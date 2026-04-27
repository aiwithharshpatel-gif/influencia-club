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
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
        setRole(response.data.role);
      }
    } catch (error) {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      setUser(response.data.creator);
      setRole('creator');
      return response.data;
    }
    return response.data;
  };

  const adminLogin = async (email, password) => {
    const response = await api.post('/auth/admin-login', { email, password });
    if (response.data.success) {
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
      setUser(response.data.creator);
      setRole('creator');
    }
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRole(null);
    }
  };

  const value = {
    user,
    role,
    loading,
    login,
    adminLogin,
    register,
    verifyOTP,
    logout,
    isAuthenticated: !!user,
    isAdmin: role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
