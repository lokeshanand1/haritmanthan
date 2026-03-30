import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useGame } from './context/GameContext';
import Landing from './pages/Landing';
import QRLeaderboard from './pages/QRLeaderboard';
import ParkMap from './pages/ParkMap';
import Report from './pages/Report';
import EcoActions from './pages/EcoActions';
import Safety from './pages/Safety';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';

function App() {
  const { user, isAdmin } = useAuth();
  const { toast } = useGame();
  const location = useLocation();

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/map" /> : <Landing />} />
        <Route path="/park/:parkId" element={<QRLeaderboard />} />
        <Route path="/map" element={user ? <ParkMap /> : <Navigate to="/" />} />
        <Route path="/report" element={user ? <Report /> : <Navigate to="/" />} />
        <Route path="/eco-actions" element={user ? <EcoActions /> : <Navigate to="/" />} />
        <Route path="/safety" element={user ? <Safety /> : <Navigate to="/" />} />
        <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
        <Route path="/admin/*" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
      </Routes>
      {user && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/park/') && location.pathname !== '/' && <BottomNav />}
    </>
  );
}

export default App;
