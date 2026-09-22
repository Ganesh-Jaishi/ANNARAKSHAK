/**
 * Receiver Allocations — detailed view of all allocations with real food images,
 * AI match scores, and accept/reject controls.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { getFoodImage } from '../../utils/imageHelper';

export default function ReceiverAllocations() {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const data = await api.listAllocations();
      setAllocations(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'accept') await api.acceptAllocation(id);
      else if (action === 'reject') await api.rejectAllocation(id);
      else if (action === 'confirm') await api.confirmDelivery(id);
      load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Incoming Food Allocations</h2>
          <p className="page-subtitle">Inspect food photos, check AI freshness ratings and accept surplus matches</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading incoming allocations...</p>
      ) : allocations.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📦</div>
          <p>No allocations assigned to your facility yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {allocations.map(a => (
            <div key={a.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <img 
                  src={getFoodImage(a.food_type, a.image_path)} 
                  alt={a.food_type} 
                  style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} 
                />
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.15rem' }}>
                      {a.food_type} — {a.quantity_kg} kg
                    </h4>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.description && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', fontStyle: 'italic' }}>
                      "{a.description}"
                    </div>
                  )}
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '4px' }}>
                    <div>🏢 <strong>{a.institution_name}</strong></div>
                    <div>📍 Distance: <strong>{a.distance_km} km</strong> (~{a.estimated_travel_min}m)</div>
                    <div>🚗 Driver: <strong>{a.assigned_driver}</strong> ({a.vehicle_type})</div>
                    <div>📊 Match Score: <strong>{a.priority_score}%</strong></div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                  {a.status === 'pending' && (
                    <>
                      <button className="btn btn-accent btn-sm" style={{ padding: '8px 16px', fontWeight: 600 }} onClick={() => handleAction(a.id, 'accept')}>
                        ✅ Accept Delivery
                      </button>
                      <button className="btn btn-danger btn-sm" style={{ padding: '8px 14px' }} onClick={() => handleAction(a.id, 'reject')}>
                        ❌ Decline
                      </button>
                    </>
                  )}
                  {a.status === 'in_transit' && (
                    <button className="btn btn-accent btn-sm" style={{ padding: '8px 16px', fontWeight: 600 }} onClick={() => handleAction(a.id, 'confirm')}>
                      ✅ Confirm Food Received
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
