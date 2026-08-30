import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { Icon } from './Icons.jsx';

export default function TopHeader({ onOpenMobileMenu, onOpenSearch, onOpenQuickTask }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on route change
  useEffect(() => {
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Handle ESC key and outside click to close dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  return (
    <header className="app-top-header">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          title="Open Navigation"
        >
          <Icon name="menu" size={20} />
        </button>
        <span className="topbar-page-title">{currentPageTitle}</span>
      </div>

      <div className="topbar-right">
        {/* Global Quick Search Button */}
        {onOpenSearch && (
          <button
            type="button"
            className="topbar-search-trigger"
            onClick={onOpenSearch}
            title="Search projects and tasks (Ctrl+K)"
            aria-label="Quick search workspace (Ctrl+K)"
          >
            <Icon name="search" size={15} />
            <span className="search-placeholder-text">Quick search...</span>
            <kbd className="search-kbd-badge">Ctrl K</kbd>
          </button>
        )}

        {/* Quick Action Button */}
        {onOpenQuickTask && (
          <button
            type="button"
            className="btn-primary topbar-create-btn"
            onClick={onOpenQuickTask}
            title="Create a new task in any project"
          >
            <Icon name="plus" size={15} />
            <span>New Task</span>
          </button>
        )}

        {/* Notifications Trigger */}
        <div className="topbar-notifications-wrapper" ref={notificationsRef}>
          <button
            type="button"
            className={`icon-action-btn topbar-bell-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
            title="Workspace Notifications"
          >
            <Icon name="bell" size={18} />
          </button>

          {showNotifications && (
            <div className="notifications-dropdown" role="dialog" aria-label="Notifications">
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

        {/* User Profile Pill & Dropdown */}
        <div className="topbar-profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className={`topbar-user-badge ${showProfileMenu ? 'active' : ''}`}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            title={`${user?.name || 'User'} (${user?.email || ''})`}
            aria-label="User account menu"
            aria-expanded={showProfileMenu}
          >
            <div className="topbar-user-avatar">{userInitials}</div>
            <span className="topbar-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
            <Icon name="chevronDown" size={13} />
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-menu" role="menu" aria-label="User Account Options">
              <div className="profile-dropdown-header">
                <div className="dropdown-user-name">{user?.name || 'Workspace User'}</div>
                <div className="dropdown-user-email">{user?.email || ''}</div>
              </div>
              <div className="profile-dropdown-links">
                <Link
                  to="/settings"
                  className="dropdown-menu-item"
                  onClick={() => setShowProfileMenu(false)}
                  role="menuitem"
                >
                  <Icon name="settings" size={16} />
                  <span>Workspace Settings</span>
                </Link>
                <Link
                  to="/tasks"
                  className="dropdown-menu-item"
                  onClick={() => setShowProfileMenu(false)}
                  role="menuitem"
                >
                  <Icon name="check" size={16} />
                  <span>My Tasks</span>
                </Link>
              </div>
              <div className="profile-dropdown-footer">
                <button
                  type="button"
                  className="dropdown-logout-btn"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <Icon name="logout" size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
