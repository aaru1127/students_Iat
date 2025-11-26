import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import "../global.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const mismatch = newPassword && confirm && newPassword !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mismatch) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axiosInstance.post("/auth/forgot-password", { email, newPassword });
      setSuccess("Password updated. You can now login with the new password.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 720 }}>
        <div className="login-card-right" style={{ width: "100%" }}>
          <div className="login-form-container">
            <h2 className="login-title">Reset Password</h2>
            <p className="login-subtitle">Enter your registered email and choose a new password.</p>

            {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}
            {success && <div className="success-message" style={{ marginBottom: 12 }}>{success}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <i className="fa-regular fa-envelope" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>New Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock" />
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    required
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock" />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirm}
                    required
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>
              {mismatch && (
                <div className="error-message" style={{ marginBottom: 12 }}>
                  Passwords do not match
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading || mismatch}>
                {loading ? "Updating..." : "Update Password"}
              </button>

              <div className="signup-link" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#4f8cff",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
