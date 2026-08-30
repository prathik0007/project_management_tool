import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from './Icons.jsx';

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { user, isAuthenticated, login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, immediately redirect to dashboard
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    return true;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validate()) return;

    setSubmitting(true);

    try {
      if (isLogin) {
        await login({ email: email.trim(), password });
      } else {
        await register({ name: name.trim(), email: email.trim(), password });
      }
      navigate('/dashboard');
    } catch (err) {
      let rawMsg = err.message || '';
      if (/failed to fetch|networkerror|econnrefused/i.test(rawMsg)) {
        setError('Unable to connect to the backend server. Please verify the backend is running on http://localhost:5000.');
      } else {
        setError(rawMsg || 'Unable to complete request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="auth-header">
            <span className="auth-brand-mark">
              <Icon name="spark" size={24} />
            </span>
            <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p className="auth-subtitle">
              {isLogin
                ? 'Sign in to access your ProjectFlow workspace.'
                : 'Start organizing your projects and tasks today.'}
            </p>
          </div>

          {error && (
            <div className="auth-error-alert" role="alert">
              <Icon name="alert" size={16} />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                required
                autoComplete="name"
                placeholder="e.g. Alex Rivera"
                disabled={submitting}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              required
              autoComplete="email"
              placeholder="you@company.com"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                required
                minLength={6}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
                disabled={submitting}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            {!isLogin && <span className="input-helper-text">Must be at least 6 characters long</span>}
          </div>

          <button
            type="submit"
            className="btn-primary btn-lg auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="btn-spinner" />
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Workspace Account'
            )}
          </button>

          <div className="auth-footer">
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <Link to={isLogin ? '/register' : '/login'} className="auth-switch-link">
                {isLogin ? 'Sign up free' : 'Log in here'}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthForm;
