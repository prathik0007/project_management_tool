import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from './Icons.jsx';

export default function TopHeader({ onOpenMobileMenu, onOpenSearch, onOpenQuickTask }) {
  const location = useLocation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Close notifications dropdown on route change
  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  // Handle ESC key to close notifications
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            className="btn-primary btn-sm topbar-create-btn"
            onClick={onOpenQuickTask}
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
  );
}
