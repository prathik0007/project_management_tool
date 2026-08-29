import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../services/api.js';

function ProtectedRoute({ children }) {
  const [state, setState] = useState('checking');
  useEffect(() => {
    authAPI.getMe().then(() => setState('authorized')).catch(() => setState('unauthorized'));
  }, []);
  if (state === 'checking') return <p className="loading-text">Checking your session...</p>;
  if (state === 'unauthorized') return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;
