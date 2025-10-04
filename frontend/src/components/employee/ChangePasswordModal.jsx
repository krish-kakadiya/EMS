import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword, clearChangePasswordState } from '../../redux/slices/authSlice';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

const Field = ({ label, name, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="cp-modal-field">
      <label>{label}</label>
      <div className="cp-modal-input-wrap">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          required
        />
        <button type="button" className="cp-modal-eye" onClick={() => setShow(s => !s)}>
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { changingPassword, changePasswordMessage, error } = useSelector(s => s.auth);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Clear previous state when modal mounts
  useEffect(() => {
    dispatch(clearChangePasswordState());
  }, [dispatch]);

  useEffect(() => {
    if (changePasswordMessage) {
      alert(changePasswordMessage);
      onClose();
    }
  }, [changePasswordMessage, onClose]);

  // Could show error via alert or toast if desired

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    const { currentPassword, newPassword, confirmPassword } = form;
    if (!currentPassword || !newPassword || !confirmPassword) return 'All fields required';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    if (newPassword.length < 8) return 'Password must be at least 8 characters';
    const strength = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strength.test(newPassword)) return 'Include upper, lower, number & special character';
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    dispatch(changePassword(form));
  };

  return (
    <div className="cp-modal-overlay">
      <div className="cp-modal">
        <div className="cp-modal-header">
          <h3>Change Password</h3>
          <button className="cp-modal-close" onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit} className="cp-modal-form">
          <Field label="Current Password" name="currentPassword" value={form.currentPassword} onChange={handleChange} />
          <Field label="New Password" name="newPassword" value={form.newPassword} onChange={handleChange} />
          <Field label="Confirm New Password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
          <div className="cp-modal-hint">Must be 8+ chars with upper, lower, number & special.</div>
          {error && <div className="cp-modal-error">{error}</div>}
          <div className="cp-modal-actions">
            <button type="button" className="cp-modal-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="cp-modal-submit" disabled={changingPassword}>{changingPassword ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
