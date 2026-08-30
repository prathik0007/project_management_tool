import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
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
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

// ─── Main App Component ──────────────────────────────────────────────────────
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Route: Shows Login for unauthenticated users; redirects to Dashboard for authenticated users */}
            <Route path="/" element={<Login />} />

            {/* Standalone Authentication Pages (No Sidebar, Centered Card) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
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
