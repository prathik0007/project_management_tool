import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api.js';

function AppNav() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    authAPI.getMe().then((data) => setUser(data.user)).catch(() => setUser(null));
  }, []);

  const logout = async () => {
    try { await authAPI.logout(); } finally { navigate('/login'); }
  };

  return <header className="app-nav">
    <Link className="app-brand" to="/dashboard">ProjectFlow</Link>
    <button className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-navigation">Menu</button>
    <nav id="main-navigation" className={`nav-links ${open ? 'open' : ''}`}>
      <NavLink to="/dashboard" onClick={() => setOpen(false)}>Dashboard</NavLink>
      <NavLink to="/projects" onClick={() => setOpen(false)}>Projects</NavLink>
      <NavLink to="/tasks" onClick={() => setOpen(false)}>Tasks</NavLink>
      <NavLink to="/deadlines" onClick={() => setOpen(false)}>Deadlines</NavLink>
    </nav>
    <div className="nav-user">
      {user ? <><span>Hello, {user.name}</span><button className="btn-logout" onClick={logout}>Logout</button></> : <Link className="nav-link" to="/login">Login</Link>}
    </div>
  </header>;
}

export default AppNav;
