import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup } from 'react-leaflet';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useLang } from '../../context/LanguageContext';
import './Dashboard.css';

const REPORT_ICONS = {
  litter: '🗑️', broken_bench: '🪑', dry_tree: '🌵', unsafe_lighting: '💡',
  damaged_path: '🛤️', water_leak: '💧', graffiti: '🎨', other: '❓',
};

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { park, territories, reports, ecoActions, leaderboard, updateReportStatus, safetyRatings } = useGame();
  const { t } = useLang();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [mapOverlay, setMapOverlay] = useState('territories');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate stats
  const now = Date.now();
  const activeTerritories = territories.filter(t =>
    t.owners.some(o => o.expiresAt > now)
  );
  const totalArea = activeTerritories.reduce((sum, t) => sum + t.area_m2, 0);
  const pendingReports = reports.filter(r => r.status === 'pending').length;
  const todayReports = reports.filter(r => {
    const d = new Date(r.timestamp);
    return d.toDateString() === new Date().toDateString();
  }).length;
  const todayEcoActions = ecoActions.filter(a => {
    const d = new Date(a.timestamp);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const parkCoords = park.boundary.geometry.coordinates[0].map(c => [c[1], c[0]]);

  const getTerritoryFill = (territory) => {
    const active = territory.owners.filter(o => o.expiresAt > now);
    if (active.length === 0) return 'rgba(100,100,100,0.1)';

    if (mapOverlay === 'safety') {
      // Simulated safety based on territory
      const hash = territory.id.charCodeAt(territory.id.length - 1) % 3;
      if (hash === 0) return 'rgba(34, 197, 94, 0.5)';
      if (hash === 1) return 'rgba(234, 179, 8, 0.5)';
      return 'rgba(239, 68, 68, 0.4)';
    }
    if (mapOverlay === 'climate') {
      const hash = territory.id.charCodeAt(territory.id.length - 2) % 3;
      if (hash === 0) return 'rgba(34, 197, 94, 0.5)';
      if (hash === 1) return 'rgba(234, 179, 8, 0.4)';
      return 'rgba(239, 68, 68, 0.4)';
    }

    // Default: territory view (color by owner count)
    if (active.length > 2) return 'rgba(139, 92, 246, 0.5)';
    if (active.length > 1) return 'rgba(139, 92, 246, 0.35)';
    return 'rgba(34, 197, 94, 0.35)';
  };

  // Simulated hourly data
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    visitors: Math.floor(Math.max(0, 30 * Math.sin((i - 6) * Math.PI / 12) + 10 + Math.random() * 15)),
  }));

  const tabs = [
    { id: 'overview', icon: '📊', label: t('admin.overview') },
    { id: 'reports', icon: '📋', label: t('admin.reports') },
    { id: 'map', icon: '🗺️', label: t('admin.safety_map') },
    { id: 'analytics', icon: '📈', label: t('admin.analytics') },
  ];

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>🛡️ {t('admin.title')}</h1>
          <span className="admin-park-name">{park.name}</span>
        </div>
        <div className="admin-header-right">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/map')}>User View</button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="metric-card mc-green">
              <span className="mc-icon">👥</span>
              <span className="mc-value">{Math.floor(Math.random() * 30) + 20}</span>
              <span className="mc-label">{t('admin.active_users')}</span>
            </div>
            <div className="metric-card mc-blue">
              <span className="mc-icon">📋</span>
              <span className="mc-value">{todayReports}</span>
              <span className="mc-label">{t('admin.reports_today')}</span>
            </div>
            <div className="metric-card mc-purple">
              <span className="mc-icon">📐</span>
              <span className="mc-value">{totalArea.toLocaleString()}m²</span>
              <span className="mc-label">Area Claimed</span>
            </div>
            <div className="metric-card mc-orange">
              <span className="mc-icon">🌱</span>
              <span className="mc-value">{todayEcoActions}</span>
              <span className="mc-label">{t('admin.eco_actions_today')}</span>
            </div>

            {/* Mini map */}
            <div className="overview-map-card">
              <h3>Live Territory Map ({activeTerritories.length} active territories)</h3>
              <div className="mini-map">
                <MapContainer center={park.center} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Polygon positions={parkCoords} pathOptions={{ color: '#22c55e', weight: 2, fillColor: 'transparent', dashArray: '8 4' }} />
                  {activeTerritories.map(territory => (
                    <Polygon
                      key={territory.id}
                      positions={territory.polygon}
                      pathOptions={{
                        fillColor: getTerritoryFill(territory),
                        fillOpacity: 1,
                        color: 'rgba(34, 197, 94, 0.6)',
                        weight: 1.5,
                      }}
                    />
                  ))}
                  {reports.filter(r => r.status === 'pending').map(r => (
                    <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={6} pathOptions={{ fillColor: '#ef4444', fillOpacity: 1, color: '#fff', weight: 2 }}>
                      <Popup>{REPORT_ICONS[r.type]} {r.description}</Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="overview-reports-card">
              <h3>Pending Reports ({pendingReports})</h3>
              {reports.filter(r => r.status === 'pending').slice(0, 3).map(r => (
                <div key={r.id} className="mini-report">
                  <span>{REPORT_ICONS[r.type]}</span>
                  <div className="mini-report-info">
                    <span className="mini-report-desc">{r.description || r.type}</span>
                    <span className="mini-report-time">{new Date(r.timestamp).toLocaleString()}</span>
                  </div>
                  <span className="mini-report-status" style={{ color: STATUS_COLORS[r.status] }}>●</span>
                </div>
              ))}
            </div>

            {/* Top Players */}
            <div className="overview-top-card">
              <h3>Top Players</h3>
              {leaderboard.slice(0, 5).map((p, i) => (
                <div key={p.uid} className="mini-player">
                  <span className="mini-rank">{i + 1}</span>
                  <span className="mini-avatar">{p.avatar}</span>
                  <span className="mini-name">{p.displayName}</span>
                  <span className="mini-pts">{p.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="report-filters">
              <button className="btn btn-sm btn-secondary">All ({reports.length})</button>
              <button className="btn btn-sm btn-ghost">Pending ({pendingReports})</button>
              <button className="btn btn-sm btn-ghost">Resolved ({reports.filter(r => r.status === 'resolved').length})</button>
            </div>
            <div className="reports-list">
              {reports.map(r => (
                <div key={r.id} className="report-card-admin">
                  <div className="rca-header">
                    <span className="rca-icon">{REPORT_ICONS[r.type]}</span>
                    <div className="rca-info">
                      <span className="rca-type">{r.type.replace(/_/g, ' ')}</span>
                      <span className="rca-by">by {r.userName} • {new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    <span className="rca-status" style={{ background: STATUS_COLORS[r.status] + '20', color: STATUS_COLORS[r.status] }}>
                      {r.status}
                    </span>
                  </div>
                  {r.description && <p className="rca-desc">{r.description}</p>}
                  <div className="rca-location">📍 {r.lat.toFixed(4)}, {r.lng.toFixed(4)}</div>
                  <div className="rca-actions">
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => updateReportStatus(r.id, 'in_progress')}>
                          Start
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => updateReportStatus(r.id, 'resolved')}>
                          Resolve
                        </button>
                      </>
                    )}
                    {r.status === 'in_progress' && (
                      <button className="btn btn-sm btn-primary" onClick={() => updateReportStatus(r.id, 'resolved')}>
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="admin-map-section">
            <div className="map-overlay-tabs">
              <button className={`btn btn-sm ${mapOverlay === 'territories' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMapOverlay('territories')}>
                🗺️ Territories
              </button>
              <button className={`btn btn-sm ${mapOverlay === 'safety' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMapOverlay('safety')}>
                🛡️ Safety
              </button>
              <button className={`btn btn-sm ${mapOverlay === 'climate' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMapOverlay('climate')}>
                🌡️ Cooling
              </button>
            </div>
            <div className="admin-map-container">
              <MapContainer center={park.center} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <Polygon positions={parkCoords} pathOptions={{ color: '#22c55e', weight: 2, fillColor: 'transparent', dashArray: '8 4' }} />
                {activeTerritories.map(territory => (
                  <Polygon
                    key={territory.id}
                    positions={territory.polygon}
                    pathOptions={{
                      fillColor: getTerritoryFill(territory),
                      fillOpacity: 1,
                      color: territory.owners.length > 1 ? '#8b5cf6' : '#22c55e',
                      weight: 2,
                      dashArray: territory.owners.length > 1 ? '6 3' : undefined,
                    }}
                  >
                    <Popup>
                      <strong>{territory.area_m2.toLocaleString()}m²</strong><br />
                      {territory.owners.filter(o => o.expiresAt > now).map(o => o.displayName).join(', ')}
                    </Popup>
                  </Polygon>
                ))}
              </MapContainer>
            </div>
            <div className="map-legend-admin">
              {mapOverlay === 'territories' && <>
                <span style={{ color: '#22c55e' }}>● Solo Territory</span>
                <span style={{ color: '#8b5cf6' }}>● Co-owned</span>
              </>}
              {mapOverlay === 'safety' && <>
                <span style={{ color: '#22c55e' }}>● Safe</span>
                <span style={{ color: '#eab308' }}>● Neutral</span>
                <span style={{ color: '#ef4444' }}>● Unsafe</span>
              </>}
              {mapOverlay === 'climate' && <>
                <span style={{ color: '#22c55e' }}>● Cool (&lt;28°C)</span>
                <span style={{ color: '#eab308' }}>● Warm (28-32°C)</span>
                <span style={{ color: '#ef4444' }}>● Hot (&gt;32°C)</span>
              </>}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <div className="analytics-card">
              <h3>⏰ Peak Hours (Visitors)</h3>
              <div className="chart-container">
                {hourlyData.map(h => (
                  <div key={h.hour} className="bar-item">
                    <div className="bar" style={{ height: `${(h.visitors / 55) * 100}%` }}>
                      <span className="bar-val">{h.visitors}</span>
                    </div>
                    <span className="bar-label">{h.hour}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📊 Territory Stats</h3>
                <div className="duration-stats">
                  <div className="dur-item">
                    <span className="dur-val">{activeTerritories.length}</span>
                    <span className="dur-label">Active Zones</span>
                  </div>
                  <div className="dur-item">
                    <span className="dur-val">{totalArea.toLocaleString()}</span>
                    <span className="dur-label">m² Claimed</span>
                  </div>
                  <div className="dur-item">
                    <span className="dur-val">{activeTerritories.filter(t => t.owners.length > 1).length}</span>
                    <span className="dur-label">Co-owned</span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>🌱 Eco Impact</h3>
                <div className="eco-impact-stats">
                  <div className="impact-row">
                    <span>Plants Watered</span>
                    <span className="impact-val">234</span>
                  </div>
                  <div className="impact-row">
                    <span>Litter Picked</span>
                    <span className="impact-val">156</span>
                  </div>
                  <div className="impact-row">
                    <span>Saplings Planted</span>
                    <span className="impact-val">12</span>
                  </div>
                  <div className="impact-row">
                    <span>Wildlife Spotted</span>
                    <span className="impact-val">89</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
