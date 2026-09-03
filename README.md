# MERN E-Commerce Application

Full-stack folder structure scaffold (feature-based frontend, module-based backend MVC).

## Structure
- frontend/  -> React (Vite) client, feature-based folders
- backend/   -> Node.js + Express + MongoDB (Mongoose), module-based MVC

## Backend quick start
1. cd backend
2. npm install
3. Update .env with your real MONGO_URI (a local MongoDB or MongoDB Atlas connection string)
4. npm run dev
5. Check http://localhost:5000/api/health
6. Test the DB connection via the CRUD endpoints under /api/test (see backend/src/modules/test)

## DB Connection Test (CRUD)
Base URL: /api/test
- POST   /api/test        { "message": "hello" }
- GET    /api/test
- GET    /api/test/:id
- PUT    /api/test/:id    { "message": "updated" }
- DELETE /api/test/:id

A successful POST + GET confirms the app can read/write to MongoDB.
