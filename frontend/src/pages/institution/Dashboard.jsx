/**
 * Institution Dashboard — overview of active batches, rescue clocks, and stats.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import RescueClock from '../../components/RescueClock';
import StatusBadge from '../../components/StatusBadge';
import { getFoodImage } from '../../utils/imageHelper';

export default function InstitutionDashboard() {
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const inst = await api.getMyInstitution();
      setInstitution(inst);
      const [batchData, statsData] = await Promise.all([
        api.listFoodBatches(),
        api.getInstitutionStats(inst.id),
      ]);
      setBatches(batchData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    }
  };

  const activeBatches = batches.filter(b => !['completed', 'wasted'].includes(b.status));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Institution Dashboard</h2>
          <p className="page-subtitle">{institution?.name || 'Loading...'} — {institution?.city}, {institution?.state}</p>
        </div>
        <button className="btn btn-primary" onClick={async () => {
          try { await api.runAllocation(); loadData(); } catch(e) { alert(e.message); }
        }}>
          🤖 Run AI Allocation
        </button>
      </div>

      {error && <div style={{ padding: '12px', background: 'var(--critical-bg)', borderRadius: '8px', color: 'var(--critical)', marginBottom: '16px' }}>{error}</div>}

      {stats && (
        <div className="card-grid" style={{ marginBottom: '32px' }}>
          <div className="card stat-card rescued">
            <div className="card-title">Food Rescued</div>
            <div className="stat-value">{stats.total_rescued_kg} kg</div>
            <div className="stat-label">Rescue Rate: {stats.rescue_rate}%</div>
            <div className="stat-icon">♻️</div>
          </div>
          <div className="card stat-card wasted">
            <div className="card-title">Food Wasted</div>
            <div className="stat-value">{stats.total_wasted_kg} kg</div>
            <div className="stat-label">{stats.total_batches} total batches</div>
            <div className="stat-icon">🗑️</div>
          </div>
          <div className="card stat-card active">
            <div className="card-title">Active Batches</div>
            <div className="stat-value">{activeBatches.length}</div>
            <div className="stat-label">Awaiting allocation</div>
            <div className="stat-icon">📦</div>
          </div>
          <div className="card stat-card impact">
            <div className="card-title">Lives Impacted</div>
            <div className="stat-value">{stats.total_beneficiaries}</div>
            <div className="stat-label">{stats.total_carbon_saved_kg} kg CO₂ saved</div>
            <div className="stat-icon">💚</div>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '16px' }}>Active Food Batches & Rescue Clocks</h3>
      {activeBatches.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🍱</div>
          <p>No active food batches. Register surplus food to start rescuing!</p>
        </div>
      ) : (
        <div className="card-grid">
          {activeBatches.map((batch) => (
            <div key={batch.id} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '16px' }}>
              <img 
                src={getFoodImage(batch.food_type, batch.image_path)} 
                alt={batch.food_type}
                style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize' }}>{batch.food_type}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{batch.quantity_kg} kg</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {batch.description}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge status={batch.ai_condition} />
                  {batch.segregation && <StatusBadge status={batch.segregation} />}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <RescueClock availableUntil={batch.available_until} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
