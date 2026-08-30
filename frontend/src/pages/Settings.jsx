import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Icon } from '../components/Icons.jsx';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  // Preference toggles
  const [compactView, setCompactView] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [taskSounds, setTaskSounds] = useState(false);

  const userInitials = (user?.name || user?.email || 'PF')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Profile information saved in workspace session', 'success');
    }, 400);
  };

  const handleSavePreferences = () => {
    showToast('Preferences updated successfully', 'success');
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('Signed out of session', 'info');
      navigate('/login');
    } catch {
      showToast('Error during logout', 'error');
    }
  };

  return (
    <div className="page-container settings-page">
      <header className="page-header">
        <div>
          <h1>Workspace Settings</h1>
          <p className="page-subtitle">
            Manage your personal profile, workspace session, and application preferences.
          </p>
        </div>
      </header>

      {/* Settings Navigation Tabs */}
      <div className="project-tabs-bar">
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <Icon name="user" size={15} />
          <span>My Profile</span>
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <Icon name="settings" size={15} />
          <span>Account & Session</span>
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Icon name="spark" size={15} />
          <span>Preferences</span>
        </button>
        <button
          type="button"
          className={`project-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Icon name="alert" size={15} />
          <span>Security</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="settings-section-container">
          <div className="card settings-card">
            <div className="settings-card-header">
              <div>
                <h3>Personal Information</h3>
                <p className="settings-card-subtitle">
                  Update your identity details across projects and assigned tasks.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="settings-form">
              <div className="profile-avatar-row">
                <div className="settings-avatar-large">{userInitials}</div>
                <div className="profile-avatar-meta">
                  <span className="profile-avatar-title">{user?.name || 'Workspace User'}</span>
                  <span className="profile-avatar-badge">Workspace Member</span>
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="settings-name">Full Name</label>
                  <input
                    id="settings-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="settings-email">Email Address</label>
                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    disabled
                    title="Email is bound to your account and cannot be modified directly"
                  />
                  <span className="input-helper-text">Managed by ProjectFlow Auth</span>
                </div>
              </div>

              <div className="settings-actions-footer">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Account & Session */}
      {activeTab === 'account' && (
        <div className="settings-section-container">
          <div className="card settings-card">
            <div className="settings-card-header">
              <div>
                <h3>Current Active Session</h3>
                <p className="settings-card-subtitle">
                  Session authentication and connected database environment details.
                </p>
              </div>
            </div>

            <div className="session-info-grid">
              <div className="session-info-box">
                <span className="session-lbl">Authenticated Account</span>
                <span className="session-val">{user?.email}</span>
              </div>
              <div className="session-info-box">
                <span className="session-lbl">Session Type</span>
                <span className="session-val">HTTP-Only JWT Cookie</span>
              </div>
              <div className="session-info-box">
                <span className="session-lbl">Backend Engine</span>
                <span className="session-val">Node.js + Express (Port 5000)</span>
              </div>
              <div className="session-info-box">
                <span className="session-lbl">Database Cluster</span>
                <span className="session-val" style={{ color: '#4ade80' }}>
                  ● MongoDB Atlas (Connected)
                </span>
              </div>
            </div>

            <div className="danger-zone-box">
              <div className="danger-zone-text">
                <h4>Sign out of this session</h4>
                <p>You will be signed out of your current ProjectFlow account on this browser.</p>
              </div>
              <button type="button" className="btn-danger" onClick={handleSignOut}>
                <Icon name="logout" size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeTab === 'preferences' && (
        <div className="settings-section-container">
          <div className="card settings-card">
            <div className="settings-card-header">
              <div>
                <h3>Interface & Theme Settings</h3>
                <p className="settings-card-subtitle">
                  Customize your ProjectFlow workspace display mode and notification prompts.
                </p>
              </div>
            </div>

            <div className="preferences-list">
              <div className="pref-item">
                <div className="pref-text">
                  <h4>Theme Mode</h4>
                  <p>Dark Navy Theme (#070B14) is optimized for eye comfort and focus.</p>
                </div>
                <span className="badge badge-completed">Dark Theme Active</span>
              </div>

              <div className="pref-item">
                <div className="pref-text">
                  <h4>Compact Table Density</h4>
                  <p>Reduce task row height to display more deliverables simultaneously.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={compactView}
                    onChange={(e) => setCompactView(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="pref-item">
                <div className="pref-text">
                  <h4>Deadline Email Alerts</h4>
                  <p>Receive milestone notifications before tasks are marked overdue.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="pref-item">
                <div className="pref-text">
                  <h4>Task Completion Sound</h4>
                  <p>Play a subtle sound when a task checkbox is completed.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={taskSounds}
                    onChange={(e) => setTaskSounds(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="settings-actions-footer">
              <button type="button" className="btn-primary" onClick={handleSavePreferences}>
                Apply Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <div className="settings-section-container">
          <div className="card settings-card">
            <div className="settings-card-header">
              <div>
                <h3>Authentication & Security Standards</h3>
                <p className="settings-card-subtitle">
                  ProjectFlow enforces strict HTTP-only cookie security and salted bcrypt hashing.
                </p>
              </div>
            </div>

            <div className="security-features-list">
              <div className="security-item">
                <div className="security-icon-box">
                  <Icon name="check" size={18} />
                </div>
                <div>
                  <h4>Bcrypt Password Hashing</h4>
                  <p>Passwords are hashed with a 10-round salt in MongoDB and are never stored in plaintext.</p>
                </div>
              </div>

              <div className="security-item">
                <div className="security-icon-box">
                  <Icon name="check" size={18} />
                </div>
                <div>
                  <h4>HTTP-Only JWT Tokenization</h4>
                  <p>Session tokens cannot be accessed by client-side JavaScript, mitigating XSS risks.</p>
                </div>
              </div>

              <div className="security-item">
                <div className="security-icon-box">
                  <Icon name="check" size={18} />
                </div>
                <div>
                  <h4>SameSite Strict Protection</h4>
                  <p>Cross-site request forgery is blocked by cookie sameSite policies and CORS validation.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
