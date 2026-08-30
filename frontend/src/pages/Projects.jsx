import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { SkeletonCard } from '../components/Skeletons.jsx';

export default function Projects() {
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('RECENT');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [projectToDelete, setProjectToDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        projectsAPI.getAll().catch(() => ({ projects: [] })),
        tasksAPI.getAll().catch(() => ({ tasks: [] })),
      ]);
      setProjects(pRes.projects || []);
      setTasks(tRes.tasks || []);
    } catch {
      setError('Unable to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter & Sort computation
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((p) => (p.status || 'active').toLowerCase() === statusFilter.toLowerCase());
    }

    // Sorting
    if (sortBy === 'NAME') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'PROGRESS') {
      const getProgress = (p) => {
        const pId = p._id || p.id;
        const pTasks = tasks.filter((t) => String(t.project?._id || t.project || t.projectId) === String(pId));
        if (pTasks.length === 0) return 0;
        const done = pTasks.filter((t) => t.status === 'completed' || t.status === 'done').length;
        return done / pTasks.length;
      };
      list.sort((a, b) => getProgress(b) - getProgress(a));
    } else {
      // Default: Most Recent
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [projects, tasks, searchQuery, statusFilter, sortBy]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormName('');
    setFormDesc('');
    setFormStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject(project);
    setFormName(project.name);
    setFormDesc(project.description || '');
    setFormStatus(project.status || 'active');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProject) {
        await projectsAPI.update(editingProject._id || editingProject.id, {
          name: formName.trim(),
          description: formDesc.trim(),
          status: formStatus,
        });
        showToast('Project updated successfully', 'success');
      } else {
        await projectsAPI.create({
          name: formName.trim(),
          description: formDesc.trim(),
          status: formStatus,
        });
        showToast('Project created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await projectsAPI.delete(projectToDelete._id || projectToDelete.id);
      showToast('Project deleted successfully', 'info');
      setProjectToDelete(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete project', 'error');
    }
  };

  return (
    <div className="page-container projects-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-subtitle">Organize and manage your team's initiatives.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handleOpenCreateModal}
        >
          <Icon name="plus" size={16} />
          <span>Create Project</span>
        </button>
      </header>

      {error && (
        <div className="page-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn-sm btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* Toolbar: Search & Filters */}
      <section className="projects-toolbar card" aria-label="Project Controls">
        <div className="projects-toolbar-grid">
          <div className="search-box">
            <Icon name="search" size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search projects by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-controls-row">
            <div className="filter-group">
              <label htmlFor="statusFilter">Status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sortBy">Sort by:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="RECENT">Most Recent</option>
                <option value="NAME">Name (A-Z)</option>
                <option value="PROGRESS">Highest Progress</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      {loading ? (
        <div className="projects-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredProjects.length === 0 ? (
        searchQuery || statusFilter !== 'ALL' ? (
          <EmptyState
            icon="search"
            title="No projects match your filter"
            message="Try adjusting your search terms or status filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          />
        ) : (
          <EmptyState
            icon="folder"
            title="No projects yet"
            message="Create your first project and start organizing your work."
            actionLabel="+ Create Project"
            onAction={handleOpenCreateModal}
          />
        )
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const pId = project._id || project.id;
            const pTasks = tasks.filter(
              (t) => String(t.project?._id || t.project || t.projectId) === String(pId)
            );
            const pDone = pTasks.filter((t) => t.status === 'completed' || t.status === 'done').length;
            const percent = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

            return (
              <div key={pId} className="project-card">
                <div className="project-card-header">
                  <div className="project-icon-badge">
                    <Icon name="folder" size={20} />
                  </div>
                  <div className="project-header-actions">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={(e) => handleOpenEditModal(project, e)}
                      title="Edit project"
                    >
                      <Icon name="edit" size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToDelete(project);
                      }}
                      title="Delete project"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="project-card-title">
                  <Link to={`/projects/${pId}`}>{project.name}</Link>
                </h3>

                <p className="project-card-desc">
                  {project.description || 'No description provided for this project.'}
                </p>

                <div className="project-card-footer">
                  <div className="project-meta-bar">
                    <span className="task-count-text">
                      <Icon name="check" size={14} />
                      {pDone}/{pTasks.length} tasks ({percent}%)
                    </span>
                    <span className={`badge badge-${project.status === 'completed' ? 'completed' : 'inprogress'}`}>
                      {project.status || 'Active'}
                    </span>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${percent === 100 ? 'progress-fill-success' : 'progress-fill-normal'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="project-card-actions-bar">
                    <Link to={`/projects/${pId}`} className="view-project-link">
                      <span>View Workspace</span>
                      <Icon name="arrowRight" size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Icon name="folder" size={18} />
                </div>
                <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="formName">Project Name *</label>
                  <input
                    id="formName"
                    type="text"
                    required
                    placeholder="e.g. Platform API v2"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="formDesc">Description</label>
                  <textarea
                    id="formDesc"
                    rows={3}
                    placeholder="Detailed goals and scope of this initiative..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="formStatus">Status</label>
                  <select
                    id="formStatus"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
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
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !formName.trim()}
                >
                  {submitting ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : editingProject ? (
                    'Save Changes'
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!projectToDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Project"
        danger
        onConfirm={handleDeleteProject}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
