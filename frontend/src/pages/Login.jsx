// src/pages/Login.jsx
import React, { useState } from "react";
import AuthIllustration from "../components/AuthIllustration";
import LoginForm from "../components/LoginForm";
import "../global.css";

const Login = ({ initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode); // "login" | "signup"

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-left">
          <AuthIllustration />
        </div>
        <div className="login-card-right">
          <LoginForm mode={mode} onModeChange={setMode} />
        </div>
      </div>
    </div>
  );
};

export default Login;
