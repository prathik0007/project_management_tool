import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import TaskForm from './TaskForm.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useToast } from './Toast.jsx';
import { Icon } from './Icons.jsx';

const PRIORITY_CLASS = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const STATUS_CLASS = { todo: 'badge-todo', 'in-progress': 'badge-inprogress', completed: 'badge-completed' };
const STATUS_LABEL = { todo: 'To Do', 'in-progress': 'In Progress', completed: 'Completed' };

const DEADLINE_STATUS = {
  'no-deadline': { label: 'No Deadline', className: 'deadline-none' },
  upcoming: { label: 'Upcoming', className: 'deadline-upcoming' },
  'due-today': { label: 'Due Today', className: 'deadline-today' },
  overdue: { label: 'Overdue', className: 'deadline-overdue' },
  completed: { label: 'Completed', className: 'deadline-completed' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function TaskItem({ task, onRefresh, viewMode = 'list' }) {
  const toast = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deadline = DEADLINE_STATUS[task.deadlineStatus] || DEADLINE_STATUS['no-deadline'];

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tasksAPI.delete(task._id);
      setConfirming(false);
      toast('Task deleted successfully', 'success');
      onRefresh();
    } catch (err) {
      setConfirming(false);
      toast(err.message || 'Failed to delete task', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusQuickChange = async (newStatus) => {
    try {
      await tasksAPI.update(task._id, { status: newStatus });
      toast(`Task moved to ${STATUS_LABEL[newStatus]}`, 'success');
      onRefresh();
    } catch (err) {
      toast(err.message || 'Unable to update status', 'error');
    }
  };

  if (showEdit) {
    return (
      <TaskForm
        editTask={task}
        onSuccess={() => {
          setShowEdit(false);
          onRefresh();
        }}
        onCancel={() => setShowEdit(false)}
      />
    );
  }

  if (viewMode === 'kanban') {
    return (
      <article className="kanban-card">
        <div className="kanban-card-top">
          <span className={`badge ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
          <div className="kanban-card-actions">
            <button className="icon-action-btn" onClick={() => setShowEdit(true)} title="Edit Task">
              <Icon name="edit" size={14} />
            </button>
            <button className="icon-action-btn danger" onClick={() => setConfirming(true)} title="Delete Task">
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>

        <h4 className="kanban-card-title">{task.title}</h4>
        {task.description && <p className="kanban-card-desc">{task.description}</p>}

        <div className="kanban-card-footer">
          {task.project && (
            <Link to={`/projects/${task.project._id}`} className="kanban-project-tag">
              <Icon name="folder" size={12} />
              <span>{task.project.name || 'Project'}</span>
            </Link>
          )}

          <div className="kanban-card-meta">
            {task.assignedTo && (
              <span className="user-avatar-tiny" title={`Assigned to ${task.assignedTo.name}`}>
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </span>
            )}
            {task.dueDate && (
              <span className={`kanban-due-date ${deadline.className}`}>
                <Icon name="calendar" size={12} />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={confirming}
          title="Delete task?"
          message={`Are you sure you want to delete "${task.title}"?`}
          confirmLabel="Delete Task"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      </article>
    );
  }

  return (
    <article className="task-row-card">
      <div className="task-row-main">
        <div className="task-row-checkbox">
          <button
            className={`status-circle-btn ${task.status === 'completed' ? 'completed' : ''}`}
            onClick={() =>
              handleStatusQuickChange(task.status === 'completed' ? 'todo' : 'completed')
            }
            title={task.status === 'completed' ? 'Mark as to-do' : 'Mark as completed'}
          >
            {task.status === 'completed' ? <Icon name="check" size={12} /> : null}
          </button>
        </div>

        <div className="task-row-info">
          <div className="task-row-title-line">
            <h4 className={`task-row-title ${task.status === 'completed' ? 'completed' : ''}`}>
              {task.title}
            </h4>
            <div className="task-row-badges">
              <span className={`badge ${STATUS_CLASS[task.status] || ''}`}>
                {STATUS_LABEL[task.status] || task.status}
              </span>
              <span className={`badge ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
              {task.deadlineStatus && task.deadlineStatus !== 'no-deadline' && (
                <span className={`badge ${deadline.className}`}>{deadline.label}</span>
              )}
            </div>
          </div>

          {task.description && <p className="task-row-desc">{task.description}</p>}

          <div className="task-row-meta">
            {task.project && (
              <span className="task-meta-item">
                <Icon name="folder" size={13} />
                <Link to={`/projects/${task.project._id}`} className="project-link">
                  {task.project.name || 'Project'}
                </Link>
              </span>
            )}
            {task.assignedTo ? (
              <span className="task-meta-item">
                <Icon name="user" size={13} />
                {task.assignedTo.name}
              </span>
            ) : (
              <span className="task-meta-item muted">Unassigned</span>
            )}
            {task.dueDate && (
              <span className="task-meta-item">
                <Icon name="calendar" size={13} />
                Due {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="task-row-actions">
        <button className="btn-ghost btn-sm" onClick={() => setShowEdit(true)}>
          <Icon name="edit" size={14} />
          <span>Edit</span>
        </button>
        <button className="btn-ghost btn-sm danger" onClick={() => setConfirming(true)}>
          <Icon name="trash" size={14} />
          <span>Delete</span>
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete task?"
        message={`Are you sure you want to delete "${task.title}"?`}
        confirmLabel="Delete Task"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </article>
  );
}

export default TaskItem;
