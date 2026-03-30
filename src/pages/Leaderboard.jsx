import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLang } from '../context/LanguageContext';
import './Leaderboard.css';

export default function Leaderboard() {
  const { user } = useAuth();
  const { leaderboard, userStats, getUserRank, badges, dailyChallenges } = useGame();
  const { t, lang } = useLang();
  const [tab, setTab] = useState('leaderboard'); // leaderboard | challenges | badges

  const userRank = getUserRank(user.uid);

  const allPlayers = [
    ...leaderboard,
    { uid: user.uid, displayName: user.displayName, avatar: user.avatar || '🌿', points: userStats.points, areaClaimed: userStats.areaClaimed, badges: userStats.badges.length }
  ].sort((a, b) => b.points - a.points);

  return (
    <div className="page lb-page">
      <div className="page-header">
        <h1 className="page-title">🏆 {t('leaderboard.title')}</h1>
      </div>

      <div className="page-content">
        {/* Your Rank Card */}
        <div className="your-rank-card">
          <div className="rank-circle">
            <span className="rank-num">#{userRank}</span>
          </div>
          <div className="rank-info">
            <h3>{user.displayName}</h3>
            <div className="rank-stats">
              <span>⭐ {userStats.points} {t('leaderboard.points')}</span>
              <span>📐 {userStats.areaClaimed.toLocaleString()}m²</span>
              <span>🏅 {userStats.badges.length} {t('leaderboard.badges')}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="lb-tabs">
          <button className={`lb-tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>
            Rankings
          </button>
          <button className={`lb-tab ${tab === 'challenges' ? 'active' : ''}`} onClick={() => setTab('challenges')}>
            Challenges
          </button>
          <button className={`lb-tab ${tab === 'badges' ? 'active' : ''}`} onClick={() => setTab('badges')}>
            Badges
          </button>
        </div>

        {/* Leaderboard Tab */}
        {tab === 'leaderboard' && (
          <div className="lb-list-full">
            {/* Top 3 Podium */}
            <div className="podium">
              {allPlayers.slice(0, 3).map((p, i) => (
                <div key={p.uid} className={`podium-item podium-${i + 1} ${p.uid === user.uid ? 'podium-you' : ''}`}>
                  <span className="podium-medal">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <span className="podium-avatar">{p.avatar}</span>
                  <span className="podium-name">{p.uid === user.uid ? 'You' : p.displayName}</span>
                  <span className="podium-pts">{p.points.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Rest of list */}
            {allPlayers.slice(3).map((p, i) => (
              <div key={p.uid} className={`lb-row-full ${p.uid === user.uid ? 'lb-row-you' : ''}`}>
                <span className="lb-rank-num">#{i + 4}</span>
                <span className="lb-a">{p.avatar}</span>
                <div className="lb-inf">
                  <span className="lb-n">{p.uid === user.uid ? 'You' : p.displayName}</span>
                  <span className="lb-s">{(p.areaClaimed || 0).toLocaleString()}m²</span>
                </div>
                <span className="lb-p">{p.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Challenges Tab */}
        {tab === 'challenges' && (
          <div className="challenges-list">
            <h3>{t('leaderboard.daily_challenges')}</h3>
            {dailyChallenges.map(ch => {
              const progress = userStats.challengeProgress[ch.type] || 0;
              const pct = Math.min(100, (progress / ch.target) * 100);
              return (
                <div key={ch.id} className="challenge-card">
                  <div className="challenge-header">
                    <span className="challenge-icon">{ch.icon}</span>
                    <div className="challenge-info">
                      <span className="challenge-title">{lang === 'hi' ? ch.titleHi : ch.title}</span>
                      <span className="challenge-reward">+{ch.reward} pts</span>
                    </div>
                    {pct >= 100 && <span className="challenge-done">✅</span>}
                  </div>
                  <div className="challenge-bar">
                    <div className="challenge-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="challenge-progress">{progress}/{ch.target}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Badges Tab */}
        {tab === 'badges' && (
          <div className="badges-grid">
            {badges.map(badge => {
              const earned = userStats.badges.includes(badge.id);
              return (
                <div key={badge.id} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{lang === 'hi' ? badge.nameHi : badge.name}</span>
                  <span className="badge-desc">{badge.desc}</span>
                  {earned && <span className="badge-earned-tag">Earned!</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
