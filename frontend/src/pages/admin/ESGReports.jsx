/**
 * Admin ESG Reports — Aggregated Environmental, Social & Governance impact report.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ESGReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getESGReport().then(setReport).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '24px' }}>Compiling ESG metrics...</p>;
  if (!report) return <p style={{ color: 'var(--critical)' }}>Failed to load ESG report.</p>;

  const impactData = [
    { metric: 'CO₂ Avoided', value: report.total_carbon_saved_kg, unit: 'kg' },
    { metric: 'Water Conserved', value: report.total_water_saved_liters / 1000, unit: 'kL' },
    { metric: 'Energy Saved', value: report.total_energy_saved_kwh || 0, unit: 'kWh' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>ESG & Sustainability Impact Certification</h2>
          <p className="page-subtitle">Audited environmental offsets, citizen nutrition delivery & circular economy metrics</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
          📄 Export / Print Audit Report
        </button>
      </div>

      <div className="card-grid" style={{ marginBottom: '24px' }}>
        <div className="card stat-card rescued">
          <div className="card-title">Net Food Rescued</div>
          <div className="stat-value">{report.total_rescued_kg} kg</div>
          <div className="stat-label">{report.rescue_count} verified dispatches</div>
          <div className="stat-icon">♻️</div>
        </div>
        <div className="card stat-card impact">
          <div className="card-title">Nutrition Portions</div>
          <div className="stat-value">{report.total_beneficiaries.toLocaleString()}</div>
          <div className="stat-label">Citizens served via NGOs</div>
          <div className="stat-icon">👥</div>
        </div>
        <div className="card stat-card active">
          <div className="card-title">Landfill Diversion</div>
          <div className="stat-value">{report.total_recovery_kg} kg</div>
          <div className="stat-label">Re-routed to animal & bio streams</div>
          <div className="stat-icon">🐾</div>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1.2fr 1fr', marginBottom: '24px' }}>
        <div className="card">
          <h4 style={{ marginBottom: '16px' }}>Environmental Savings Metrics</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={impactData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
                formatter={(val, name, props) => [`${val.toFixed(1)} ${props.payload.unit}`, props.payload.metric]}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '16px' }}>Resource Circularity Metrics</h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>⚡ Biogas Clean Energy</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{report.total_biogas_kwh} kWh</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>🌱 Organic Compost</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--safe-text)' }}>{report.total_compost_kg} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>💧 Clean Water Conserved</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>{report.total_water_saved_liters.toLocaleString()} L</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>🌍 Net Carbon Avoided</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--safe-text)' }}>{report.total_carbon_saved_kg} kg CO₂</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Statutory Compliance & Audit Note:</strong> This digital impact statement is computed using life-cycle assessment (LCA) methodologies aligned with national civil supplies protocols and FSSAI surplus donation standards. Carbon offset computations adhere to standard greenhouse gas emission factors (2.5 kg CO₂e / kg food preserved).
        </div>
      </div>
    </div>
  );
}
