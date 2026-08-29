import { useEffect, useState } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../services/api.js';

// TaskForm handles both CREATE and EDIT modes.
// Props:
//   onSuccess   - callback after a successful create/edit
//   editTask    - if provided, the form pre-fills with this task's data (edit mode)
//   onCancel    - callback when the user clicks Cancel
function TaskForm({ onSuccess, editTask = null, onCancel }) {
  const isEditing = Boolean(editTask);

  // Form field state — pre-fill from editTask if we're editing
  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [projectId, setProjectId] = useState(editTask?.project?._id || editTask?.project || '');
  const [assignedTo, setAssignedTo] = useState(editTask?.assignedTo?._id || editTask?.assignedTo || '');
  const [status, setStatus] = useState(editTask?.status || 'todo');
  const [priority, setPriority] = useState(editTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    editTask?.dueDate ? editTask.dueDate.slice(0, 10) : '' // Format to YYYY-MM-DD
  );

  // Dropdown data
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load projects and users when component first mounts
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [projectsData, usersData] = await Promise.all([
          projectsAPI.getAll(),
          usersAPI.getAll(),
        ]);
        setProjects(projectsData.projects || []);
        setUsers(usersData.users || []);
      } catch (err) {
        setError('Failed to load projects or users');
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdownData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!isEditing && !projectId) {
      setError('Please select a project');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo || null,
        status,
        priority,
        dueDate: dueDate || null,
      };

      if (isEditing) {
        // PUT /api/tasks/:id — update existing task
        await tasksAPI.update(editTask._id, payload);
      } else {
        // POST /api/tasks — create new task
        await tasksAPI.create({ ...payload, project: projectId });
      }

      onSuccess(); // Tell the parent to refresh and close this form
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDropdowns) {
    return <p className="loading-text">Loading form data...</p>;
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3 className="form-title">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>

      {error && <div className="form-error">{error}</div>}

      {/* Title */}
      <div className="form-group">
        <label htmlFor="task-title">Title *</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="task-desc">Description</label>
        <textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={3}
        />
      </div>

      {/* Project (only for create mode — can't reassign a task's project) */}
      {!isEditing && (
        <div className="form-group">
          <label htmlFor="task-project">Project *</label>
          <select
            id="task-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">— Select a project —</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="hint-text">No projects yet. Create a project first.</p>
          )}
        </div>
      )}

      {/* Assigned To */}
      <div className="form-group">
        <label htmlFor="task-assigned">Assign To</label>
        <select
          id="task-assigned"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">— Unassigned —</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="form-group">
        <label htmlFor="task-priority">Priority</label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Status (only relevant for editing) */}
      {isEditing && (
        <div className="form-group">
          <label htmlFor="task-status">Status</label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      )}

      {/* Due Date */}
      <div className="form-group">
        <label htmlFor="task-due">Due Date</label>
        <input
          id="task-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
