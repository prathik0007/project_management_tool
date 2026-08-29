import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api.js';
import { Icon } from './Icons.jsx';

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (isLogin) await authAPI.login({ email, password });
      else await authAPI.register({ name, email, password });
      navigate('/dashboard');
    } catch (err) { setError(err.message || 'Unable to continue. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="auth-logo" aria-hidden="true"><Icon name="spark" size={20} /></span>
        <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p>{isLogin ? 'Sign in to manage your projects.' : 'Start organizing your projects today.'}</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Your full name" />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? 'Your password' : 'At least 6 characters'} />
        </div>
        <button className="btn-primary btn-lg" disabled={submitting}>
          {submitting ? <span className="btn-spinner" aria-label="Loading" /> : null}
          {submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
        </button>
        <p className="auth-switch">
          {isLogin ? 'New here?' : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Log in'}</Link>
        </p>
      </form>
    </main>
  );
}

export default AuthForm;
