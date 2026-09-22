/**
 * Receiver History — past deliveries, quantities, ESG contribution, with food images.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { getFoodImage } from '../../utils/imageHelper';

export default function ReceiverHistory() {
  const [history, setHistory] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const recv = await api.getMyReceiver();
      setReceiver(recv);
      const data = await api.getReceiverHistory(recv.id);
      setHistory(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const totalQty = history?.deliveries?.reduce((s, d) => s + d.quantity_kg, 0) || 0;
  const totalBeneficiaries = history?.deliveries?.reduce((s, d) => s + d.beneficiaries, 0) || 0;
  const totalCarbon = history?.deliveries?.reduce((s, d) => s + d.carbon_saved_kg, 0) || 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Delivery & Consumption History</h2>
          <p className="page-subtitle">{receiver?.name} — {receiver?.city}, {receiver?.state}</p>
        </div>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading records...</p> : (
        <>
          <div className="card-grid" style={{ marginBottom: '24px' }}>
            <div className="card stat-card rescued">
              <div className="card-title">Total Received</div>
              <div className="stat-value">{totalQty.toFixed(1)} kg</div>
              <div className="stat-label">{history?.total_count || 0} completed rescues</div>
            </div>
            <div className="card stat-card impact">
              <div className="card-title">Beneficiaries Served</div>
              <div className="stat-value">{totalBeneficiaries}</div>
              <div className="stat-label">Nourishing meals served</div>
            </div>
            <div className="card stat-card active">
              <div className="card-title">Carbon Avoided</div>
              <div className="stat-value">{totalCarbon.toFixed(1)} kg</div>
              <div className="stat-label">CO₂ equivalent mitigated</div>
            </div>
          </div>

          {(!history?.deliveries || history.deliveries.length === 0) ? (
            <div className="card empty-state">
              <div className="empty-icon">📋</div>
              <p>No delivery history yet. Accept allocations to start receiving food.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Date</th>
                    <th>Quantity</th>
                    <th>Beneficiaries</th>
                    <th>Carbon Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {history.deliveries.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={getFoodImage(d.food_type)} 
                            alt={d.food_type} 
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                          />
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{d.food_type}</span>
                        </div>
                      </td>
                      <td>{d.delivered_at ? new Date(d.delivered_at).toLocaleDateString() : 'Today'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{d.quantity_kg} kg</td>
                      <td>{d.beneficiaries} persons</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{d.carbon_saved_kg} kg CO₂</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
