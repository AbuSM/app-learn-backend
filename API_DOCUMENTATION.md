# Trello-like Task Manager - Backend API Documentation

## Overview
This backend provides a complete task management system similar to Trello with boards, lists, cards, comments, and action history.

## Features
- ✅ **Boards**: Create, manage, and share boards within workspaces
- ✅ **Lists**: Organize cards into customizable lists with drag-and-drop support
- ✅ **Cards**: Create detailed cards with titles, descriptions, deadlines, priority, and status
- ✅ **Comments**: Add comments to cards for team collaboration
- ✅ **Actions/Audit Log**: Track all activities on boards for transparency
- ✅ **Members & Permissions**: Manage board members with role-based access control
- ✅ **Assignees & Watchers**: Assign cards to team members and watch for updates

## Database Schema

### Core Entities

#### Board
- `id` (UUID): Primary key
- `name` (string): Board name
- `description` (string, optional): Board description
- `color` (string, optional): Board color code
- `backgroundImage` (string, optional): Background image URL
- `workspaceId` (UUID): Workspace reference
- `isActive` (boolean): Soft delete flag
- `createdAt` (timestamp): Creation time
- `updatedAt` (timestamp): Last update time
- **Relations**:
  - `workspace`: ManyToOne → Workspace
  - `members`: OneToMany → BoardMember
  - `lists`: OneToMany → List

#### List
- `id` (UUID): Primary key
- `title` (string): List title
- `position` (number): Order position
- `boardId` (UUID): Board reference
- `isActive` (boolean): Soft delete flag
- `createdAt` (timestamp): Creation time
- `updatedAt` (timestamp): Last update time
- **Relations**:
  - `board`: ManyToOne → Board
  - `cards`: OneToMany → Card

#### Card
- `id` (UUID): Primary key
- `title` (string): Card title
- `description` (string, optional): Card description
- `dueDate` (timestamp, optional): Deadline
- `priority` (enum): LOW, MEDIUM, HIGH, CRITICAL
- `status` (enum): TODO, IN_PROGRESS, IN_REVIEW, DONE
- `position` (number): Order position in list
- `listId` (UUID): List reference
- `createdById` (UUID): Creator user reference
- `coverImage` (string, optional): Card cover image
- `estimatedHours` (number, optional): Estimated time
- `spentHours` (number, optional): Actual time spent
- `labels` (string[]): Tag labels
- `createdAt` (timestamp): Creation time
- `updatedAt` (timestamp): Last update time
- **Relations**:
  - `list`: ManyToOne → List
  - `createdBy`: ManyToOne → User
  - `assignees`: ManyToMany → User
  - `watchers`: ManyToMany → User
  - `comments`: OneToMany → CardComment

#### CardComment
- `id` (UUID): Primary key
- `content` (text): Comment text
- `cardId` (UUID): Card reference
- `authorId` (UUID): Author user reference
- `createdAt` (timestamp): Creation time
- `updatedAt` (timestamp): Last update time
- **Relations**:
  - `card`: ManyToOne → Card
  - `author`: ManyToOne → User

#### Action (Audit Log)
- `id` (UUID): Primary key
- `type` (enum): Type of action performed
- `boardId` (UUID): Board reference
- `userId` (UUID): User who performed action
- `targetId` (string, optional): ID of affected entity
- `targetType` (string, optional): Type of affected entity
- `metadata` (jsonb): Additional action data
- `description` (string, optional): Human-readable description
- `createdAt` (timestamp): When action occurred
- **Relations**:
  - `board`: ManyToOne → Board
  - `user`: ManyToOne → User

#### BoardMember
- `id` (UUID): Primary key
- `boardId` (UUID): Board reference
- `userId` (UUID): User reference
- `role` (enum): ADMIN, MEMBER, OBSERVER
- `joinedAt` (timestamp): When user joined
- **Relations**:
  - `board`: ManyToOne → Board
  - `user`: ManyToOne → User

## API Endpoints

### Authentication Required
All endpoints require `Authorization: Bearer {token}` header

---

## Boards Endpoints

### Create Board
```
POST /api/tasks/boards
Content-Type: application/json

{
  "name": "Project Alpha",
  "description": "Main project board",
  "color": "#1E90FF",
  "backgroundImage": "https://...",
  "workspaceId": "uuid"
}

Response: Board object with lists and members
```

