/**
 * Institution Allocations — view AI-generated allocations with real food images and confirm handover.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { getFoodImage } from '../../utils/imageHelper';

export default function InstitutionAllocations() {
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

  const handleConfirmHandover = async (id) => {
    try {
      await api.confirmHandover(id);
      load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>AI Food Allocations</h2>
          <p className="page-subtitle">View automated AI matching, real food condition & confirm transport dispatch</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading allocations...</p>
      ) : allocations.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🤖</div>
          <p>No allocations yet. Register and segregate food, then run AI Allocation.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {allocations.map((a) => (
            <div 
              key={a.id} 
              className="card" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                flexWrap: 'wrap', 
                padding: '16px',
                borderLeft: `4px solid ${a.rescue_color || 'var(--primary)'}`,
              }}
            >
              <img 
                src={getFoodImage(a.food_type, a.image_path)} 
                alt={a.food_type || 'Food'} 
                style={{ width: '74px', height: '74px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} 
              />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize', marginBottom: '2px' }}>
                  {a.food_type} → {a.receiver_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <strong>{a.quantity_kg} kg</strong> • Distance: {a.distance_km} km • ETA: ~{a.estimated_travel_min} mins
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge status={a.status} />
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: a.rescue_color + '20', color: a.rescue_color, borderRadius: '12px', fontWeight: 600 }}>
                    {a.rescue_status?.toUpperCase()} • {Math.round(a.rescue_remaining_min)}m left
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Match Score: {a.priority_score}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  🚗 {a.assigned_driver} ({a.vehicle_type})
                </div>
                {a.status === 'accepted' && (
                  <button className="btn btn-accent btn-sm" onClick={() => handleConfirmHandover(a.id)}>
                    ✅ Confirm Handover to Driver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
