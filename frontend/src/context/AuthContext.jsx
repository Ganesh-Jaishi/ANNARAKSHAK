/**
 * Auth Context — manages JWT auth state across the app.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('annarakshak_token');
    const savedUser = localStorage.getItem('annarakshak_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('annarakshak_token', res.access_token);
    localStorage.setItem('annarakshak_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const register = async (data) => {
    const res = await api.register(data);
    localStorage.setItem('annarakshak_token', res.access_token);
    localStorage.setItem('annarakshak_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('annarakshak_token');
    localStorage.removeItem('annarakshak_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
