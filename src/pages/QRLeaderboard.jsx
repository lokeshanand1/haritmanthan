import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';
import './QRLeaderboard.css';

export default function QRLeaderboard() {
  const { parkId } = useParams();
  const { user, demoLogin } = useAuth();
  const { park, leaderboard, userStats, ecoActions } = useGame();
  const { t } = useLang();
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);

  const todayEcoActions = ecoActions.filter(a => {
    const today = new Date();
    const actionDate = new Date(a.timestamp);
    return actionDate.toDateString() === today.toDateString();
  }).length;

  const handleEnterPark = async () => {
    setEntering(true);
    if (!user) {
      await demoLogin();
    }
    setTimeout(() => navigate('/map'), 800);
  };

  return (
    <div className="qr-page">
      <div className="qr-bg">
        <div className="qr-orb qr-orb-1"></div>
        <div className="qr-orb qr-orb-2"></div>
      </div>

      <div className="qr-content">
        {/* Park Header */}
        <div className="qr-header animate-fade-in-up">
          <div className="qr-park-badge">🌳</div>
          <h1 className="qr-park-name">{park.name}</h1>
          <p className="qr-park-city">{park.city} • {park.managed_by}</p>
          <div className="qr-live-stats">
            <div className="live-stat">
              <span className="live-dot"></span>
              <span className="live-count">
                {Math.floor(Math.random() * 30) + 15}
              </span>
              <span className="live-label">{t('qr_leaderboard.live_visitors')}</span>
            </div>
            <div className="live-stat">
              <span className="eco-icon">🌱</span>
              <span className="live-count">{todayEcoActions + 47}</span>
              <span className="live-label">{t('qr_leaderboard.eco_actions_today')}</span>
            </div>
          </div>
        </div>

        {/* Champion Spotlight */}
        <div className="champion-card animate-fade-in-up stagger-1">
          <div className="champion-crown">👑</div>
          <div className="champion-info">
            <span className="champion-badge">{t('qr_leaderboard.title')}</span>
            <div className="champion-user">
              <span className="champion-avatar">{leaderboard[0]?.avatar}</span>
              <div>
                <h3>{leaderboard[0]?.displayName}</h3>
                <p>{leaderboard[0]?.points.toLocaleString()} {t('qr_leaderboard.points')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="qr-leaderboard animate-fade-in-up stagger-2">
          <h2>{t('qr_leaderboard.top_players')}</h2>
          <div className="lb-list">
            {leaderboard.slice(0, 10).map((player, idx) => (
              <div key={player.uid} className={`lb-row ${idx < 3 ? 'lb-top3' : ''}`}>
                <span className={`lb-rank rank-${idx + 1}`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </span>
                <span className="lb-avatar">{player.avatar}</span>
                <div className="lb-info">
                  <span className="lb-name">{player.displayName}</span>
                  <span className="lb-stats">{(player.areaClaimed || 0).toLocaleString()}m² • {player.badges} 🏅</span>
                </div>
                <span className="lb-points">{player.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="qr-cta animate-fade-in-up stagger-3">
          <button
            className={`btn btn-primary btn-lg qr-enter-btn ${entering ? 'entering' : ''}`}
            onClick={handleEnterPark}
          >
            {entering ? (
              <span className="enter-loading">
                <span className="spinner"></span>
                Entering...
              </span>
            ) : (
              <>
                <span>🚪</span>
                {t('qr_leaderboard.enter_park')}
              </>
            )}
          </button>
          <p className="qr-join-text">{t('qr_leaderboard.join_now')}</p>
        </div>
      </div>
    </div>
  );
}
