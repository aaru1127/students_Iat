// src/components/LoginForm.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const LoginForm = ({ mode = "login", onModeChange }) => {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axiosInstance.post("/auth/login", { email, password });
        login(res.data.token, res.data.user);
        const role = res.data.user?.role;
        navigate(role === "student" ? "/student-dashboard" : "/teacher-dashboard");
      } else {
       const res = await axiosInstance.post("/auth/signup", {
  name,
  email,
  password,
  role,
  department: "",
  class: "",
  section: "",
});

        login(res.data.token, res.data.user);
        const createdRole = res.data.user?.role;
        navigate(createdRole === "student" ? "/student-dashboard" : "/teacher-dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (isLogin ? "Login failed. Please try again." : "Sign up failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const showLogin = () => onModeChange && onModeChange("login");
  const showSignup = () => onModeChange && onModeChange("signup");

  return (
    <div className="login-form-container">
      <h2 className="login-title">
        {isLogin ? "Welcome Back!" : "Create an account"}
      </h2>
      <p className="login-subtitle">
        {isLogin
          ? "Please enter your details to sign in."
          : "Fill in your details to get started."}
      </p>
      <div className="login-tabs">
        <span
          className={isLogin ? "active" : "inactive"}
          onClick={showLogin}
        >
          Login
        </span>
        <span
          className={!isLogin ? "active" : "inactive"}
          onClick={showSignup}
        >
          Sign Up
        </span>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="input-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <i className="fa-regular fa-user"></i>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="input-group">
          <label>Email Address</label>
          <div className="input-with-icon">
            <i className="fa-regular fa-envelope"></i>
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
          <label>Password</label>
          <div className="input-with-icon">
            <i className="fa-solid fa-lock"></i>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {!isLogin && (
          <div className="input-group">
            <label>Role</label>
            <div className="input-with-icon">
              <i className="fa-solid fa-user-graduate"></i>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ border: "none", background: "transparent", width: "100%" }}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>
        )}

        {isLogin && (
          <div className="login-actions">
            <a href="/forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>
        )}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? (isLogin ? "Signing in..." : "Creating account...") : isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <div className="signup-link">
        {isLogin ? (
          <>
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={showSignup}
              style={{
                border: "none",
                background: "none",
                color: "#4f8cff",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={showLogin}
              style={{
                border: "none",
                background: "none",
                color: "#4f8cff",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
