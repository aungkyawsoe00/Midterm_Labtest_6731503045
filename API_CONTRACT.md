# API Contract

Base URL: `http://localhost:8787/api`

## Routes

| Method | Path | Success | Behavior |
| --- | --- | ---: | --- |
| GET | `/equipment` | 200 | Returns all equipment. |
| GET | `/bookings` | 200 | Returns all bookings. |
| GET | `/bookings/:id` | 200 | Returns one booking; missing IDs return 404. |
| POST | `/bookings` | 201 | Validates and creates a booking. |
| PATCH | `/bookings/:id` | 200 | Updates `borrowerName`, `startAt`, `endAt`, or `purpose`. |
| DELETE | `/bookings/:id` | 204 | Deletes a booking with no response body. |

## Booking payload

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class"
}
```

`startAt` and `endAt` must be valid dates, and `startAt` must be earlier than `endAt`. The equipment ID must exist. A same-equipment overlap returns `409`; a malformed request returns `400`; a missing resource returns `404`. Errors use `{ "error": "..." }`.

## Relationship

`bookings.equipmentId` references `equipment.id`. One equipment record can have many bookings, but overlapping time ranges for that equipment are rejected by the application-level conflict query.