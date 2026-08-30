import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskForm from '../components/TaskForm.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { SkeletonCard, SkeletonRow } from '../components/Skeletons.jsx';

function formatDate(dateStr) {
  if (!dateStr) return 'No date set';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab: 'overview' | 'tasks' | 'timeline' | 'members'
  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const [projData, taskData, userData] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getAll().catch(() => ({ tasks: [] })),
        usersAPI.getAll().catch(() => ({ users: [] })),
      ]);

      const foundProject = projData.project || projData;
      setProject(foundProject);
      setName(foundProject.name || '');
      setDescription(foundProject.description || '');
      setStatus(foundProject.status || 'active');

      // Filter tasks for this project
      const allTasks = taskData.tasks || [];
      const projectTasks = allTasks.filter((t) => {
        const tProjId = t.project?._id || t.project?.id || t.project || t.projectId;
        return String(tProjId) === String(id);
      });
      setTasks(projectTasks);
      setUsers(userData.users || []);
    } catch (err) {
      setError(err.message || 'Unable to load project workspace');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed' || t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in-progress').length;
    const todo = tasks.filter((t) => !t.status || t.status === 'todo').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed' || t.status === 'done') return false;
      return new Date(t.dueDate) < now;
    }).length;

    return { total, completed, inProgress, todo, overdue, percent };
  }, [tasks]);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Project name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await projectsAPI.update(id, { name: name.trim(), description: description.trim(), status });
      showToast('Project updated successfully', 'success');
      setIsEditModalOpen(false);
      loadProject();
    } catch (err) {
      showToast(err.message || 'Failed to update project', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectsAPI.delete(id);
      showToast('Project deleted successfully', 'info');
      navigate('/projects');
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const isDone = task.status === 'completed' || task.status === 'done';
    const newStatus = isDone ? 'todo' : 'completed';
    try {
      await tasksAPI.update(task._id || task.id, { status: newStatus });
      showToast(isDone ? 'Task marked as To Do' : 'Task completed! 🎉', 'success');
      loadProject();
    } catch (err) {
      showToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      showToast('Task removed', 'info');
      loadProject();
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <SkeletonCard />
        <div style={{ marginTop: '1.5rem' }}>
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-container">
        <div className="page-error" role="alert">
          <span>{error || 'Project not found.'}</span>
          <Link to="/projects" className="btn-sm btn-secondary">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Real timeline milestones sorted by due date
  const timelineTasks = [...tasks]
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Unique project assignees / members
  const projectMembers = users.filter((u) =>
    tasks.some((t) => {
      const assignedId = t.assignedTo?._id || t.assignedTo?.id || t.assignedTo;
      const uId = u._id || u.id;
      return String(assignedId) === String(uId);
    })
  );

  return (
    <div className="page-container project-details-page">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/projects" className="breadcrumb-link">
          <Icon name="arrowRight" size={14} style={{ transform: 'rotate(180deg)' }} />
          <span>Back to Projects</span>
        </Link>
      </nav>

      {/* Project Header Banner */}
      <header className="page-header project-header-banner">
        <div className="project-title-meta">
          <div className="project-title-row">
            <div className="project-icon-badge">
              <Icon name="folder" size={22} />
            </div>
            <div>
              <h1>{project.name}</h1>
              <p className="page-subtitle">{project.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Icon name="edit" size={15} />
            <span>Edit Project</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          >
            <Icon name="plus" size={15} />
            <span>Create Task</span>
          </button>
          <button
            type="button"
            className="icon-action-btn danger"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete project"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </header>

      {/* Project Workspace Tabs */}
      <div className="project-tabs-bar">
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Icon name="dashboard" size={15} />
          <span>Overview</span>
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Icon name="check" size={15} />
          <span>Tasks ({tasks.length})</span>
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Icon name="calendar" size={15} />
          <span>Timeline ({timelineTasks.length})</span>
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <Icon name="users" size={15} />
          <span>Members ({projectMembers.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="tab-content-pane">
          {/* Progress Banner */}
          <section className="project-summary-panel">
            <div className="project-summary-info">
              <div className="summary-title-line">
                <h3>Overall Initiative Progress</h3>
                <span className="summary-percent-pill">{metrics.percent}% Completed</span>
              </div>
              <div className="progress-track" style={{ height: '10px', marginTop: '1rem' }}>
                <div
                  className={`progress-fill ${metrics.percent === 100 ? 'progress-fill-success' : 'progress-fill-normal'}`}
                  style={{ width: `${metrics.percent}%` }}
                />
              </div>
            </div>

            <div className="project-stats-grid" style={{ marginTop: '1.5rem' }}>
              <div className="project-stat-box">
                <span className="stat-num">{metrics.total}</span>
                <span className="stat-lbl">Total Tasks</span>
              </div>
              <div className="project-stat-box">
                <span className="stat-num" style={{ color: '#4ade80' }}>{metrics.completed}</span>
                <span className="stat-lbl">Completed</span>
              </div>
              <div className="project-stat-box">
                <span className="stat-num" style={{ color: '#fbbf24' }}>{metrics.inProgress}</span>
                <span className="stat-lbl">In Progress</span>
              </div>
              <div className="project-stat-box">
                <span className="stat-num" style={{ color: '#94a3b8' }}>{metrics.todo}</span>
                <span className="stat-lbl">To Do</span>
              </div>
              <div className="project-stat-box">
                <span className="stat-num" style={{ color: metrics.overdue > 0 ? '#ef4444' : '#94a3b8' }}>
                  {metrics.overdue}
                </span>
                <span className="stat-lbl">Overdue</span>
              </div>
            </div>
          </section>

          {/* Quick Tasks List in Overview */}
          <section className="card">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Icon name="check" size={18} />
                <h2>Project Tasks</h2>
              </div>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => setActiveTab('tasks')}
              >
                View in Tasks Tab →
              </button>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                icon="check"
                title="No tasks in this project yet"
                message="Add tasks to plan and execute deliverables for this project."
                actionLabel="+ Add First Task"
                onAction={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
              />
            ) : (
              <TaskList
                tasks={tasks.slice(0, 6)}
                onToggle={handleToggleTaskStatus}
                onEdit={(task) => {
                  setEditingTask(task);
                  setIsTaskModalOpen(true);
                }}
                onDelete={handleDeleteTask}
              />
            )}
          </section>
        </div>
      )}

      {/* Tab 2: Tasks */}
      {activeTab === 'tasks' && (
        <div className="tab-content-pane">
          <div className="tab-actions-header">
            <h3>All Project Tasks ({tasks.length})</h3>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            >
              <Icon name="plus" size={14} />
              <span>Add Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon="check"
              title="No tasks yet"
              message="Create a task to assign work and set deliverables."
              actionLabel="+ Create Task"
              onAction={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          ) : (
            <TaskList
              tasks={tasks}
              onToggle={handleToggleTaskStatus}
              onEdit={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDelete={handleDeleteTask}
            />
          )}
        </div>
      )}

      {/* Tab 3: Timeline */}
      {activeTab === 'timeline' && (
        <div className="tab-content-pane">
          <div className="tab-actions-header">
            <h3>Milestone & Deliverable Schedule</h3>
          </div>

          {timelineTasks.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No dated milestones scheduled"
              message="Assign due dates to project tasks to visualize your milestone timeline."
              actionLabel="+ Set Task Due Date"
              onAction={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          ) : (
            <div className="timeline-schedule-list">
              {timelineTasks.map((t, idx) => {
                const isDone = t.status === 'completed' || t.status === 'done';
                return (
                  <div key={t._id || t.id} className="timeline-milestone-item">
                    <div className="timeline-marker">
                      <div className={`timeline-dot ${isDone ? 'dot-completed' : 'dot-active'}`} />
                      {idx < timelineTasks.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-milestone-card card">
                      <div className="milestone-top">
                        <span className="milestone-date">{formatDate(t.dueDate)}</span>
                        <span className={`badge badge-${t.status === 'completed' ? 'completed' : 'inprogress'}`}>
                          {t.status || 'todo'}
                        </span>
                      </div>
                      <h4 className="milestone-title">{t.title}</h4>
                      {t.description && <p className="milestone-desc">{t.description}</p>}
                      <div className="milestone-meta">
                        <span className={`badge badge-${t.priority || 'medium'}`}>{t.priority || 'medium'} priority</span>
                        {t.assignedTo?.name && (
                          <span className="milestone-assignee">
                            <Icon name="user" size={13} />
                            {t.assignedTo.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Members */}
      {activeTab === 'members' && (
        <div className="tab-content-pane">
          <div className="tab-actions-header">
            <h3>Workspace Members Assigned to this Project ({projectMembers.length})</h3>
          </div>

          {projectMembers.length === 0 ? (
            <EmptyState
              icon="users"
              title="No members assigned yet"
              message="Assign team members to tasks in this project to see them here."
              actionLabel="+ Assign Task"
              onAction={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
            />
          ) : (
            <div className="members-grid">
              {projectMembers.map((m) => {
                const memberInitials = (m.name || m.email || 'U').slice(0, 2).toUpperCase();
                const mTasks = tasks.filter((t) => {
                  const aId = t.assignedTo?._id || t.assignedTo?.id || t.assignedTo;
                  const uId = m._id || m.id;
                  return String(aId) === String(uId);
                });

                return (
                  <div key={m._id || m.id} className="member-card card">
                    <div className="member-avatar-box">{memberInitials}</div>
                    <div className="member-info">
                      <h4>{m.name}</h4>
                      <p>{m.email}</p>
                      <span className="member-task-count">
                        {mTasks.length} task{mTasks.length === 1 ? '' : 's'} in this project
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Icon name="edit" size={18} />
                </div>
                <h3>Edit Project</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="editName">Project Name *</label>
                  <input
                    id="editName"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editDesc">Description</label>
                  <textarea
                    id="editDesc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editStatus">Status</label>
                  <select
                    id="editStatus"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !name.trim()}
                >
                  {saving ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Create / Edit Modal */}
      {isTaskModalOpen && (
        <TaskForm
          task={editingTask}
          projectId={id}
          projects={[project]}
          users={users}
          onSuccess={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
            loadProject();
          }}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Delete Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}" and remove all associated data? This action cannot be undone.`}
        confirmText="Delete Project"
        danger
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
