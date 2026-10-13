import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!sessionStorage.getItem('equivest_token')) {
      setIsLoading(false);
      return () => { active = false; };
    }
    authApi.getCurrentUser()
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch(() => { sessionStorage.removeItem('equivest_token'); if (active) setUser(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const acceptSession = useCallback(({ user: nextUser, token }) => {
    sessionStorage.setItem('equivest_token', token);
    setUser(nextUser);
    return nextUser;
  }, []);
  const signIn = useCallback(async (credentials) => acceptSession(await authApi.login(credentials)), [acceptSession]);
  const signUp = useCallback(async (data) => acceptSession(await authApi.register(data)), [acceptSession]);
  const signOut = useCallback(() => {
    sessionStorage.removeItem('equivest_token');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isLoading, signIn, signUp, signOut }), [user, isLoading, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
