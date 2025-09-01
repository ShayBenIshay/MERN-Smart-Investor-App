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
  withCredentials: true, // Important for cookies
});

// Remove the token interceptor since we're using cookies now

// Handle token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await api.post("/auth/refresh", { refreshToken });
          const { accessToken } = response.data;

          localStorage.setItem("accessToken", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  getCurrentUser: () => api.get("/auth/me"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
};

// Transactions API
export const transactionsAPI = {
  getAll: (filters = {}, page = 1, limit = 20) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    return api.get(`/transactions?${params.toString()}`);
  },
  getAllWithoutPagination: () => api.get("/transactions?limit=1000"), // Get all transactions
  create: (transactionData) => api.post("/transactions", transactionData),
  getById: (id) => api.get(`/transactions/${id}`),
  update: (id, transactionData) =>
    api.put(`/transactions/${id}`, transactionData),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export default api;
