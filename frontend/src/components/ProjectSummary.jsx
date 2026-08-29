import ProjectProgress from './ProjectProgress.jsx';

function ProjectSummary({ summary }) {
  const { project, totalTasks, completedTasks, inProgressTasks, todoTasks, progress, overdueTasks, upcomingTasks } = summary;
  return (
    <section className="summary-card" aria-label="Project summary">
      <div className="summary-heading"><div><h2>{project.name}</h2><p>{project.description || 'No project description.'}</p></div></div>
      <ProjectProgress progress={progress} />
      <div className="summary-stats">
        <div><strong>{totalTasks}</strong><span>Total Tasks</span></div>
        <div><strong>{completedTasks}</strong><span>Completed</span></div>
        <div><strong>{inProgressTasks}</strong><span>In Progress</span></div>
        <div><strong>{todoTasks}</strong><span>To Do</span></div>
        <div><strong>{overdueTasks}</strong><span>Overdue</span></div>
        <div><strong>{upcomingTasks}</strong><span>Upcoming</span></div>
      </div>
    </section>
  );
}

export default ProjectSummary;
