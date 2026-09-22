/**
 * Register Page — Commercial SaaS Registration Portal
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'institution', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const update = (key, val) => setForm({ ...form, [key]: val });

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: 'var(--primary)', 
            color: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '1.4rem', 
            margin: '0 auto 12px',
            boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)' 
          }}>
            🛡️
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Register Facility
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
            Onboard your organization to the National Food Rescue Network
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
            marginBottom: '18px' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name / Authorized Officer</label>
            <input 
              type="text" 
              className="form-input" 
              value={form.full_name} 
              onChange={(e) => update('full_name', e.target.value)} 
              placeholder="e.g. Rajiv Sharma" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={form.email} 
              onChange={(e) => update('email', e.target.value)} 
              placeholder="name@canteen.gov.in" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={form.password} 
              onChange={(e) => update('password', e.target.value)} 
              placeholder="Minimum 8 characters" 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Organization Type</label>
              <select className="form-select" value={form.role} onChange={(e) => update('role', e.target.value)}>
                <option value="institution">Donor (Canteen, Hotel, University)</option>
                <option value="receiver">Receiver (NGO, Food Bank, Gaushala)</option>
                <option value="admin">Civil Supplies Oversight</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input 
                type="tel" 
                className="form-input" 
                value={form.phone} 
                onChange={(e) => update('phone', e.target.value)} 
                placeholder="+91 98100 10001" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '11px', fontSize: '0.95rem', marginTop: '6px' }} 
            disabled={loading}
          >
            {loading ? 'Registering Facility...' : 'Complete Facility Onboarding'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have credentials? <Link to="/login" style={{ fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
