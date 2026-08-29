function ProjectProgress({ progress }) {
  const safeProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;

  return (
    <div className="project-progress">
      <div className="progress-label"><span>Progress</span><strong>{safeProgress}%</strong></div>
      <div className="progress-track" role="progressbar" aria-label="Project progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeProgress}>
        <div className="progress-fill" style={{ width: `${safeProgress}%` }} />
      </div>
    </div>
  );
}

export default ProjectProgress;
