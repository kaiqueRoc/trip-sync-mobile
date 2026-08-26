import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as SecureStorage from "./secure-storage";
import { setAuthToken } from "../api/client";
import type { AuthUser } from "@trip-sync/contracts";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
};

type AuthContextValue = {
  state: AuthState;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "tripsync_token";
const USER_KEY = "tripsync_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    (async () => {
      const [token, userRaw] = await Promise.all([
        SecureStorage.getItem(TOKEN_KEY),
        SecureStorage.getItem(USER_KEY),
      ]);
      if (token && userRaw) {
        setAuthToken(token);
        setState({ user: JSON.parse(userRaw), loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    })();
  }, []);

  async function signIn(token: string, user: AuthUser) {
    await SecureStorage.setItem(TOKEN_KEY, token);
    await SecureStorage.setItem(USER_KEY, JSON.stringify(user));
    setAuthToken(token);
    setState({ user, loading: false });
  }

  async function signOut() {
    await SecureStorage.deleteItem(TOKEN_KEY);
    await SecureStorage.deleteItem(USER_KEY);
    setAuthToken(null);
    setState({ user: null, loading: false });
  }

  return (
    <AuthContext.Provider value={{ state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
