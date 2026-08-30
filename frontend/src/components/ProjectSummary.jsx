import ProjectProgress from './ProjectProgress.jsx';

function ProjectSummary({ summary }) {
  if (!summary) return null;

  const { project, totalTasks, completedTasks, inProgressTasks, todoTasks, progress, overdueTasks, upcomingTasks } = summary;

  return (
    <section className="project-summary-panel" aria-label="Project details summary">
      <div className="project-summary-header">
        <div className="project-summary-info">
          <h2>{project.name}</h2>
          <p>{project.description || 'No project description provided.'}</p>
        </div>
      </div>

      <div className="project-summary-progress-wrapper">
        <ProjectProgress progress={progress} />
      </div>

      <div className="project-stats-grid">
        <div className="project-stat-box">
          <span className="stat-num">{totalTasks}</span>
          <span className="stat-lbl">Total Tasks</span>
        </div>
        <div className="project-stat-box stat-success">
          <span className="stat-num">{completedTasks}</span>
          <span className="stat-lbl">Completed</span>
        </div>
        <div className="project-stat-box stat-warning">
          <span className="stat-num">{inProgressTasks}</span>
          <span className="stat-lbl">In Progress</span>
        </div>
        <div className="project-stat-box stat-neutral">
          <span className="stat-num">{todoTasks}</span>
          <span className="stat-lbl">To Do</span>
        </div>
        <div className="project-stat-box stat-danger">
          <span className="stat-num">{overdueTasks}</span>
          <span className="stat-lbl">Overdue</span>
        </div>
        <div className="project-stat-box stat-info">
          <span className="stat-num">{upcomingTasks}</span>
          <span className="stat-lbl">Upcoming</span>
        </div>
      </div>
    </section>
  );
}

export default ProjectSummary;
