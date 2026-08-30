import { useEffect, useState } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../services/api.js';
import { Icon } from './Icons.jsx';

function TaskForm({
  task = null,
  editTask = null,
  projectId: initialProjectId = '',
  projects: propProjects = null,
  users: propUsers = null,
  onSuccess,
  onClose,
  onCancel,
}) {
  const currentTask = task || editTask;
  const isEditing = Boolean(currentTask);
  const handleClose = onClose || onCancel;

  const [title, setTitle] = useState(currentTask?.title || '');
  const [description, setDescription] = useState(currentTask?.description || '');
  const [projectId, setProjectId] = useState(
    currentTask?.project?._id ||
    currentTask?.project?.id ||
    currentTask?.project ||
    currentTask?.projectId ||
    initialProjectId ||
    ''
  );
  const [assignedTo, setAssignedTo] = useState(
    currentTask?.assignedTo?._id || currentTask?.assignedTo?.id || currentTask?.assignedTo || ''
  );
  const [status, setStatus] = useState(currentTask?.status || 'todo');
  const [priority, setPriority] = useState(currentTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(
    currentTask?.dueDate ? currentTask.dueDate.slice(0, 10) : ''
  );

  const [projectsList, setProjectsList] = useState(propProjects || []);
  const [usersList, setUsersList] = useState(propUsers || []);
  const [loadingDropdowns, setLoadingDropdowns] = useState(!propProjects || !propUsers);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!propProjects || !propUsers) {
      const loadDropdownData = async () => {
        try {
          const [projectsData, usersData] = await Promise.all([
            projectsAPI.getAll().catch(() => ({ projects: [] })),
            usersAPI.getAll().catch(() => ({ users: [] })),
          ]);
          setProjectsList(projectsData.projects || []);
          setUsersList(usersData.users || []);
        } catch {
          setError('Failed to load project or user assignment list.');
        } finally {
          setLoadingDropdowns(false);
        }
      };
      loadDropdownData();
    }
  }, [propProjects, propUsers]);

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
      const normalizedStatus = status === 'in_progress' ? 'in-progress' : status;
      const payload = {
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo || null,
        status: normalizedStatus,
        priority,
        dueDate: dueDate || null,
      };

      if (isEditing) {
        await tasksAPI.update(currentTask._id || currentTask.id, payload);
      } else {
        await tasksAPI.create({ ...payload, project: projectId });
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Unable to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">
              <Icon name="check" size={18} />
            </span>
            <h3>{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
          </div>
          {handleClose && (
            <button className="modal-close-btn" onClick={handleClose} aria-label="Close dialog">
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
                placeholder="e.g. Implement real-time notifications"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed instructions or deliverable notes..."
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
                    {projectsList.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
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
                  {usersList.map((u) => (
                    <option key={u._id || u.id} value={u._id || u.id}>
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
              {handleClose && (
                <button type="button" className="btn-secondary" onClick={handleClose} disabled={submitting}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={submitting || !title.trim()}>
                {submitting ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Saving Task...</span>
                  </>
                ) : isEditing ? (
                  'Save Changes'
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default TaskForm;
