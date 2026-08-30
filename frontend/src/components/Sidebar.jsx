import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { Icon } from './Icons.jsx';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/projects', label: 'Projects', icon: 'folder' },
  { path: '/tasks', label: 'Tasks', icon: 'check' },
  { path: '/deadlines', label: 'Deadlines', icon: 'calendar' },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'info');
      navigate('/login');
    } catch {
      showToast('Error during logout', 'error');
    }
  };

  const userInitials = (user?.name || user?.email || 'PF')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="sidebar-inner-content">
      <div className="sidebar-brand-wrapper">
        <Link to="/dashboard" className="sidebar-brand" onClick={onClose} aria-label="ProjectFlow Home">
          <span className="sidebar-brand-mark">
            <Icon name="spark" size={20} />
          </span>
          <span className="sidebar-brand-text">ProjectFlow</span>
        </Link>
      </div>

      <div className="sidebar-nav-group">
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-links" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-nav-group" style={{ marginTop: '1.75rem' }}>
        <div className="sidebar-section-label">SYSTEM</div>
        <nav className="sidebar-links" aria-label="System Links">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon name="settings" size={19} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-block">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{userInitials}</div>
            <div className="sidebar-profile-meta">
              <span className="sidebar-user-name">{user?.name || 'Workspace User'}</span>
              <span className="sidebar-user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sign out of ProjectFlow"
          >
            <Icon name="logout" size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar - Exactly ONE instance on Desktop */}
      <aside className="app-sidebar desktop-only" aria-label="Sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer - Conditionally rendered only when isOpen is true */}
      {isOpen && (
        <div className="mobile-drawer-root">
          <div
            className="drawer-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="app-sidebar app-sidebar--drawer open" aria-label="Mobile Navigation">
            <button
              type="button"
              className="drawer-close"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <Icon name="x" size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
