import { NavLink, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import './BottomNav.css';

export default function BottomNav() {
  const { t } = useLang();
  const location = useLocation();

  const items = [
    { path: '/map', icon: '🗺️', label: 'Map' },
    { path: '/leaderboard', icon: '🏆', label: 'Ranks' },
    { path: '/eco-actions', icon: '🌱', label: 'Eco' },
    { path: '/safety', icon: '🛡️', label: 'Safety' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {items.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
