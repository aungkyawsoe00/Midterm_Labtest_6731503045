import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

type BookingInput = {
  equipmentId?: unknown;
  borrowerName?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  purpose?: unknown;
};

type Booking = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  startAt: string;
  endAt: string;
  purpose: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const errorResponse = (message: string, status: 400 | 404 | 409) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isValidDateRange = (startAt: string, endAt: string) =>
  !Number.isNaN(Date.parse(startAt)) &&
  !Number.isNaN(Date.parse(endAt)) &&
  new Date(startAt).getTime() < new Date(endAt).getTime();

const isValidDateFormat = (startAt: string, endAt: string) =>
  !Number.isNaN(Date.parse(startAt)) && !Number.isNaN(Date.parse(endAt));

app.get('/api/equipment', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, name, location FROM equipment ORDER BY id',
  ).all();
  return c.json(result.results);
});

app.get('/api/bookings', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, equipmentId, borrowerName, startAt, endAt, purpose FROM bookings ORDER BY startAt',
  ).all<Booking>();
  return c.json(result.results);
});

app.get('/api/bookings/:id', async (c) => {
  const booking = await c.env.DB.prepare(
    'SELECT id, equipmentId, borrowerName, startAt, endAt, purpose FROM bookings WHERE id = ?1',
  )
    .bind(c.req.param('id'))
    .first<Booking>();

  if (!booking) return errorResponse('Booking not found', 404);
  return c.json(booking);
});

app.post('/api/bookings', async (c) => {
  let body: BookingInput;
  try {
    body = await c.req.json<BookingInput>();
  } catch {
    return errorResponse('Request body must be valid JSON', 400);
  }

  if (
    !isNonEmptyString(body.equipmentId) ||
    !isNonEmptyString(body.borrowerName) ||
    !isNonEmptyString(body.startAt) ||
    !isNonEmptyString(body.endAt) ||
    !isNonEmptyString(body.purpose)
  ) {
    return errorResponse('All booking fields are required', 400);
  }

  const { equipmentId, borrowerName, startAt, endAt, purpose } = body;
  if (!isValidDateFormat(startAt, endAt)) {
    return errorResponse('Invalid date format', 400);
  }
  if (!isValidDateRange(startAt, endAt)) {
    return errorResponse('startAt must be before endAt', 400);
  }

  const equipment = await c.env.DB.prepare(
    'SELECT id FROM equipment WHERE id = ?1',
  )
    .bind(equipmentId)
    .first();
  if (!equipment) return errorResponse('Equipment not found', 404);

  // Two time intervals overlap when both strict comparisons are true:
  // existing.startAt < new.endAt means the existing interval begins before
  // the proposed interval ends, and existing.endAt > new.startAt means it
  // ends after the proposed interval begins. Using strict boundaries means
  // an existing booking ending exactly when the new one starts is allowed.
  const conflict = await c.env.DB.prepare(
    `SELECT id FROM bookings
     WHERE equipmentId = ?1
       AND startAt < ?2
       AND endAt > ?3
     LIMIT 1`,
  )
    .bind(equipmentId, endAt, startAt)
    .first();
  if (conflict) {
    return errorResponse('Equipment is already booked during this time', 409);
  }

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO bookings (id, equipmentId, borrowerName, startAt, endAt, purpose)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
  )
    .bind(id, equipmentId, borrowerName, startAt, endAt, purpose)
    .run();

  const booking = await c.env.DB.prepare(
    'SELECT id, equipmentId, borrowerName, startAt, endAt, purpose FROM bookings WHERE id = ?1',
  )
    .bind(id)
    .first<Booking>();
  return c.json(booking, 201);
});

app.patch('/api/bookings/:id', async (c) => {
  const id = c.req.param('id');
  const current = await c.env.DB.prepare(
    'SELECT id, equipmentId, borrowerName, startAt, endAt, purpose FROM bookings WHERE id = ?1',
  )
    .bind(id)
    .first<Booking>();
  if (!current) return errorResponse('Booking not found', 404);

  let body: BookingInput;
  try {
    body = await c.req.json<BookingInput>();
  } catch {
    return errorResponse('Request body must be valid JSON', 400);
  }

  const updates: Partial<Booking> = {};
  for (const field of ['borrowerName', 'purpose'] as const) {
    if (body[field] !== undefined) {
      if (!isNonEmptyString(body[field])) return errorResponse(`${field} must be a non-empty string`, 400);
      updates[field] = body[field];
    }
  }

  const nextStartAt = body.startAt === undefined ? current.startAt : body.startAt;
  const nextEndAt = body.endAt === undefined ? current.endAt : body.endAt;
  if (!isNonEmptyString(nextStartAt) || !isNonEmptyString(nextEndAt)) {
    return errorResponse('startAt and endAt must be non-empty strings', 400);
  }
  if (!isValidDateFormat(nextStartAt, nextEndAt)) {
    return errorResponse('Invalid date format', 400);
  }
  if (!isValidDateRange(nextStartAt, nextEndAt)) {
    return errorResponse('startAt must be before endAt', 400);
  }
  if (body.startAt !== undefined) updates.startAt = nextStartAt;
  if (body.endAt !== undefined) updates.endAt = nextEndAt;

  if (body.startAt !== undefined || body.endAt !== undefined) {
    // The overlap formula is existing.startAt < new.endAt AND
    // existing.endAt > new.startAt. Both comparisons are strict, so a
    // booking that ends exactly when another starts is not a conflict.
    // Excluding the current id prevents the row being updated from matching
    // its own existing interval.
    const conflict = await c.env.DB.prepare(
      `SELECT id FROM bookings
       WHERE equipmentId = ?1
         AND id <> ?2
         AND startAt < ?3
         AND endAt > ?4
       LIMIT 1`,
    )
      .bind(current.equipmentId, id, nextEndAt, nextStartAt)
      .first();
    if (conflict) {
      return errorResponse('Equipment is already booked during this time', 409);
    }
  }

  const fields = Object.keys(updates) as Array<keyof Booking>;
  if (fields.length === 0) return errorResponse('No updatable fields provided', 400);
  const values = fields.map((field) => updates[field]);
  const assignments = fields.map((field, index) => `${field} = ?${index + 1}`).join(', ');
  await c.env.DB.prepare(`UPDATE bookings SET ${assignments} WHERE id = ?${values.length + 1}`)
    .bind(...values, id)
    .run();

  const booking = await c.env.DB.prepare(
    'SELECT id, equipmentId, borrowerName, startAt, endAt, purpose FROM bookings WHERE id = ?1',
  )
    .bind(id)
    .first<Booking>();
  return c.json(booking);
});

app.delete('/api/bookings/:id', async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?1')
    .bind(c.req.param('id'))
    .run();
  if (!result.meta.changes) return errorResponse('Booking not found', 404);
  return new Response(null, { status: 204 });
});

export default app;