import React, { useState, useEffect } from "react";
import "./EmployeeProfile.css";
import Navbar from "../../components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { FaEye, FaEyeSlash, FaUser, FaCamera, FaCalendarAlt, FaEdit } from "react-icons/fa";
import {
  applyLeave,
  getMyLeaves,
  clearMessages,
} from "../../redux/slices/leaveSlice";
import { getCurrentUser } from "../../redux/slices/authSlice";

const EmployeeProfile = () => {
  const [profileImg, setProfileImg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  const [leaveForm, setLeaveForm] = useState({
    type: "",
    reason: "",
    fromDate: "",
    toDate: "",
  });

  const { user } = useSelector((state) => state.auth);
  const { myLeaves, loading, error, success } = useSelector(
    (state) => state.leave
  );

  const dispatch = useDispatch();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImg(URL.createObjectURL(e.target.files[0]));
    }
  };

  useEffect(() => {
    if (!user?.salary) {
      dispatch(getCurrentUser());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    dispatch(getMyLeaves());
  }, [dispatch, user]);

  const handleChange = (e) => {
    setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
  };

  const handleApplyLeave = () => {
    if (!leaveForm.type || !leaveForm.reason || !leaveForm.fromDate || !leaveForm.toDate) {
      alert("Please fill all fields");
      return;
    }
    dispatch(applyLeave(leaveForm)).then(() => {
      dispatch(getMyLeaves());
      setLeaveForm({ type: "", reason: "", fromDate: "", toDate: "" });
    });
  };

  const calculateSalary = (basicSalary) => {
    const allowances = basicSalary * 0.47;
    const deductions = 0;
    const grossSalary = basicSalary + allowances;
    const netSalary = grossSalary - deductions;

    return {
      allowances: Math.round(allowances),
      deductions: Math.round(deductions),
      grossSalary: Math.round(grossSalary),
      netSalary: Math.round(netSalary),
      basicSalary
    };
  };

  useEffect(() => {
    if (success) {
      alert(success);
      dispatch(clearMessages());
    }
    if (error) {
      alert(error);
      dispatch(clearMessages());
    }
  }, [success, error, dispatch]);

  return (
    <div className="profile-container">
      <Navbar />

      {/* Enhanced Profile Header */}
      <div className="profile-header">
        <div className="profile-photo-section">
          <div className="photo-wrapper">
            <img
              src={profileImg || "https://avatar.iran.liara.run/public/17"}
              alt="Profile"
              className="profile-photo"
            />
            <label className="camera-overlay">
              <FaCamera className="camera-icon" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </label>
          </div>
        </div>

        <div className="profile-info">
          <h1 className="employee-name">{user?.name || "Employee Name"}</h1>
          <p className="employee-details">
            <span className="role">{user?.role || "Employee"}</span> • 
            <span className="department">{user?.department || "Department"}</span>
          </p>
          <p className="employee-id">Employee ID: {user?.employeeId || "EMP001"}</p>
          <p className="employee-email">{user?.email || "email@company.com"}</p>
          
          <div className="salary-overview">
            <div className="salary-item">
              <span className="salary-label">Basic Salary</span>
              <span className="salary-value">
                ₹{user?.salary?.basic ? calculateSalary(user.salary.basic).basicSalary.toLocaleString() : "0"}
              </span>
            </div>
            <div className="salary-item">
              <span className="salary-label">Allowances</span>
              <span className="salary-value">
                ₹{user?.salary?.basic ? calculateSalary(user.salary.basic).allowances.toLocaleString() : "0"}
              </span>
            </div>
            <div className="salary-item highlight">
              <span className="salary-label">Net Salary</span>
              <span className="salary-value">
                ₹{user?.salary?.basic ? calculateSalary(user.salary.basic).netSalary.toLocaleString() : "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <FaUser className="tab-icon" />
          Personal Information
        </button>
        <button 
          className={`tab-button ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <FaCalendarAlt className="tab-icon" />
          Leave Management
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'personal' && (
          <div className="personal-tab">
            {/* Account Section */}
            <div className="info-section">
              <h3 className="section-title">
                <FaEdit className="section-icon" />
                Account Information
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="form-input disabled"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value="••••••••"
                      readOnly
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <button className="change-password-btn">Change</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="info-section">
              <h3 className="section-title">
                <FaUser className="section-icon" />
                Personal Details
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input type="radio" name="gender" />
                      <span>Male</span>
                    </label>
                    <label className="radio-option">
                      <input type="radio" name="gender" />
                      <span>Female</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" placeholder="Enter phone number" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input type="date" className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Marital Status</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input type="radio" name="marital" />
                      <span>Single</span>
                    </label>
                    <label className="radio-option">
                      <input type="radio" name="marital" />
                      <span>Married</span>
                    </label>
                  </div>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Address</label>
                  <textarea 
                    placeholder="Enter your complete address"
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <button className="update-btn">Update Information</button>
            </div>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="leaves-tab">
            {/* Apply Leave Section */}
            <div className="info-section">
              <h3 className="section-title">
                <FaCalendarAlt className="section-icon" />
                Apply for Leave
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="fromDate"
                    value={leaveForm.fromDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="toDate"
                    value={leaveForm.toDate}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select 
                    name="type" 
                    value={leaveForm.type} 
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select leave type</option>
                    <option value="medical">Medical Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Reason</label>
                  <textarea
                    name="reason"
                    placeholder="Please provide a detailed reason for your leave"
                    value={leaveForm.reason}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <button 
                className="apply-btn"
                onClick={handleApplyLeave} 
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Leave Request"}
              </button>
            </div>

            {/* Leave History Section */}
            <div className="info-section">
              <h3 className="section-title">
                <FaCalendarAlt className="section-icon" />
                Your Leave History
              </h3>
              {myLeaves && myLeaves.length > 0 ? (
                <div className="leaves-grid">
                  {myLeaves.map((leave) => (
                    <div key={leave._id} className="leave-card">
                      <div className="leave-header">
                        <span className="leave-type">{leave.type}</span>
                        <span className={`leave-status ${leave.status?.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="leave-reason">{leave.reason}</p>
                      <div className="leave-dates">
                        <span>{new Date(leave.fromDate).toLocaleDateString()}</span>
                        <span>to</span>
                        <span>{new Date(leave.toDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-leaves">
                  <p>No leave requests found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeProfile;