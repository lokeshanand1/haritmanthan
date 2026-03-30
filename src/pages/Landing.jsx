import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import './Landing.css';

export default function Landing() {
  const { login, register, demoLogin, adminLogin, loading } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState('home'); // home | login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/map');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, name, password);
      navigate('/map');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemoLogin = async () => {
    await demoLogin();
    navigate('/map');
  };

  const handleAdminLogin = async () => {
    await adminLogin();
    navigate('/admin');
  };

  const handleScanQR = () => {
    // Simulate QR scan → navigate to park leaderboard
    navigate('/park/indraprastha-park');
  };

  if (mode === 'login' || mode === 'register') {
    return (
      <div className="landing-page">
        <div className="landing-bg-effects">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
          <div className="bg-orb bg-orb-3"></div>
        </div>
        <div className="auth-container animate-fade-in-up">
          <button className="back-btn" onClick={() => setMode('home')} aria-label="Back">
            ← {t('common.back')}
          </button>
          <div className="auth-header">
            <span className="auth-logo">🛡️</span>
            <h1>{mode === 'login' ? t('landing.login') : t('landing.register')}</h1>
          </div>
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="auth-form">
            {mode === 'register' && (
              <input
                type="text"
                className="input"
                placeholder="Display Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                aria-label="Display name"
              />
            )}
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              aria-label="Email"
            />
            <input
              type="password"
              className="input"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={4}
              aria-label="Password"
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? '...' : mode === 'login' ? t('landing.login') : t('landing.register')}
            </button>
          </form>
          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button className="link-btn" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? t('landing.register') : t('landing.login')}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-bg-effects">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}>🌿</div>
          ))}
        </div>
      </div>

      <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
        {lang === 'en' ? 'हिं' : 'EN'}
      </button>

      <div className="landing-content">
        <div className="landing-hero animate-fade-in-up">
          <div className="hero-logo animate-float">
            <span className="logo-shield">🛡️</span>
            <div className="logo-glow"></div>
          </div>
          <h1 className="hero-title">{t('landing.title')}</h1>
          <p className="hero-subtitle">{t('landing.subtitle')}</p>
        </div>

        <div className="landing-actions animate-fade-in-up stagger-2">
          <button className="btn btn-primary btn-lg scan-btn" onClick={handleScanQR}>
            <span className="btn-emoji">📱</span>
            {t('landing.scan_qr')}
          </button>

          <div className="divider">
            <span>{t('landing.or')}</span>
          </div>

          <button className="btn btn-secondary btn-lg" onClick={() => setMode('login')}>
            {t('landing.login')}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => setMode('register')}>
            {t('landing.register')}
          </button>
        </div>

        <div className="landing-features animate-fade-in-up stagger-3">
          {[
            { icon: '🗺️', key: 'claim' },
            { icon: '📋', key: 'report' },
            { icon: '🏆', key: 'earn' },
            { icon: '🛡️', key: 'safe' },
          ].map(f => (
            <div key={f.key} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div>
                <h3>{t(`landing.features.${f.key}`)}</h3>
                <p>{t(`landing.features.${f.key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="landing-quick animate-fade-in-up stagger-4">
          <button className="btn btn-primary demo-btn" onClick={handleDemoLogin}>
            ⚡ {t('landing.demo_login')}
          </button>
          <button className="btn btn-ghost demo-btn" onClick={handleAdminLogin}>
            🔐 Admin Demo
          </button>
        </div>
      </div>
    </div>
  );
}
