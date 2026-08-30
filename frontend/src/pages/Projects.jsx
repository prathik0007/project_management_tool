import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeletons from '../components/Skeletons.jsx';
import ProjectProgress from '../components/ProjectProgress.jsx';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';

function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await projectsAPI.getAll();
      const list = data.projects || [];
      setProjects(list);

      // Load progress summaries in background
      list.forEach(async (project) => {
        try {
          const summary = await projectsAPI.getSummary(project._id);
          setSummaries((prev) => ({ ...prev, [project._id]: summary }));
        } catch {
          /* summary is optional */
        }
      });
    } catch (err) {
      setError('Unable to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setName(project.name || '');
    setDescription(project.description || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!name.trim()) return setFormError('Project name is required.');

    setSaving(true);
    setFormError('');
    try {
      if (editingProject) {
        await projectsAPI.update(editingProject._id, {
          name: name.trim(),
          description: description.trim(),
        });
        toast('Project updated successfully', 'success');
      } else {
        await projectsAPI.create({
          name: name.trim(),
          description: description.trim(),
        });
        toast('Project created successfully', 'success');
      }
      setShowModal(false);
      loadProjects();
    } catch (err) {
      setFormError(err.message || 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    setDeleteBusy(true);
    try {
      await projectsAPI.delete(deletingProject._id);
      toast('Project deleted successfully', 'success');
      setDeletingProject(null);
      loadProjects();
    } catch (err) {
      toast(err.message || 'Unable to delete project.', 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [projects, search]);

  return (
    <main className="page-container">
      {/* Header Bar */}
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-subtitle">Organize and manage your team's initiatives.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Icon name="plus" size={16} />
          <span>Create Project</span>
        </button>
      </div>

      {error && (
        <div className="page-error" role="alert">
          <p>{error}</p>
          <button className="btn-secondary btn-sm" onClick={loadProjects}>
            Try Again
          </button>
        </div>
      )}

      {/* Toolbar: Search */}
      <div className="projects-toolbar card">
        <div className="search-box">
          <Icon name="search" size={16} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title or description..."
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')}>
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <Skeletons count={3} type="card" />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon="folder"
          title={search ? 'No matching projects found' : 'No projects yet'}
          message={
            search
              ? 'Try adjusting your search query.'
              : 'Create your first project to start organizing tasks.'
          }
          action={
            !search && (
              <button className="btn-primary" onClick={openCreateModal}>
                Create Project
              </button>
            )
          }
        />
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const summary = summaries[project._id];
            const progress = summary?.progress || 0;
            const totalTasks = summary?.totalTasks || 0;
            const completedTasks = summary?.completedTasks || 0;

            return (
              <article key={project._id} className="project-card">
                <div className="project-card-header">
                  <span className="project-icon-badge">
                    <Icon name="folder" size={18} />
                  </span>
                  <div className="project-card-actions">
                    <button
                      className="icon-action-btn"
                      onClick={() => openEditModal(project)}
                      title="Edit Project"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      className="icon-action-btn danger"
                      onClick={() => setDeletingProject(project)}
                      title="Delete Project"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="project-card-title">{project.name}</h3>
                <p className="project-card-desc">
                  {project.description || 'No description provided.'}
                </p>

                <div className="project-card-footer">
                  <ProjectProgress progress={progress} />
                  <div className="project-meta-bar">
                    <span className="task-count-text">
                      <Icon name="check" size={14} />
                      {completedTasks} / {totalTasks} Tasks
                    </span>
                    <Link to={`/projects/${project._id}`} className="btn-ghost btn-sm">
                      <span>View Details</span>
                      <Icon name="arrowRight" size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal: Create/Edit Project */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">
                  <Icon name="folder" size={18} />
                </span>
                <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSave}>
              {formError && (
                <div className="form-error-alert" role="alert">
                  <Icon name="alert" size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="project-name">Project Name *</label>
                <input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mobile App Development"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is the objective of this project?"
                  rows={3}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      <ConfirmDialog
        open={Boolean(deletingProject)}
        title="Delete Project?"
        message={`Are you sure you want to delete "${deletingProject?.name}"? All associated tasks will also be removed.`}
        confirmLabel="Delete Project"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProject(null)}
      />
    </main>
  );
}

export default Projects;
