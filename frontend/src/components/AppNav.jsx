import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { Icon } from './Icons.jsx';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/projects', label: 'Projects', icon: 'folder' },
  { path: '/tasks', label: 'Tasks', icon: 'check' },
  { path: '/deadlines', label: 'Deadlines', icon: 'calendar' },
];

function AppNav({ onOpenQuickCreate, onOpenSearch }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Handle ESC key to close drawer/dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out successfully', 'info');
      navigate('/login');
    } catch {
      showToast('Error during logout', 'error');
    }
  };

  const currentPageTitle = (() => {
    if (location.pathname.startsWith('/projects/')) return 'Project Details';
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname === '/projects') return 'Projects';
    if (location.pathname === '/tasks') return 'Tasks';
    if (location.pathname === '/deadlines') return 'Deadlines & Milestones';
    if (location.pathname === '/settings') return 'Workspace Settings';
    return 'ProjectFlow';
  })();

  const userInitials = (user?.name || user?.email || 'PF')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderSidebarContent = () => (
    <>
      <div className="sidebar-brand-wrapper">
        <Link to="/dashboard" className="sidebar-brand" aria-label="ProjectFlow Home">
          <span className="sidebar-brand-mark">
            <Icon name="spark" size={18} />
          </span>
          <span className="sidebar-brand-text">ProjectFlow</span>
        </Link>
      </div>

      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-links" aria-label="Main Navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-section-label" style={{ marginTop: '1.5rem' }}>
        SYSTEM
      </div>
      <nav className="sidebar-links" aria-label="System Links">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >
          <Icon name="settings" size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>

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
            <Icon name="logout" size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="sidebar desktop-only" aria-label="Sidebar">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar sidebar--drawer ${drawerOpen ? 'open' : ''}`} aria-label="Mobile Navigation">
        <button
          type="button"
          className="drawer-close"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation menu"
        >
          <Icon name="x" size={20} />
        </button>
        {renderSidebarContent()}
      </aside>

      {/* Top Bar Header */}
      <header className="app-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" size={20} />
          </button>
          <span className="topbar-page-title">{currentPageTitle}</span>
        </div>

        <div className="topbar-right">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              type="button"
              className="topbar-search-trigger"
              onClick={onOpenSearch}
              title="Search projects and tasks (Ctrl+K)"
            >
              <Icon name="search" size={15} />
              <span className="search-placeholder-text">Quick search...</span>
              <kbd className="search-kbd-badge">Ctrl K</kbd>
            </button>
          )}

          {/* Quick Action Button */}
          {onOpenQuickCreate && (
            <button
              type="button"
              className="btn-primary btn-sm topbar-create-btn"
              onClick={onOpenQuickCreate}
            >
              <Icon name="plus" size={14} />
              <span>New Task</span>
            </button>
          )}

          {/* Notifications Trigger */}
          <div className="topbar-notifications-wrapper">
            <button
              type="button"
              className="icon-action-btn topbar-bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <Icon name="bell" size={18} />
            </button>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h4>Notifications</h4>
                  <span className="badge-count">All caught up</span>
                </div>
                <div className="notifications-body">
                  <div className="notification-empty">
                    <Icon name="check" size={24} />
                    <p>No unread notifications</p>
                    <span>You're all up to date with tasks and project deadlines!</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="topbar-user-badge" title={user?.email}>
            <div className="topbar-user-avatar">{userInitials}</div>
            <span className="topbar-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
          </div>
        </div>
      </header>
    </>
  );
}

export default AppNav;
