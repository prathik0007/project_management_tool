function ProjectProgress({ progress, showLabel = true }) {
  const safeProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, Math.round(progress))) : 0;

  let colorClass = 'progress-fill-normal';
  if (safeProgress >= 100) colorClass = 'progress-fill-success';
  else if (safeProgress > 60) colorClass = 'progress-fill-primary';

  return (
    <div className="project-progress">
      {showLabel && (
        <div className="progress-label">
          <span>Project Completion</span>
          <strong>{safeProgress}%</strong>
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Project progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
      >
        <div className={`progress-fill ${colorClass}`} style={{ width: `${safeProgress}%` }} />
      </div>
    </div>
  );
}

export default ProjectProgress;