### Get Board by Workspace
```
GET /api/tasks/boards/workspace/:workspaceId

Response: Board[] - All boards in workspace
```

### Get Board Details
```
GET /api/tasks/boards/:id

Response: Board object with full structure (lists, cards, members)
```

### Update Board
```
PATCH /api/tasks/boards/:id
Content-Type: application/json

{
  "name": "New Name",
  "description": "...",
  "color": "#...",
  "backgroundImage": "..."
}

Note: Only board admins can update
Response: Updated Board object
```

### Delete Board
```
DELETE /api/tasks/boards/:id

Note: Only board admins can delete
Note: Soft delete (sets isActive to false)
Response: 200 OK
```

### Get Board Members
```
GET /api/tasks/boards/:id/members

Response: BoardMember[]
```

### Add Member to Board
```
POST /api/tasks/boards/:id/members
Content-Type: application/json

{
  "userId": "uuid",
  "role": "member"  // Optional, defaults to "member"
}

Note: Only board admins can add members
Response: BoardMember object
```

### Remove Member from Board
```
DELETE /api/tasks/boards/:id/members/:userId

Note: Only board admins can remove members
Note: Cannot remove last admin
Response: 200 OK
```

### Update Member Role
```
PATCH /api/tasks/boards/:id/members/:userId/role
Content-Type: application/json

{
  "role": "admin"  // "admin", "member", or "observer"
}

Note: Only board admins can update roles
Response: Updated BoardMember object
```

---

## Lists Endpoints

### Create List
```
POST /api/tasks/lists
Content-Type: application/json

{
  "title": "To Do",
  "position": 0,
  "boardId": "uuid"
}

Response: List object
```

### Get Lists by Board
```
GET /api/tasks/lists/board/:boardId

Response: List[] sorted by position, with cards
```

### Get List Details
```
GET /api/tasks/lists/:id

Response: List object with all cards
```

### Update List
```
PATCH /api/tasks/lists/:id
Content-Type: application/json

{
  "title": "New Title",
  "position": 1
}

Response: Updated List object
```

### Delete List
```
DELETE /api/tasks/lists/:id

Note: Soft delete (sets isActive to false)
Response: 200 OK
```

### Reorder Lists
```
POST /api/tasks/lists/:boardId/reorder
Content-Type: application/json

{
  "listIds": ["uuid1", "uuid2", "uuid3"]
}

Response: List[] with updated positions
```

---

## Cards Endpoints

### Create Card
```
POST /api/tasks/cards
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Users unable to login with email",
  "dueDate": "2024-12-31T23:59:59Z",
  "priority": "high",
  "status": "todo",
  "position": 0,
  "listId": "uuid",
  "labels": ["bug", "urgent"],
  "estimatedHours": 4
}

Note: Creator is automatically set to authenticated user
Response: Card object
```

### Get Cards by List
```
GET /api/tasks/cards/list/:listId

Response: Card[] with assignees, watchers, comments
```

### Get Card Details
```
GET /api/tasks/cards/:id

Response: Card object with all relations
```

### Update Card
```
PATCH /api/tasks/cards/:id
Content-Type: application/json

{
  "title": "...",
  "description": "...",
  "dueDate": "...",
  "priority": "...",
  "status": "...",
  "labels": [...],
  "estimatedHours": 5,
  "spentHours": 3,
  "coverImage": "..."
}

Response: Updated Card object
```

### Delete Card
```
DELETE /api/tasks/cards/:id

Response: 200 OK
```

### Assign User to Card
```
POST /api/tasks/cards/:id/assignees
Content-Type: application/json

{
  "userId": "uuid"
}

Response: Card with updated assignees
```

### Unassign User from Card
```
DELETE /api/tasks/cards/:id/assignees/:userId

Response: Card with updated assignees
```

### Add Watcher to Card
```
POST /api/tasks/cards/:id/watchers
Content-Type: application/json

{
  "userId": "uuid"
}

Response: Card with updated watchers
```

### Remove Watcher from Card
```
DELETE /api/tasks/cards/:id/watchers/:userId

Response: Card with updated watchers
```

