import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';
import './EcoActions.css';

const ACTIONS = [
  { type: 'water_plant', icon: '🌱', points: 30, color: '#22c55e' },
  { type: 'pick_litter', icon: '🗑️', points: 40, color: '#3b82f6' },
  { type: 'plant_sapling', icon: '🌳', points: 100, color: '#16a34a' },
  { type: 'clean_bench', icon: '🪑', points: 25, color: '#f59e0b' },
  { type: 'wildlife_spot', icon: '🐦', points: 20, color: '#8b5cf6' },
];

export default function EcoActions() {
  const { user } = useAuth();
  const { addEcoAction, userPosition, ecoActions: allActions } = useGame();
  const { t } = useLang();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selected) return;
    const pos = userPosition || [28.6175, 77.2470];
    addEcoAction({
      type: selected,
      photo,
      lat: pos[0],
      lng: pos[1],
    }, user);
    setSubmitted(true);
    setSelected(null);
    setPhoto(null);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const recentActions = allActions.slice(0, 5);

  return (
    <div className="page eco-page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/map')}>← {t('common.back')}</button>
        <h1 className="page-title">{t('eco_actions.title')}</h1>
      </div>

      <div className="page-content">
        <p className="eco-subtitle">{t('eco_actions.subtitle')}</p>

        {/* Action Cards */}
        <div className="eco-grid">
          {ACTIONS.map(action => (
            <button
              key={action.type}
              className={`eco-card ${selected === action.type ? 'selected' : ''}`}
              onClick={() => setSelected(action.type)}
              style={{ '--action-color': action.color }}
            >
              <span className="eco-card-icon">{action.icon}</span>
              <span className="eco-card-name">{t(`eco_actions.actions.${action.type}`)}</span>
              <span className="eco-card-points">{t(`eco_actions.points.${action.type}`)}</span>
            </button>
          ))}
        </div>

        {/* Photo & Submit */}
        {selected && (
          <div className="eco-submit-section animate-fade-in-up">
            <label className="photo-btn btn btn-secondary" htmlFor="eco-photo">
              📸 {t('eco_actions.take_photo')}
            </label>
            <input
              type="file"
              id="eco-photo"
              accept="image/*"
              capture="environment"
              onChange={handlePhoto}
              style={{ display: 'none' }}
            />
            {photo && (
              <div className="photo-preview">
                <img src={photo} alt="Action proof" />
              </div>
            )}
            <button className="btn btn-primary btn-lg" onClick={handleSubmit} style={{ width: '100%' }}>
              {t('eco_actions.submit')}
            </button>
            <p className="eco-pending-note">🔍 {t('eco_actions.pending_review')}</p>
          </div>
        )}

        {/* Success animation */}
        {submitted && (
          <div className="eco-success animate-fade-in-up">
            <span className="eco-success-icon">🎉</span>
            <p>{t('eco_actions.success')}</p>
          </div>
        )}

        {/* Recent Actions */}
        {recentActions.length > 0 && (
          <div className="eco-recent">
            <h3>Recent Eco Actions</h3>
            {recentActions.map(action => (
              <div key={action.id} className="eco-recent-row">
                <span>{ACTIONS.find(a => a.type === action.type)?.icon}</span>
                <div className="eco-recent-info">
                  <span className="eco-recent-name">{t(`eco_actions.actions.${action.type}`)}</span>
                  <span className="eco-recent-time">{new Date(action.timestamp).toLocaleTimeString()}</span>
                </div>
                <span className="eco-recent-pts">+{action.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
