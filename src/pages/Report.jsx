import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';
import './Report.css';

const ISSUE_ICONS = {
  litter: '🗑️', broken_bench: '🪑', dry_tree: '🌵', unsafe_lighting: '💡',
  damaged_path: '🛤️', water_leak: '💧', graffiti: '🎨', other: '❓',
};

export default function Report() {
  const { user } = useAuth();
  const { addReport, userPosition } = useGame();
  const { t } = useLang();
  const navigate = useNavigate();

  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
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
    if (!type) return;
    const pos = userPosition || [28.6175, 77.2470];
    addReport({
      type,
      description,
      photo,
      lat: pos[0],
      lng: pos[1],
    }, user);
    setSubmitted(true);
    setTimeout(() => navigate('/map'), 2000);
  };

  if (submitted) {
    return (
      <div className="page report-page">
        <div className="report-success animate-fade-in-up">
          <div className="success-icon">✅</div>
          <h2>{t('report.success')}</h2>
          <p>Redirecting to map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page report-page">
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/map')}>← {t('common.back')}</button>
        <h1 className="page-title">{t('report.title')}</h1>
      </div>

      <div className="page-content">
        {/* Location badge */}
        <div className="report-location">
          <span>📍</span> {t('report.location_auto')}
          {userPosition && <span className="loc-coords">{userPosition[0].toFixed(4)}, {userPosition[1].toFixed(4)}</span>}
        </div>

        {/* Issue Type Selection */}
        <h3 className="section-label">{t('report.select_type')}</h3>
        <div className="issue-grid">
          {Object.entries(ISSUE_ICONS).map(([key, icon]) => (
            <button
              key={key}
              className={`issue-btn ${type === key ? 'selected' : ''}`}
              onClick={() => setType(key)}
              aria-label={t(`report.types.${key}`)}
            >
              <span className="issue-icon">{icon}</span>
              <span className="issue-label">{t(`report.types.${key}`)}</span>
            </button>
          ))}
        </div>

        {/* Photo */}
        <div className="report-photo-section">
          <label className="photo-btn btn btn-secondary" htmlFor="report-photo">
            📸 {t('report.add_photo')}
          </label>
          <input
            type="file"
            id="report-photo"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            style={{ display: 'none' }}
          />
          {photo && (
            <div className="photo-preview">
              <img src={photo} alt="Report photo" />
            </div>
          )}
        </div>

        {/* Description */}
        <textarea
          className="input report-desc"
          placeholder={t('report.description')}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />

        {/* Submit */}
        <button
          className="btn btn-primary btn-lg report-submit"
          onClick={handleSubmit}
          disabled={!type}
        >
          {t('report.submit')}
        </button>
      </div>
    </div>
  );
}
