import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthProvider as DescopeAuthProvider, useDescope, useSession, useUser } from '@descope/react-sdk';

const AuthContext = createContext(null);

// ── Mock mode (no project ID set) ────────────────────────────────────────────
const MOCK_USER = { name: 'Local User', email: 'local@mock.dev', userId: 'mock-user-id' };

function MockAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  const login = (token, userData) => {
    setIsAuthenticated(true);
    setUser(userData || MOCK_USER);
    setSessionToken(token || 'mock-token');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setSessionToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, sessionToken, isAuthenticated, isLoading: false, login, logout, isMockMode: true }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Real Descope mode ─────────────────────────────────────────────────────────
function DescopeInnerProvider({ children }) {
  const { isAuthenticated, isSessionLoading, sessionToken } = useSession();
  const { user, isUserLoading } = useUser();
  const { logout: descopeLogout } = useDescope();

  const logout = async () => {
    await descopeLogout();
  };

  // login is handled by the widget's onSuccess — no manual call needed
  const login = () => {};

  return (
    <AuthContext.Provider value={{
      user,
      sessionToken,
      isAuthenticated,
      isLoading: isSessionLoading || isUserLoading,
      login,
      logout,
      isMockMode: false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Root provider — switches mode based on env ────────────────────────────────
export function AuthProvider({ children }) {
  const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID;

  if (!projectId) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return (
    <DescopeAuthProvider projectId={projectId}>
      <DescopeInnerProvider>{children}</DescopeInnerProvider>
    </DescopeAuthProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
