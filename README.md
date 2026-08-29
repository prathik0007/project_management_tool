# Project Management Tool

A modern web application built with React for the frontend and Node.js with Express for the backend.

## 🚀 Phase 1: Basic Setup & Connection

Phase 1 establishes the baseline project structure and verifies communication between the React frontend and Node.js/Express backend.

---

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI Library
- **Vite** - Lightning-fast Build Tool & Dev Server
- **CSS3** - Modern styling

### Backend
- **Node.js** - JavaScript Runtime
- **Express.js** - Web framework for API routes
- **CORS** - Enables cross-origin requests from frontend

---

## 📁 Project Structure

```text
project-management-tool/
├── backend/
│   ├── package.json
│   └── server.js
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

## ⚡ How to Start the Project

### 1. Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm install
npm start
```
The backend server will run at: **`http://localhost:5000`**

---

### 2. Start the Frontend Application

Open a **new** terminal window/tab and run:

```bash
cd frontend
npm install
npm run dev
```
The React frontend will run at: **`http://localhost:5173`**

---

## 🧪 Testing Connection

1. Open `http://localhost:5173` in your web browser.
2. Click the **"Test Backend"** button.
3. You will see the response from Express server: `"Backend is working"`.
