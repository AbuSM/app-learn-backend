# Quick Start Guide - Trello Backend API

## 🚀 5-Minute Setup

### 1. Prerequisites
```bash
# Check Node.js version (should be 18+)
node --version

# Check PostgreSQL is running
psql --version
```

### 2. Install Dependencies
```bash
cd /Users/fattoh/Projects/app-learn-backend
npm install
```

### 3. Configure Database
Create `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=trello_app
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3001
```

### 4. Create Database
```bash
# Create database
psql -U postgres -c "CREATE DATABASE trello_app;"

# TypeORM will auto-create tables on startup
```

### 5. Start Development Server
```bash
npm run start:dev
```

The API will be available at: `http://localhost:3000/api`

---

## 📚 API Documentation

Read the detailed docs:
- **API Endpoints**: `API_DOCUMENTATION.md`
- **Implementation Details**: `TRELLO_IMPLEMENTATION_SUMMARY.md`
- **Created Files**: `FILES_CREATED.md`

---

## 🧪 Test the API

### Using curl (create a board)
```bash
# Get JWT token first (assuming you have auth endpoint)
TOKEN="your_jwt_token_here"

# Create a board
curl -X POST http://localhost:3000/api/boards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Board",
    "description": "Test board",
    "workspaceId": "your-workspace-uuid"
  }'
```

### Using Postman
1. Import the endpoints from `API_DOCUMENTATION.md`
2. Set up environment variable: `token = your_jwt_token`
3. Start with "Create Board" endpoint
4. Follow the example workflows

---

## 📋 Common Tasks

### Create a Complete Board with Content
```
1. POST /api/boards - Create board
2. POST /api/lists - Create "To Do" list
3. POST /api/lists - Create "In Progress" list
4. POST /api/cards - Create first card
5. POST /api/cards/:id/assignees - Assign user
6. POST /api/comments - Add comment
```

### Add Team Member
```
POST /api/boards/:boardId/members
{
  "userId": "user-uuid",
  "role": "member"  // or "admin", "observer"
}
```

### Track Card Progress
```
1. PATCH /api/cards/:id - Update status to "in_progress"
2. POST /api/cards/:id/watchers - Add watchers
3. POST /api/comments - Add progress comment
4. GET /api/actions/board/:boardId - View history
```

---

## 🔑 Key Endpoints

### Boards
- `POST /api/boards` - Create
- `GET /api/boards/workspace/:id` - List
- `GET /api/boards/:id` - Details
- `PATCH /api/boards/:id` - Update
- `DELETE /api/boards/:id` - Delete

### Cards
- `POST /api/cards` - Create with:
  - title, description, dueDate
  - priority, status, labels
  - estimatedHours
- `GET /api/cards/list/:id` - Get all in list
- `PATCH /api/cards/:id/move` - Move to different list
- `POST /api/cards/:id/assignees` - Assign users

### Comments
- `POST /api/comments` - Add comment
- `GET /api/comments/card/:id` - Get all
- `PATCH /api/comments/:id` - Edit
- `DELETE /api/comments/:id` - Delete

### Audit Log
- `GET /api/actions/board/:id` - Board activity
- `GET /api/actions/target/:id` - Entity activity

---

## 🛠️ Build & Deploy

### Development
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

### Testing
```bash
npm run test
npm run test:cov
```

### Linting
```bash
npm run lint
```

---

## 🔒 Authentication

All endpoints require JWT token in headers:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Get token from `/api/auth/login` endpoint

---

## 📊 Database

### Tables Created Automatically
- `boards` - Main boards
- `lists` - Columns/lists
- `cards` - Tasks
- `card_comments` - Comments
- `card_assignees` - Card assignments (M2M)
- `card_watchers` - Card watchers (M2M)
- `board_members` - Team members
- `actions` - Audit log
- `users` - Users (existing)
- `workspaces` - Workspaces (existing)

### View Database
```bash
# Connect to database
psql -U postgres -d trello_app

# List tables
\dt

# View table structure
\d cards
```

---

## ❌ Troubleshooting

### Port 3000 Already in Use
```bash
# The app auto-detects and uses port 3001 if 3000 is busy
npm run start:dev
# Check console for actual port
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
# Check .env credentials match your setup
# Test connection:
psql -U postgres -d trello_app
```

### Build Errors
```bash
# Clean build
rm -rf dist
npm run build

# Check TypeScript
npx tsc --noEmit
```

---

## 📈 Next Steps

1. ✅ Setup database and start server
2. ✅ Create test workspace and board
3. ✅ Test creating lists and cards
4. ✅ Test member management
5. ✅ Build frontend to consume API
6. ✅ Setup CI/CD pipeline
7. ✅ Deploy to production

---

## 📖 Documentation Links

- **Complete API Reference**: `API_DOCUMENTATION.md`
- **Implementation Summary**: `TRELLO_IMPLEMENTATION_SUMMARY.md`
- **Files Reference**: `FILES_CREATED.md`
- **NestJS Docs**: https://docs.nestjs.com
- **TypeORM Docs**: https://typeorm.io

---

## 💡 Tips

- Use the action history (`GET /api/actions/board/:id`) to understand what's happening
- Test endpoints in order: boards → lists → cards → comments
- Permission errors? Check member roles and admin status
- Comment errors? Make sure you own the comment
- Card movement errors? Verify list exists and position is valid

---

## ✨ Features at a Glance

✅ Create/manage boards and teams
✅ Organize work in lists
✅ Create detailed task cards
✅ Assign multiple team members
✅ Track progress with status
✅ Add priorities and deadlines
✅ Comment and collaborate
✅ Watch card updates
✅ Complete audit trail
✅ Role-based permissions
✅ Time tracking support
✅ Custom labels and tags

---

**You're all set! Happy building! 🎉**
