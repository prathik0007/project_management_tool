import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import TaskForm from '../components/TaskForm.jsx';
import TaskList from '../components/TaskList.jsx';
import { Icon } from '../components/Icons.jsx';

// Tasks page — the main view for task management.
// Filtering/searching is done client-side on already-fetched data (no backend change).
function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Client-side filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

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

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setSuccessMsg('Task created successfully!');
    fetchTasks();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const projects = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => { if (task.project?._id) map.set(task.project._id, task.project.name || 'Project'); });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const filtered = useMemo(() => tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (projectFilter !== 'all' && task.project?._id !== projectFilter) return false;
    return true;
  }), [tasks, search, statusFilter, priorityFilter, projectFilter]);

  const filtersActive = search || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all';

  return (
    <div className="page-container">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-subtitle">Manage all your tasks across projects</p>
        </div>
        <button className="btn-primary btn-lg" onClick={() => setShowCreateForm((prev) => !prev)}>
          <Icon name="plus" size={16} /> {showCreateForm ? 'Close' : 'New Task'}
        </button>
      </div>

      {/* ── Success Message ── */}
      {successMsg && <div className="alert alert-success" role="status">{successMsg}</div>}

      {/* ── Create Task Form ── */}
      {showCreateForm && (
        <div className="form-panel">
          <TaskForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateForm(false)} />
        </div>
      )}

      {/* ── Filters (client-side, no backend change) ── */}
      <div className="task-filters" role="search">
        <div className="task-search">
          <Icon name="search" size={15} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" aria-label="Search tasks" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} aria-label="Filter by priority">
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} aria-label="Filter by project">
          <option value="all">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* ── Task List ── */}
      <div className="section-header">
        <h2>{filtersActive ? `Matching Tasks (${filtered.length} of ${tasks.length})` : `All Tasks (${tasks.length})`}</h2>
        <Link to="/deadlines" className="nav-link">View Deadlines</Link>
      </div>

      <TaskList
        tasks={filtered}
        loading={loading}
        error={error}
        onRefresh={fetchTasks}
      />
    </div>
  );
}

export default Tasks;
