/**
 * Admin National Dashboard — India-wide view with commercial analytics & GIS telemetry.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import MapView from '../../components/MapView';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState({ points: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dashData, heatData] = await Promise.all([
        api.getDashboard(),
        api.getHeatmap(),
      ]);
      setStats(dashData);
      setHeatmap(heatData);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '24px' }}>Loading national grid metrics...</p>;
  if (!stats) return <p style={{ color: 'var(--critical)', padding: '24px' }}>Unable to fetch national telemetry.</p>;

  const rescuePieData = [
    { name: 'Human Rescued', value: stats.total_rescued_kg, color: '#0f766e' },
    { name: 'Animal Feed', value: stats.total_animal_recovery_kg, color: '#d97706' },
    { name: 'Biogas / Compost', value: stats.total_biogas_recovery_kg + stats.total_compost_kg, color: '#0284c7' },
    { name: 'Unavoidable Loss', value: stats.total_wasted_kg, color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>National Oversight Dashboard</h2>
          <p className="page-subtitle">Centralized food waste reduction & redistribution monitoring across {stats.states_active?.length || 0} active states</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>🔄 Refresh Telemetry</button>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="card-grid" style={{ marginBottom: '24px' }}>
        <div className="card stat-card rescued">
          <div className="card-title">Food Rescued</div>
          <div className="stat-value">{stats.total_rescued_kg} kg</div>
          <div className="stat-label">National Rescue Rate: {stats.rescue_rate_percent}%</div>
          <div className="stat-icon">♻️</div>
        </div>
        <div className="card stat-card active">
          <div className="card-title">Active Dispatches</div>
          <div className="stat-value">{stats.active_rescues}</div>
          <div className="stat-label">Live transports on road</div>
          <div className="stat-icon">🚚</div>
        </div>
        <div className="card stat-card impact">
          <div className="card-title">Citizens Nourished</div>
          <div className="stat-value">{stats.total_beneficiaries.toLocaleString()}</div>
          <div className="stat-label">Verified meal portions served</div>
          <div className="stat-icon">💚</div>
        </div>
        <div className="card stat-card">
          <div className="card-title">Environmental Offset</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.total_carbon_saved_kg.toLocaleString()} kg</div>
          <div className="stat-label">CO₂ equivalent avoided</div>
          <div className="stat-icon">🌱</div>
        </div>
      </div>

      {/* GIS Map & Food Disposition */}
      <div className="card-grid" style={{ gridTemplateColumns: '2fr 1.1fr', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0 }}>📍 National Surplus & Demand GIS Hub</h4>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Real-time regional node density across India
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
              <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} /> Surplus Nodes
              </span>
              <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f766e', display: 'inline-block' }} /> Demand Hubs
              </span>
            </div>
          </div>
          <MapView
            center={[20.5937, 78.9629]}
            zoom={5}
            heatpoints={heatmap.points}
            height="400px"
          />
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h4 style={{ marginBottom: '4px' }}>Food Disposition Breakdown</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Diversion breakdown by rescue stream
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie 
                data={rescuePieData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={75}
                innerRadius={45}
                paddingAngle={4}
              >
                {rescuePieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
            {rescuePieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', background: d.color, display: 'inline-block' }} />
                  {d.name}
                </span>
                <strong>{d.value} kg</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Network Infrastructure Summary */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f5f3ff', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            🏢
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem' }}>{stats.total_institutions}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Registered Donor Facilities</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            🤝
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem' }}>{stats.total_receivers}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Verified NGO & Shelter Hubs</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            🗺️
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.4rem' }}>{stats.states_active?.length || 0}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Active State Jurisdictions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
