import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';

const ISSUE_TYPES = [
  'Garbage Overflow',
  'Broken Bench',
  'Damaged Light',
  'Dry Tree',
  'Unsafe Path',
  'Other',
];

export default function ReportForm() {
  const { user } = useAuth();
  const { addReport, userPosition, classifyIssue } = useGame();
  const { t } = useLang();
  const navigate = useNavigate();

  const [type, setType] = useState('Garbage Overflow');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const classification = useMemo(() => classifyIssue(type), [classifyIssue, type]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!type) return;
    const pos = userPosition || [28.6175, 77.2470];
    addReport({
      type,
      description,
      photo,
      location: { lat: pos[0], lng: pos[1] },
      lat: pos[0],
      lng: pos[1],
    }, user);
    setSubmitted(true);
    setTimeout(() => navigate('/map'), 2000);
  };

  if (submitted) {
    return (
      <div className="report-success animate-fade-in-up">
        <div className="success-icon">✅</div>
        <h2>{t('report.success')}</h2>
        <p>Redirecting to map...</p>
      </div>
    );
  }

  return (
    <>
      <div className="report-location">
        <span>📍</span> {t('report.location_auto')}
        {userPosition && <span className="loc-coords">{userPosition[0].toFixed(4)}, {userPosition[1].toFixed(4)}</span>}
      </div>

      <h3 className="section-label">Issue Type</h3>
      <div className="input-row">
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {ISSUE_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="report-classification-badge">
        <span className="rcb-pill">Category: <strong>{classification.category}</strong></span>
        <span className="rcb-pill">SLA: <strong>{classification.slaHours}h</strong></span>
      </div>

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

      <textarea
        className="input report-desc"
        placeholder={t('report.description')}
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={3}
      />

      <button
        className="btn btn-primary btn-lg report-submit"
        onClick={handleSubmit}
      >
        {t('report.submit')}
      </button>
    </>
  );
}

