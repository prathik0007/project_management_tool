import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Skeletons from './Skeletons.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-container" style={{ paddingTop: '3rem' }}>
        <Skeletons count={2} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
