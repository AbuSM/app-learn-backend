# Calendar Events API Documentation

Complete API reference for calendar event management with date validation and event status tracking.

---

## 📋 Overview

The Calendar API allows users to create, manage, and track events within workspaces. All events must have valid dates (not in the past), and the system automatically determines event status based on current date and time.

### Key Features
- ✅ **Date Validation** - Prevents creation of events with past dates
- ✅ **Automatic Status** - Calculates event status (upcoming, ongoing, completed, cancelled)
- ✅ **Date Range Queries** - Find events by month or custom date range
- ✅ **Event Management** - Create, update, delete, and cancel events
- ✅ **Workspace Integration** - Events are workspace-scoped

---

## 🗄️ Database Schema

### CalendarEvent Entity

```typescript
{
  id: UUID,                    // Primary key
  title: string,              // Event title
  description?: string,       // Event description
  startDate: timestamp,       // Event start date/time
  endDate: timestamp,         // Event end date/time
  status: EventStatus,        // upcoming, ongoing, completed, cancelled
  location?: string,          // Event location
  color?: string,             // Event color code
  workspaceId: UUID,         // Workspace reference
  createdById: UUID,         // Creator user reference
  isActive: boolean,         // Soft delete flag
  createdAt: timestamp,      // Created timestamp
  updatedAt: timestamp       // Updated timestamp
}
```

### EventStatus Enum

```
- "upcoming"    → Event is in the future
- "ongoing"     → Event is currently happening
- "completed"   → Event has ended
- "cancelled"   → Event has been cancelled
```

---

## 📡 API Endpoints

All endpoints require `Authorization: Bearer {token}` header

Base URL: `http://localhost:3000/api/tasks/calendar`

### Create Event

```
POST /api/tasks/calendar/events
Content-Type: application/json

{
  "title": "Team Meeting",
  "description": "Quarterly planning session",
  "startDate": "2024-12-20T10:00:00Z",
  "endDate": "2024-12-20T11:00:00Z",
  "location": "Conference Room A",
  "color": "#3C50E0",
  "workspaceId": "workspace-uuid"
}

Response: 201 Created
{
  "id": "event-uuid",
  "title": "Team Meeting",
  "startDate": "2024-12-20T10:00:00.000Z",
  "endDate": "2024-12-20T11:00:00.000Z",
  "status": "upcoming",
  "location": "Conference Room A",
  "color": "#3C50E0",
  "workspaceId": "workspace-uuid",
  "createdById": "user-uuid",
  "isActive": true,
  "createdAt": "2024-11-13T...",
  "updatedAt": "2024-11-13T..."
}

Validation:
- ✅ startDate must be in the future
- ✅ endDate must be in the future
- ✅ endDate must be after startDate
- ✅ All fields required except description, location, color
```

### Get All Events in Workspace

```
GET /api/tasks/calendar/events/workspace/:workspaceId

Response: 200 OK
[
  {
    "id": "event-uuid-1",
    "title": "Team Meeting",
    "startDate": "2024-12-20T10:00:00Z",
    "endDate": "2024-12-20T11:00:00Z",
    "status": "upcoming",
    ...
  },
  ...
]

Parameters:
- workspaceId (path): UUID of workspace

Returns: All active events in workspace, sorted by start date
```

### Get Upcoming Events

```
GET /api/tasks/calendar/events/workspace/:workspaceId/upcoming?limit=10

Response: 200 OK
[
  {
    "id": "event-uuid",
    "title": "Conference",
    "startDate": "2024-12-25T09:00:00Z",
    "endDate": "2024-12-25T17:00:00Z",
    "status": "upcoming",
    ...
  },
  ...
]

Parameters:
- workspaceId (path): UUID of workspace
- limit (query, optional): Number of events to return (default: 10)

Returns: Future events only, sorted by start date (earliest first)
```

### Get Ongoing Events

```
GET /api/tasks/calendar/events/workspace/:workspaceId/ongoing

Response: 200 OK
[
  {
    "id": "event-uuid",
    "title": "Conference",
    "startDate": "2024-12-15T09:00:00Z",
    "endDate": "2024-12-20T17:00:00Z",
    "status": "ongoing",
    ...
  }
]

Parameters:
- workspaceId (path): UUID of workspace

Returns: Currently happening events in workspace
```

