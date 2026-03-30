import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const { userStats, badges } = useGame();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const [highContrast, setHighContrast] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    document.documentElement.setAttribute('data-high-contrast', String(next));
  };

  const handleShare = async () => {
    const text = `🛡️ EcoGuardian - My Stats\n⭐ ${userStats.points} Points\n📐 ${userStats.areaClaimed.toLocaleString()}m² Territory\n📋 ${userStats.reportsFiled} Reports Filed\n🌱 ${userStats.ecoActions} Eco Actions\n🔁 ${userStats.loopsCompleted} Loops Completed\n\nJoin me at Indraprastha Park!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'EcoGuardian Stats', text });
      } catch { }
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const earnedBadges = badges.filter(b => userStats.badges.includes(b.id));

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">{t('profile.title')}</h1>
      </div>

      <div className="page-content">
        {/* User Card */}
        <div className="profile-card">
          <div className="profile-avatar">{user.avatar || '🌿'}</div>
          <h2 className="profile-name">{user.displayName}</h2>
          <p className="profile-email">{user.email}</p>
          <div className="profile-role badge badge-primary">{user.role === 'admin' ? 'Admin' : 'Explorer'}</div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="pstat">
            <span className="pstat-icon">⭐</span>
            <span className="pstat-num">{userStats.points}</span>
            <span className="pstat-label">{t('profile.total_points')}</span>
          </div>
          <div className="pstat">
            <span className="pstat-icon">📐</span>
            <span className="pstat-num">{userStats.areaClaimed.toLocaleString()}</span>
            <span className="pstat-label">m² Claimed</span>
          </div>
          <div className="pstat">
            <span className="pstat-icon">📋</span>
            <span className="pstat-num">{userStats.reportsFiled}</span>
            <span className="pstat-label">{t('profile.reports')}</span>
          </div>
          <div className="pstat">
            <span className="pstat-icon">🌱</span>
            <span className="pstat-num">{userStats.ecoActions}</span>
            <span className="pstat-label">{t('profile.eco_actions')}</span>
          </div>
          <div className="pstat">
            <span className="pstat-icon">🕐</span>
            <span className="pstat-num">{userStats.timeInPark}</span>
            <span className="pstat-label">{t('common.min')}</span>
          </div>
          <div className="pstat">
            <span className="pstat-icon">🔁</span>
            <span className="pstat-num">{userStats.loopsCompleted}</span>
            <span className="pstat-label">Loops</span>
          </div>
        </div>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div className="profile-badges">
            <h3>{t('profile.badges_title')}</h3>
            <div className="badges-row">
              {earnedBadges.map(b => (
                <div key={b.id} className="pbadge">
                  <span>{b.icon}</span>
                  <span className="pbadge-name">{lang === 'hi' ? b.nameHi : b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <button className="btn btn-primary share-btn" onClick={handleShare}>
          📤 {t('profile.share_territory')}
        </button>

        {/* Settings */}
        <div className="settings-section">
          <h3>{t('profile.settings')}</h3>

          <div className="setting-row" onClick={toggleLang}>
            <span className="setting-icon">🌐</span>
            <span className="setting-label">{t('profile.language')}</span>
            <span className="setting-value">{lang === 'en' ? 'English' : 'हिंदी'}</span>
          </div>

          <div className="setting-row" onClick={toggleHighContrast}>
            <span className="setting-icon">👁️</span>
            <span className="setting-label">{t('profile.high_contrast')}</span>
            <span className={`toggle ${highContrast ? 'on' : ''}`}>
              <span className="toggle-knob"></span>
            </span>
          </div>

          {user.role === 'admin' && (
            <div className="setting-row" onClick={() => navigate('/admin')}>
              <span className="setting-icon">🔐</span>
              <span className="setting-label">{t('admin.title')}</span>
              <span className="setting-arrow">→</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="btn btn-danger logout-btn" onClick={handleLogout}>
          🚪 {t('profile.logout')}
        </button>
      </div>
    </div>
  );
}
