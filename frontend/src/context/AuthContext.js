import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check if user is logged in on app start
  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      setError("Session expired. Please login again.");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError("");
      setLoading(true);

      const response = await authAPI.login({ email, password });
      const { user } = response.data;

      setUser(user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, cash = 0) => {
    try {
      setError("");
      setLoading(true);

      const response = await authAPI.register({ email, password, cash });
      const { user } = response.data;

      setUser(user);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setError("");
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
