import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectsAPI } from '../services/api.js';
import ProjectSummary from '../components/ProjectSummary.jsx';

function ProjectDetails() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchSummary = useCallback(async () => {
    setLoading(true); setError('');
    try { setSummary(await projectsAPI.getSummary(id)); }
    catch (err) { setError(err.message || 'Unable to load the project summary. Please try again.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  return <div className="page-container">
    <div className="page-header"><div><h1>Project Summary</h1><p className="page-subtitle">Tasks and progress for this project</p></div><Link to="/tasks" className="nav-link">Back to Tasks</Link></div>
    {loading && <p className="loading-text">Loading project summary...</p>}
    {error && <div className="page-error"><p>{error}</p><button className="btn-secondary" onClick={fetchSummary}>Try Again</button></div>}
    {summary && !loading && <ProjectSummary summary={summary} />}
  </div>;
}

export default ProjectDetails;
