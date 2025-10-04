import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../axios/api';
import './EmployeeDetail.css';

const fallbackAvatar = 'https://avatar.iran.liara.run/public/46';

const Field = ({ label, value }) => (
  <div className="ed-field">
    <span className="ed-field-label">{label}</span>
    <span className="ed-field-value">{value ?? '—'}</span>
  </div>
);

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector(s => s.auth);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/employees/${id}`);
        if (active) {
          setEmployee(res.data.employee);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load employee');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDetails();
    return () => { active = false; };
  }, [id]);

  if (!currentUser || currentUser.role !== 'hr') {
    return <div className="ed-wrapper"><p className="ed-error">Not authorized</p></div>;
  }

  if (loading) {
    return <div className="ed-wrapper"><div className="ed-loading">Loading...</div></div>;
  }

  if (error) {
    return <div className="ed-wrapper"><p className="ed-error">{error}</p></div>;
  }

  const profile = employee.profile || {};
  const salary = employee.salary || {};
  const avatar = profile.profilePicture || fallbackAvatar;

  return (
    <div className="ed-wrapper">
      <div className="ed-card">
        <div className="ed-header">
          <button className="ed-back" onClick={() => navigate(-1)}>← Back</button>
          <h2 className="ed-title">Employee Profile</h2>
        </div>
        <div className="ed-avatar-box">
          <img src={avatar} alt={employee.name} className="ed-avatar" onError={(e)=>{e.currentTarget.src=fallbackAvatar}} />
          <h3 className="ed-name">{employee.name}</h3>
          <p className="ed-email">{employee.email}</p>
          <span className="ed-badge">{employee.employeeId}</span>
        </div>
        <div className="ed-grid">
          <Field label="Role" value={employee.role} />
          <Field label="Department" value={employee.department} />
          <Field label="Gender" value={profile.gender} />
            <Field label="Phone" value={profile.phone} />
            <Field label="Marital Status" value={profile.maritalStatus} />
            <Field label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : null} />
            <Field label="Salary (Basic)" value={salary.basic ? `₹${salary.basic}` : null} />
            <Field label="Address" value={profile.address} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;
