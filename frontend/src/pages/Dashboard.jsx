import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api.js';
import { Icon } from '../components/Icons.jsx';
import TaskForm from '../components/TaskForm.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { SkeletonStat, SkeletonCard, SkeletonRow } from '../components/Skeletons.jsx';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'completed' || status === 'done') return false;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projRes, taskRes, deadRes, userRes] = await Promise.all([
        projectsAPI.getAll().catch(() => ({ projects: [] })),
        tasksAPI.getAll().catch(() => ({ tasks: [] })),
        tasksAPI.getDeadlines().catch(() => ({ deadlines: [] })),
        usersAPI.getAll().catch(() => ({ users: [] })),
      ]);
      setProjects(projRes.projects || []);
      setTasks(taskRes.tasks || []);
      setDeadlines(deadRes.deadlines || deadRes.tasks || []);
      setUsers(userRes.users || []);
    } catch {
      setError('Unable to load workspace data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics calculation
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in-progress').length;
  const overdueTasksCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }
    setSavingProject(true);
    try {
      await projectsAPI.create({ name: projectName.trim(), description: projectDesc.trim() });
      showToast('Project created successfully', 'success');
      setProjectName('');
      setProjectDesc('');
      setIsProjectModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to create project', 'error');
    } finally {
      setSavingProject(false);
    }
  };

  const handleToggleTask = async (task) => {
    const isDone = task.status === 'completed' || task.status === 'done';
    const newStatus = isDone ? 'todo' : 'completed';
    try {
      await tasksAPI.update(task._id || task.id, { status: newStatus });
      showToast(isDone ? 'Task marked as To Do' : 'Task completed! 🎉', 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const activeProjects = projects.slice(0, 4);
  const todaysFocusTasks = tasks
    .filter((t) => t.status !== 'completed' && t.status !== 'done')
    .slice(0, 5);

  const upcomingDeadlinesList = (deadlines.length > 0 ? deadlines : tasks.filter((t) => t.dueDate))
    .filter((t) => t.status !== 'completed' && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  return (
    <div className="page-container dashboard-page">
      {/* Top Welcome Header */}
      <header className="page-header dashboard-welcome-header">
        <div className="welcome-text-group">
          <h1>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening across your workspace today.
          </p>
        </div>
        <div className="welcome-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsProjectModalOpen(true)}
          >
            <Icon name="plus" size={16} />
            <span>New Project</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <Icon name="plus" size={16} />
            <span>Create Task</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="page-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-sm btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* 4 Statistics Metrics Cards */}
      <section className="dashboard-stats-grid" aria-label="Workspace Metrics">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Total Projects</span>
                <div className="stat-card-icon-box stat-badge-info">
                  <Icon name="folder" size={16} />
                </div>
              </div>
              <div className="stat-card-value">{totalProjects}</div>
              <span className="stat-card-subtitle">
                {totalProjects === 1 ? '1 active project' : `${totalProjects} active initiatives`}
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Total Tasks</span>
                <div className="stat-card-icon-box stat-badge-neutral">
                  <Icon name="layers" size={16} />
                </div>
              </div>
              <div className="stat-card-value">{totalTasks}</div>
              <span className="stat-card-subtitle">
                {completedTasks} completed ({totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">In Progress</span>
                <div className="stat-card-icon-box stat-badge-warning">
                  <Icon name="clock" size={16} />
                </div>
              </div>
              <div className="stat-card-value">{inProgressTasks}</div>
              <span className="stat-card-subtitle">Tasks actively being worked on</span>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">Overdue Tasks</span>
                <div className={`stat-card-icon-box ${overdueTasksCount > 0 ? 'stat-badge-danger' : 'stat-badge-success'}`}>
                  <Icon name={overdueTasksCount > 0 ? 'alert' : 'check'} size={16} />
                </div>
              </div>
              <div className="stat-card-value" style={{ color: overdueTasksCount > 0 ? '#ef4444' : '#22c55e' }}>
                {overdueTasksCount}
              </div>
              <span className="stat-card-subtitle">
                {overdueTasksCount > 0 ? 'Requires immediate attention' : 'All deadlines on track'}
              </span>
            </div>
          </>
        )}
      </section>

      {/* Main Content Layout Grid */}
      <div className="dashboard-content-grid">
        {/* Left Column: Active Projects & Today's Focus */}
        <div className="dashboard-column-left">
          {/* Active Projects */}
          <section className="dashboard-section card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-title-bar">
              <div className="section-title-left">
                <Icon name="folder" size={18} />
                <h2>Active Projects</h2>
              </div>
              <Link to="/projects" className="view-all-link">
                View All ({projects.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="skeleton-grid-cards">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : activeProjects.length === 0 ? (
              <EmptyState
                icon="folder"
                title="No projects yet"
                message="Create your first project and start organizing your team's work."
                actionLabel="+ Create Project"
                onAction={() => setIsProjectModalOpen(true)}
              />
            ) : (
              <div className="projects-grid-dashboard">
                {activeProjects.map((project) => {
                  const pTasks = tasks.filter((t) => {
                    const tProjId = t.project?._id || t.project?.id || t.project || t.projectId;
                    const pId = project._id || project.id;
                    return String(tProjId) === String(pId);
                  });
                  const pDone = pTasks.filter((t) => t.status === 'completed' || t.status === 'done').length;
                  const percent = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

                  return (
                    <Link
                      key={project._id || project.id}
                      to={`/projects/${project._id || project.id}`}
                      className="dashboard-project-card"
                    >
                      <div className="dashboard-project-header">
                        <h4>{project.name}</h4>
                        <span className="project-task-count">
                          {pDone}/{pTasks.length} tasks
                        </span>
                      </div>
                      <p className="dashboard-project-desc">
                        {project.description || 'No description provided.'}
                      </p>
                      <div className="progress-track" style={{ height: '6px' }}>
                        <div
                          className="progress-fill progress-fill-normal"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Today's Focus Tasks */}
          <section className="dashboard-section card">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Icon name="check" size={18} />
                <h2>Today's Focus</h2>
              </div>
              <Link to="/tasks" className="view-all-link">
                All Tasks ({tasks.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="skeleton-list-rows">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : todaysFocusTasks.length === 0 ? (
              <div className="empty-sub-block">
                <Icon name="check" size={24} />
                <p>No pending tasks on your focus list.</p>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  + Add a task
                </button>
              </div>
            ) : (
              <div className="dashboard-task-list">
                {todaysFocusTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const isDone = task.status === 'completed' || task.status === 'done';

                  return (
                    <div key={task._id || task.id} className="dashboard-task-item">
                      <button
                        type="button"
                        className={`status-circle-btn ${isDone ? 'completed' : ''}`}
                        onClick={() => handleToggleTask(task)}
                        title={isDone ? 'Mark as incomplete' : 'Mark complete'}
                      >
                        {isDone && <Icon name="check" size={12} />}
                      </button>

                      <div className="dashboard-task-info">
                        <span className="dashboard-task-title">{task.title}</span>
                        <div className="dashboard-task-meta">
                          {task.project?.name && (
                            <span className="task-meta-tag">{task.project.name}</span>
                          )}
                          <span className={`badge badge-${task.priority || 'medium'}`}>
                            {task.priority || 'medium'}
                          </span>
                          {task.dueDate && (
                            <span className={`task-date-tag ${overdue ? 'date-overdue' : ''}`}>
                              <Icon name="calendar" size={12} />
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Upcoming Deadlines & Recent Activity */}
        <div className="dashboard-column-right">
          {/* Upcoming Deadlines */}
          <section className="dashboard-section card" style={{ marginBottom: '1.5rem' }}>
            <div className="section-title-bar">
              <div className="section-title-left">
                <Icon name="calendar" size={18} />
                <h2>Upcoming Deadlines</h2>
              </div>
              <Link to="/deadlines" className="view-all-link">
                View Schedule →
              </Link>
            </div>

            {loading ? (
              <div className="skeleton-list-rows">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : upcomingDeadlinesList.length === 0 ? (
              <div className="empty-sub-block">
                <Icon name="calendar" size={24} />
                <p>No upcoming task deadlines scheduled.</p>
              </div>
            ) : (
              <div className="deadline-widget-list">
                {upcomingDeadlinesList.map((item) => {
                  const overdue = isOverdue(item.dueDate, item.status);
                  return (
                    <div key={item._id || item.id} className="deadline-widget-item">
                      <div className="deadline-widget-main">
                        <span className="deadline-widget-title">{item.title}</span>
                        <span className="deadline-widget-proj">
                          {item.project?.name || 'General Task'}
                        </span>
                      </div>
                      <div className={`deadline-widget-pill ${overdue ? 'pill-overdue' : 'pill-upcoming'}`}>
                        <Icon name={overdue ? 'alert' : 'clock'} size={13} />
                        <span>{formatDate(item.dueDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Activity / Workspace Stream */}
          <section className="dashboard-section card">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Icon name="activity" size={18} />
                <h2>Workspace Stream</h2>
              </div>
              <span className="badge-live">Live</span>
            </div>

            <div className="activity-feed">
              <div className="activity-item">
                <div className="activity-dot dot-active" />
                <div className="activity-content">
                  <p><strong>Workspace session active</strong></p>
                  <span>Connected to ProjectFlow workspace database.</span>
                </div>
              </div>

              {tasks.slice(0, 3).map((t) => (
                <div key={t._id || t.id} className="activity-item">
                  <div className="activity-dot dot-cyan" />
                  <div className="activity-content">
                    <p>
                      Task <strong>{t.title}</strong> is in <em>{t.status?.replace('_', ' ') || 'todo'}</em> status
                    </p>
                    <span>Priority: {t.priority || 'medium'}</span>
                  </div>
                </div>
              ))}

              {projects.slice(0, 2).map((p) => (
                <div key={p._id || p.id} className="activity-item">
                  <div className="activity-dot dot-proj" />
                  <div className="activity-content">
                    <p>Project <strong>{p.name}</strong> ready in workspace</p>
                    <span>{p.description || 'Project initiative active'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Create Project Modal */}
      {isProjectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProjectModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Icon name="folder" size={18} />
                </div>
                <h3>Create New Project</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsProjectModalOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="projectName">Project Name *</label>
                  <input
                    id="projectName"
                    type="text"
                    required
                    placeholder="e.g. Mobile App Redesign"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projectDesc">Description</label>
                  <textarea
                    id="projectDesc"
                    rows={3}
                    placeholder="Briefly describe the goals and scope of this project..."
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsProjectModalOpen(false)}
                  disabled={savingProject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingProject || !projectName.trim()}
                >
                  {savingProject ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <TaskForm
          projects={projects}
          users={users}
          onSuccess={() => {
            setIsTaskModalOpen(false);
            loadData();
          }}
          onClose={() => setIsTaskModalOpen(false)}
        />
      )}
    </div>
  );
}
