# Complete API Endpoints Summary

## Base URL
```
http://localhost:3000/api
```

---

## 1. Authentication Endpoints
**Base Route**: `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/logout` | Logout user |

---

## 2. Users Endpoints
**Base Route**: `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| PATCH | `/users/:id` | Update user profile |
| DELETE | `/users/:id` | Delete user |

---

## 3. Boards Endpoints (Tasks Module)
**Base Route**: `/api/tasks/boards`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/boards` | Create board |
| GET | `/tasks/boards/workspace/:workspaceId` | Get all boards in workspace |
| GET | `/tasks/boards/:id` | Get board details |
| PATCH | `/tasks/boards/:id` | Update board |
| DELETE | `/tasks/boards/:id` | Delete board (soft delete) |
| GET | `/tasks/boards/:id/members` | Get board members |
| POST | `/tasks/boards/:id/members` | Add member to board |
| DELETE | `/tasks/boards/:id/members/:userId` | Remove member from board |
| PATCH | `/tasks/boards/:id/members/:userId/role` | Update member role |

---

## 4. Lists Endpoints (Tasks Module)
**Base Route**: `/api/tasks/lists`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/lists` | Create list |
| GET | `/tasks/lists/board/:boardId` | Get all lists in board |
| GET | `/tasks/lists/:id` | Get list details |
| PATCH | `/tasks/lists/:id` | Update list |
| DELETE | `/tasks/lists/:id` | Delete list |
| PATCH | `/tasks/lists/:id/reorder` | Reorder lists |

---

## 5. Cards Endpoints (Tasks Module)
**Base Route**: `/api/tasks/cards`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/cards` | Create card |
| GET | `/tasks/cards/list/:listId` | Get all cards in list |
| GET | `/tasks/cards/:id` | Get card details |
| PATCH | `/tasks/cards/:id` | Update card |
| DELETE | `/tasks/cards/:id` | Delete card |
| POST | `/tasks/cards/:id/assign` | Assign card to user |
| DELETE | `/tasks/cards/:id/assign/:userId` | Remove assignment |
| POST | `/tasks/cards/:id/watch` | Add card to watched list |
| DELETE | `/tasks/cards/:id/watch/:userId` | Remove from watched list |

---

## 6. Comments Endpoints (Tasks Module)
**Base Route**: `/api/tasks/comments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks/comments` | Add comment to card |
| GET | `/tasks/comments/card/:cardId` | Get all comments on card |
| GET | `/tasks/comments/:id` | Get comment details |
| PATCH | `/tasks/comments/:id` | Update comment |
| DELETE | `/tasks/comments/:id` | Delete comment |

---

## 7. Actions/Audit Log Endpoints (Tasks Module)
**Base Route**: `/api/tasks/actions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/actions/board/:boardId` | Get board activity log |
| GET | `/tasks/actions/card/:cardId` | Get card activity log |
| GET | `/tasks/actions/:id` | Get action details |

---

## 8. Calendar Events Endpoints (SEPARATE API)
**Base Route**: `/api/calendar`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/calendar` | Create calendar event |
| GET | `/calendar/workspace/:workspaceId` | Get all events in workspace |
| GET | `/calendar/workspace/:workspaceId/upcoming` | Get upcoming events |
| GET | `/calendar/workspace/:workspaceId/ongoing` | Get ongoing events |
| GET | `/calendar/workspace/:workspaceId/month` | Get events by month |
| GET | `/calendar/workspace/:workspaceId/range` | Get events by date range |
| GET | `/calendar/:id` | Get event details |
| PATCH | `/calendar/:id` | Update event |
| DELETE | `/calendar/:id` | Delete event (soft delete) |
| PATCH | `/calendar/:id/cancel` | Cancel event |

---

## Endpoint Statistics

| Module | Count | Type |
|--------|-------|------|
| Authentication | 4 | Standalone |
| Users | 4 | Standalone |
| Boards (Tasks) | 9 | Sub-module |
| Lists (Tasks) | 6 | Sub-module |
| Cards (Tasks) | 9 | Sub-module |
| Comments (Tasks) | 5 | Sub-module |
| Actions (Tasks) | 3 | Sub-module |
| **TOTAL TASKS MODULE** | **32** | - |
| Calendar | 10 | Standalone |
| **TOTAL ENDPOINTS** | **54** | - |

---

## API Structure

### Tasks Module (32 endpoints)
Grouped under `/api/tasks/` prefix:
- Boards management
- Lists organization
- Cards/Tasks management
- Comments collaboration
- Action audit logging

### Calendar Module (10 endpoints)
Standalone under `/api/calendar/` prefix:
- Event creation and management
- Date-based queries
- Status tracking
- Event cancellation

### Authentication & Users (8 endpoints)
Standalone modules:
- User authentication
- Profile management

---

**Total: 54 API Endpoints**

