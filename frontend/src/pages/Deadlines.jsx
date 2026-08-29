import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api.js';
import DeadlineList from '../components/DeadlineList.jsx';
import Skeletons from '../components/Skeletons.jsx';
import { Icon } from '../components/Icons.jsx';

function Deadlines() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchDeadlines = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await tasksAPI.getDeadlines(); setTasks(data.tasks || []); }
    catch (err) { setError(err.message || 'Unable to load deadlines. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);
  return <div className="page-container">
    <div className="page-header">
      <div>
        <h1>Deadlines</h1>
        <p className="page-subtitle">Upcoming, due today, and overdue tasks</p>
      </div>
      <Link to="/tasks" className="btn-secondary"><Icon name="check" size={15} /> All Tasks</Link>
    </div>
    <DeadlineList tasks={tasks} loading={loading} error={error} onRefresh={fetchDeadlines} />
  </div>;
}

export default Deadlines;
