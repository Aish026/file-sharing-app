# File Sharing Application

## Live Demo
- **Frontend**: file-sharing-app-vercel-hgkc9e4fc-aishwaryas-projects-17e9f2a0.vercel.app
- **Backend API**: https://file-sharing-app-production-6ea2.up.railway.app/

## GitHub Repository
https://github.com/Aish026/file-sharing-app

## How to Test
1. Visit the live demo link
2. Register a new account
3. Login with your credentials
4. Upload files (PDF, images, CSV)
5. Download uploaded files
6. Share files with other users (need 2 accounts to test)
7. Generate shareable links

## Local Setup Instructions

### Prerequisites
- Node.js installed
- MySQL installed

### Database Setup
```sql
CREATE DATABASE file_share;
-- Run SQL commands from initial setup
```

### Backend
```bash
cd backend
npm install
# Configure .env with MySQL credentials
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Tech Stack
- Frontend: React.js
- Backend: Node.js, Express
- Database: MySQL
- Deployment: Vercel (frontend), Railway (backend)
