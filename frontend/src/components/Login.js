import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      // Login successful - user will be redirected by App component
      console.log("Login successful");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to Smart Investor</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Don't have an account?{" "}
            <button onClick={onSwitchToSignup} className="switch-button">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
