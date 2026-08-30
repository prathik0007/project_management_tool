import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../services/api.js';
import { Icon } from './Icons.jsx';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setLoading(true);
      Promise.all([projectsAPI.getAll(), tasksAPI.getAll()])
        .then(([projData, taskData]) => {
          setProjects(projData.projects || []);
          setTasks(taskData.tasks || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectProject = (projectId) => {
    onClose();
    navigate(`/projects/${projectId}`);
  };

  const handleSelectTask = () => {
    onClose();
    navigate('/tasks');
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <Icon name="search" size={18} className="search-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search projects, tasks, or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="command-palette-esc" onClick={onClose}>ESC</kbd>
        </div>

        <div className="command-palette-results">
          {loading ? (
            <div className="command-palette-loading">
              <span className="btn-spinner" />
              <span>Searching workspace...</span>
            </div>
          ) : (
            <>
              {/* Navigation Shortcuts */}
              {!query && (
                <div className="command-section">
                  <span className="command-section-label">NAVIGATION</span>
                  <button
                    type="button"
                    className="command-item"
                    onClick={() => { onClose(); navigate('/dashboard'); }}
                  >
                    <Icon name="dashboard" size={16} />
                    <span>Go to Dashboard</span>
                  </button>
                  <button
                    type="button"
                    className="command-item"
                    onClick={() => { onClose(); navigate('/projects'); }}
                  >
                    <Icon name="folder" size={16} />
                    <span>Go to Projects</span>
                  </button>
                  <button
                    type="button"
                    className="command-item"
                    onClick={() => { onClose(); navigate('/tasks'); }}
                  >
                    <Icon name="check" size={16} />
                    <span>Go to Tasks</span>
                  </button>
                  <button
                    type="button"
                    className="command-item"
                    onClick={() => { onClose(); navigate('/deadlines'); }}
                  >
                    <Icon name="calendar" size={16} />
                    <span>Go to Deadlines & Milestones</span>
                  </button>
                </div>
              )}

              {/* Matching Projects */}
              {filteredProjects.length > 0 && (
                <div className="command-section">
                  <span className="command-section-label">PROJECTS</span>
                  {filteredProjects.slice(0, 5).map((project) => (
                    <button
                      key={project._id || project.id}
                      type="button"
                      className="command-item"
                      onClick={() => handleSelectProject(project._id || project.id)}
                    >
                      <Icon name="folder" size={16} />
                      <span className="command-item-title">{project.name}</span>
                      {project.status && (
                        <span className="command-item-badge">{project.status}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Matching Tasks */}
              {filteredTasks.length > 0 && (
                <div className="command-section">
                  <span className="command-section-label">TASKS</span>
                  {filteredTasks.slice(0, 6).map((task) => (
                    <button
                      key={task._id || task.id}
                      type="button"
                      className="command-item"
                      onClick={handleSelectTask}
                    >
                      <Icon name="check" size={16} />
                      <span className="command-item-title">{task.title}</span>
                      <span className="command-item-meta">{task.status || 'todo'}</span>
                    </button>
                  ))}
                </div>
              )}

              {query && filteredProjects.length === 0 && filteredTasks.length === 0 && (
                <div className="command-empty">
                  <p>No results found for "{query}"</p>
                  <span>Try searching with a different keyword</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
