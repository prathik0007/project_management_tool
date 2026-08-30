import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import DeadlineList from '../components/DeadlineList.jsx';
import { Icon } from '../components/Icons.jsx';

function Deadlines() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tasksAPI.getDeadlines();
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message || 'Unable to load deadlines. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeadlines();
  }, [fetchDeadlines]);

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <h1>Deadlines & Milestones</h1>
          <p className="page-subtitle">Track upcoming deadlines, tasks due today, and overdue work.</p>
        </div>
        <Link to="/tasks" className="btn-secondary">
          <Icon name="check" size={15} />
          <span>All Tasks View</span>
        </Link>
      </div>

      <DeadlineList
        tasks={tasks}
        loading={loading}
        error={error}
        onRefresh={fetchDeadlines}
      />
    </main>
  );
}

export default Deadlines;
