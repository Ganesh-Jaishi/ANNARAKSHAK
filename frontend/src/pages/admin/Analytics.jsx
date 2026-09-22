/**
 * Admin Analytics — AI-powered demand/surplus forecasting & waste hotspot identification.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Analytics() {
  const [predictions, setPredictions] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPredictions(),
      api.getWasteHotspots(),
    ]).then(([pred, hs]) => {
      setPredictions(pred);
      setHotspots(hs.hotspots || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '24px' }}>Running predictive intelligence models...</p>;

  const surplusData = predictions?.institutions?.map(i => ({
    name: i.name?.substring(0, 16),
    surplus: i.predicted_surplus_kg,
    risk: i.risk_score * 100,
  })) || [];

  const demandData = predictions?.receivers?.map(r => ({
    name: r.name?.substring(0, 16),
    demand: r.predicted_demand_kg,
  })) || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Predictive Intelligence & Waste Hotspots</h2>
          <p className="page-subtitle">AI surplus forecasting, receiver meal demand estimates & high-risk leak audits</p>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '24px' }}>
        <div className="card">
          <h4 style={{ marginBottom: '4px' }}>Predicted Surplus by Donor Facility</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Next 24h expected commercial excess</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={surplusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} 
              />
              <Bar dataKey="surplus" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Predicted Surplus (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4 style={{ marginBottom: '4px' }}>Predicted Intake Capacity by Partner</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Upcoming meal demand requirements</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} angle={-15} textAnchor="end" height={50} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border)' }} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }} 
              />
              <Bar dataKey="demand" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Predicted Demand (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: '4px' }}>Waste Hotspot Vulnerability Index</h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Facilities showing high loss ratios requiring intervention</p>
        
        {hotspots.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No waste hotspot records flagged currently.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Location</th>
                  <th>Total Registered</th>
                  <th>Recorded Waste</th>
                  <th>Loss Rate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</td>
                    <td>{h.city}, {h.state}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{h.total_kg} kg</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--critical-text)' }}>{h.wasted_kg} kg</td>
                    <td>
                      <span className={`status-badge ${h.waste_rate > 30 ? 'status-critical' : h.waste_rate > 15 ? 'status-urgent' : 'status-safe'}`}>
                        <span className="dot" />
                        <span>{h.waste_rate}%</span>
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Audit Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
