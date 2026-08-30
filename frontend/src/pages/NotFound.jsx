import { Link } from 'react-router-dom';
import { Icon } from '../components/Icons.jsx';

export default function NotFound() {
  return (
    <main className="page-container center-page">
      <div className="not-found-card card">
        <div className="not-found-icon">
          <Icon name="alert" size={32} />
        </div>
        <h1>404 — Page Not Found</h1>
        <p className="muted">The page or route you are looking for does not exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/dashboard" className="btn-primary">
            <Icon name="dashboard" size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
