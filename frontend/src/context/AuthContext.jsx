import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check query parameter for impersonation token
      const urlParams = new URLSearchParams(window.location.search);
      const impToken = urlParams.get('impersonate_token');
      if (impToken) {
        const currentToken = localStorage.getItem('token') || localStorage.getItem('clinic_token') || localStorage.getItem('auth_token');
        if (currentToken && !sessionStorage.getItem('superadmin_backup_token') && !localStorage.getItem('backup_superadmin_token')) {
          sessionStorage.setItem('superadmin_backup_token', currentToken);
          localStorage.setItem('backup_superadmin_token', currentToken);
          localStorage.setItem('superadmin_backup_token', currentToken);
        }
        localStorage.setItem('token', impToken);
        localStorage.setItem('clinic_token', impToken);
        localStorage.setItem('auth_token', impToken);
        localStorage.setItem('is_impersonating', 'true');

        // Clean query parameter from URL without page reload
        const cleanPath = window.location.pathname || '/dashboard';
        window.history.replaceState({}, document.title, cleanPath);
      }

      const token = localStorage.getItem('token') || localStorage.getItem('clinic_token') || localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Synchronize all auth token keys for cross-component compatibility
      localStorage.setItem('token', token);
      localStorage.setItem('clinic_token', token);
      localStorage.setItem('auth_token', token);

      try {
        const data = await authApi.me();
        if (data && data.user) {
          setUser(data.user);
          setTenant(data.tenant);
          if (data.tenant?.name) {
            localStorage.setItem('impersonating_clinic_name', data.tenant.name);
          }
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          if (data.tenant) {
            localStorage.setItem('tenant', JSON.stringify(data.tenant));
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('clinic_token');
          localStorage.removeItem('auth_token');
          setUser(null);
          setTenant(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('clinic_token');
        localStorage.removeItem('auth_token');
        setUser(null);
        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, tenantData, token) => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('clinic_token', token);
      localStorage.setItem('auth_token', token);
    }
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
    if (tenantData) localStorage.setItem('tenant', JSON.stringify(tenantData));
    setUser(userData);
    setTenant(tenantData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('is_impersonating');
      localStorage.removeItem('impersonating_clinic_name');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      setUser(null);
      setTenant(null);
    }
  };

  const value = {
    user,
    tenant,
    isLoading,
    loading: isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

