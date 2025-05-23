import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 dodat loading flag

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        setUser(decoded);
        setToken(savedToken);
      } catch {
        localStorage.removeItem("token");
      }
    }
    setLoading(false); // 👈 kad završi proveru
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(
        `${API_BASE}/auth/login`,
        new URLSearchParams({
          username: email,
          password: password,
        }),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      const accessToken = res.data.access_token;
      const decoded = jwtDecode(accessToken);
      localStorage.setItem("token", accessToken);
      setToken(accessToken);
      setUser(decoded);
      return decoded; // 👈 vraćamo korisnika
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
