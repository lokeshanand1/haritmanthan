import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import VerificationModal from '../components/VerificationModal';
import './BountyMap.css';

function distanceMetres(a, b) {
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function BountyMap() {
  const { user } = useAuth();
  const { park, userPosition, bountyQuests, submitVerification, failVerification, showToast } = useGame();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const activeQuests = useMemo(() => {
    const now = Date.now();
    return (bountyQuests || []).filter(q => q.status === 'active' && (!q.expiresAt || q.expiresAt > now) && q.location);
  }, [bountyQuests]);

  const nearby = useMemo(() => {
    if (!userPosition) return activeQuests;
    return activeQuests
      .map(q => ({
        ...q,
        distM: distanceMetres([q.location.lat, q.location.lng], userPosition),
      }))
      .sort((a, b) => a.distM - b.distM);
  }, [activeQuests, userPosition]);

  const handleSubmitSuccess = ({ questId, reportId, photoDataUrl }) => {
    submitVerification({ questId, reportId, verifierUserId: user.uid, photoDataUrl });
    setSelected(null);
  };

  const handleSubmitFail = ({ questId, reportId }) => {
    failVerification({ questId, reportId });
    showToast('Thanks — reopened the issue and boosted the bounty.', 'info');
    setSelected(null);
  };

  return (
    <div className="page bounty-page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/map')}>← Back</button>
        <h1 className="page-title">Nearby Bounties</h1>
      </div>

      <div className="bounty-stats">
        <div className="bounty-chip">Active: <strong>{activeQuests.length}</strong></div>
        <div className="bounty-chip">Nearby: <strong>{nearby.filter(q => q.distM === undefined || q.distM <= 1000).length}</strong></div>
      </div>

      <div className="bounty-layout">
        <div className="bounty-list glass">
          {nearby.length === 0 && (
            <div className="bounty-empty">
              No active bounties right now. Check again later.
            </div>
          )}
          {nearby.slice(0, 20).map(q => (
            <button key={q.questId} className="bounty-row" onClick={() => setSelected(q)}>
              <div className="bounty-row-left">
                <div className="bounty-icon">🎯</div>
                <div className="bounty-row-info">
                  <div className="bounty-title">Quest for Report {String(q.reportId).slice(-6)}</div>
                  <div className="bounty-sub">
                    Reward: {q.rewardPoints} pts
                    {q.distM !== undefined ? ` • ${(q.distM).toFixed(0)}m` : ''}
                  </div>
                </div>
              </div>
              <div className="bounty-row-right">Verify →</div>
            </button>
          ))}
        </div>

        <div className="bounty-map glass">
          <MapContainer center={park.center} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            {userPosition && (
              <CircleMarker center={userPosition} radius={8} pathOptions={{ fillColor: '#22c55e', fillOpacity: 1, color: '#fff', weight: 3 }}>
                <Popup>You are here</Popup>
              </CircleMarker>
            )}
            {activeQuests.map(q => (
              <CircleMarker
                key={q.questId}
                center={[q.location.lat, q.location.lng]}
                radius={8}
                pathOptions={{ fillColor: '#f59e0b', fillOpacity: 0.95, color: '#fff', weight: 2 }}
                eventHandlers={{ click: () => setSelected(q) }}
              >
                <Popup>
                  <strong>Verification Bounty</strong><br />
                  Reward: {q.rewardPoints} pts
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      <VerificationModal
        open={!!selected}
        onClose={() => setSelected(null)}
        quest={selected}
        userPosition={userPosition}
        onSubmitSuccess={handleSubmitSuccess}
        onSubmitFail={handleSubmitFail}
      />
    </div>
  );
}

