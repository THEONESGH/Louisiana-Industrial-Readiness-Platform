import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = anon, obj = user
  useEffect(() => {
    api.get("/auth/me").then(r => setUser(r.data)).catch(() => setUser(false));
  }, []);
  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    setUser(r.data); return r.data;
  };
  const register = async (payload) => {
    const r = await api.post("/auth/register", payload);
    setUser(r.data); return r.data;
  };
  const logout = async () => { try { await api.post("/auth/logout"); } catch (e) {} setUser(false); };
  return <AuthCtx.Provider value={{ user, setUser, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
