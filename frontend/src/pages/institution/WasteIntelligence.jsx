/**
 * Waste Intelligence — Waste Fingerprint visualization and AI reduction recommendations.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#0f766e', '#ea580c', '#0284c7', '#8b5cf6'];

export default function WasteIntelligence() {
  const [fingerprint, setFingerprint] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const inst = await api.getMyInstitution();
      setInstitution(inst);
      const fp = await api.getWasteFingerprint(inst.id);
      setFingerprint(fp);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>;
  if (!fingerprint?.has_data) return (
    <div className="fade-in">
      <h2>Waste Intelligence</h2>
      <div className="card empty-state" style={{ marginTop: '24px' }}>
        <div className="empty-icon">📉</div>
        <p>No operational waste logged yet. Data logged during meal cycles will populate your facility Waste Fingerprint.</p>
      </div>
    </div>
  );

  const pieData = Object.entries(fingerprint.breakdown_percent).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: parseFloat(value),
  }));

  const barData = [
    { name: 'Overproduction', kg: fingerprint.totals.overproduction_kg },
    { name: 'Raw Material', kg: fingerprint.totals.raw_material_loss_kg },
    { name: 'Spoilage', kg: fingerprint.totals.spoilage_kg },
    { name: 'Storage Loss', kg: fingerprint.totals.storage_loss_kg },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Waste Fingerprint & Loss Analytics</h2>
          <p className="page-subtitle">Granular root-cause analysis for {institution?.name}</p>
        </div>
        <div>
          <span className={`status-badge ${fingerprint.trend === 'improving' ? 'status-safe' : 'status-urgent'}`}>
            <span className="dot" />
            <span>Trend: {fingerprint.trend?.toUpperCase()} ({fingerprint.trend_change_pct > 0 ? '+' : ''}{fingerprint.trend_change_pct}%)</span>
          </span>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '24px' }}>
        <div className="card">
          <h4 style={{ marginBottom: '16px' }}>Waste Distribution (%)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name} ${value}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.25rem' }}>{fingerprint.total_waste_kg} kg</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>cumulative recorded loss</span>
          </div>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '16px' }}>Loss Breakdown by Category (kg)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} 
              />
              <Bar dataKey="kg" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Primary Loss Driver: <strong style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{fingerprint.top_loss_source?.replace('_', ' ')}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: '12px' }}>💡 AI Operational Recommendations</h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          {(fingerprint.recommendations || []).map((rec, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '12px 14px', 
                background: 'var(--bg-subtle)', 
                borderRadius: '8px', 
                borderLeft: '3px solid var(--primary)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              {rec}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
