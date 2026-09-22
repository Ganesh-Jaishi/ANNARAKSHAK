/**
 * Admin Heat Map — Dedicated national surplus and demand GIS visualization.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import MapView from '../../components/MapView';

export default function HeatMap() {
  const [heatmap, setHeatmap] = useState({ points: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHeatmap().then(setHeatmap).catch(console.error).finally(() => setLoading(false));
  }, []);

  const surplusPoints = heatmap.points.filter(p => p.type === 'surplus');
  const demandPoints = heatmap.points.filter(p => p.type === 'demand');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>National GIS Heat Map</h2>
          <p className="page-subtitle">{surplusPoints.length} commercial surplus generation points • {demandPoints.length} verified receiver demand clusters</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>National Geo-Distribution Layer</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} /> Surplus Hotspots
            </span>
            <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0f766e', display: 'inline-block' }} /> Demand Clusters
            </span>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>Loading GIS coordinates...</p>
        ) : (
          <MapView
            center={[20.5937, 78.9629]}
            zoom={5}
            heatpoints={heatmap.points}
            height="560px"
          />
        )}
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h4 style={{ color: '#ea580c', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔶 Surplus Hotspots ({surplusPoints.length})</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {surplusPoints.map((p, i) => (
              <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '0.825rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Coordinates: {p.lat.toFixed(4)}, {p.lng.toFixed(4)} • Relative Volume: {(p.intensity * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h4 style={{ color: 'var(--primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🟢 Demand Hubs ({demandPoints.length})</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {demandPoints.map((p, i) => (
              <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '0.825rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Coordinates: {p.lat.toFixed(4)}, {p.lng.toFixed(4)} • Intake Capacity: {(p.intensity * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
