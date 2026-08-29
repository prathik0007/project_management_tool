import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authAPI, projectsAPI, tasksAPI } from '../services/api.js';
import ProjectProgress from '../components/ProjectProgress.jsx';
import SummaryCard from '../components/SummaryCard.jsx';

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : 'No deadline';

const taskStatusLabel = (status) => status === 'in-progress' ? 'In Progress' : status === 'todo' ? 'To Do' : 'Completed';

function Dashboard() {
  const navigate = useNavigate();
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
      loadDashboard();
    } catch (err) {
      setProjectError(err.message || 'Unable to create the project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } finally { navigate('/'); }
  };

  if (unauthorized) return <Navigate to="/" replace />;
  if (loading) return <div className="page-container"><p className="loading-text">Loading dashboard...</p></div>;

  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress').length;
  const todoTasks = tasks.filter((task) => task.status === 'todo').length;
  const overdueTasks = deadlines.filter((task) => task.deadlineStatus === 'overdue').length;
  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const deadlineGroups = [
    { key: 'overdue', title: 'Overdue', empty: 'No overdue tasks.' },
    { key: 'due-today', title: 'Due Today', empty: 'No tasks due today.' },
    { key: 'upcoming', title: 'Upcoming', empty: 'No upcoming deadlines.' },
  ];

  return <div className="dashboard-container">
    <header className="dashboard-header">
      <div><h1>Welcome back, {user?.name || 'there'}</h1><p>Here is an overview of your projects and tasks.</p></div>
      <button className="btn-secondary" onClick={handleLogout}>Logout</button>
    </header>

    {error && <div className="page-error"><p>{error}</p><button className="btn-secondary" onClick={loadDashboard}>Try Again</button></div>}

    {!error && <>
      <nav className="quick-actions" aria-label="Quick actions">
        <button className="btn-primary" onClick={() => setShowProjectForm((visible) => !visible)}>Create Project</button>
        <Link className="btn-secondary" to="/tasks">Create Task</Link>
        <a className="btn-secondary" href="#projects">View Projects</a>
        <Link className="btn-secondary" to="/tasks">View Tasks</Link>
        <Link className="btn-secondary" to="/deadlines">View Deadlines</Link>
      </nav>

      {showProjectForm && <form className="create-project-form" onSubmit={handleCreateProject}>
        <h2>Create Project</h2>
        {projectError && <p className="form-error">{projectError}</p>}
        <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" aria-label="Project name" />
        <textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} placeholder="Optional description" rows="2" />
        <div className="form-actions"><button className="btn-primary" disabled={creatingProject}>{creatingProject ? 'Creating...' : 'Create Project'}</button><button type="button" className="btn-secondary" onClick={() => setShowProjectForm(false)}>Cancel</button></div>
      </form>}

      <section className="dashboard-summary-grid" aria-label="Dashboard summary">
        <SummaryCard label="Total Projects" value={projects.length} />
        <SummaryCard label="Total Tasks" value={tasks.length} />
        <SummaryCard label="Completed Tasks" value={completedTasks} tone="success" />
        <SummaryCard label="In Progress Tasks" value={inProgressTasks} tone="warning" />
        <SummaryCard label="To Do Tasks" value={todoTasks} />
        <SummaryCard label="Overdue Tasks" value={overdueTasks} tone="danger" />
      </section>

      <section className="dashboard-section" id="projects"><div className="section-header"><h2>Project Overview</h2></div>
        {projects.length === 0 ? <div className="empty-state"><p>You don't have any projects yet.</p></div> : <div className="dashboard-project-grid">{projects.map((summary) => <article className="dashboard-project-card" key={summary.project._id}>
          <h3><Link to={`/projects/${summary.project._id}`} className="project-link">{summary.project.name}</Link></h3>
          <p>{summary.project.description || 'No project description.'}</p>
          <ProjectProgress progress={summary.progress} />
          <span>{summary.completedTasks} of {summary.totalTasks} tasks completed</span>
        </article>)}</div>}
      </section>

      <section className="dashboard-section"><div className="section-header"><h2>Recent Tasks</h2><Link to="/tasks" className="nav-link">View all tasks</Link></div>
        {recentTasks.length === 0 ? <div className="empty-state"><p>No tasks available.</p></div> : <div className="recent-task-list">{recentTasks.map((task) => <article className="recent-task" key={task._id}>
          <div><h3>{task.title}</h3><p>{task.project?.name || 'Unknown project'} · {task.assignedTo?.name || 'Unassigned'}</p></div>
          <div className="recent-task-meta"><span>{taskStatusLabel(task.status)}</span><span>{task.priority} priority</span><span>Due: {formatDate(task.dueDate)}</span></div>
        </article>)}</div>}
      </section>

      <section className="dashboard-section"><div className="section-header"><h2>Deadline Overview</h2><Link to="/deadlines" className="nav-link">View all deadlines</Link></div>
        <div className="dashboard-deadline-grid">{deadlineGroups.map((group) => {
          const groupTasks = deadlines.filter((task) => task.deadlineStatus === group.key);
          return <article className="deadline-overview-card" key={group.key}><h3>{group.title}</h3>{groupTasks.length === 0 ? <p>{group.empty}</p> : <ul>{groupTasks.slice(0, 5).map((task) => <li key={task._id}>{task.title}</li>)}</ul>}</article>;
        })}</div>
      </section>
    </>}
  </div>;
}

export default Dashboard;
