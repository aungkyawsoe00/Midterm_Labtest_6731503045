# AI Log

## Prompts and use

1. The assignment prompts requested a SQLite/D1 schema, Hono GET routes, booking creation with validation and overlap detection, PATCH/DELETE CRUD, and quality-gate documentation.
2. The implementation used those requirements as a starting point, then added strict request-shape checks, malformed-date checks, a PATCH field allowlist, and local run instructions.

## Verification performed

* Confirmed all SQL request values use D1 `.bind(...)` parameters.
* Confirmed the PATCH conflict query excludes the current booking ID.
* Ran `npm run typecheck` successfully after configuring the Cloudflare worker library.
* The curl cases in `curl_test_guide.md` cover success, validation, not-found, conflict, and deletion behavior.

## Ownership notes

The overlap condition treats bookings as half-open intervals: an existing booking conflicts when `existing.startAt < new.endAt` and `existing.endAt > new.startAt`. This permits a second booking to start exactly when the first ends.