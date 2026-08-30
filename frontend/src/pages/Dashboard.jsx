import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { projectsAPI, tasksAPI } from '../services/api.js';
import SummaryCard from '../components/SummaryCard.jsx';
import ProjectProgress from '../components/ProjectProgress.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeletons from '../components/Skeletons.jsx';
import TaskItem from '../components/TaskItem.jsx';
import TaskForm from '../components/TaskForm.jsx';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsData, tasksData, deadlinesData] = await Promise.all([
        projectsAPI.getAll(),
        tasksAPI.getAll(),
        tasksAPI.getDeadlines(),
      ]);

      const projectList = projectsData.projects || [];
      const summaries = await Promise.all(
        projectList.map(async (project) => {
          try {
            return await projectsAPI.getSummary(project._id);
          } catch {
            return {
              project,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              todoTasks: 0,
              progress: 0,
              overdueTasks: 0,
              upcomingTasks: 0,
            };
          }
        })
      );

      setProjects(summaries);
      setTasks(tasksData.tasks || []);
      setDeadlines(deadlinesData.tasks || []);
    } catch (err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!projectName.trim()) return setProjectError('Project name is required.');

    setCreatingProject(true);
    setProjectError('');
    try {
      await projectsAPI.create({
        name: projectName.trim(),
        description: projectDescription.trim(),
      });
      setProjectName('');
      setProjectDescription('');
      setShowProjectModal(false);
      toast('Project created successfully', 'success');
      loadDashboardData();
    } catch (err) {
      setProjectError(err.message || 'Unable to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  // Compute key stats
  const totalProjectsCount = projects.length;
  const completedProjectsCount = projects.filter((p) => p.progress === 100).length;

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'in-progress').length;
  const overdueTasksCount = deadlines.filter((t) => t.deadlineStatus === 'overdue').length;

  return (
    <div className="page-container">
      {/* Dashboard Top Greeting Header */}
      <div className="dashboard-welcome-header">
        <div className="welcome-text-group">
          <h1>
            {greeting()}, {user?.name || 'User'}!
          </h1>
          <p className="page-subtitle">Here is what is happening across your projects today.</p>
        </div>
        <div className="welcome-actions">
          <button className="btn-secondary" onClick={() => setShowProjectModal(true)}>
            <Icon name="plus" size={16} />
            <span>New Project</span>
          </button>
          <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
            <Icon name="plus" size={16} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="page-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary btn-sm" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* Metrics Stats Grid */}
      {loading ? (
        <div className="dashboard-stats-grid">
          <Skeletons count={4} type="stat" />
        </div>
      ) : (
        <div className="dashboard-stats-grid">
          <SummaryCard
            label="Total Projects"
            value={totalProjectsCount}
            subtitle={`${completedProjectsCount} completed`}
            tone="info"
            icon="folder"
          />
          <SummaryCard
            label="Total Tasks"
            value={totalTasksCount}
            subtitle={`${completedTasksCount} completed`}
            tone="neutral"
            icon="check"
          />
          <SummaryCard
            label="In Progress"
            value={inProgressTasksCount}
            subtitle="Active tasks"
            tone="warning"
            icon="clock"
          />
          <SummaryCard
            label="Overdue Deadlines"
            value={overdueTasksCount}
            subtitle={overdueTasksCount > 0 ? 'Action required' : 'All up to date'}
            tone={overdueTasksCount > 0 ? 'danger' : 'success'}
            icon="alert"
          />
        </div>
      )}

      {/* Main Dashboard Layout */}
      <div className="dashboard-content-grid">
        {/* Left Column: Projects Overview */}
        <section className="dashboard-section card">
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
            <Skeletons count={2} type="card" />
          ) : projects.length === 0 ? (
            <EmptyState
              icon="folder"
              title="No projects yet"
              message="Create your first project to start tracking tasks and deadlines."
              action={
                <button className="btn-primary btn-sm" onClick={() => setShowProjectModal(true)}>
                  Create Project
                </button>
              }
            />
          ) : (
            <div className="projects-grid-dashboard">
              {projects.slice(0, 4).map(({ project, progress, totalTasks, completedTasks }) => (
                <div
                  key={project._id}
                  className="dashboard-project-card"
                  onClick={() => navigate(`/projects/${project._id}`)}
                >
                  <div className="dashboard-project-header">
                    <h4>{project.name}</h4>
                    <span className="project-task-count">
                      {completedTasks}/{totalTasks} tasks
                    </span>
                  </div>
                  {project.description && (
                    <p className="dashboard-project-desc">{project.description}</p>
                  )}
                  <ProjectProgress progress={progress} showLabel={false} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Recent Tasks & Upcoming Deadlines */}
        <div className="dashboard-right-column">
          <section className="dashboard-section card">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Icon name="check" size={18} />
                <h2>Recent Tasks</h2>
              </div>
              <Link to="/tasks" className="view-all-link">
                View Tasks →
              </Link>
            </div>

            {loading ? (
              <Skeletons count={3} rows />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon="check"
                title="No tasks found"
                message="Create a task to keep your team organized."
              />
            ) : (
              <div className="dashboard-tasks-list">
                {tasks.slice(0, 5).map((task) => (
                  <TaskItem key={task._id} task={task} onRefresh={loadDashboardData} viewMode="list" />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal: Create Project */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">
                  <Icon name="folder" size={18} />
                </span>
                <h3>Create New Project</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowProjectModal(false)}
                aria-label="Close modal"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form className="modal-body" onSubmit={handleCreateProject}>
              {projectError && (
                <div className="form-error-alert" role="alert">
                  <Icon name="alert" size={16} />
                  <span>{projectError}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="modal-project-name">Project Name *</label>
                <input
                  id="modal-project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Website Redesign Q3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-project-desc">Description</label>
                <textarea
                  id="modal-project-desc"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Summary of objectives and scope..."
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowProjectModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creatingProject}>
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && (
        <TaskForm
          onSuccess={() => {
            setShowTaskModal(false);
            toast('Task created successfully', 'success');
            loadDashboardData();
          }}
          onCancel={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;