### Get Events by Month

```
GET /api/tasks/calendar/events/workspace/:workspaceId/month?year=2024&month=12

Response: 200 OK
[
  {
    "id": "event-uuid",
    "title": "Year-end Party",
    "startDate": "2024-12-31T18:00:00Z",
    "endDate": "2025-01-01T02:00:00Z",
    "status": "upcoming",
    ...
  },
  ...
]

Parameters:
- workspaceId (path): UUID of workspace
- year (query, optional): Year (default: current year)
- month (query, optional): Month 1-12 (default: current month)

Returns: All events in specified month, regardless of status
Validation:
- month must be 1-12
```

### Get Events by Date Range

```
GET /api/tasks/calendar/events/workspace/:workspaceId/range?startDate=2024-12-15T00:00:00Z&endDate=2024-12-31T23:59:59Z

Response: 200 OK
[
  {
    "id": "event-uuid",
    "title": "Holiday Week",
    "startDate": "2024-12-20T09:00:00Z",
    "endDate": "2024-12-25T17:00:00Z",
    "status": "upcoming",
    ...
  },
  ...
]

Parameters:
- workspaceId (path): UUID of workspace
- startDate (query, required): ISO 8601 date
- endDate (query, required): ISO 8601 date

Returns: Events that overlap with date range
Validation:
- Both startDate and endDate are required
- Must be valid ISO 8601 format
```

### Get Event Details

```
GET /api/tasks/calendar/events/:id

Response: 200 OK
{
  "id": "event-uuid",
  "title": "Team Meeting",
  "description": "Quarterly planning",
  "startDate": "2024-12-20T10:00:00Z",
  "endDate": "2024-12-20T11:00:00Z",
  "status": "upcoming",
  "location": "Conference Room A",
  "color": "#3C50E0",
  "workspaceId": "workspace-uuid",
  "createdBy": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "isActive": true,
  "createdAt": "2024-11-13T...",
  "updatedAt": "2024-11-13T..."
}

Parameters:
- id (path): UUID of event
```

### Update Event

```
PATCH /api/tasks/calendar/events/:id
Content-Type: application/json

{
  "title": "Rescheduled Meeting",
  "startDate": "2024-12-21T10:00:00Z",
  "endDate": "2024-12-21T11:00:00Z",
  "location": "Virtual",
  "description": "Updated description"
}

Response: 200 OK
{
  "id": "event-uuid",
  "title": "Rescheduled Meeting",
  "startDate": "2024-12-21T10:00:00Z",
  "endDate": "2024-12-21T11:00:00Z",
  "status": "upcoming",
  ...
}

Parameters:
- id (path): UUID of event

Validation:
- If dates are updated, they must not be in the past
- endDate must be after startDate
- Status is automatically recalculated if dates change
```

### Delete Event (Soft Delete)

```
DELETE /api/tasks/calendar/events/:id

Response: 200 OK

Parameters:
- id (path): UUID of event

Note: This performs a soft delete (sets isActive to false)
Event is not returned in future queries
Can be restored by an admin if needed
```

### Cancel Event

```
PATCH /api/tasks/calendar/events/:id/cancel

Response: 200 OK
{
  "id": "event-uuid",
  "title": "Cancelled Meeting",
  "status": "cancelled",
  ...
}

Parameters:
- id (path): UUID of event

Note: Sets event status to "cancelled"
Event remains in database but is marked as cancelled
Different from delete - shows event was cancelled, not removed
```

---

## 📊 Event Status Determination

Event status is **automatically calculated** based on current date/time:

| Condition | Status |
|-----------|--------|
| Now < startDate | `upcoming` |
| startDate ≤ Now < endDate | `ongoing` |
| Now ≥ endDate | `completed` |
| Manually cancelled | `cancelled` |

Example:
```
Event: 2024-12-20 10:00 - 11:00

Current: 2024-12-20 08:00 → Status: UPCOMING
Current: 2024-12-20 10:30 → Status: ONGOING
Current: 2024-12-20 12:00 → Status: COMPLETED
```

---

## ✅ Validation Rules

### Date Validation

