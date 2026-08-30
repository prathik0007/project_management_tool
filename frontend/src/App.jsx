import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AppNav from './components/AppNav.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Tasks from './pages/Tasks.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import Deadlines from './pages/Deadlines.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Projects from './pages/Projects.jsx';
import NotFound from './pages/NotFound.jsx';

// ─── Home Page (Backend Connection Test, preserved) ──────────────────────────
function Home() {
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTestBackend = async () => {
    setLoading(true);
    setError('');
    setResponseMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/test', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Server returned status: ${res.status}`);
      const data = await res.json();
      setResponseMessage(data.message);
    } catch {
      setError('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Project Management Tool</h1>
          <p className="page-subtitle">Backend Connection & API Verification</p>
        </div>
      </header>

      <main className="content-card">
        <h2>Backend Connectivity Test</h2>
        <p className="description">
          Send a <code>GET /api/test</code> request to verify backend API health.
        </p>

        <button className="test-btn" onClick={handleTestBackend} disabled={loading}>
          {loading ? 'Testing Connection...' : 'Test Backend Connection'}
        </button>

        {responseMessage && (
          <div className="response-box success">
            <span className="label">Backend Status:</span>
            <p className="message">{responseMessage}</p>
          </div>
        )}

        {error && (
          <div className="response-box error">
            <span className="label">Error:</span>
            <p className="message">{error}</p>
          </div>
        )}
      </main>

      <nav className="home-nav">
        <Link to="/dashboard" className="nav-card">
          <span className="nav-card-label">Go to Dashboard</span>
          <span className="nav-card-arrow">→</span>
        </Link>
        <Link to="/tasks" className="nav-card">
          <span className="nav-card-label">Go to Tasks</span>
          <span className="nav-card-arrow">→</span>
        </Link>
      </nav>
    </div>
  );
}

// ─── Authenticated App Layout (Sidebar + Main View) ──────────────────────────
function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <AppNav />
      <div className="app-main-content">
        {children}
      </div>
    </div>
  );
}

// ─── Main App Component ──────────────────────────────────────────────────────
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Authentication Pages (No Sidebar, Perfectly Centered) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Standalone Test / Verification Landing Route */}
            <Route path="/" element={<Home />} />

            {/* Authenticated Application Workspace Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Projects />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectDetails />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Tasks />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deadlines"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Deadlines />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
