import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';
import './ParkMap.css';

// Component to update map view
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function ParkMap() {
  const { user } = useAuth();
  const { t } = useLang();
  const {
    park, territories, currentPath, userStats,
    isInsidePark, userPosition,
    setIsInsidePark, setUserPosition, setSessionStart,
    addPathPoint, clearPath, checkInsidePark,
    getTerritoryStatus, showToast, pods
  } = useGame();
  const navigate = useNavigate();

  const [tracking, setTracking] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [simulateMode, setSimulateMode] = useState(false);
  const [timeInPark, setTimeInPark] = useState(0);
  const [showEmergency, setShowEmergency] = useState(false);
  const [loopsClosed, setLoopsClosed] = useState(0);
  const [simProgress, setSimProgress] = useState('');

  const watchIdRef = useRef(null);
  const simIntervalRef = useRef(null);
  const timerRef = useRef(null);
  const simIndexRef = useRef(0);
  const prevLoopsRef = useRef(userStats.loopsCompleted);

  // Simulated walking path — a clear loop through the park
  const SIM_PATH = [
    // Walk east from gate
    [28.6175, 77.2458], [28.6177, 77.2461], [28.6179, 77.2464],
    [28.6181, 77.2467], [28.6183, 77.2470],
    // Curve north
    [28.6186, 77.2473], [28.6189, 77.2475], [28.6192, 77.2477],
    [28.6195, 77.2479],
    // Curve east
    [28.6197, 77.2482], [28.6199, 77.2486], [28.6200, 77.2490],
    // Turn south
    [28.6199, 77.2494], [28.6197, 77.2497], [28.6194, 77.2499],
    // Continue south-west
    [28.6191, 77.2498], [28.6188, 77.2496], [28.6185, 77.2494],
    [28.6182, 77.2491],
    // Curve back west
    [28.6180, 77.2488], [28.6178, 77.2484], [28.6176, 77.2480],
    [28.6174, 77.2476], [28.6173, 77.2472],
    // Close the loop – return to start
    [28.6173, 77.2468], [28.6174, 77.2464], [28.6175, 77.2460],
    [28.6175, 77.2458], // ← closes the loop
  ];

  // Watch for new loops from GameContext
  useEffect(() => {
    if (userStats.loopsCompleted > prevLoopsRef.current) {
      setLoopsClosed(prev => prev + 1);
      prevLoopsRef.current = userStats.loopsCompleted;
    }
  }, [userStats.loopsCompleted]);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('GPS not available', 'warning');
      return;
    }
    setTracking(true);
    setSessionStart(Date.now());
    clearPath();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setUserPosition([lat, lng]);
        setGpsAccuracy(accuracy);
        const inside = checkInsidePark(lat, lng);
        setIsInsidePark(inside);
        if (inside) {
          addPathPoint(lat, lng, user);
        }
      },
      () => {
        showToast(t('map.gps_weak'), 'warning');
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  }, [addPathPoint, checkInsidePark, clearPath, setIsInsidePark, setSessionStart, setUserPosition, showToast, t, user]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  // Simulate walking for demo
  const startSimulation = useCallback(() => {
    setSimulateMode(true);
    setTracking(true);
    setIsInsidePark(true);
    setSessionStart(Date.now());
    clearPath();
    simIndexRef.current = 0;
    setLoopsClosed(0);

    simIntervalRef.current = setInterval(() => {
      const idx = simIndexRef.current;
      if (idx >= SIM_PATH.length) {
        clearInterval(simIntervalRef.current);
        setSimulateMode(false);
        setSimProgress('');
        showToast('Walk complete! Check your territory!', 'success');
        return;
      }

      const pos = SIM_PATH[idx];
      setUserPosition(pos);
      setGpsAccuracy(5);
      addPathPoint(pos[0], pos[1], user);

      const pct = Math.round(((idx + 1) / SIM_PATH.length) * 100);
      setSimProgress(`${pct}% walked (${idx + 1}/${SIM_PATH.length} points)`);

      simIndexRef.current++;
    }, 350);
  }, [addPathPoint, clearPath, setIsInsidePark, setSessionStart, setUserPosition, showToast, user]);

  // Timer
  useEffect(() => {
    if (tracking) {
      timerRef.current = setInterval(() => {
        setTimeInPark(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [tracking]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Manual check-in
  const manualCheckIn = () => {
    setIsInsidePark(true);
    setTracking(true);
    setSessionStart(Date.now());
    setUserPosition(park.center);
    clearPath();
    showToast(t('map.inside_park'), 'success');
  };

  // Emergency handler
  const triggerEmergency = () => {
    setShowEmergency(true);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    setTimeout(() => {
      showToast(t('safety.emergency_sent'), 'warning');
      setShowEmergency(false);
    }, 3000);
  };

  // Format time
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Territory colors
  const getTerritoryColor = (territory) => {
    const status = getTerritoryStatus(territory, user.uid);
    switch (status) {
      case 'owned': return { fill: 'rgba(34, 197, 94, 0.35)', border: '#22c55e' };
      case 'co-owned': return { fill: 'rgba(139, 92, 246, 0.35)', border: '#8b5cf6' };
      case 'other': return { fill: 'rgba(59, 130, 246, 0.25)', border: '#3b82f6' };
      default: return { fill: 'rgba(100, 100, 100, 0.1)', border: '#666' };
    }
  };

  const getTerritoryLabel = (territory) => {
    const status = getTerritoryStatus(territory, user.uid);
    const now = Date.now();
    const active = territory.owners.filter(o => o.expiresAt > now);
    const userOwner = active.find(o => o.userId === user.uid);
    const hoursLeft = userOwner ? Math.round((userOwner.expiresAt - now) / 3600000) : null;

    return (
      <div className="territory-popup">
        <div className="tp-status">
          {status === 'owned' && '✅ Your Territory'}
          {status === 'co-owned' && '👥 Co-owned Territory'}
          {status === 'other' && '🔵 Claimed by Others'}
          {status === 'expired' && '⬜ Expired'}
        </div>
        <div className="tp-area">📐 {territory.area_m2.toLocaleString()} m²</div>
        <div className="tp-owners">👥 {active.length} owner{active.length !== 1 ? 's' : ''}</div>
        {hoursLeft !== null && <div className="tp-expiry">⏳ Expires in {hoursLeft}h</div>}
      </div>
    );
  };

  const parkCoords = park.boundary.geometry.coordinates[0].map(c => [c[1], c[0]]);

  // Total area for display
  const now = Date.now();
  const myTerritories = territories.filter(t =>
    t.owners.some(o => o.userId === user.uid && o.expiresAt > now)
  );
  const totalArea = myTerritories.reduce((sum, t) => sum + t.area_m2, 0);

  return (
    <div className="map-page">
      {/* Status Bar */}
      <div className="map-status-bar glass">
        <div className="status-left">
          <span className={`status-dot ${isInsidePark ? 'online' : 'offline'}`}></span>
          <span className="status-text">
            {isInsidePark ? t('map.inside_park') : t('map.outside_park')}
          </span>
        </div>
        <div className="status-stats">
          <div className="stat-chip">
            <span>📐</span>
            <span>{totalArea.toLocaleString()}m²</span>
          </div>
          <div className="stat-chip">
            <span>⭐</span>
            <span>{userStats.points}</span>
          </div>
          <div className="stat-chip">
            <span>⏱️</span>
            <span>{formatTime(timeInPark)}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={park.center}
        zoom={park.zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OSM'
        />

        {/* Park Boundary */}
        <Polygon
          positions={parkCoords}
          pathOptions={{
            color: '#22c55e',
            weight: 2,
            fillColor: 'rgba(34, 197, 94, 0.03)',
            fillOpacity: 1,
            dashArray: '8 4',
          }}
        />

        {/* Claimed Territories (filled polygons) */}
        {territories.map(territory => {
          const active = territory.owners.filter(o => o.expiresAt > now);
          if (active.length === 0) return null;
          const colors = getTerritoryColor(territory);
          return (
            <Polygon
              key={territory.id}
              positions={territory.polygon}
              pathOptions={{
                fillColor: colors.fill,
                fillOpacity: 1,
                color: colors.border,
                weight: 2,
                dashArray: getTerritoryStatus(territory, user.uid) === 'co-owned' ? '6 3' : undefined,
              }}
            >
              <Popup>{getTerritoryLabel(territory)}</Popup>
            </Polygon>
          );
        })}

        {/* Current Walking Trail (live path, not yet closed) */}
        {currentPath.length > 1 && (
          <Polyline
            positions={currentPath}
            pathOptions={{
              color: '#22c55e',
              weight: 3,
              opacity: 0.8,
              dashArray: '4 6',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Trail start marker (so user can see where to close the loop) */}
        {currentPath.length > 5 && (
          <CircleMarker
            center={currentPath[0]}
            radius={10}
            pathOptions={{
              fillColor: '#f59e0b',
              fillOpacity: 0.9,
              color: '#fff',
              weight: 2,
            }}
          >
            <Popup>🔁 Walk back here to close your loop and claim the area!</Popup>
          </CircleMarker>
        )}

        {/* User Position */}
        {userPosition && (
          <>
            <CircleMarker
              center={userPosition}
              radius={8}
              pathOptions={{
                fillColor: '#22c55e',
                fillOpacity: 1,
                color: '#fff',
                weight: 3,
              }}
            />
            {gpsAccuracy && gpsAccuracy < 50 && (
              <CircleMarker
                center={userPosition}
                radius={Math.min(gpsAccuracy * 2, 30)}
                pathOptions={{
                  fillColor: 'rgba(34, 197, 94, 0.1)',
                  fillOpacity: 1,
                  color: 'rgba(34, 197, 94, 0.3)',
                  weight: 1,
                }}
              />
            )}
          </>
        )}

        {/* POI Markers */}
        {park.poi.map(poi => (
          <CircleMarker
            key={poi.id}
            center={poi.coordinates}
            radius={5}
            pathOptions={{
              fillColor: '#f59e0b',
              fillOpacity: 0.8,
              color: 'rgba(245, 158, 11, 0.5)',
              weight: 1,
            }}
          >
            <Popup>{poi.name}</Popup>
          </CircleMarker>
        ))}

        {/* Pod Markers */}
        {pods.map(pod => (
          <CircleMarker
            key={pod.id}
            center={[pod.lat, pod.lng]}
            radius={8}
            pathOptions={{
              fillColor: '#06b6d4', // Cyan
              fillOpacity: 0.9,
              color: '#fff',
              weight: 2,
            }}
          >
            <Popup>
              <strong>{pod.type.toUpperCase()} POD ({pod.id})</strong><br />
              Total Scans: {pod.totalScans}
            </Popup>
          </CircleMarker>
        ))}

        {/* Today's Creative Area Marker */}
        <Marker
          position={[28.6145, 77.2485]}
          icon={L.divIcon({
            html: '<div style="font-size: 28px; line-height: 1; text-align: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transform: translateY(-50%);">🎨</div>',
            className: 'creativity-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })}
        >
          <Popup>
            <strong>Today's creative area</strong><br/>
            Artists can make and show their painting there, singers can jam, and others can join.
          </Popup>
        </Marker>

        <MapUpdater center={userPosition} />
      </MapContainer>

      {/* Floating Action Buttons */}
      <div className="map-fab-container">
        {!tracking ? (
          <div className="fab-group">
            <button className="fab fab-primary" onClick={startTracking} aria-label="Start GPS tracking">
              📍 Start GPS
            </button>
            <button className="fab fab-secondary" onClick={manualCheckIn} aria-label="Manual check-in">
              ✋ {t('map.manual_checkin')}
            </button>
            <button className="fab fab-accent" onClick={startSimulation} aria-label="Simulate walk">
              🚶 {t('map.simulate_walk')}
            </button>
          </div>
        ) : (
          <div className="fab-group">
            <button className="fab fab-report" onClick={() => navigate('/report')} aria-label="Report issue">
              📋 {t('map.report_issue')}
            </button>
            <button className="fab fab-eco" onClick={() => navigate('/eco-actions')} aria-label="Eco action">
              🌱 {t('map.eco_action')}
            </button>
            <button className="fab fab-safety" onClick={() => navigate('/safety')} aria-label="Safety">
              🛡️ {t('map.safety_rate')}
            </button>
            <button className="fab fab-emergency" onClick={triggerEmergency} aria-label="Emergency">
              🆘 {t('map.emergency')}
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend glass">
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'rgba(34, 197, 94, 0.5)', border: '2px solid #22c55e' }}></span>
          <span>Your Territory</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'rgba(139, 92, 246, 0.45)', border: '2px dashed #8b5cf6' }}></span>
          <span>Co-owned</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'rgba(59, 130, 246, 0.35)', border: '2px solid #3b82f6' }}></span>
          <span>Others</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'transparent', border: '2px dashed #22c55e' }}></span>
          <span>Your Trail</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#06b6d4', border: '2px solid #fff', borderRadius: '50%' }}></span>
          <span>Eco Pod</span>
        </div>
      </div>

      {/* Trail info / loop hint */}
      {tracking && currentPath.length > 0 && (
        <div className="trail-info glass">
          <span className="trail-dot"></span>
          {currentPath.length < 8
            ? `Drawing trail... (${currentPath.length} points)`
            : `🔁 Close the loop to claim territory! (${currentPath.length} pts)`
          }
        </div>
      )}

      {/* Emergency Overlay */}
      {showEmergency && (
        <div className="emergency-overlay">
          <div className="emergency-content">
            <div className="emergency-pulse">🆘</div>
            <h2>{t('safety.emergency_title')}</h2>
            <p>{t('safety.emergency_msg')}</p>
            <div className="emergency-spinner"></div>
          </div>
        </div>
      )}

      {/* Simulation indicator */}
      {simulateMode && (
        <div className="sim-indicator glass">
          <span className="sim-dot"></span>
          Simulating walk... {simProgress} {loopsClosed > 0 ? `• ${loopsClosed} loop${loopsClosed > 1 ? 's' : ''} closed!` : ''}
        </div>
      )}
    </div>
  );
}
