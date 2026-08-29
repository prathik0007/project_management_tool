import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api.js';
import { Icon } from './Icons.jsx';

// ─── App shell: sidebar on desktop, slide-in drawer on mobile ───────────────
const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/tasks', label: 'Tasks', icon: 'check' },
  { to: '/deadlines', label: 'Deadlines', icon: 'clock' },
];

function SidebarContent({ user, onLogout, onNavigate }) {
  return (
    <>
      <Link className="sidebar-brand" to="/dashboard" onClick={onNavigate}>
        <span className="sidebar-brand-mark"><Icon name="spark" size={16} /></span>
        ProjectFlow
      </Link>
      <nav className="sidebar-links" aria-label="Main navigation">
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={onNavigate} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon name={link.icon} size={17} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="sidebar-profile">
              <span className="sidebar-avatar" aria-hidden="true">{(user.name || '?').charAt(0).toUpperCase()}</span>
              <div className="sidebar-profile-meta">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            </div>
            <button className="sidebar-logout" onClick={onLogout}>
              <Icon name="logout" size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link className="sidebar-link" to="/login" onClick={onNavigate}>
            <Icon name="user" size={17} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </>
  );
}

export default function AppNav() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    authAPI.getMe().then((data) => setUser(data.user)).catch(() => setUser(null));
  }, []);

  // Close the mobile drawer with Escape and lock body scroll while open
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const logout = async () => {
    try { await authAPI.logout(); } finally { navigate('/login'); }
  };

  const close = () => setDrawerOpen(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <Link className="sidebar-brand" to="/dashboard"><span className="sidebar-brand-mark"><Icon name="spark" size={16} /></span>ProjectFlow</Link>
        <button className="mobile-menu-btn" onClick={() => setDrawerOpen(true)} aria-label="Open navigation menu" aria-expanded={drawerOpen}>
          <Icon name="menu" size={20} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="sidebar">
        <SidebarContent user={user} onLogout={logout} onNavigate={() => { }} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && <div className="drawer-overlay" onClick={close} />}
      <aside className={`sidebar sidebar--drawer${drawerOpen ? ' open' : ''}`}>
        <button className="drawer-close" onClick={close} aria-label="Close navigation menu"><Icon name="x" size={18} /></button>
        <SidebarContent user={user} onLogout={logout} onNavigate={close} />
      </aside>
    </>
  );
}
