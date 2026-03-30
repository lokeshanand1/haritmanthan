import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext();

// Simulated user database
const DEMO_USERS = {
  'demo@ecoguardian.app': { uid: 'user-demo-001', email: 'demo@ecoguardian.app', displayName: 'Demo Explorer', password: 'demo1234', role: 'user', avatar: '🌿' },
  'admin@ecoguardian.app': { uid: 'user-admin-001', email: 'admin@ecoguardian.app', displayName: 'DDA Admin', password: 'admin1234', role: 'admin', avatar: '🛡️' },
  'user2@eco.app': { uid: 'user-002', email: 'user2@eco.app', displayName: 'Green Walker', password: '1234', role: 'user', avatar: '🌳' },
  'user3@eco.app': { uid: 'user-003', email: 'user3@eco.app', displayName: 'Nature Scout', password: '1234', role: 'user', avatar: '🦋' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('eco_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('eco_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('eco_user');
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const u = DEMO_USERS[email];
    if (u && u.password === password) {
      const { password: _, ...userData } = u;
      setUser(userData);
      setLoading(false);
      return userData;
    }
    setLoading(false);
    throw new Error('Invalid email or password');
  }, []);

  const register = useCallback(async (email, displayName, password) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const newUser = {
      uid: 'user-' + Date.now(),
      email,
      displayName,
      role: 'user',
      avatar: '🌱',
    };
    DEMO_USERS[email] = { ...newUser, password };
    setUser(newUser);
    setLoading(false);
    return newUser;
  }, []);

  const demoLogin = useCallback(async () => {
    return login('demo@ecoguardian.app', 'demo1234');
  }, [login]);

  const adminLogin = useCallback(async () => {
    return login('admin@ecoguardian.app', 'admin1234');
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('eco_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, adminLogin, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
