# Updated API Routes - /api/tasks Prefix

All task management routes are now under the `/api/tasks/` prefix.

## 🎯 Route Structure

```
/api/tasks/
├── boards/       - Board management
├── lists/        - List management
├── cards/        - Card management
├── comments/     - Comment management
└── actions/      - Audit log
```

---

## 📋 Complete Route Reference

### Boards Routes
All routes under `/api/tasks/boards`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks/boards` | Create board |
| `GET` | `/api/tasks/boards/workspace/:workspaceId` | List boards by workspace |
| `GET` | `/api/tasks/boards/:id` | Get board details |
| `PATCH` | `/api/tasks/boards/:id` | Update board |
| `DELETE` | `/api/tasks/boards/:id` | Delete board |
| `GET` | `/api/tasks/boards/:id/members` | Get board members |
| `POST` | `/api/tasks/boards/:id/members` | Add member to board |
| `DELETE` | `/api/tasks/boards/:id/members/:userId` | Remove member from board |
| `PATCH` | `/api/tasks/boards/:id/members/:userId/role` | Update member role |

### Lists Routes
All routes under `/api/tasks/lists`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks/lists` | Create list |
| `GET` | `/api/tasks/lists/board/:boardId` | Get lists by board |
| `GET` | `/api/tasks/lists/:id` | Get list details |
| `PATCH` | `/api/tasks/lists/:id` | Update list |
| `DELETE` | `/api/tasks/lists/:id` | Delete list |
| `POST` | `/api/tasks/lists/:boardId/reorder` | Reorder lists |

### Cards Routes
All routes under `/api/tasks/cards`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks/cards` | Create card |
| `GET` | `/api/tasks/cards/list/:listId` | Get cards by list |
| `GET` | `/api/tasks/cards/:id` | Get card details |
| `PATCH` | `/api/tasks/cards/:id` | Update card |
| `DELETE` | `/api/tasks/cards/:id` | Delete card |
| `POST` | `/api/tasks/cards/:id/assignees` | Assign user to card |
| `DELETE` | `/api/tasks/cards/:id/assignees/:userId` | Unassign user from card |
| `POST` | `/api/tasks/cards/:id/watchers` | Add card watcher |
| `DELETE` | `/api/tasks/cards/:id/watchers/:userId` | Remove card watcher |
| `PATCH` | `/api/tasks/cards/:id/move` | Move card to different list |
| `POST` | `/api/tasks/cards/:listId/reorder` | Reorder cards in list |

### Comments Routes
All routes under `/api/tasks/comments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks/comments` | Create comment |
| `GET` | `/api/tasks/comments/card/:cardId` | Get comments by card |
| `GET` | `/api/tasks/comments/:id` | Get comment details |
| `PATCH` | `/api/tasks/comments/:id` | Update comment |
| `DELETE` | `/api/tasks/comments/:id` | Delete comment |

### Actions Routes
All routes under `/api/tasks/actions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks/actions/board/:boardId` | Get board activity history |
| `GET` | `/api/tasks/actions/board/:boardId/user/:userId` | Get user actions on board |
| `GET` | `/api/tasks/actions/target/:targetId` | Get actions on specific entity |

---

## 💻 Example Requests

### Create a Board
```bash
curl -X POST http://localhost:3000/api/tasks/boards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Board",
    "description": "Board description",
    "workspaceId": "workspace-uuid"
  }'
```

### Create a List
```bash
curl -X POST http://localhost:3000/api/tasks/lists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "To Do",
    "position": 0,
    "boardId": "board-uuid"
  }'
```

### Create a Card
```bash
curl -X POST http://localhost:3000/api/tasks/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Task Name",
    "description": "Task description",
    "priority": "high",
    "dueDate": "2024-12-31",
    "listId": "list-uuid",
    "position": 0
  }'
```

### Get Board with All Content
```bash
curl -X GET http://localhost:3000/api/tasks/boards/board-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Add Comment to Card
```bash
curl -X POST http://localhost:3000/api/tasks/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Comment text",
    "cardId": "card-uuid"
  }'
```

### View Board Activity
```bash
curl -X GET http://localhost:3000/api/tasks/actions/board/board-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Complete Route Summary

### By Resource
- **Boards**: 9 endpoints
- **Lists**: 6 endpoints
- **Cards**: 11 endpoints
- **Comments**: 5 endpoints
- **Actions**: 3 endpoints
- **Total**: 34 endpoints

### By HTTP Method
- `GET`: 14 endpoints (queries)
- `POST`: 13 endpoints (create, actions)
- `PATCH`: 5 endpoints (update)
- `DELETE`: 5 endpoints (delete)

### Authentication
✅ All endpoints require JWT bearer token in `Authorization` header

### Base URL
```
http://localhost:3000/api/tasks
```

---

## 🔄 Old vs New Routes

| Old Route | New Route |
|-----------|-----------|
| `/api/boards` | `/api/tasks/boards` |
| `/api/lists` | `/api/tasks/lists` |
| `/api/cards` | `/api/tasks/cards` |
| `/api/comments` | `/api/tasks/comments` |
| `/api/actions` | `/api/tasks/actions` |

---

## 📝 Migration Guide for Frontend

If you're updating a frontend application, replace all API calls:

### Before
```javascript
// Old routes
const response = await fetch('http://localhost:3000/api/boards');
```

### After
```javascript
// New routes
const response = await fetch('http://localhost:3000/api/tasks/boards');
```

### Simple Find & Replace
Search for:
- `/api/boards` → `/api/tasks/boards`
- `/api/lists` → `/api/tasks/lists`
- `/api/cards` → `/api/tasks/cards`
- `/api/comments` → `/api/tasks/comments`
- `/api/actions` → `/api/tasks/actions`

---

## ✅ Testing the Routes

### Quick Test with curl
```bash
# 1. Get all boards in workspace
curl http://localhost:3000/api/tasks/boards/workspace/{workspace-id} \
  -H "Authorization: Bearer {token}"

# 2. Create a board
curl -X POST http://localhost:3000/api/tasks/boards \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","workspaceId":"{id}"}'

# 3. Create a list
curl -X POST http://localhost:3000/api/tasks/lists \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"List","position":0,"boardId":"{id}"}'

# 4. Create a card
curl -X POST http://localhost:3000/api/tasks/cards \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Card","position":0,"listId":"{id}"}'
```

---

## 🎯 Next Steps

1. ✅ Update all API calls in your frontend from `/api/*` to `/api/tasks/*`
2. ✅ Test all routes with the new prefix
3. ✅ Update any documentation or API client generation
4. ✅ Deploy updated frontend

---

**All routes are now under `/api/tasks/` prefix! 🚀**
