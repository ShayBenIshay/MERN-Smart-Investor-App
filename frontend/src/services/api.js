import axios from "axios";

// Determine API base URL
const isProduction = 
  process.env.NODE_ENV === "production" || 
  window.location.hostname !== "localhost";

const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  (isProduction ? "/api" : "http://localhost:5000/api");

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
};

// Transactions API
export const transactionsAPI = {
  getAll: () => api.get("/transactions"),
  create: (transactionData) => api.post("/transactions", transactionData),
  getById: (id) => api.get(`/transactions/${id}`),
  update: (id, transactionData) =>
    api.put(`/transactions/${id}`, transactionData),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export default api;
