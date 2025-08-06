import React, { useState } from 'react';
import './LoginPage.css';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">LOGIN</h2>

        <div className="input-group">
          <FaEnvelope className="input-icon" />
          <input type="email" placeholder="EMAIL" className="input-field" />
        </div>

        <div className="input-group">
          <FaLock className="input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="PASSWORD"
            className="input-field"
          />
          <span className="eye-icon" onClick={togglePassword}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="forgot-password">FORGOT PASSWORD</div>

        <button className="login-btn">LOGIN</button>
      </div>
    </div>
  );
};

export default LoginPage;