### Move Card
```
PATCH /api/tasks/cards/:id/move
Content-Type: application/json

{
  "listId": "uuid",
  "position": 0
}

Response: Card with updated list and position
```

### Reorder Cards in List
```
POST /api/tasks/cards/:listId/reorder
Content-Type: application/json

{
  "cardIds": ["uuid1", "uuid2", "uuid3"]
}

Response: Card[] with updated positions
```

---

## Comments Endpoints

### Create Comment
```
POST /api/tasks/comments
Content-Type: application/json

{
  "content": "This is a comment",
  "cardId": "uuid"
}

Note: Author is automatically set to authenticated user
Response: CardComment object
```

### Get Comments by Card
```
GET /api/tasks/comments/card/:cardId

Response: CardComment[] sorted by creation time (ascending)
```

### Get Comment Details
```
GET /api/tasks/comments/:id

Response: CardComment object with author
```

### Update Comment
```
PATCH /api/tasks/comments/:id
Content-Type: application/json

{
  "content": "Updated comment text"
}

Note: Only comment author can update
Response: Updated CardComment object
```

### Delete Comment
```
DELETE /api/tasks/comments/:id

Note: Only comment author can delete
Response: 200 OK
```

---

## Actions (Audit Log) Endpoints

### Get Board Actions
```
GET /api/tasks/actions/board/:boardId?limit=50

Parameters:
  - limit (optional): Number of actions to return (default: 50)

Response: Action[] sorted by creation time (descending)
```

### Get Actions by User
```
GET /api/tasks/actions/board/:boardId/user/:userId?limit=50

Parameters:
  - limit (optional): Number of actions to return (default: 50)

Response: Action[] for specific user sorted by creation time (descending)
```

### Get Actions by Target
```
GET /api/tasks/actions/target/:targetId

Response: Action[] for specific entity (card, list, etc.)
```

---

## Enums

### CardPriority
```
- "low"
- "medium"
- "high"
- "critical"
```

### CardStatus
```
- "todo"
- "in_progress"
- "in_review"
- "done"
```

### MemberRole
```
- "admin": Full control over board
- "member": Can create/edit cards, add comments
- "observer": Read-only access
```

### ActionType
```
- CREATE_BOARD
- UPDATE_BOARD
- DELETE_BOARD
- CREATE_LIST
- UPDATE_LIST
- DELETE_LIST
- CREATE_CARD
- UPDATE_CARD
- MOVE_CARD
- DELETE_CARD
- ASSIGN_CARD
- UNASSIGN_CARD
- ADD_COMMENT
- DELETE_COMMENT
- ADD_MEMBER
- REMOVE_MEMBER
- UPDATE_MEMBER_ROLE
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request body",
  "error": "Bad Request"
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

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Only board admins can perform this action",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Board with ID <id> not found",
  "error": "Not Found"
}
```

---

## Example Usage Flows

### Create a Board and Add Content
```bash
# 1. Create board
POST /api/tasks/boards
{
  "name": "Q4 Sprint",
  "workspaceId": "workspace-uuid"
}
→ Board created with id: board-uuid

# 2. Create lists
POST /api/tasks/lists
{
  "title": "To Do",
  "position": 0,
  "boardId": "board-uuid"
}
→ List created with id: list-uuid-1

# 3. Create card
POST /api/tasks/cards
{
  "title": "Implement feature X",
  "dueDate": "2024-12-31",
  "priority": "high",
  "listId": "list-uuid-1",
  "position": 0
}
→ Card created with id: card-uuid-1

# 4. Assign user to card
POST /api/tasks/cards/card-uuid-1/assignees
{
  "userId": "user-uuid"
}

# 5. Add comment
POST /api/tasks/comments
{
  "content": "Started working on this",
  "cardId": "card-uuid-1"
}

# 6. View action history
GET /api/tasks/actions/board/board-uuid
```

---

## Notes

- All UUIDs should be valid v4 format
- Dates should be ISO 8601 format
- Timestamps are returned in ISO 8601 format
- Soft deletes are used for boards and lists (isActive flag)
- Hard deletes are used for cards, comments, and actions
- All endpoints are protected by JWT authentication
- Detailed action logging automatically tracks all operations
