import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authAPI, projectsAPI, tasksAPI } from '../services/api.js';
import ProjectProgress from '../components/ProjectProgress.jsx';
import SummaryCard from '../components/SummaryCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeletons from '../components/Skeletons.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  : 'No deadline';

const STATUS_CLASS = { todo: 'badge-todo', 'in-progress': 'badge-inprogress', completed: 'badge-completed' };
const STATUS_LABEL = { todo: 'To Do', 'in-progress': 'In Progress', completed: 'Completed' };
const PRIORITY_CLASS = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const me = await authAPI.getMe();
      setUser(me.user);

      const [projectsData, tasksData, deadlinesData] = await Promise.all([
        projectsAPI.getAll(),
        tasksAPI.getAll(),
        tasksAPI.getDeadlines(),
      ]);
      const projectList = projectsData.projects || [];
      const summaries = await Promise.all(projectList.map((project) => projectsAPI.getSummary(project._id)));

      setProjects(summaries);
      setTasks(tasksData.tasks || []);
      setDeadlines(deadlinesData.tasks || []);
    } catch (err) {
      if (/not authorized|no token|invalid token|token has expired/i.test(err.message || '')) {
        setUnauthorized(true);
      } else {
        setError('Unable to load the dashboard. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    if (!projectName.trim()) return setProjectError('Project name is required.');
    setCreatingProject(true);
    setProjectError('');
    try {
      await projectsAPI.create({ name: projectName.trim(), description: projectDescription.trim() });
      setProjectName('');
      setProjectDescription('');
      setShowProjectForm(false);
      toast('Project created', 'success');
      loadDashboard();
    } catch (err) {
      setProjectError(err.message || 'Unable to create the project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleLogout = async () => {
    setConfirmLogout(false);
    try { await authAPI.logout(); toast('Logged out', 'info'); navigate('/login'); } catch { navigate('/login'); }
  };

  if (unauthorized) return <Navigate to="/login" replace />;
  if (loading) return <div className="page-container"><Skeletons count={3} /><Skeletons count={2} rows /></div>;

  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress').length;
  const todoTasks = tasks.filter((task) => task.status === 'todo').length;
  const overdueTasks = deadlines.filter((task) => task.deadlineStatus === 'overdue').length;
  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const deadlineGroups = [
    { key: 'overdue', title: 'Overdue', empty: 'Nothing overdue. Great job!' },
    { key: 'due-today', title: 'Due Today', empty: 'No tasks due today.' },
    { key: 'upcoming', title: 'Upcoming', empty: 'No upcoming deadlines.' },
  ];

  return <div className="dashboard-container">
    <header className="dashboard-header">
      <div>
        <h1>{greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
        <p>Here's what's happening with your projects.</p>
      </div>
      <button className="btn-secondary" onClick={() => setConfirmLogout(true)}>
        <Icon name="logout" size={15} /> Logout
      </button>
    </header>

    {error && <div className="page-error"><p>{error}</p><button className="btn-secondary" onClick={loadDashboard}>Try Again</button></div>}

    {!error && <>
      <section className="dashboard-actions-row">
        <button className="btn-primary btn-lg" onClick={() => setShowProjectForm((visible) => !visible)}>
          <Icon name="plus" size={16} /> Create Project
        </button>
        <Link className="btn-secondary" to="/tasks"><Icon name="check" size={15} /> Create Task</Link>
        <Link className="btn-secondary" to="/projects"><Icon name="folder" size={15} /> Projects</Link>
        <Link className="btn-secondary" to="/deadlines"><Icon name="clock" size={15} /> Deadlines</Link>
      </section>

      {showProjectForm && <form className="create-project-form" onSubmit={handleCreateProject}>
        <h2>Create Project</h2>
        {projectError && <p className="form-error">{projectError}</p>}
        <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" aria-label="Project name" />
        <textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} placeholder="Optional description" rows="2" aria-label="Project description" />
        <div className="form-actions"><button className="btn-primary" disabled={creatingProject}>{creatingProject ? 'Creating...' : 'Create Project'}</button><button type="button" className="btn-secondary" onClick={() => setShowProjectForm(false)}>Cancel</button></div>
      </form>}

      <section className="dashboard-summary-grid" aria-label="Dashboard summary">
        <SummaryCard label="Total Projects" value={projects.length} tone="info" icon="folder" />
        <SummaryCard label="Total Tasks" value={tasks.length} tone="neutral" icon="layers" />
        <SummaryCard label="Completed" value={completedTasks} tone="success" icon="check" />
        <SummaryCard label="In Progress" value={inProgressTasks} tone="info" icon="clock" />
        <SummaryCard label="To Do" value={todoTasks} tone="neutral" icon="circle" />
        <SummaryCard label="Overdue" value={overdueTasks} tone="danger" icon="alert" />
      </section>

      <section className="dashboard-section" id="projects"><div className="section-header"><h2>Project Overview</h2><Link to="/projects" className="nav-link">All projects</Link></div>
        {projects.length === 0 ? <EmptyState icon="folder" title="No projects yet" message="Create your first project and start organizing your work." action={<button className="btn-primary" onClick={() => setShowProjectForm(true)}><Icon name="plus" size={15} /> Create Project</button>} /> : <div className="dashboard-project-grid">{projects.map((summary) => <article className="dashboard-project-card" key={summary.project._id}>
          <h3><Link to={`/projects/${summary.project._id}`} className="project-link">{summary.project.name}</Link></h3>
          <p>{summary.project.description || 'No project description.'}</p>
          <ProjectProgress progress={summary.progress} />
          <span className="task-count-line"><Icon name="check" size={13} /> {summary.completedTasks} of {summary.totalTasks} tasks completed</span>
        </article>)}</div>}
      </section>

      <section className="dashboard-section"><div className="section-header"><h2>Recent Tasks</h2><Link to="/tasks" className="nav-link">View all tasks</Link></div>
        {recentTasks.length === 0 ? <EmptyState icon="check" title="No tasks yet" message="Create your first task to start tracking your work." action={<Link className="btn-primary" to="/tasks"><Icon name="plus" size={15} /> Create Task</Link>} /> : <div className="recent-task-list">{recentTasks.map((task) => <article className="recent-task" key={task._id}>
          <div><h3>{task.title}</h3><p>{task.project?.name || 'Unknown project'} · {task.assignedTo?.name || 'Unassigned'}</p></div>
          <div className="recent-task-meta">
            <span className={`badge ${STATUS_CLASS[task.status] || ''}`}>{STATUS_LABEL[task.status] || task.status}</span>
            <span className={`badge ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
            <span>Due: {formatDate(task.dueDate)}</span>
          </div>
        </article>)}</div>}
      </section>

      <section className="dashboard-section"><div className="section-header"><h2>Deadline Overview</h2><Link to="/deadlines" className="nav-link">View all deadlines</Link></div>
        <div className="dashboard-deadline-grid">{deadlineGroups.map((group) => {
          const groupTasks = deadlines.filter((task) => task.deadlineStatus === group.key);
          return <article className={`deadline-overview-card${group.key === 'overdue' && groupTasks.length ? ' is-overdue' : ''}`} key={group.key}>
            <h3>{group.title} <span className="deadline-count">{groupTasks.length}</span></h3>
            {groupTasks.length === 0 ? <p>{group.empty}</p> : <ul>{groupTasks.slice(0, 5).map((task) => <li key={task._id}>{task.title}</li>)}</ul>}
          </article>;
        })}</div>
      </section>
    </>}

    <ConfirmDialog
      open={confirmLogout}
      title="Log out?"
      message="You will need to sign in again to access your projects."
      confirmLabel="Log out"
      onConfirm={handleLogout}
      onCancel={() => setConfirmLogout(false)}
    />
  </div>;
}

export default Dashboard;
