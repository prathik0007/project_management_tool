import { useState } from 'react';
import { tasksAPI } from '../services/api.js';
import TaskForm from './TaskForm.jsx';

// Priority badge colors
const PRIORITY_CLASS = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
};

// Status badge colors
const STATUS_CLASS = {
  todo: 'badge-todo',
  'in-progress': 'badge-inprogress',
  completed: 'badge-completed',
};

// Format an ISO date string to a readable date
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// TaskItem displays a single task card with Edit and Delete buttons.
// Props:
//   task       - the task object
//   onRefresh  - callback to re-fetch the task list after edit/delete
function TaskItem({ task, onRefresh }) {
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await tasksAPI.delete(task._id);
      onRefresh(); // Refresh the task list in the parent
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
      setDeleting(false);
    }
  };

  // Called when TaskForm completes an edit successfully
  const handleEditSuccess = () => {
    setShowEdit(false);
    onRefresh();
  };

  return (
    <div className="task-card">
      {/* ── If edit form is open, show it inline instead of task details ── */}
      {showEdit ? (
        <TaskForm
          editTask={task}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEdit(false)}
        />
      ) : (
        <>
          {/* Task Header */}
          <div className="task-card-header">
            <h4 className="task-title">{task.title}</h4>
            <div className="task-badges">
              <span className={`badge ${STATUS_CLASS[task.status] || ''}`}>
                {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Completed'}
              </span>
              <span className={`badge ${PRIORITY_CLASS[task.priority] || ''}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {/* Meta info */}
          <div className="task-meta">
            {task.project && (
              <span className="task-meta-item">
                📁 <strong>{task.project.name || 'Unknown project'}</strong>
              </span>
            )}
            {task.assignedTo ? (
              <span className="task-meta-item">
                👤 {task.assignedTo.name}
              </span>
            ) : (
              <span className="task-meta-item muted">👤 Unassigned</span>
            )}
            {task.dueDate && (
              <span className="task-meta-item">
                📅 {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="task-actions">
            <button
              className="btn-edit"
              onClick={() => setShowEdit(true)}
            >
              Edit
            </button>
            <button
              className="btn-delete"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TaskItem;
