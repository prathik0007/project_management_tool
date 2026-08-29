import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api.js';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await projectsAPI.getAll(); setProjects(data.projects || []); }
    catch (err) { setError('Unable to load projects. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const openForm = (project = null) => { setForm(project || {}); setName(project?.name || ''); setDescription(project?.description || ''); setError(''); };
  const save = async (event) => {
    event.preventDefault(); if (!name.trim()) return setError('Project name is required.');
    setSaving(true);
    try { if (form._id) await projectsAPI.update(form._id, { name: name.trim(), description: description.trim() }); else await projectsAPI.create({ name: name.trim(), description: description.trim() }); setForm(null); load(); }
    catch (err) { setError(err.message || 'Unable to save the project.'); }
    finally { setSaving(false); }
  };
  const remove = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try { await projectsAPI.delete(project._id); load(); } catch (err) { setError(err.message || 'Unable to delete the project.'); }
  };
  return <main className="page-container"><div className="page-header"><div><h1>Projects</h1><p className="page-subtitle">Plan and track your work in one place.</p></div><button className="btn-primary" onClick={() => openForm()}>Create Project</button></div>
    {error && <div className="page-error" role="alert"><p>{error}</p><button className="btn-secondary" onClick={load}>Try Again</button></div>}
    {form && <form className="form-panel project-form" onSubmit={save}><h2>{form._id ? 'Edit Project' : 'Create Project'}</h2><div className="form-group"><label htmlFor="project-name">Project name</label><input id="project-name" value={name} onChange={(e) => setName(e.target.value)} required /></div><div className="form-group"><label htmlFor="project-description">Description</label><textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" /></div><div className="form-actions"><button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Project'}</button><button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancel</button></div></form>}
    {loading ? <p className="loading-text">Loading projects...</p> : projects.length === 0 ? <div className="empty-state"><p>You don't have any projects yet.</p><button className="btn-primary" onClick={() => openForm()}>Create your first project</button></div> : <div className="project-list">{projects.map((project) => <article className="project-card" key={project._id}><div><h2><Link className="project-link" to={`/projects/${project._id}`}>{project.name}</Link></h2><p>{project.description || 'No project description.'}</p></div><div className="project-card-actions"><Link className="btn-secondary" to={`/projects/${project._id}`}>View Summary</Link><button className="btn-edit" onClick={() => openForm(project)}>Edit</button><button className="btn-delete" onClick={() => remove(project)}>Delete</button></div></article>)}</div>}
  </main>;
}
export default Projects;
