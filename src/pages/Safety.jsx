import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';
import './Safety.css';

const RATINGS = [
  { value: 'safe', icon: '✅', color: '#22c55e' },
  { value: 'neutral', icon: '😐', color: '#eab308' },
  { value: 'unsafe', icon: '⚠️', color: '#ef4444' },
];

export default function Safety() {
  const { rateSafety, userPosition, showToast, safetyRatings } = useGame();
  const { t } = useLang();
  const navigate = useNavigate();
  const [selectedRating, setSelectedRating] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const handleSubmitRating = () => {
    if (!selectedRating) return;
    const pos = userPosition || [28.6175, 77.2470];
    rateSafety(pos[0], pos[1], selectedRating);
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setSelectedRating(null); }, 2000);
  };

  const handleEmergency = () => {
    setShowEmergency(true);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    setTimeout(() => {
      showToast(t('safety.emergency_sent'), 'warning');
      setShowEmergency(false);
    }, 3000);
  };

  // Calculate safety stats from ratings map
  const allKeys = Object.keys(safetyRatings);
  const ratedZones = allKeys.length;
  const safeZones = allKeys.filter(key => {
    const ratings = safetyRatings[key] || [];
    if (!ratings.length) return false;
    const avg = ratings.reduce((sum, r) => sum + (r.rating === 'safe' ? 1 : r.rating === 'neutral' ? 0.5 : 0), 0) / ratings.length;
    return avg >= 0.7;
  }).length;

  return (
    <div className="page safety-page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/map')}>← {t('common.back')}</button>
        <h1 className="page-title">{t('safety.title')}</h1>
      </div>

      <div className="page-content">
        {/* Emergency Button */}
        <button className="emergency-btn" onClick={handleEmergency} aria-label="Emergency alert">
          <span className="emergency-icon">🆘</span>
          <div className="emergency-text">
            <strong>{t('safety.emergency_title')}</strong>
            <span>{t('safety.shake_to_alert')}</span>
          </div>
        </button>

        {/* Safety Stats */}
        <div className="safety-stats-grid">
          <div className="safety-stat safe-stat">
            <span className="safety-stat-num">{safeZones}</span>
            <span className="safety-stat-label">{t('safety.safe')} Zones</span>
          </div>
          <div className="safety-stat">
            <span className="safety-stat-num">{ratedZones}</span>
            <span className="safety-stat-label">Rated</span>
          </div>
          <div className="safety-stat">
            <span className="safety-stat-num">{ratedZones > 0 ? Math.round((safeZones / ratedZones) * 100) : 0}%</span>
            <span className="safety-stat-label">Safe %</span>
          </div>
        </div>

        {/* Rate this area */}
        <div className="rate-section card">
          <h3>{t('safety.how_safe')}</h3>
          <div className="rating-options">
            {RATINGS.map(r => (
              <button
                key={r.value}
                className={`rating-btn ${selectedRating === r.value ? 'selected' : ''}`}
                style={{ '--rating-color': r.color }}
                onClick={() => setSelectedRating(r.value)}
              >
                <span className="rating-icon">{r.icon}</span>
                <span className="rating-label">{t(`safety.${r.value}`)}</span>
              </button>
            ))}
          </div>
          {selectedRating && !submitted && (
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={handleSubmitRating}>
              {t('safety.submit')}
            </button>
          )}
          {submitted && (
            <div className="rating-submitted animate-fade-in-up">
              ✅ Rating submitted! +5 points
            </div>
          )}
        </div>

        {/* Info */}
        <div className="safety-info card">
          <h3>🛡️ {t('safety.heatmap')}</h3>
          <p>Safety ratings are tied to your current GPS location. Rate zones as you walk to build the safety heatmap for park management.</p>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => navigate('/map')}>
            View on Map
          </button>
        </div>
      </div>

      {/* Emergency Overlay */}
      {showEmergency && (
        <div className="safety-emergency-overlay">
          <div className="safety-emergency-content">
            <div className="emergency-pulse-icon">🆘</div>
            <h2>{t('safety.emergency_title')}</h2>
            <p>{t('safety.emergency_msg')}</p>
            <div className="emergency-location">
              📍 {userPosition ? `${userPosition[0].toFixed(4)}, ${userPosition[1].toFixed(4)}` : 'Detecting...'}
            </div>
            <div className="emergency-spinner-ring"></div>
          </div>
        </div>
      )}
    </div>
  );
}
