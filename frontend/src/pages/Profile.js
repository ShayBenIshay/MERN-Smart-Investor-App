import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";
import "./Profile.css";

function Profile() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    cash: user?.cash || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear messages when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      cash: user?.cash || 0,
    });
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      cash: user?.cash || 0,
    });
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Basic validation
      if (!formData.email || !formData.email.includes("@")) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      if (isNaN(formData.cash) || formData.cash === "") {
        setError("Please enter a valid cash amount");
        setLoading(false);
        return;
      }

      await authAPI.updateProfile(formData);
      await refreshUser();

      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="profile-container">
        <h1>User Profile</h1>

        {error && <div className="message error-message">{error}</div>}
        {success && <div className="message success-message">{success}</div>}

        <div className="profile-card">
          <h2>Personal Information</h2>

          <div className="profile-field">
            <label>Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="edit-input"
                required
              />
            ) : (
              <div className="field-value">{user?.email}</div>
            )}
          </div>

          <div className="profile-field">
            <label>First Name</label>
            {isEditing ? (
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className="edit-input"
              />
            ) : (
              <div className="field-value">{user?.firstName || "Not set"}</div>
            )}
          </div>

          <div className="profile-field">
            <label>Last Name</label>
            {isEditing ? (
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className="edit-input"
              />
            ) : (
              <div className="field-value">{user?.lastName || "Not set"}</div>
            )}
          </div>

          <div className="profile-field">
            <label>Cash Balance</label>
            {isEditing ? (
              <input
                type="number"
                name="cash"
                value={formData.cash}
                onChange={handleChange}
                placeholder="Enter cash amount"
                className="edit-input"
                step="0.01"
              />
            ) : (
              <div className="field-value cash-balance">
                ${user?.cash?.toFixed(2) || "0.00"}
              </div>
            )}
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="save-button"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={handleEdit} className="edit-button">
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
