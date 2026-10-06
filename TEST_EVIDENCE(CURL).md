# API Test Evidence

**Base URL Used:** `http://localhost:8787/api`

## 1. List equipment
**Expected:** `200 OK`
**Command:**
```powershell
curl.exe -v http://localhost:8787/api/equipment

![alt text]({51557CF2-B3BB-4382-8DCD-D5CF2C689024}.png)
__________________________________________________________________
2. List bookings
Expected: 200 OK
Command:

PowerShell
curl.exe -v http://localhost:8787/api/bookings

![alt text]({3C62B2AB-FB9E-4B03-A45A-2D6F5BA663D5}.png)
______________________________________________________________

3. Create a booking
Expected: 201 Created
Command:

PowerShell
curl.exe -v -X POST http://localhost:8787/api/bookings -H "Content-Type: application/json" -d "{\"equipmentId\": \"eq-1\", \"borrowerName\": \"Somchai Jaidee\", \"startAt\": \"2026-10-20T09:00:00.000Z\", \"endAt\": \"2026-10-20T11:00:00.000Z\", \"purpose\": \"Class presentation\"}"

![alt text]({4B14F61F-D22E-4924-BB20-EC116B9A269D}.png)

(Note: Copy the id from the JSON response in this screenshot for steps 4, 5, and 9)

__________________________________________________________________________________

4. Get one booking
Expected: 200 OK
Command: (Replace <BOOKING_ID> with your copied ID)

PowerShell
curl.exe -v http://localhost:8787/api/bookings/<BOOKING_ID>
Evidence:

![alt text]({FB7DB0F8-9434-48EB-BC36-EC352390E1EB}.png)

_______________________________________________________________________

5. Update a booking
Expected: 200 OK
Command: (Replace <BOOKING_ID> with your copied ID)

PowerShell
curl.exe -v -X PATCH http://localhost:8787/api/bookings/<BOOKING_ID> -H "Content-Type: application/json" -d "{\"equipmentId\": \"eq-1\", \"borrowerName\": \"Somchai Jaidee\", \"startAt\": \"2026-10-20T12:00:00.000Z\", \"endAt\": \"2026-10-20T14:00:00.000Z\", \"purpose\": \"Updated class presentation\"}"
Evidence:

![alt text]({C22C81B5-EE19-40AB-A4FB-E7CDF52C592E}.png)
_____________________________________________________________________________________

6. Invalid time range
Expected: 400 Bad Request
Command:

PowerShell
curl.exe -v -X POST http://localhost:8787/api/bookings -H "Content-Type: application/json" -d "{\"equipmentId\": \"eq-1\", \"borrowerName\": \"Somchai Jaidee\", \"startAt\": \"2026-10-21T11:00:00.000Z\", \"endAt\": \"2026-10-21T09:00:00.000Z\", \"purpose\": \"Invalid time range test\"}"
Evidence:

![alt text]({7B108796-0A85-4BEB-B659-D346395EE6E5}.png)

__________________________________________________________________________________________________

7. Overlapping booking
Expected: 409 Conflict
Command:

PowerShell
curl.exe -v -X POST http://localhost:8787/api/bookings -H "Content-Type: application/json" -d "{\"equipmentId\": \"eq-1\", \"borrowerName\": \"Suda Dee\", \"startAt\": \"2026-10-20T12:30:00.000Z\", \"endAt\": \"2026-10-20T13:30:00.000Z\", \"purpose\": \"Conflict test\"}"
Evidence:

![alt text]({5EC730FC-BC03-4C72-B8B0-CF7D2848B741}.png)
__________________________________________________________________________________________

8. Missing booking
Expected: 404 Not Found
Command:

PowerShell
curl.exe -v http://localhost:8787/api/bookings/not-found
Evidence:

![alt text]({191BFA39-E0A9-4746-96C1-BF2C57B2510C}.png)

____________________________________________________________________

9. Delete a booking
Expected: 204 No Content
Command: (Replace <BOOKING_ID> with your copied ID)

PowerShell
curl.exe -v -X DELETE http://localhost:8787/api/bookings/<BOOKING_ID>
Evidence:

![alt text]({E70F21FC-59D6-499D-945F-9FC52A6CE7F2}.png)