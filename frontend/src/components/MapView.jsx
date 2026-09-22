/**
 * MapView — Enhanced Leaflet map component with dynamic auto-zoom,
 * custom SVG markers for Institution, Receiver, and Vehicles, and animated tracking.
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Helper component to dynamically re-center or fit bounds when props change
function MapController({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (bounds && bounds.length >= 2) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
      } catch (e) {
        console.warn('fitBounds error:', e);
      }
    } else if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, bounds, map]);

  return null;
}

// Custom DivIcons for crisp, high-resolution rendering
export const createCustomIcon = (type, label = '') => {
  let bg = '#3b82f6';
  let emoji = '📍';
  let pulse = false;

  if (type === 'institution') {
    bg = '#6366f1';
    emoji = '🏢';
  } else if (type === 'receiver') {
    bg = '#10b981';
    emoji = '🤝';
  } else if (type === 'vehicle' || type === 'driver') {
    bg = '#f59e0b';
    emoji = '🚚';
    pulse = true;
  } else if (type === 'delivered') {
    bg = '#059669';
    emoji = '✅';
  }

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${pulse ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${bg}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
      <div style="width: 34px; height: 34px; border-radius: 50%; background: ${bg}; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; transform: translateY(-4px);">
        ${emoji}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 24],
    popupAnchor: [0, -20],
  });
};

export default function MapView({ 
  center = [20.5937, 78.9629], 
  zoom = 5, 
  bounds = null,
  markers = [], 
  routes = [],
  heatpoints = [],
  height = '450px',
  onMarkerClick = null,
}) {
  // If no explicit bounds provided, auto-calculate from markers or routes if present
  let activeBounds = bounds;
  if (!activeBounds) {
    const allPoints = [];
    markers.forEach(m => {
      if (m.lat && m.lng) allPoints.push([m.lat, m.lng]);
    });
    routes.forEach(r => {
      (r.points || []).forEach(p => {
        if (p && p.length >= 2) allPoints.push([p[0], p[1]]);
      });
    });
    if (allPoints.length >= 2) {
      activeBounds = allPoints;
    }
  }

  return (
    <div className="map-container" style={{ height, borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        scrollWheelZoom={true}
      >
        <MapController center={center} zoom={zoom} bounds={activeBounds} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Polylines for Routes */}
        {routes.map((route, i) => (
          <div key={`route-group-${i}`}>
            {/* Outer Glow */}
            <Polyline
              positions={route.points}
              pathOptions={{ 
                color: route.color || '#f59e0b', 
                weight: 6, 
                opacity: 0.35, 
                lineCap: 'round', 
                lineJoin: 'round' 
              }}
            />
            {/* Core Route Line */}
            <Polyline
              positions={route.points}
              pathOptions={{ 
                color: route.color || '#f97316', 
                weight: 3.5, 
                opacity: 0.95, 
                dashArray: route.dashed ? '8, 8' : undefined,
                lineCap: 'round', 
                lineJoin: 'round' 
              }}
            />
          </div>
        ))}

        {/* Markers */}
        {markers.map((m, i) => {
          if (!m.lat || !m.lng) return null;
          const icon = createCustomIcon(m.type || 'default', m.label);

          return (
            <Marker 
              key={`marker-${i}-${m.lat}-${m.lng}`} 
              position={[m.lat, m.lng]} 
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(m),
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160, color: '#0f172a' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>
                    {m.label || 'Location'}
                  </div>
                  {m.badge && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      background: '#e0e7ff', 
                      color: '#4338ca', 
                      fontWeight: 600,
                      display: 'inline-block',
                      marginBottom: 4,
                    }}>
                      {m.badge}
                    </span>
                  )}
                  {m.sublabel && (
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 3 }}>
                      {m.sublabel}
                    </div>
                  )}
                  {m.meta && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, borderTop: '1px solid #e2e8f0', paddingTop: 4 }}>
                      {m.meta}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Heatpoints / Nodes */}
        {heatpoints.map((p, i) => (
          <CircleMarker
            key={`hp-${i}`}
            center={[p.lat, p.lng]}
            radius={Math.max(8, (p.intensity || 0.5) * 26)}
            pathOptions={{
              color: p.type === 'surplus' ? '#f97316' : '#10b981',
              fillColor: p.type === 'surplus' ? '#f97316' : '#10b981',
              fillOpacity: 0.35 + (p.intensity || 0.5) * 0.35,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ color: '#0f172a', fontWeight: 600 }}>{p.label}</div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
