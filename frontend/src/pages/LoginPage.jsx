import React, { useState } from "react";
import "./LoginPage.css";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../utils/axios.js";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }))
      .unwrap()
      .then(() => {
        toast.success("Login successful 🎉");
        navigate("/");
      })
      .catch((err) => {
        toast.error(err?.message || "Login failed ❌");
      });
  };

  const handleForgotPassword = async () => {
    // Check if email is entered
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Sending OTP to your email...");

    try {
      const response = await axios.post("/api/auth/send-reset-code", {
        email: email,
      });
      
      if (response.data.success) {
        toast.dismiss(loadingToast);
        toast.success("OTP sent to your email! 📧");
        setShowForgotModal(true);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.message || "Failed to send OTP";
      toast.error(errorMessage);
      console.error("Error sending OTP:", error);
    }
  };

  const handleVerifyCode = async (e) => {
  e.preventDefault();
  
  if (!resetCode) {
    toast.error("Please enter the OTP code");
    return;
  }

  if (resetCode.length !== 6) {
    toast.error("OTP must be 6 digits");
    return;
  }

  setIsVerifying(true);
  try {
    const response = await axios.post("/api/auth/verify-reset-code", {
      email: email,
      code: resetCode,
    });
    
    if (response.data.success) {
      toast.success("OTP verified successfully ✅");

      // 🟢 Store user data and token for ProtectedRoute
      const { user, token } = response.data;

      if (token) {
        localStorage.setItem("token", token);  // Store JWT for future requests
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Close modal and reset input
      setShowForgotModal(false);
      setResetCode("");

      // 🔁 Optional: refresh redux/auth state if you use it
      // dispatch(setUser(user)); // if your slice has this

      // ✅ Redirect to profile/homepage instantly
      navigate("/profile");
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || "Invalid or expired OTP";
    toast.error(errorMessage);
    console.error("Verification error:", error);
  } finally {
    setIsVerifying(false);
  }
};


  const handleResendCode = async () => {
    setResetCode(""); // Clear the input
    
    const loadingToast = toast.loading("Resending OTP...");

    try {
      const response = await axios.post("/api/auth/send-reset-code", {
        email: email,
      });
      
      if (response.data.success) {
        toast.dismiss(loadingToast);
        toast.success("New OTP sent! 📧");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to resend OTP");
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetCode("");
  };

  return (
    <>
      <div className="login-container">
        <div className="login-box">
          <h2 className="login-title">Welcome Back</h2>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email address"
                id="email"
                name="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="input-field"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="eye-icon" onClick={togglePassword}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div 
              className="forgot-password" 
              onClick={handleForgotPassword}
              style={{ cursor: 'pointer' }}
            >
              Forgot Password?
            </div>

            <button 
              type="submit" 
              className={`login-btn ${loading ? 'loading' : ''}`} 
              disabled={loading}
            >
              {loading ? "" : "Log In"}
            </button>
          </form>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeForgotModal}>
              <FaTimes />
            </button>
            
            <h3 className="modal-title">Enter OTP</h3>
            
            <form onSubmit={handleVerifyCode}>
              <p className="modal-description">
                We've sent a 6-digit OTP to <strong>{email}</strong>
              </p>
              
              <div className="input-group">
                <FaLock className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  className="input-field"
                  value={resetCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only numbers
                    if (value.length <= 6) {
                      setResetCode(value);
                    }
                  }}
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className={`login-btn ${isVerifying ? 'loading' : ''}`}
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify & Login"}
              </button>
              
              <button 
                type="button" 
                className="resend-btn"
                onClick={handleResendCode}
              >
                Resend OTP
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;