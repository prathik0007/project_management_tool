# Project Management Tool

A modern web application built with React for the frontend and Node.js with Express for the backend, connected to MongoDB for data storage.

---

## 🛠️ Technologies Used

### Frontend
- **React 18** – UI Library
- **Vite** – Lightning-fast Build Tool & Dev Server

### Backend
- **Node.js** – JavaScript Runtime
- **Express.js** – Web framework for API routes
- **CORS** – Enables cross-origin requests from frontend
- **dotenv** – Loads environment variables from `.env` file
- **Mongoose** – MongoDB object modeling for Node.js

### Database
- **MongoDB** – NoSQL cloud database (MongoDB Atlas recommended)

---

## 📁 Project Structure

```text
project-management-tool/
├── backend/
│   ├── config/
│   │   └── db.js          ← MongoDB connection logic
│   ├── .env               ← Private environment variables (NOT committed to git)
│   ├── .env.example       ← Template showing required env variables
│   ├── package.json
│   └── server.js          ← Express server entry point
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Setup (REQUIRED before running backend)

The backend requires a `.env` file inside the `backend/` folder.

### Step 1: Create the `.env` file

Inside the `backend/` folder, create a file named `.env`:

```
backend/.env
```

### Step 2: Add your environment variables

Open the `.env` file and add:

```
MONGO_URI=your_actual_mongodb_connection_string
PORT=5000
```

Replace `your_actual_mongodb_connection_string` with your real MongoDB Atlas URI.

> ⚠️ **IMPORTANT**: Never share or commit your `.env` file. It is already listed in `.gitignore`.

### MongoDB Atlas URI format

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
```

---

## ⚡ How to Start the Project

### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```

Backend runs at: **`http://localhost:5000`**

**Expected terminal output when MongoDB connects successfully:**
```
Server running on http://localhost:5000
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

### 2. Start the Frontend Application

Open a **new** terminal tab and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **`http://localhost:5173`**

---

## 🧪 Testing the API Endpoints

### Test 1 – Backend health check (Phase 1)
```
GET http://localhost:5000/api/test
```
Expected response:
```json
{ "message": "Backend is working" }
```

### Test 2 – Database connection check (Phase 2)
```
GET http://localhost:5000/api/db-test
```
Expected response when connected:
```json
{ "message": "Database is connected" }
```
