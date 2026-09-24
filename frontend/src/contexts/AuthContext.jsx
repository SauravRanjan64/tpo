import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'STUDENT' | 'ADMIN' | 'COMPANY'
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Load session from backend HttpOnly cookie on mount
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await authApi.getMe();
      if (res?.user) {
        setUser(res.user);
        setRole(res.user.role);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const res = await authApi.login(email, password);
      if (res?.user) {
        if (res?.token) {
          localStorage.setItem('dcrust_token', res.token);
        }
        setUser(res.user);
        setRole(res.user.role);
        showToast({
          type: 'success',
          title: 'Welcome Back',
          message: `Logged in as ${res.user.name} (${res.user.role})`
        });
        return { success: true, user: res.user };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast({ type: 'error', title: 'Login Error', message: msg });
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout request failed', err);
    } finally {
      localStorage.removeItem('dcrust_token');
      setUser(null);
      setRole(null);
      showToast({ type: 'info', title: 'Logged Out', message: 'You have been safely signed out.' });
    }
  };

  const acceptConsent = async () => {
    try {
      const res = await authApi.giveConsent(true);
      if (res?.user) {
        setUser(res.user);
      } else if (user) {
        setUser({ ...user, consentGiven: true });
      }
      showToast({
        type: 'success',
        title: 'Consent Acknowledged',
        message: 'Placement participation terms accepted.'
      });
      return true;
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Unable to save consent. Please try again.'
      });
      return false;
    }
  };

  const refreshUser = async () => {
    await checkSession();
  };

  const isAuthenticated = !!user;
  const hasConsent = role !== 'STUDENT' || Boolean(user?.consentGiven);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        hasConsent,
        login,
        logout,
        acceptConsent,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
