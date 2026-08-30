import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api.js';
import ProjectSummary from '../components/ProjectSummary.jsx';
import TaskItem from '../components/TaskItem.jsx';
import TaskForm from '../components/TaskForm.jsx';
import Skeletons from '../components/Skeletons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Icon } from '../components/Icons.jsx';
import { useToast } from '../components/Toast.jsx';

function ProjectDetails() {
  const { id } = useParams();
  const toast = useToast();

  const [summary, setSummary] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, tasksData] = await Promise.all([
        projectsAPI.getSummary(id),
        tasksAPI.getByProject(id),
      ]);
      setSummary(summaryData);
      setProjectTasks(tasksData.tasks || []);
    } catch (err) {
      setError(err.message || 'Unable to load project summary.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div className="page-header">
        <div>
          <div className="breadcrumb-nav">
            <Link to="/projects" className="breadcrumb-link">
              <Icon name="arrowRight" size={14} style={{ transform: 'rotate(180deg)' }} />
              <span>Back to Projects</span>
            </Link>
          </div>
          <h1>{summary?.project?.name || 'Project Summary'}</h1>
          <p className="page-subtitle">Track project health, progress metrics, and associated tasks.</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
            <Icon name="plus" size={16} />
            <span>Add Task to Project</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="page-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary btn-sm" onClick={fetchProjectDetails}>
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="project-details-loading">
          <Skeletons count={1} type="card" />
          <Skeletons count={3} rows />
        </div>
      ) : summary ? (
        <div className="project-details-content">
          <ProjectSummary summary={summary} />

          {/* Associated Tasks Section */}
          <section className="project-tasks-section card">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Icon name="check" size={18} />
                <h2>Project Tasks ({projectTasks.length})</h2>
              </div>
            </div>

            {projectTasks.length === 0 ? (
              <EmptyState
                icon="check"
                title="No tasks assigned to this project"
                message="Add tasks to start building out your project workflow."
                action={
                  <button className="btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
                    Create Task
                  </button>
                }
              />
            ) : (
              <div className="task-list-wrapper">
                {projectTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onRefresh={fetchProjectDetails}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {/* Modal: Task Form */}
      {showTaskModal && (
        <TaskForm
          editTask={{ project: id }}
          onSuccess={() => {
            setShowTaskModal(false);
            toast('Task added to project', 'success');
            fetchProjectDetails();
          }}
          onCancel={() => setShowTaskModal(false)}
        />
      )}
    </div>
  );
}

export default ProjectDetails;
