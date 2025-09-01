import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";
import { queryClient } from "./config/queryClient";
import { getDisplayName } from "./utils/userUtils";
import "./App.css";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Profile = lazy(() => import("./pages/Profile"));
const TransactionsHistory = lazy(() => import("./pages/TransactionsHistory"));

// Query client is now imported from config

const NavBar = React.memo(() => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          Smart Investor
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/portfolio" className="nav-link">
              Portfolio
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/transactions" className="nav-link">
              Transactions
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
          </li>
          <li className="nav-item">
            <span className="nav-link user-info">
              {getDisplayName(user)} (${user?.cash?.toFixed(2) || 0})
            </span>
          </li>
          <li className="nav-item">
            <button onClick={logout} className="nav-link logout-button">
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
});

function AppContent() {
  return (
    <ProtectedRoute>
      <div className="App">
        <NavBar />
        <main className="main-content">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/transactions" element={<TransactionsHistory />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  style: {
                    background: "#10b981",
                  },
                },
                error: {
                  style: {
                    background: "#ef4444",
                  },
                },
              }}
            />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
