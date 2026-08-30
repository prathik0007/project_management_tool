import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from './Icons.jsx';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/tasks', label: 'Tasks', icon: 'check' },
  { to: '/deadlines', label: 'Deadlines', icon: 'clock' },
];

function getPageTitle(pathname) {
  if (pathname.startsWith('/projects/')) return 'Project Details';
  switch (pathname) {
    case '/dashboard':
      return 'Dashboard';
    case '/projects':
      return 'Projects';
    case '/tasks':
      return 'Tasks';
    case '/deadlines':
      return 'Deadlines';
    default:
      return 'ProjectFlow';
  }
}

function SidebarContent({ user, onLogout, onNavigate }) {
  return (
    <>
      <div className="sidebar-brand-wrapper">
        <Link className="sidebar-brand" to="/dashboard" onClick={onNavigate}>
          <span className="sidebar-brand-mark">
            <Icon name="spark" size={18} />
          </span>
          <span className="sidebar-brand-text">ProjectFlow</span>
        </Link>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      <nav className="sidebar-links" aria-label="Main navigation">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon name={link.icon} size={18} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user-block">
            <div className="sidebar-profile">
              <span className="sidebar-avatar" aria-hidden="true">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </span>
              <div className="sidebar-profile-meta">
                <strong className="sidebar-user-name">{user.name}</strong>
                <span className="sidebar-user-email">{user.email}</span>
              </div>
            </div>
            <button className="sidebar-logout-btn" onClick={onLogout} aria-label="Logout of account">
              <Icon name="logout" size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link className="sidebar-link" to="/login" onClick={onNavigate}>
            <Icon name="user" size={18} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </>
  );
}

export default function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const pageTitle = getPageTitle(location.pathname);

  // Close mobile drawer on ESC key & manage scroll lock
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeDrawer = () => setDrawerOpen(false);

  if (isAuthPage) return null;

  return (
    <>
      {/* Top Header Bar for Desktop and Tablet/Mobile */}
      <header className="app-topbar">
        <div className="topbar-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="topbar-title-area">
            <h2 className="topbar-page-title">{pageTitle}</h2>
          </div>
        </div>

        <div className="topbar-right">
          {user && (
            <div className="topbar-user-badge">
              <span className="topbar-user-avatar">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="topbar-user-name">{user.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => {}} />
      </aside>

      {/* Mobile Drawer Navigation */}
      {drawerOpen && <div className="drawer-overlay" onClick={closeDrawer} />}
      <aside className={`sidebar sidebar--drawer${drawerOpen ? ' open' : ''}`}>
        <button className="drawer-close" onClick={closeDrawer} aria-label="Close navigation menu">
          <Icon name="x" size={18} />
        </button>
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={closeDrawer} />
      </aside>
    </>
  );
}
