import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, tokenStore } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(() => !tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  // Any 401 (expired token) signs the person out everywhere.
  useEffect(() => {
    const onUnauthorized = () => {
      tokenStore.set(null);
      setUser(null);
    };
    window.addEventListener("skillport:unauthorized", onUnauthorized);
    return () => window.removeEventListener("skillport:unauthorized", onUnauthorized);
  }, []);

  const startSession = useCallback(({ token, user }) => {
    tokenStore.set(token);
    setUser(user);
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      setUser,
      login: async (data) => startSession(await api.login(data)),
      register: async (data) => startSession(await api.register(data)),
      logout: () => {
        tokenStore.set(null);
        setUser(null);
      },
    }),
    [user, ready, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
