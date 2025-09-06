import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cash, setCash] = useState(0);
  const [formError, setFormError] = useState("");
  const { register, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email) {
      setFormError("Email is required");
      return;
    }

    // In production, password is required
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && (!password || !confirmPassword)) {
      setFormError("Password fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (isProduction && password.length < 3) {
      setFormError("Password must be at least 3 characters");
      return;
    }

    if (cash < 0) {
      setFormError("Initial cash amount cannot be negative");
      return;
    }

    const result = await register(email, password, cash);
    if (result.success) {
      // Registration successful - user will be redirected by App component
      console.log("Registration successful");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up for Smart Investor</h2>

        {(error || formError) && (
          <div className="error-message">{formError || error}</div>
        )}

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
              required={process.env.NODE_ENV === "production"}
              placeholder={
                process.env.NODE_ENV === "production"
                  ? "Enter your password (min 3 characters)"
                  : "Password (optional in dev)"
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={process.env.NODE_ENV === "production"}
              placeholder={
                process.env.NODE_ENV === "production"
                  ? "Confirm your password"
                  : "Confirm password (optional in dev)"
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="cash">Initial Cash Amount ($)</label>
            <input
              type="number"
              id="cash"
              value={cash}
              onChange={(e) => setCash(Number(e.target.value))}
              min="0"
              step="0.01"
              placeholder="Enter initial cash amount (optional)"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="switch-button">
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
