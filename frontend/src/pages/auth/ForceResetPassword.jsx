import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, getCurrentUser, clearResetPasswordState } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import {FaEye , FaEyeSlash} from "react-icons/fa";
import './ForceResetPassword.css';

const ForceResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, resettingPassword, resetPasswordMessage, error } = useSelector(s => s.auth);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: '' });

  useEffect(() => {
    // Clear previous state
    dispatch(clearResetPasswordState());
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  useEffect(() => {
    if (user && !user.passwordResetRequired) {
      navigate('/profile', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!newPassword || !confirmPassword) {
      return setLocalError('Please fill all fields');
    }
    if (newPassword !== confirmPassword) {
      return setLocalError('Passwords do not match');
    }
    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strengthRegex.test(newPassword)) {
      return setLocalError('Password must have upper, lower, number, special char and be 8+ chars');
    }

    const result = await dispatch(resetPassword({ newPassword, confirmPassword }));
    if (result.meta.requestStatus === 'fulfilled') {
      // refresh user to clear flag
      await dispatch(getCurrentUser());
      navigate('/profile', { replace: true });
    }
  };

  // Basic password strength evaluation
  useEffect(() => {
    if (!newPassword) {
      setStrength({ score: 0, label: '' });
      return;
    }
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    const labels = ['Very Weak','Weak','Fair','Good','Strong','Very Strong'];
    setStrength({ score, label: labels[score] || '' });
  }, [newPassword]);

  return (
    <div className="force-reset-wrapper">
      <form onSubmit={handleSubmit} className="force-reset-form">
        <h2 className="force-reset-title">Set New Password</h2>
        <p className="force-reset-subtext">Your account requires a password reset before continuing.</p>

        {localError && <div className="force-reset-alert error">{localError}</div>}
        {error && <div className="force-reset-alert error">{error}</div>}
        {resetPasswordMessage && <div className="force-reset-alert success">{resetPasswordMessage}</div>}

        <label className="force-reset-label" htmlFor="newPassword">New Password</label>
        <div className="fr-field-wrapper">
          <input
            id="newPassword"
            className="force-reset-input"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter strong password"
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showNew ? 'Hide password' : 'Show password'}
            className="fr-eye-btn"
            onClick={() => setShowNew(p => !p)}
          >
            {showNew ?  <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        {newPassword && (
          <div className="fr-strength">
            <div className={`fr-strength-bar score-${strength.score}`}></div>
            <span className="fr-strength-label">{strength.label}</span>
          </div>
        )}

        <label className="force-reset-label" htmlFor="confirmPassword">Confirm Password</label>
        <div className="fr-field-wrapper">
          <input
            id="confirmPassword"
            className="force-reset-input"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            className="fr-eye-btn"
            onClick={() => setShowConfirm(p => !p)}
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button disabled={resettingPassword} type="submit" className="force-reset-submit">
          {resettingPassword ? 'Updating...' : 'Update Password'}
        </button>
        <p className="force-reset-info">Password must contain at least 8 characters including uppercase, lowercase, number and special character.</p>
      </form>
    </div>
  );
};

export default ForceResetPassword;