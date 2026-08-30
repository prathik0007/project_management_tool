import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonRow } from '../components/Skeletons.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Deadlines() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDeadlines = useCallback(async () => {
    try {
      const data = await tasksAPI.getDeadlines();
      setTasks(data.deadlines || data.tasks || []);
    } catch {
      setError('Unable to load deadlines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeadlines();
  }, [loadDeadlines]);

  const handleToggleTask = async (task) => {
    const isDone = task.status === 'completed' || task.status === 'done';
    const newStatus = isDone ? 'todo' : 'completed';
    try {
      await tasksAPI.update(task._id || task.id, { status: newStatus });
      showToast(isDone ? 'Task marked as To Do' : 'Task completed! 🎉', 'success');
      loadDeadlines();
    } catch (err) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  // Classify by deadline category
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);

  const activeTasksWithDates = tasks.filter(
    (t) => t.dueDate && t.status !== 'completed' && t.status !== 'done'
  );

  const overdue = activeTasksWithDates.filter((t) => {
    const d = new Date(t.dueDate);
    return d < now;
  });

  const today = activeTasksWithDates.filter((t) => {
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === now.getTime();
  });

  const thisWeekAndUpcoming = activeTasksWithDates.filter((t) => {
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d > now;
  });

  const renderDeadlineGroup = (title, items, iconName, badgeClass, emptyText) => (
    <section className="deadline-section card">
      <div className="deadline-section-header">
        <div className="deadline-section-title">
          <div className="deadline-icon-wrapper">
            <Icon name={iconName} size={18} />
          </div>
          <h2>{title}</h2>
        </div>
        <span className={`deadline-badge-count ${badgeClass}`}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="deadline-section-empty">
          <Icon name="check" size={20} />
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="deadline-task-list">
          {items.map((task) => {
            const isDone = task.status === 'completed' || task.status === 'done';
            return (
              <div key={task._id || task.id} className="task-row-card">
                <div className="task-row-main">
                  <button
                    type="button"
                    className={`status-circle-btn ${isDone ? 'completed' : ''}`}
                    onClick={() => handleToggleTask(task)}
                    title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isDone && <Icon name="check" size={12} />}
                  </button>

                  <div className="task-row-info">
                    <div className="task-row-title-line">
                      <span className="task-row-title">{task.title}</span>
                      <span className={`badge badge-${task.priority || 'medium'}`}>
                        {task.priority || 'medium'}
                      </span>
                    </div>

                    {task.description && (
                      <p className="task-row-desc">{task.description}</p>
                    )}

                    <div className="task-row-meta">
                      {task.project?.name && (
                        <span className="task-meta-item">
                          <Icon name="folder" size={13} />
                          {task.project.name}
                        </span>
                      )}
                      <span className="task-meta-item deadline-date-tag">
                        <Icon name="calendar" size={13} />
                        Due {formatDate(task.dueDate)}
                      </span>
                      {task.assignedTo?.name && (
                        <span className="task-meta-item">
                          <Icon name="user" size={13} />
                          {task.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="page-container deadlines-page">
      <header className="page-header">
        <div>
          <h1>Deadlines & Milestones</h1>
          <p className="page-subtitle">
            Track upcoming deadlines, tasks due today, and overdue deliverables.
          </p>
        </div>
        <Link to="/tasks" className="btn-secondary">
          <Icon name="list" size={16} />
          <span>All Tasks</span>
        </Link>
      </header>

      {error && (
        <div className="page-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-sm btn-secondary" onClick={loadDeadlines}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="skeleton-list-rows">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : activeTasksWithDates.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No deadlines currently scheduled"
          message="Assign due dates to your project tasks to track milestones and deliverables."
          actionLabel="+ Go to Tasks"
          onAction={() => (window.location.href = '/tasks')}
        />
      ) : (
        <div className="deadline-groups">
          {renderDeadlineGroup(
            'Overdue Deliverables',
            overdue,
            'alert',
            'stat-badge-danger',
            'No overdue tasks. Everything is running on schedule!'
          )}
          {renderDeadlineGroup(
            'Due Today',
            today,
            'clock',
            'stat-badge-warning',
            'No deliverables due today.'
          )}
          {renderDeadlineGroup(
            'Upcoming & This Week',
            thisWeekAndUpcoming,
            'calendar',
            'stat-badge-info',
            'No upcoming tasks in the pipeline.'
          )}
        </div>
      )}
    </div>
  );
}
