import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const clearSession = () => { sessionStorage.removeItem('equivest_token'); if (active) setUser(null); };
    window.addEventListener('equivest:session-expired', clearSession);
    authApi.getCurrentUser()
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch(() => { sessionStorage.removeItem('equivest_token'); if (active) setUser(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; window.removeEventListener('equivest:session-expired', clearSession); };
  }, []);

  const acceptSession = useCallback(({ user: nextUser }) => {
    sessionStorage.removeItem('equivest_token');
    setUser(nextUser);
    return nextUser;
  }, []);
  const signIn = useCallback(async (credentials) => acceptSession(await authApi.login(credentials)), [acceptSession]);
  const signUp = useCallback(async (data) => acceptSession(await authApi.register(data)), [acceptSession]);
  const signOut = useCallback(async () => {
    try { await authApi.logout(); } catch { /* The local session still closes if the server is unreachable. */ }
    finally { sessionStorage.removeItem('equivest_token'); setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, isLoading, signIn, signUp, signOut }), [user, isLoading, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
