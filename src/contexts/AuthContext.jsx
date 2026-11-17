import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize session and listen for auth changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        setLoading(true);
        const currentSession = await authService.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error initializing auth:', err);
          setAuthError(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Subscribe to auth state change events
    const subscription = authService.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const data = await authService.signIn(email, password);
      setSession(data.session);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    loading,
    authError,
    setAuthError,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