1. **No Past Dates**
   ```
   ✗ startDate in past → BadRequestException
   ✗ endDate in past → BadRequestException
   ```

2. **Date Order**
   ```
   ✓ endDate > startDate
   ✗ endDate ≤ startDate → BadRequestException
   ```

3. **Date Format**
   ```
   ✓ ISO 8601: 2024-12-20T10:00:00Z
   ✓ ISO 8601: 2024-12-20T10:00:00+00:00
   ✗ Invalid format → BadRequestException
   ```

### Request Validation

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| title | string | Yes | Min 1 char |
| description | string | No | Any text |
| startDate | date | Yes | ISO 8601, not past |
| endDate | date | Yes | ISO 8601, not past, after start |
| location | string | No | Any text |
| color | string | No | Hex color code |
| workspaceId | UUID | Yes | Valid workspace |

---

## 🔒 Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Start date cannot be in the past",
  "error": "Bad Request"
}
```

Common messages:
- `"Start date cannot be in the past"`
- `"End date cannot be in the past"`
- `"End date must be after start date"`
- `"Month must be between 1 and 12"`
- `"startDate and endDate query parameters are required"`
- `"Invalid date format. Use ISO 8601 format"`

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Event with ID {id} not found",
  "error": "Not Found"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## 💻 Example Usage Flows

### Create and Track an Event

```bash
# 1. Create event
POST /api/tasks/calendar/events
{
  "title": "Product Launch",
  "startDate": "2024-12-25T09:00:00Z",
  "endDate": "2024-12-25T17:00:00Z",
  "workspaceId": "workspace-uuid"
}
→ Event created with status: "upcoming"

# 2. Check status later (during event)
GET /api/tasks/calendar/events/{event-uuid}
→ Status is now: "ongoing"

# 3. Check after event ends
GET /api/tasks/calendar/events/{event-uuid}
→ Status is now: "completed"
```

### Plan Monthly Events

```bash
# Get all events for December 2024
GET /api/tasks/calendar/events/workspace/{workspace-uuid}/month?year=2024&month=12

# Response includes all events in that month
# Events are sorted by start date for easy planning
```

### View Schedule

```bash
# Get upcoming events (next 20)
GET /api/tasks/calendar/events/workspace/{workspace-uuid}/upcoming?limit=20

# Get currently happening events
GET /api/tasks/calendar/events/workspace/{workspace-uuid}/ongoing

# Get events in custom range
GET /api/tasks/calendar/events/workspace/{workspace-uuid}/range?startDate=2024-12-20T00:00:00Z&endDate=2024-12-31T23:59:59Z
```

### Manage Events

```bash
# Reschedule an event
PATCH /api/tasks/calendar/events/{event-uuid}
{
  "startDate": "2024-12-21T10:00:00Z",
  "endDate": "2024-12-21T11:00:00Z"
}

# Cancel without deleting
PATCH /api/tasks/calendar/events/{event-uuid}/cancel

# Delete (soft delete)
DELETE /api/tasks/calendar/events/{event-uuid}
```

---

## 📋 Complete Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/tasks/calendar/events` | Create event |
| `GET` | `/api/tasks/calendar/events/workspace/:id` | List all events |
| `GET` | `/api/tasks/calendar/events/workspace/:id/upcoming` | Get future events |
| `GET` | `/api/tasks/calendar/events/workspace/:id/ongoing` | Get current events |
| `GET` | `/api/tasks/calendar/events/workspace/:id/month` | Get events by month |
| `GET` | `/api/tasks/calendar/events/workspace/:id/range` | Get events by date range |
| `GET` | `/api/tasks/calendar/events/:id` | Get event details |
| `PATCH` | `/api/tasks/calendar/events/:id` | Update event |
| `DELETE` | `/api/tasks/calendar/events/:id` | Delete (soft) |
| `PATCH` | `/api/tasks/calendar/events/:id/cancel` | Cancel event |

**Total: 10 endpoints**

---

## 🔑 Authentication

All endpoints require JWT bearer token:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All UUIDs should be valid v4 format
- Events are workspace-scoped
- Soft deletes preserve event history
- Status is automatically calculated
- Date validation prevents past event creation
- End date must be after start date
- Timezone support via ISO 8601 with timezone

---

**Calendar API is production-ready!** 🚀
