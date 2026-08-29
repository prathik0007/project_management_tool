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
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

function TaskItem({ task, onRefresh }) {
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
      toast('Task deleted', 'success');
      onRefresh();
    } catch (err) {
      setConfirming(false);
      toast(err.message || 'Failed to delete task', 'error');
    } finally {
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
          <span className={`badge ${STATUS_CLASS[task.status] || ''}`}>{STATUS_LABEL[task.status] || task.status}</span>
          <span className={`badge ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
          <span className={`badge ${deadline.className}`}>{deadline.label}</span>
        </div>
      </div>
      {task.description && <p className="task-description">{task.description}</p>}
      <div className="task-meta">
        {task.project && <span className="task-meta-item">Project: <Link to={`/projects/${task.project._id}`} className="project-link">{task.project.name || 'Unknown project'}</Link></span>}
        {task.assignedTo ? <span className="task-meta-item">Assigned: {task.assignedTo.name}</span> : <span className="task-meta-item muted">Unassigned</span>}
        <span className="task-meta-item">{task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No deadline'}</span>
      </div>
      <div className="task-actions">
        <button className="btn-edit" onClick={() => setShowEdit(true)}><Icon name="edit" size={14} /> Edit</button>
        <button className="btn-delete" onClick={() => setConfirming(true)}><Icon name="trash" size={14} /> Delete</button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Delete task?"
        message={`This will permanently delete "${task.title}". This action cannot be undone.`}
        confirmLabel="Delete Task"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

export default TaskItem;
