import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      if (!token) return null;
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [role, setRole] = useState(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) return null;
    return localStorage.getItem('role') || null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) {
      setUser(null);
      setRole(null);
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        setRole(response.data.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('role', response.data.role);
      } else {
        throw new Error('Auth check failed');
      }
    } catch (error) {
      setUser(null);
      setRole(null);
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const token = response.data.token || response.data.accessToken;
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.creator));
      localStorage.setItem('role', 'creator');
      setUser(response.data.creator);
      setRole('creator');
      return response.data;
    }
    return response.data;
  };

  const adminLogin = async (email, password) => {
    const response = await api.post('/auth/admin-login', { email, password });
    if (response.data.success) {
      const token = response.data.token || response.data.adminToken;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('adminToken', token);
      }
      localStorage.setItem('user', JSON.stringify(response.data.admin));
      localStorage.setItem('role', 'admin');
      setUser(response.data.admin);
      setRole('admin');
      return response.data;
    }
    return response.data;
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    return response.data;
  };

  const verifyOTP = async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    if (response.data.success) {
      const token = response.data.token || response.data.accessToken;
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(response.data.creator));
      localStorage.setItem('role', 'creator');
      setUser(response.data.creator);
      setRole('creator');
    }
    return response.data;
  };

  const brandLogin = async (email) => {
    const response = await api.post('/auth/brand-login', { email });
    return response.data;
  };

  const brandVerifyOTP = async (email, otp) => {
    const response = await api.post('/auth/brand-verify', { email, otp });
    if (response.data.success) {
      const token = response.data.token || response.data.accessToken;
      if (token) localStorage.setItem('token', token);
      const brandUser = response.data.user || {
        email,
        brandName: response.data.brandName || 'Brand Partner',
        role: 'brand'
      };
      localStorage.setItem('user', JSON.stringify(brandUser));
      localStorage.setItem('role', 'brand');
      setUser(brandUser);
      setRole('brand');
    }
    return response.data;
  };

  const setAuthSession = (sessionUser, sessionRole, sessionToken) => {
    if (sessionToken) localStorage.setItem('token', sessionToken);
    if (sessionUser) localStorage.setItem('user', JSON.stringify(sessionUser));
    if (sessionRole) localStorage.setItem('role', sessionRole);
    setUser(sessionUser);
    setRole(sessionRole);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    sessionStorage.clear();
    setUser(null);
    setRole(null);

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout notification failed or completed:', error.message);
    }
  };

  const value = {
    user,
    role,
    loading,
    login,
    adminLogin,
    brandLogin,
    brandVerifyOTP,
    register,
    verifyOTP,
    setAuthSession,
    logout,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isBrand: role === 'brand'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

