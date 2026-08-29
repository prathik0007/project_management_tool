import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Skeletons from '../components/Skeletons.jsx';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';

function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [summaries, setSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await projectsAPI.getAll();
      const list = data.projects || [];
      setProjects(list);
      // Load progress summaries without blocking the page render
      list.forEach(async (project) => {
        try {
          const summary = await projectsAPI.getSummary(project._id);
          setSummaries((prev) => ({ ...prev, [project._id]: summary }));
        } catch { /* summary is optional decoration */ }
      });
    }
    catch (err) { setError('Unable to load projects. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openForm = (project = null) => { setForm(project || {}); setName(project?.name || ''); setDescription(project?.description || ''); setError(''); };
  const save = async (event) => {
    event.preventDefault(); if (!name.trim()) return setError('Project name is required.');
    setSaving(true);
    try {
      if (form._id) { await projectsAPI.update(form._id, { name: name.trim(), description: description.trim() }); toast('Project updated', 'success'); }
      else { await projectsAPI.create({ name: name.trim(), description: description.trim() }); toast('Project created', 'success'); }
      setForm(null); load();
    }
    catch (err) { setError(err.message || 'Unable to save the project.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    const project = deleting;
    if (!project) return;
    setDeleteBusy(true);
    try {
      await projectsAPI.delete(project._id);
      toast('Project deleted', 'success');
      setDeleting(null);
      load();
    } catch (err) { toast(err.message || 'Unable to delete the project.', 'error'); }
    finally { setDeleteBusy(false); }
  };

  return <main className="page-container">
    <div className="page-header">
      <div><h1>Projects</h1><p className="page-subtitle">Plan and track your work in one place.</p></div>
      <button className="btn-primary btn-lg" onClick={() => openForm()}><Icon name="plus" size={16} /> Create Project</button>
    </div>

    {error && <div className="page-error" role="alert"><p>{error}</p><button className="btn-secondary" onClick={load}>Try Again</button></div>}

    {form && <form className="form-panel project-form" onSubmit={save}>
      <h2>{form._id ? 'Edit Project' : 'Create Project'}</h2>
      <div className="form-group"><label htmlFor="project-name">Project name</label><input id="project-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Website Redesign" /></div>
      <div className="form-group"><label htmlFor="project-description">Description</label><textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" placeholder="What is this project about?" /></div>
      <div className="form-actions"><button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Project'}</button><button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancel</button></div>
    </form>}

    {loading ? <Skeletons count={4} /> : projects.length === 0 ? (
      <EmptyState icon="folder" title="No projects yet" message="Create your first project and start organizing your work." action={<button className="btn-primary" onClick={() => openForm()}><Icon name="plus" size={15} /> Create Project</button>} />
    ) : (
      <div className="project-list">
        {projects.map((project) => {
          const summary = summaries[project._id];
          return (
            <article className="project-card" key={project._id}>
              <div>
                <h2><Link className="project-link" to={`/projects/${project._id}`}>{project.name}</Link></h2>
                <p>{project.description || 'No project description.'}</p>
                <div className="project-card-progress">
                  <ProjectProgressInline progress={summary?.progress} />
                  <span className="task-count-line"><Icon name="check" size={13} /> {summary ? `${summary.completedTasks} of ${summary.totalTasks} tasks completed` : 'Loading progress…'}</span>
                </div>
              </div>
              <div className="project-card-actions">
                <Link className="btn-secondary btn-sm" to={`/projects/${project._id}`}><Icon name="dashboard" size={14} /> View</Link>
                <button className="btn-edit" onClick={() => openForm(project)}><Icon name="edit" size={14} /> Edit</button>
                <button className="btn-delete" onClick={() => setDeleting(project)}><Icon name="trash" size={14} /> Delete</button>
              </div>
            </article>
          );
        })}
      </div>
    )}

    <ConfirmDialog
      open={Boolean(deleting)}
      title="Delete project?"
      message={`This will permanently delete "${deleting?.name || 'this project'}" and its tasks. This action cannot be undone.`}
      confirmLabel="Delete Project"
      busy={deleteBusy}
      onConfirm={remove}
      onCancel={() => setDeleting(null)}
    />
  </main>;
}

// Small inline progress bar (reuses the design-system track styles)
function ProjectProgressInline({ progress }) {
  const value = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : null;
  if (value === null) return <div className="progress-track skeleton-track" />;
  return (
    <div className="progress-track" role="progressbar" aria-label="Project progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export default Projects;
