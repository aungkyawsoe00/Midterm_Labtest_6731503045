# Midterm_Labtest_6731503045

# Campus Equipment Booking API

A backend REST API built with TypeScript, Hono, and Cloudflare D1 (SQLite) for managing campus equipment reservations and preventing overlapping bookings.

## Project Documentation

This repository includes:

- `AI_LOG.md`: AI assistance and verification record.
- `API_CONTRACT.md`: API contract and response details.
- `TEST_EVIDENCE(CURL).md`: HTTP test evidence.
- `curl_test_guide.md`: cURL testing instructions.
- `schema.sql`: Database schema and seed data.

## Database Schema

The database uses SQLite through Cloudflare D1 with foreign-key integrity between equipment and bookings.

```text
+--------------------+               +--------------------+
|     EQUIPMENT      |               |      BOOKINGS      |
+--------------------+               +--------------------+
| id (PK, TEXT)      |<--- 1 : N ----| id (PK, TEXT)      |
| name (TEXT)        |               | equipmentId (FK)   |
| location (TEXT)    |               | borrowerName (TEXT)|
+--------------------+               | startAt (TEXT)     |
                                     | endAt (TEXT)       |
                                     | purpose (TEXT)     |
                                     +--------------------+
```

Bookings use the overlap rule `existing.startAt < new.endAt AND existing.endAt > new.startAt`. Strict inequalities allow back-to-back bookings when one booking ends exactly as another begins.

## Setup and Execution

### Prerequisites

- Node.js 18 or higher
- npm

### Install dependencies

```powershell
npm install
```

### Initialize the local D1 database

```powershell
npx wrangler d1 execute campus-equipment-bookings --local --file=./schema.sql
```

### Run the development server

```powershell
npm run dev
```

The server runs at `http://localhost:8787`.

### Run the typecheck

```powershell
npm run typecheck
```

## API Contract Summary

Base URL: `http://localhost:8787/api`

| Method | Endpoint | Success | Error codes | Description |
| --- | --- | --- | --- | --- |
| GET | `/equipment` | 200 | 500 | List available equipment |
| GET | `/bookings` | 200 | 500 | List all bookings |
| GET | `/bookings/:id` | 200 | 404 | Get a specific booking |
| POST | `/bookings` | 201 | 400, 404, 409 | Create a booking |
| PATCH | `/bookings/:id` | 200 | 400, 404, 409 | Update a booking |
| DELETE | `/bookings/:id` | 204 | 404 | Delete a booking |

All error responses use this JSON format:

```json
{
  "error": "Descriptive error message"
}
```

ID: 6731503045  
Name: AUNG KYAW SOE
