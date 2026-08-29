import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';

// Tasks page — the main view for task management.
// Shows a create form and the list of all tasks owned by the logged-in user.
function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // fetchTasks uses useCallback so it can be safely passed as a prop
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tasksAPI.getAll();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tasks once when the page mounts
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Called by TaskForm after a successful creation
  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setSuccessMsg('Task created successfully!');
    fetchTasks(); // Refresh the list
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="page-container">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-subtitle">Manage all your tasks across projects</p>
        </div>
        <Link to="/" className="nav-link">← Back to Home</Link>
      </div>

      {/* ── Success Message ── */}
      {successMsg && (
        <div className="alert alert-success">{successMsg}</div>
      )}

      {/* ── Create Task Toggle Button ── */}
      <div className="section-header">
        <h2>All Tasks ({tasks.length})</h2>
        <Link to="/deadlines" className="nav-link">View Deadlines</Link>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          {showCreateForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {/* ── Create Task Form (shown/hidden by toggle) ── */}
      {showCreateForm && (
        <div className="form-panel">
          <TaskForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* ── Task List ── */}
      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        onRefresh={fetchTasks}
      />
    </div>
  );
}

export default Tasks;
