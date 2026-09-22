/**
 * Track Delivery — Live interactive map with route tracking, real food images,
 * driver HUD, and status timeline.
 */
import { useState, useEffect } from 'react';
import api from '../../api/client';
import MapView from '../../components/MapView';
import StatusBadge from '../../components/StatusBadge';
import { getFoodImage } from '../../utils/imageHelper';

export default function TrackDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    api.getDeliveries()
      .then((data) => {
        setDeliveries(data);
        if (data.length > 0) {
          // Default select the first active delivery or first delivery
          const active = data.find(d => d.status !== 'delivered');
          setSelectedId(active ? active.id : data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Subtle live pulse ticker for in-transit simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => (t + 1) % 100);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const selectedDelivery = deliveries.find(d => d.id === selectedId) || deliveries[0];

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

    // Pickup marker
    if (selectedDelivery.pickup_lat && selectedDelivery.pickup_lng) {
      markers.push({
        lat: selectedDelivery.pickup_lat,
        lng: selectedDelivery.pickup_lng,
        type: 'institution',
        label: selectedDelivery.institution_name || 'Pickup Point',
        badge: 'ORIGIN / CANTEEN',
        sublabel: selectedDelivery.pickup_address,
        meta: selectedDelivery.pickup_time ? `Picked up: ${new Date(selectedDelivery.pickup_time).toLocaleTimeString()}` : 'Awaiting driver handover',
      });
    }

    // Delivery dropoff marker
    if (selectedDelivery.delivery_lat && selectedDelivery.delivery_lng) {
      markers.push({
        lat: selectedDelivery.delivery_lat,
        lng: selectedDelivery.delivery_lng,
        type: selectedDelivery.status === 'delivered' ? 'delivered' : 'receiver',
        label: selectedDelivery.receiver_name || 'Dropoff Point',
        badge: 'DESTINATION / NGO',
        sublabel: selectedDelivery.delivery_address,
        meta: selectedDelivery.delivery_time ? `Delivered: ${new Date(selectedDelivery.delivery_time).toLocaleTimeString()}` : `ETA: ~${selectedDelivery.estimated_travel_min || 15} mins`,
      });
    }

    // In-transit vehicle marker
    if (selectedDelivery.status !== 'delivered' && selectedRoutePoints.length > 0) {
      // Pick a coordinate along the route based on status / tick
      const midIndex = Math.min(
        selectedRoutePoints.length - 1,
        Math.floor((selectedRoutePoints.length * 0.5) + (tick % 2 === 0 ? 0 : 0.05))
      );
      const vehiclePt = selectedRoutePoints[midIndex] || selectedRoutePoints[0];

      markers.push({
        lat: vehiclePt[0],
        lng: vehiclePt[1],
        type: 'vehicle',
        label: `🚚 ${selectedDelivery.driver_name} (${selectedDelivery.vehicle_type?.toUpperCase()})`,
        badge: 'IN TRANSIT',
        sublabel: `Dist: ${selectedDelivery.distance_km} km • Phone: ${selectedDelivery.driver_phone}`,
        meta: `Transporting ${selectedDelivery.quantity_kg}kg ${selectedDelivery.food_type || 'surplus food'}`,
      });
    }

    return markers;
  })();

  // Routes for map
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
          <h2>Live Delivery Tracking & Routes</h2>
          <p className="page-subtitle">Real-time GPS dispatch route, food condition verification & handover status</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setLoading(true);
              api.getDeliveries().then(setDeliveries).finally(() => setLoading(false));
            }}
          >
            🔄 Refresh GPS
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛰️</div>
          <p style={{ color: 'var(--text-muted)' }}>Connecting to real-time delivery telemetry...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🚚</div>
          <h3>No Dispatches Yet</h3>
          <p>Register surplus food batches and run AI allocation to generate delivery routes.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT: Deliveries List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeDeliveries.length > 0 && (
              <div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />
                  Active Deliveries ({activeDeliveries.length})
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
                            → {d.receiver_name}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <StatusBadge status={d.status} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🚗 {d.driver_name}</span>
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
                Completed Deliveries ({pastDeliveries.length})
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
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>✅ Delivered</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {d.quantity_kg} kg • To: {d.receiver_name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Selected Delivery HUD & Live Route Map */}
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
                          {selectedDelivery.description || 'Surplus batch allocated through ANNARAKSHAK AI'}
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
                          📞 {selectedDelivery.driver_phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Step Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ height: '4px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '4px' }} />
                    <span style={{ color: 'var(--text-muted)' }}>1. Matched</span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ height: '4px', background: 'var(--accent)', borderRadius: '2px', marginBottom: '4px' }} />
                    <span style={{ color: 'var(--text-muted)' }}>2. Assigned</span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ 
                      height: '4px', 
                      background: selectedDelivery.status === 'delivered' || selectedDelivery.status === 'picked_up' ? 'var(--accent)' : 'var(--border)', 
                      borderRadius: '2px', 
                      marginBottom: '4px' 
                    }} />
                    <span style={{ color: selectedDelivery.status !== 'assigned' ? 'var(--text)' : 'var(--text-muted)' }}>
                      3. In Transit
                    </span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                    <div style={{ 
                      height: '4px', 
                      background: selectedDelivery.status === 'delivered' ? 'var(--accent)' : 'var(--border)', 
                      borderRadius: '2px', 
                      marginBottom: '4px' 
                    }} />
                    <span style={{ color: selectedDelivery.status === 'delivered' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: selectedDelivery.status === 'delivered' ? 700 : 400 }}>
                      4. Received
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Map Container */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  📍 {selectedDelivery?.institution_name || 'Origin'} → {selectedDelivery?.receiver_name || 'Destination'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Interactive OpenStreetMap Route
                </span>
              </div>
              <MapView
                center={[
                  selectedDelivery?.pickup_lat || 20.5937,
                  selectedDelivery?.pickup_lng || 78.9629,
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
