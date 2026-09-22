/**
 * Receiver Dashboard — incoming allocations, capacity meter, availability toggle.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { getFoodImage } from '../../utils/imageHelper';

export default function ReceiverDashboard() {
  const [receiver, setReceiver] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const recv = await api.getMyReceiver();
      setReceiver(recv);
      const allocs = await api.listAllocations();
      setAllocations(allocs);
    } catch (e) { setError(e.message); }
  };

  const toggleAvailability = async () => {
    if (!receiver) return;
    try {
      await api.updateReceiver(receiver.id, { is_available: !receiver.is_available });
      setReceiver({ ...receiver, is_available: !receiver.is_available });
    } catch (e) { alert(e.message); }
  };

  const pending = allocations.filter(a => a.status === 'pending');
  const active = allocations.filter(a => ['accepted', 'in_transit'].includes(a.status));
  const completed = allocations.filter(a => a.status === 'delivered');

  const capacityPct = receiver ? Math.min(100, (receiver.current_demand_kg / receiver.capacity_kg) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Receiver Dashboard</h2>
          <p className="page-subtitle">{receiver?.name || 'Loading...'} — {receiver?.city}, {receiver?.state}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Available</span>
          <div className={`toggle ${receiver?.is_available ? 'active' : ''}`} onClick={toggleAvailability} />
        </div>
      </div>

      {error && <div style={{ padding: '12px', background: 'var(--critical-bg)', borderRadius: '8px', color: 'var(--critical)', marginBottom: '16px' }}>{error}</div>}

      <div className="card-grid" style={{ marginBottom: '32px' }}>
        <div className="card stat-card active">
          <div className="card-title">Pending Allocations</div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-label">Awaiting your response</div>
          <div className="stat-icon">📦</div>
        </div>
        <div className="card stat-card rescued">
          <div className="card-title">In Progress</div>
          <div className="stat-value">{active.length}</div>
          <div className="stat-label">Accepted or in transit</div>
          <div className="stat-icon">🚚</div>
        </div>
        <div className="card stat-card impact">
          <div className="card-title">Received</div>
          <div className="stat-value">{completed.length}</div>
          <div className="stat-label">Successfully delivered</div>
          <div className="stat-icon">✅</div>
        </div>
        <div className="card">
          <div className="card-title">Capacity</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', margin: '8px 0' }}>
            {receiver?.current_demand_kg || 0} / {receiver?.capacity_kg || 0} kg
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${capacityPct}%` }} />
          </div>
          <div className="stat-label" style={{ marginTop: '6px' }}>{capacityPct.toFixed(0)}% demand filled</div>
        </div>
      </div>

      {pending.length > 0 && (
        <>
          <h3 style={{ marginBottom: '16px' }}>⚡ Incoming Allocations — Action Required</h3>
          <div style={{ display: 'grid', gap: '14px', marginBottom: '32px' }}>
            {pending.map(a => (
              <div 
                key={a.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  borderLeft: `4px solid ${a.rescue_color || 'var(--primary)'}`, 
                  flexWrap: 'wrap', 
                  padding: '16px' 
                }}
              >
                <img 
                  src={getFoodImage(a.food_type, a.image_path)} 
                  alt={a.food_type} 
                  style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} 
                />
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize' }}>
                      {a.food_type} — {a.quantity_kg} kg
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '3px 10px', 
                      background: (a.rescue_color || '#f59e0b') + '25', 
                      color: a.rescue_color || '#f59e0b', 
                      borderRadius: '12px', 
                      fontWeight: 700 
                    }}>
                      ⏱️ {a.rescue_status?.toUpperCase()} ({Math.round(a.rescue_remaining_min)}m left)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0' }}>
                    Donor: <strong>{a.institution_name}</strong> • {a.distance_km} km away • Travel: ~{a.estimated_travel_min} mins
                  </div>
                  {a.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{a.description}"
                    </div>
                  )}
                  {a.ai_condition && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                      <StatusBadge status={a.ai_condition} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        AI Match Score: <strong>{a.priority_score}%</strong>
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button 
                    className="btn btn-accent btn-sm" 
                    style={{ padding: '8px 16px', fontWeight: 600 }}
                    onClick={async () => { await api.acceptAllocation(a.id); loadData(); }}
                  >
                    ✅ Accept Surplus
                  </button>
                  <button 
                    className="btn btn-danger btn-sm" 
                    style={{ padding: '8px 14px' }}
                    onClick={async () => { await api.rejectAllocation(a.id); loadData(); }}
                  >
                    ❌ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {active.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>🚚 Allocations In Progress ({active.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {active.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px' }}>
                <img 
                  src={getFoodImage(a.food_type, a.image_path)} 
                  alt={a.food_type} 
                  style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.food_type} — {a.quantity_kg} kg</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From: {a.institution_name}</div>
                  <div style={{ marginTop: '4px' }}><StatusBadge status={a.status} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
