/**
 * Landing Page — Commercial SaaS Presentation for ANNARAKSHAK
 */
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const FLOW_STEPS = [
  { step: 'Detect', desc: 'Surplus food identified', icon: '🔍' },
  { step: 'Assess', desc: 'AI visual freshness check', icon: '🤖' },
  { step: 'Segregate', desc: 'Human / Animal / Bio', icon: '🔀' },
  { step: 'Prioritize', desc: 'Rescue clock countdown', icon: '⏱️' },
  { step: 'Allocate', desc: 'Multi-factor partner match', icon: '🎯' },
  { step: 'Route', desc: 'Optimal driver dispatch', icon: '🗺️' },
  { step: 'Deliver', desc: 'Live GPS tracked transit', icon: '🚚' },
  { step: 'Confirm', desc: 'Handover verification', icon: '✅' },
  { step: 'Measure', desc: 'ESG & CO₂ calculation', icon: '📊' },
  { step: 'Prevent', desc: 'Surplus forecast AI', icon: '🧠' },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Top Navigation */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 48px', 
        background: 'var(--bg-surface)', 
        borderBottom: '1px solid var(--border)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '34px', 
            height: '34px', 
            borderRadius: '8px', 
            background: 'var(--primary)', 
            color: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 800 
          }}>
            🛡️
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            ANNARAKSHAK
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <ThemeToggle />
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register Facility</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="landing-hero">
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '4px 14px', 
          borderRadius: '9999px', 
          background: 'var(--primary-light)', 
          border: '1px solid var(--primary-border)',
          color: 'var(--primary)',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: '20px'
        }}>
          <span>🇮🇳 Government & Commercial Food Security Network</span>
        </div>

        <h1>
          India's Centralized AI Food Rescue & Redistribution Network
        </h1>
        <p className="hero-tagline">
          Connecting institution surplus from canteens, hotels, and banquet facilities with verified hunger-relief partners — within the safe deterioration window.
        </p>

        <div className="hero-buttons">
          <Link to="/login" className="btn btn-primary btn-lg" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
            Open Platform Portal →
          </Link>
          <Link to="/register" className="btn btn-secondary btn-lg" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            Register Institution
          </Link>
        </div>

        {/* National Stats Grid */}
        <div className="landing-stats">
          <div className="landing-stat">
            <div className="stat-number">68M+</div>
            <div className="stat-desc">Tonnes Food Lost Annually</div>
          </div>
          <div className="landing-stat">
            <div className="stat-number">190M</div>
            <div className="stat-desc">Citizens Requiring Nutrition</div>
          </div>
          <div className="landing-stat">
            <div className="stat-number">₹92,000 Cr</div>
            <div className="stat-desc">Annual Economic Impact</div>
          </div>
          <div className="landing-stat">
            <div className="stat-number">8.6%</div>
            <div className="stat-desc">Global GHG Contribution</div>
          </div>
        </div>
      </div>

      {/* Flow Section */}
      <div className="flow-section">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>The 10-Step Rescue Lifecycle</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Automated intelligence from camera detection to ESG certification</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', 
          gap: '14px' 
        }}>
          {FLOW_STEPS.map((item, i) => (
            <div 
              key={i} 
              className="card" 
              style={{ 
                padding: '16px', 
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  0{i + 1}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
                {item.step}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Core Roles Section */}
      <div className="flow-section" style={{ paddingBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Three Unified Interfaces</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Streamlined workflows for institutions, charities, and oversight bodies</p>
        </div>

        <div className="card-grid" style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              background: 'var(--bg-subtle)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              marginBottom: '16px' 
            }}>
              🏢
            </div>
            <h4>Donor Institution</h4>
            <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              Canteens, universities, hotels, and banquet caterers log surplus food batches, inspect AI condition ratings, and verify dispatches.
            </p>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
              • Zero-hardware camera inspection<br />
              • Food segregation selector<br />
              • Waste fingerprint audit
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              background: 'var(--bg-subtle)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              marginBottom: '16px' 
            }}>
              🤝
            </div>
            <h4>Redistribution Partner</h4>
            <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              NGOs, shelters, community kitchens, and animal rescue facilities receive high-priority matches, accept shipments, and track arrivals.
            </p>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
              • 1-click accept / decline<br />
              • Real-time driver telemetry<br />
              • Capacity intake tracker
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '10px', 
              background: 'var(--bg-subtle)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              marginBottom: '16px' 
            }}>
              🏛️
            </div>
            <h4>Ministry & Oversight</h4>
            <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              High-level administrative oversight for civil supplies, municipal corporations, and ESG certification auditors.
            </p>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
              • India-wide GIS heatmap<br />
              • Institution compliance audits<br />
              • Carbon & water savings reports
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)'
      }}>
        Copyright © 2026 Team DireWolf. All rights reserved.
      </footer>
    </div>
  );
}
