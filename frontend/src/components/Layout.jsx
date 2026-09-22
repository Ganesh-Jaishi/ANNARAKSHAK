/**
 * App Layout with professional sidebar and top navigation header.
 * Commercial SaaS UI/UX with role-based routing and status telemetry.
 */
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = {
  institution: [
    { path: '/institution', icon: '📊', label: 'Dashboard' },
    { path: '/institution/register-food', icon: '🍱', label: 'Register Food' },
    { path: '/institution/allocations', icon: '🤖', label: 'AI Allocations' },
    { path: '/institution/track', icon: '🚚', label: 'Track Delivery' },
    { path: '/institution/waste', icon: '📉', label: 'Waste Intelligence' },
  ],
  receiver: [
    { path: '/receiver', icon: '📊', label: 'Dashboard' },
    { path: '/receiver/allocations', icon: '📦', label: 'Incoming Food' },
    { path: '/receiver/track', icon: '🚚', label: 'Track Delivery' },
    { path: '/receiver/history', icon: '📋', label: 'History' },
  ],
  admin: [
    { path: '/admin', icon: '🇮🇳', label: 'National Dashboard' },
    { path: '/admin/heatmap', icon: '🗺️', label: 'Heat Map' },
    { path: '/admin/institutions', icon: '🏢', label: 'Institutions' },
    { path: '/admin/analytics', icon: '📊', label: 'Analytics' },
    { path: '/admin/esg', icon: '🌱', label: 'ESG Reports' },
  ],
};

const ROLE_LABELS = {
  institution: 'Donor Institution',
  receiver: 'Redistribution Partner',
  admin: 'Ministry & Governance',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = NAV_ITEMS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get current active section name for topbar breadcrumbs
  const currentItem = items.find(i =>
    i.path === location.pathname || (i.path !== `/${user?.role}` && location.pathname.startsWith(i.path))
  ) || { label: 'Overview' };

  // Initials for avatar
  const initials = (user?.full_name || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🛡️</div>
          <div>
            <h1>ANNARAKSHAK</h1>
            <div className="logo-subtitle">National Food Network</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div style={{ padding: '0 8px', marginBottom: '8px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Navigation
          </div>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${user?.role}`}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="topbar-breadcrumbs">
            <span>ANNARAKSHAK</span>
            <span>/</span>
            <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            <span>/</span>
            <strong>{currentItem.label}</strong>
          </div>

          <div className="topbar-actions">
            <div className="system-pill">
              <span className="dot" />
              <span>AI Dispatch Engine Online</span>
            </div>

            <ThemeToggle />

            <div className="user-profile-pill">

              <span className={`badge ${user?.role}`} style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <Outlet />

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '24px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          borderTop: '1px solid var(--border)',
          marginTop: 'auto'
        }}>
          Copyright © 2026 Team DireWolf. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
