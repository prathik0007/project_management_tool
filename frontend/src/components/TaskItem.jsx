import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import TaskForm from './TaskForm.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { useToast } from './Toast.jsx';
import { Icon } from './Icons.jsx';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'completed' || status === 'done') return false;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
}

function TaskItem({
  task,
  onRefresh,
  onToggle,
  onEdit,
  onDelete,
  viewMode = 'list',
}) {
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDone = task.status === 'completed' || task.status === 'done';
  const overdue = isOverdue(task.dueDate, task.status);
  const taskId = task._id || task.id;

  const handleStatusToggle = () => {
    if (onToggle) {
      onToggle(task);
    } else {
      const nextStatus = isDone ? 'todo' : 'completed';
      tasksAPI
        .update(taskId, { status: nextStatus })
        .then(() => {
          showToast(isDone ? 'Task marked as To Do' : 'Task completed! 🎉', 'success');
          if (onRefresh) onRefresh();
        })
        .catch((err) => showToast(err.message || 'Failed to update task', 'error'));
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(task);
    } else {
      setShowEditModal(true);
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(taskId);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await tasksAPI.delete(taskId);
      showToast('Task deleted successfully', 'info');
      setShowDeleteConfirm(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (viewMode === 'kanban') {
    const assigneeInitials = (task.assignedTo?.name || 'U').slice(0, 2).toUpperCase();

    return (
      <>
        <article className="kanban-card">
          <div className="kanban-card-top">
            <span className={`badge badge-${task.priority || 'medium'}`}>
              {task.priority || 'medium'}
            </span>
            <div className="kanban-card-actions">
              <button
                type="button"
                className="icon-action-btn"
                onClick={handleEditClick}
                title="Edit Task"
              >
                <Icon name="edit" size={13} />
              </button>
              <button
                type="button"
                className="icon-action-btn danger"
                onClick={handleDeleteClick}
                title="Delete Task"
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>

          <h4 className="kanban-card-title">{task.title}</h4>
          {task.description && <p className="kanban-card-desc">{task.description}</p>}

          <div className="kanban-card-footer">
            {task.project?.name && (
              <span className="kanban-project-tag">
                <Icon name="folder" size={12} />
                <span>{task.project.name}</span>
              </span>
            )}

            <div className="kanban-card-meta">
              {task.dueDate && (
                <span className={`kanban-due-date ${overdue ? 'date-overdue' : ''}`}>
                  <Icon name="calendar" size={12} />
                  {formatDate(task.dueDate)}
                </span>
              )}
              {task.assignedTo?.name && (
                <span className="user-avatar-tiny" title={`Assigned to ${task.assignedTo.name}`}>
                  {assigneeInitials}
                </span>
              )}
            </div>
          </div>
        </article>

        {showEditModal && (
          <TaskForm
            editTask={task}
            onSuccess={() => {
              setShowEditModal(false);
              if (onRefresh) onRefresh();
            }}
            onClose={() => setShowEditModal(false)}
          />
        )}

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"?`}
          confirmText="Delete Task"
          danger
          disabled={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </>
    );
  }

  return (
    <>
      <article className="task-row-card">
        <div className="task-row-main">
          <button
            type="button"
            className={`status-circle-btn ${isDone ? 'completed' : ''}`}
            onClick={handleStatusToggle}
            title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {isDone && <Icon name="check" size={12} />}
          </button>

          <div className="task-row-info">
            <div className="task-row-title-line">
              <h4 className={`task-row-title ${isDone ? 'completed' : ''}`}>
                {task.title}
              </h4>
              <div className="task-row-badges">
                <span className={`badge badge-${task.status === 'completed' || task.status === 'done' ? 'completed' : task.status === 'in_progress' ? 'inprogress' : 'todo'}`}>
                  {task.status?.replace('_', ' ') || 'todo'}
                </span>
                <span className={`badge badge-${task.priority || 'medium'}`}>
                  {task.priority || 'medium'}
                </span>
              </div>
            </div>

            {task.description && <p className="task-row-desc">{task.description}</p>}

            <div className="task-row-meta">
              {task.project && (
                <span className="task-meta-item">
                  <Icon name="folder" size={13} />
                  <Link
                    to={`/projects/${task.project._id || task.project.id || task.project}`}
                    className="project-link"
                  >
                    {task.project.name || 'Project'}
                  </Link>
                </span>
              )}
              {task.assignedTo ? (
                <span className="task-meta-item">
                  <Icon name="user" size={13} />
                  <span>{task.assignedTo.name || task.assignedTo.email}</span>
                </span>
              ) : (
                <span className="task-meta-item muted">Unassigned</span>
              )}
              {task.dueDate && (
                <span className={`task-meta-item ${overdue ? 'date-overdue' : ''}`}>
                  <Icon name="calendar" size={13} />
                  <span>Due {formatDate(task.dueDate)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="task-row-actions">
          <button type="button" className="btn-ghost btn-sm" onClick={handleEditClick}>
            <Icon name="edit" size={14} />
            <span>Edit</span>
          </button>
          <button type="button" className="btn-ghost btn-sm danger" onClick={handleDeleteClick}>
            <Icon name="trash" size={14} />
            <span>Delete</span>
          </button>
        </div>
      </article>

      {showEditModal && (
        <TaskForm
          editTask={task}
          onSuccess={() => {
            setShowEditModal(false);
            if (onRefresh) onRefresh();
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"?`}
        confirmText="Delete Task"
        danger
        disabled={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

export default TaskItem;
