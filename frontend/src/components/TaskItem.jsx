import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import TaskForm from './TaskForm.jsx';

const PRIORITY_CLASS = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const STATUS_CLASS = { todo: 'badge-todo', 'in-progress': 'badge-inprogress', completed: 'badge-completed' };
const DEADLINE_STATUS = {
  'no-deadline': { label: 'No Deadline', className: 'deadline-none' },
  upcoming: { label: 'Upcoming', className: 'deadline-upcoming' },
  'due-today': { label: 'Due Today', className: 'deadline-today' },
  overdue: { label: 'Overdue', className: 'deadline-overdue' },
  completed: { label: 'Completed', className: 'deadline-completed' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

function TaskItem({ task, onRefresh }) {
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deadline = DEADLINE_STATUS[task.deadlineStatus] || DEADLINE_STATUS['no-deadline'];

  const handleDelete = async () => {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await tasksAPI.delete(task._id);
      onRefresh();
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
      setDeleting(false);
    }
  };

  if (showEdit) {
    return <div className="task-card"><TaskForm editTask={task} onSuccess={() => { setShowEdit(false); onRefresh(); }} onCancel={() => setShowEdit(false)} /></div>;
  }

  return (
    <div className="task-card">
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <div className="task-badges">
          <span className={`badge ${STATUS_CLASS[task.status] || ''}`}>
            {task.status === 'in-progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Completed'}
          </span>
          <span className={`badge ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
          <span className={`badge ${deadline.className}`}>{deadline.label}</span>
        </div>
      </div>
      {task.description && <p className="task-description">{task.description}</p>}
      <div className="task-meta">
        {task.project && <span className="task-meta-item">Project: <Link to={`/projects/${task.project._id}`} className="project-link">{task.project.name || 'Unknown project'}</Link></span>}
        {task.assignedTo ? <span className="task-meta-item">Assigned: {task.assignedTo.name}</span> : <span className="task-meta-item muted">Unassigned</span>}
        <span className="task-meta-item">{task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No deadline'}</span>
        <span className="task-meta-item">Status: {deadline.label}</span>
      </div>
      <div className="task-actions">
        <button className="btn-edit" onClick={() => setShowEdit(true)}>Edit</button>
        <button className="btn-delete" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
      </div>
    </div>
  );
}

export default TaskItem;
