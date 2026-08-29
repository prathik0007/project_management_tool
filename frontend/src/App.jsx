import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Tasks from './pages/Tasks.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import Deadlines from './pages/Deadlines.jsx';

// ─── Home Page (Phase 1 content, preserved) ─────────────────────────────────
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
    } catch (err) {
      setError('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Project Management Tool</h1>
        <p className="status-badge">Frontend is working</p>
      </header>

      <main className="content-card">
        <h2>Backend Connection Test</h2>
        <p className="description">
          Click the button below to send a <code>GET /api/test</code> request to the Node.js / Express backend.
        </p>

        <button className="test-btn" onClick={handleTestBackend} disabled={loading}>
          {loading ? 'Testing...' : 'Test Backend'}
        </button>

        {responseMessage && (
          <div className="response-box success">
            <span className="label">Backend Response:</span>
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

      {/* Navigation to Tasks page */}
      <nav className="home-nav">
        <Link to="/tasks" className="nav-card">
          <span className="nav-card-icon">✅</span>
          <span className="nav-card-label">Go to Tasks</span>
          <span className="nav-card-arrow">→</span>
        </Link>
      </nav>
    </div>
  );
}

// ─── App with Router ─────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/deadlines" element={<Deadlines />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
