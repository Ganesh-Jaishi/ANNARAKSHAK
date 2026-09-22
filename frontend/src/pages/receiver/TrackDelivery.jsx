/**
 * Receiver Track Delivery — Live interactive map with route tracking, real food images,
 * driver telemetry HUD, and confirm delivery receipt.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import MapView from '../../components/MapView';
import StatusBadge from '../../components/StatusBadge';
import { getFoodImage } from '../../utils/imageHelper';

export default function ReceiverTrackDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [tick, setTick] = useState(0);

  const fetchDeliveries = () => {
    api.getDeliveries()
      .then((data) => {
        setDeliveries(data);
        if (data.length > 0 && !selectedId) {
          const active = data.find(d => d.status !== 'delivered');
          setSelectedId(active ? active.id : data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Subtle live pulse ticker for in-transit simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => (t + 1) % 100);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const selectedDelivery = deliveries.find(d => d.id === selectedId) || deliveries[0];

  const handleConfirmReceipt = async (deliveryId) => {
    setConfirming(true);
    try {
      if (selectedDelivery?.allocation_id) {
        await api.confirmDelivery(selectedDelivery.allocation_id);
      }
      await fetchDeliveries();
      alert('Delivery confirmed! Food logged into inventory and impact calculated.');
    } catch (err) {
      alert(err.message || 'Error confirming receipt');
    } finally {
      setConfirming(false);
    }
  };

  // Parse route points for selected delivery
  const selectedRoutePoints = (() => {
    if (!selectedDelivery || !selectedDelivery.route_polyline) return [];
    try {
      return JSON.parse(selectedDelivery.route_polyline);
    } catch {
      return [];
    }
  })();

  // Generate markers for the map
  const mapMarkers = (() => {
    if (!selectedDelivery) return [];
    const markers = [];

    // Pickup marker (Institution)
    if (selectedDelivery.pickup_lat && selectedDelivery.pickup_lng) {
      markers.push({
        lat: selectedDelivery.pickup_lat,
        lng: selectedDelivery.pickup_lng,
        type: 'institution',
        label: selectedDelivery.institution_name || 'Donor Institution',
        badge: 'PICKUP ORIGIN',
        sublabel: selectedDelivery.pickup_address,
        meta: selectedDelivery.pickup_time ? `Dispatched at ${new Date(selectedDelivery.pickup_time).toLocaleTimeString()}` : 'Awaiting dispatch',
      });
    }

    // Delivery dropoff marker (Receiver)
    if (selectedDelivery.delivery_lat && selectedDelivery.delivery_lng) {
      markers.push({
        lat: selectedDelivery.delivery_lat,
        lng: selectedDelivery.delivery_lng,
        type: selectedDelivery.status === 'delivered' ? 'delivered' : 'receiver',
        label: selectedDelivery.receiver_name || 'Your Facility',
        badge: 'DROP-OFF DESTINATION',
        sublabel: selectedDelivery.delivery_address,
        meta: selectedDelivery.delivery_time ? `Received: ${new Date(selectedDelivery.delivery_time).toLocaleTimeString()}` : `ETA: ~${selectedDelivery.estimated_travel_min || 15} mins`,
      });
    }

    // In-transit vehicle marker
    if (selectedDelivery.status !== 'delivered' && selectedRoutePoints.length > 0) {
      const midIndex = Math.min(
        selectedRoutePoints.length - 1,
        Math.floor((selectedRoutePoints.length * 0.5) + (tick % 2 === 0 ? 0 : 0.05))
      );
      const vehiclePt = selectedRoutePoints[midIndex] || selectedRoutePoints[0];

      markers.push({
        lat: vehiclePt[0],
        lng: vehiclePt[1],
        type: 'vehicle',
        label: `🚚 Inbound: ${selectedDelivery.driver_name}`,
        badge: 'LIVE ON ROUTE',
        sublabel: `${selectedDelivery.vehicle_type?.toUpperCase()} • Dist: ${selectedDelivery.distance_km} km`,
        meta: `Transporting ${selectedDelivery.quantity_kg}kg ${selectedDelivery.food_type || 'meals'}`,
      });
    }

    return markers;
  })();

  const mapRoutes = selectedRoutePoints.length >= 2 ? [{
    points: selectedRoutePoints,
    color: selectedDelivery?.status === 'delivered' ? '#10b981' : '#f59e0b',
    dashed: selectedDelivery?.status !== 'delivered',
  }] : [];

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered');
  const pastDeliveries = deliveries.filter(d => d.status === 'delivered');

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Incoming Delivery Tracking</h2>
          <p className="page-subtitle">Track incoming food transports in real-time and confirm receipt</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setLoading(true);
              fetchDeliveries();
            }}
          >
            🔄 Refresh GPS
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛰️</div>
          <p style={{ color: 'var(--text-muted)' }}>Locating inbound drivers...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🚚</div>
          <h3>No Active Inbound Shipments</h3>
          <p>When you accept allocated food matches from institutions, real-time tracking will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT: Deliveries List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeDeliveries.length > 0 && (
              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />
                  Inbound Food Deliveries ({activeDeliveries.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeDeliveries.map(d => {
                    const isSelected = d.id === selectedId;
                    const foodImg = getFoodImage(d.food_type, d.image_path);
                    return (
                      <div
                        key={d.id}
                        className="card"
                        onClick={() => setSelectedId(d.id)}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '12px',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--card-bg)',
                          transition: 'all 0.2s ease',
                          transform: isSelected ? 'scale(1.01)' : 'none',
                        }}
                      >
                        <img 
                          src={foodImg} 
                          alt={d.food_type || 'Food'} 
                          style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} 
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{d.food_type || 'Food Batch'}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>{d.quantity_kg} kg</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            From: {d.institution_name}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <StatusBadge status={d.status} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ETA ~{d.estimated_travel_min || 15}m</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>
                Past Received Deliveries ({pastDeliveries.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {pastDeliveries.map(d => {
                  const isSelected = d.id === selectedId;
                  const foodImg = getFoodImage(d.food_type, d.image_path);
                  return (
                    <div
                      key={d.id}
                      className="card"
                      onClick={() => setSelectedId(d.id)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '10px',
                        opacity: isSelected ? 1 : 0.8,
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--card-bg)',
                      }}
                    >
                      <img 
                        src={foodImg} 
                        alt={d.food_type || 'Food'} 
                        style={{ width: '46px', height: '46px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.food_type}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>✅ Received</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {d.quantity_kg} kg • From: {d.institution_name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Selected Inbound HUD & Map */}
          <div>
            {selectedDelivery && (
              <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img 
                    src={getFoodImage(selectedDelivery.food_type, selectedDelivery.image_path)}
                    alt={selectedDelivery.food_type}
                    style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', textTransform: 'capitalize' }}>
                          {selectedDelivery.food_type} — {selectedDelivery.quantity_kg} kg
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Dispatched from: <strong>{selectedDelivery.institution_name}</strong> ({selectedDelivery.pickup_city || 'City'})
                        </p>
                      </div>
                      <StatusBadge status={selectedDelivery.status} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Driver: </span>
                        <strong>{selectedDelivery.driver_name}</strong> ({selectedDelivery.vehicle_type})
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Distance: </span>
                        <strong>{selectedDelivery.distance_km} km</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>ETA: </span>
                        <strong>~{selectedDelivery.estimated_travel_min || 15} mins</strong>
                      </div>
                      <div>
                        <a 
                          href={`tel:${selectedDelivery.driver_phone}`} 
                          style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          📞 Call Driver ({selectedDelivery.driver_phone})
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm receipt action */}
                {selectedDelivery.status !== 'delivered' && (
                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.08)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Driver Arrived at Destination?</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Confirm handover to log meals into your facility inventory</div>
                    </div>
                    <button 
                      className="btn btn-accent btn-sm"
                      disabled={confirming}
                      onClick={() => handleConfirmReceipt(selectedDelivery.id)}
                    >
                      {confirming ? 'Confirming...' : '✅ Confirm Food Received'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Map Container */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  📍 Inbound Route: {selectedDelivery?.institution_name || 'Donor'} → {selectedDelivery?.receiver_name || 'Your Facility'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Interactive OpenStreetMap Route
                </span>
              </div>
              <MapView
                center={[
                  selectedDelivery?.delivery_lat || 20.5937,
                  selectedDelivery?.delivery_lng || 78.9629,
                ]}
                zoom={12}
                height="460px"
                markers={mapMarkers}
                routes={mapRoutes}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
