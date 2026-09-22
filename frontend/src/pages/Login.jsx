/**
 * Login Page — Commercial SaaS Authentication UI
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const demoLogins = [
    { label: '🏢 Central Govt Canteen (Donor)', email: 'delhi.canteen@demo.in', role: 'Institution' },
    { label: '🤝 Akshaya Patra Delhi (Receiver)', email: 'ngo.delhi@demo.in', role: 'NGO / Food Bank' },
    { label: '🏛️ Dr. Arun Kumar (Admin)', email: 'admin@annarakshak.in', role: 'National Admin' },
  ];

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 14px',
            boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
          }}>
            🛡️
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ANNARAKSHAK
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            National Food Rescue & Redistribution Portal
          </p>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--critical-bg)',
            border: '1px solid var(--critical-border)',
            borderRadius: '8px',
            color: 'var(--critical-text)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@canteen.gov.in"
              required
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <span style={{ fontSize: '0.78rem', color: 'var(--primary)', cursor: 'pointer' }}>Forgot password?</span>
            </div>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '0.95rem', marginTop: '6px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Demo Roles Quick Switcher */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Role Accounts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {demoLogins.map((d) => (
              <button
                key={d.email}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-strong)'
                }}
                onClick={() => { setEmail(d.email); setPassword('demo123'); }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)' }}>{d.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Need new facility credentials? <Link to="/register" style={{ fontWeight: 600 }}>Register Institution</Link>
        </p>
      </div>
    </div>
  );
}
