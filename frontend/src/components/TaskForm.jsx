import { useEffect, useState } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../services/api.js';
import { Icon } from './Icons.jsx';

function TaskForm({ onSuccess, editTask = null, onCancel }) {
  const isEditing = Boolean(editTask);

  const [title, setTitle] = useState(editTask?.title || '');
  const [description, setDescription] = useState(editTask?.description || '');
  const [projectId, setProjectId] = useState(editTask?.project?._id || editTask?.project || '');
  const [assignedTo, setAssignedTo] = useState(editTask?.assignedTo?._id || editTask?.assignedTo || '');
  const [status, setStatus] = useState(editTask?.status || 'todo');
  const [priority, setPriority] = useState(editTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    editTask?.dueDate ? editTask.dueDate.slice(0, 10) : ''
  );

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [projectsData, usersData] = await Promise.all([
          projectsAPI.getAll(),
          usersAPI.getAll(),
        ]);
        setProjects(projectsData.projects || []);
        setUsers(usersData.users || []);
      } catch {
        setError('Failed to load projects or users list.');
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
      setError('Task title is required.');
      return;
    }
    if (!isEditing && !projectId) {
      setError('Please select a project for this task.');
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
        await tasksAPI.update(editTask._id, payload);
      } else {
        await tasksAPI.create({ ...payload, project: projectId });
      }

      onSuccess();
    } catch (err) {
      setError(err.message || 'Unable to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <Icon name="check" size={18} />
            </span>
            <h3>{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
          </div>
          {onCancel && (
            <button className="modal-close-btn" onClick={onCancel} aria-label="Close dialog">
              <Icon name="x" size={18} />
            </button>
          )}
        </div>

        {loadingDropdowns ? (
          <div className="modal-body modal-loading">
            <span className="btn-spinner" />
            <p>Loading projects and assignment data...</p>
          </div>
        ) : (
          <form className="modal-body" onSubmit={handleSubmit}>
            {error && (
              <div className="form-error-alert" role="alert">
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="task-title">Task Title *</label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement authentication middleware"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed instructions or acceptance criteria..."
                rows={3}
              />
            </div>

            <div className="form-row-2col">
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
                </div>
              )}

              <div className="form-group">
                <label htmlFor="task-assigned">Assignee</label>
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
            </div>

            <div className="form-row-3col">
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

              <div className="form-group">
                <label htmlFor="task-due">Due Date</label>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              {onCancel && (
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving Task...' : isEditing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TaskForm;
