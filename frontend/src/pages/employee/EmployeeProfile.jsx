import React, { useState, useEffect, useRef } from "react";
import { io } from 'socket.io-client';
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/employee/Sidebar_Employee";
import { useSelector, useDispatch } from "react-redux";
import { FaEye, FaEyeSlash, FaUser, FaCamera, FaCalendarAlt, FaEdit, FaSave, FaTimes, FaCheck, FaFilter } from "react-icons/fa";
import {
  applyLeave,
  getMyLeaves,
  clearMessages,
} from "../../redux/slices/leaveSlice";
import { getCurrentUser } from "../../redux/slices/authSlice";
import api from "../../axios/api";
import { fetchMyTasks, updateMyTaskStatus, deleteMyTask, leaveMyTask } from "../../redux/slices/employeeTasksSlice";
import "./EmployeeProfile.css";

const EmployeeProfile = () => {
  // Derive API origin (remove trailing /api) for constructing absolute file URLs
  const API_BASE = api.defaults.baseURL || '';
  // Remove trailing /api (with or without slash) from the configured base URL
  const API_ORIGIN = API_BASE.replace(/\/?api\/?$/i, '');
  const [profileImg, setProfileImg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [tempProfileImg, setTempProfileImg] = useState(null);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState('');
  const [personalDetails, setPersonalDetails] = useState({
    dob: '',
    phone: '',
    joiningDate: '',
    address: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    type: "",
    reason: "",
    fromDate: "",
    toDate: "",
  });

  // tasks will come from redux slice employeeTasks

  const { user } = useSelector((state) => state.auth);
  const { tasks: myTasks, loading: myTasksLoading } = useSelector((state) => state.employeeTasks);
  const { myLeaves, loading, error, success } = useSelector(
    (state) => state.leave
  );

  const dispatch = useDispatch();
  const socketRef = useRef(null);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation (optional enhancement)
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // 2MB size limit example
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be under 2MB');
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setTempProfileImg(imageUrl);
      setSelectedImageFile(file);
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImageFile) return;
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('photo', selectedImageFile);
      const res = await api.post('/profile/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data) {
        // Prefer absolute URL returned by backend, else construct using path
        const finalUrl = res.data.url
          || (res.data.path ? (res.data.path.startsWith('http') ? res.data.path : `${API_ORIGIN}${res.data.path.startsWith('/') ? '' : '/'}${res.data.path}`) : null);
        if (finalUrl) setProfileImg(finalUrl);
        setTempProfileImg(null);
        setSelectedImageFile(null);
        dispatch(getCurrentUser());
        alert('Profile image uploaded');
      }
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
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

  // ---------------- Personal Details Helpers ----------------
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalDetails(prev => ({ ...prev, [name]: value }));
  };

  const toYMD = (value) => {
    if (!value) return '';
    try {
      const d = new Date(value);
      if (isNaN(d)) return '';
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const loadExistingProfile = () => {
    const profile = user && typeof user.profile === 'object' ? user.profile : null;
    if (profile) {
      if (profile.gender) setSelectedGender(profile.gender);
      if (profile.maritalStatus) setSelectedMaritalStatus(profile.maritalStatus);
      setPersonalDetails(prev => ({
        ...prev,
        dob: toYMD(profile.dob),
        phone: profile.phone || '',
        joiningDate: toYMD(profile.joiningDate),
        address: profile.address || ''
      }));
      if (profile.profilePicture) {
        const pic = profile.profilePicture.startsWith('http')
          ? profile.profilePicture
          : `${API_ORIGIN}${profile.profilePicture.startsWith('/') ? '' : '/'}${profile.profilePicture}`;
        setProfileImg(pic);
      }
    }
  };

  useEffect(() => {
    loadExistingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!selectedGender) {
      alert('Please select gender');
      return;
    }
    if (!selectedMaritalStatus) {
      alert('Please select marital status');
      return;
    }
    setUpdatingProfile(true);
    try {
      // Placeholder API call; adjust endpoint when backend route exists
      const payload = {
        gender: selectedGender,
        maritalStatus: selectedMaritalStatus,
        dob: personalDetails.dob || null,
        phone: personalDetails.phone || null,
        joiningDate: personalDetails.joiningDate || null,
        address: personalDetails.address || ''
      };
      const res = await api.put('/profile/me', payload);
      alert('Profile updated successfully');
      // Optionally refresh user
      dispatch(getCurrentUser());
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleTaskStatusChange = (task, status) => {
    setSelectedTask(task);
    setNewStatus(status);
    setStatusMessage('');
    setShowStatusPopup(true);
  };

  const confirmStatusChange = () => {
    if (selectedTask) {
      dispatch(updateMyTaskStatus({ id: selectedTask._id, status: newStatus, message: statusMessage }))
        .then(() => {
          setShowStatusPopup(false);
          setSelectedTask(null);
          setNewStatus('');
          setStatusMessage('');
        });
    }
  };

  const cancelStatusChange = () => {
    setShowStatusPopup(false);
    setSelectedTask(null);
    setNewStatus('');
  };

  const mapStatusForDisplay = (raw) => {
    switch (raw) {
      case 'not-started': return 'not started';
      case 'in-progress': return 'in progress';
      case 'on-hold': return 'on hold';
      default: return raw || '';
    }
  };

  const filteredTasks = React.useMemo(() => {
    if (!Array.isArray(myTasks)) return [];
    if (taskFilter === 'all') return myTasks;
    return myTasks.filter(t => {
      const normalized = mapStatusForDisplay(t.status);
      if (taskFilter === 'pending') return normalized === 'not started';
      if (taskFilter === 'active') return normalized === 'in progress';
      if (taskFilter === 'hold') return normalized === 'on hold';
      if (taskFilter === 'completed') return normalized === 'completed';
      return true;
    });
  }, [myTasks, taskFilter]);

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in progress': return '#3b82f6';
      case 'on hold': return '#f59e0b';
      case 'not started': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    return status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  useEffect(() => {
    if (activeSection === 'tasks') {
      dispatch(fetchMyTasks());
    }
  }, [activeSection, dispatch]);

  // Socket setup for real-time task updates/removals
  useEffect(() => {
    if (!user?._id) return; // wait for user
    if (!socketRef.current) {
      try {
        const origin = (api.defaults.baseURL || 'http://localhost:3000/api').replace(/\/api\/?$/,'');
        socketRef.current = io(origin, { withCredentials: true });
        // Join user room for potential targeted events later
        socketRef.current.emit('joinUser', user._id);
      } catch (e) { console.warn('Socket init failed (employee)', e.message); }
    }
    const sock = socketRef.current;
    if (!sock) return;

    const handleTaskUpdated = ({ task }) => {
      if (!task || !task._id) return;
      // If user no longer in assignedTo, remove from local list
      const stillAssigned = Array.isArray(task.assignedTo) && task.assignedTo.some(p => (p._id || p) === user._id);
      if (!stillAssigned) {
        // optimistic removal without refetch
        // dispatch locally by filtering state via a mini action (reuse delete semantics)
        // We'll dispatch a fake deleteMyTask fulfilled style using fetchMyTasks after slight delay optional
        dispatch(fetchMyTasks());
        return;
      }
      // If still assigned and tasks section active, refresh list to get updated assignees/messages
      if (activeSection === 'tasks') {
        dispatch(fetchMyTasks());
      }
    };
    const handleTaskDeleted = ({ taskId }) => {
      if (!taskId) return;
      // Refresh to drop it if it belonged to user
      dispatch(fetchMyTasks());
    };
    sock.on('taskUpdated', handleTaskUpdated);
    sock.on('taskDeleted', handleTaskDeleted);
    return () => {
      sock.off('taskUpdated', handleTaskUpdated);
      sock.off('taskDeleted', handleTaskDeleted);
    };
  }, [user, dispatch, activeSection]);

  return (
    <div className="emp-profile-wrapper">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="emp-profile-main-content">
        <Navbar />

        {/* Status Change Popup */}
        {showStatusPopup && (
          <div className="status-popup-overlay">
            <div className="status-popup">
              <div className="status-popup-header">
                <h3>Confirm Status Change</h3>
                <button className="popup-close-btn" onClick={cancelStatusChange}>
                  <FaTimes />
                </button>
              </div>
              <div className="status-popup-body">
                <p>Are you sure you want to change the status of</p>
                <p className="popup-task-title">"{selectedTask?.name}"</p>
                <p>to</p>
                <span
                  className="popup-status-badge"
                  style={{
                    background: getStatusColor(newStatus) + '20',
                    color: getStatusColor(newStatus),
                    border: `2px solid ${getStatusColor(newStatus)}`
                  }}
                >
                  {getStatusLabel(newStatus)}
                </span>
                <div className="status-message-wrapper">
                  <label className="emp-form-label" style={{ marginTop: '12px' }}>Message (optional)</label>
                  <textarea
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="Add a short note about your update"
                    rows={3}
                    className="emp-form-textarea"
                  />
                </div>
              </div>
              <div className="status-popup-actions">
                <button className="popup-cancel-btn" onClick={cancelStatusChange}>
                  <FaTimes /> Cancel
                </button>
                <button className="popup-confirm-btn" onClick={confirmStatusChange}>
                  <FaCheck /> Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="emp-content-section">
            {/* Enhanced Profile Header */}
            <div className="emp-profile-header">
              <div className="emp-profile-photo-section">
                <div className="emp-photo-wrapper">
                  <img
                    src={tempProfileImg || profileImg || "https://avatar.iran.liara.run/public/17"}
                    alt="Profile"
                    className="emp-profile-photo"
                    onError={(e) => { e.currentTarget.src = "https://avatar.iran.liara.run/public/17"; }}
                  />
                  <label className="emp-camera-overlay">
                    <FaCamera className="emp-camera-icon" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                </div>
                {tempProfileImg && (
                  <button className="emp-save-image-btn" onClick={handleSaveImage} disabled={uploadingImage}>
                    <FaSave /> {uploadingImage ? 'Uploading...' : 'Save Image'}
                  </button>
                )}
              </div>

              <div className="emp-profile-info">
                <h1 className="emp-name">{user?.name || "Employee Name"}</h1>
                <p className="emp-details">
                  <span className="emp-role">{user?.role || "Employee"}</span> •
                  <span className="emp-department">{user?.department || "Department"}</span>
                </p>
                <p className="emp-id">Employee ID: {user?.employeeId || "EMP001"}</p>
                <p className="emp-email">{user?.email || "email@company.com"}</p>

                <div className="emp-salary-overview">
                  <div className="emp-salary-item">
                    <span className="emp-salary-label">Basic Salary</span>
                    <span className="emp-salary-value">
                      ₹{user?.salary?.basic ? calculateSalary(user.salary.basic).basicSalary.toLocaleString() : "0"}
                    </span>
                  </div>
                  <div className="emp-salary-item">
                    <span className="emp-salary-label">Allowances</span>
                    <span className="emp-salary-value">
                      ₹{user?.salary?.basic ? calculateSalary(user.salary.basic).allowances.toLocaleString() : "0"}
                    </span>
                  </div>
                  <div className="emp-salary-item emp-highlight">
                    <span className="emp-salary-label">Net Salary</span>
                    <span className="emp-salary-value">
                      ₹{user?.salary?.basic ? calculateSalary(user.salary.basic).netSalary.toLocaleString() : "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="emp-info-section">
              <h3 className="emp-section-title">
                <FaEdit className="emp-section-icon" />
                Account Information
              </h3>
              <div className="emp-form-grid">
                <div className="emp-form-group">
                  <label className="emp-form-label">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="emp-form-input emp-disabled"
                  />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Password</label>
                  <div className="emp-password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value="••••••••"
                      readOnly
                      className="emp-form-input"
                    />
                    <button
                      type="button"
                      className="emp-eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <button className="emp-change-password-btn">Change</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="emp-info-section">
              <h3 className="emp-section-title">
                <FaUser className="emp-section-icon" />
                Personal Details
              </h3>
              <div className="emp-form-grid">
                <div className="emp-form-group">
                  <label className="emp-form-label">Gender</label>
                  <div className="emp-radio-group">
                    <label className="emp-radio-option">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={selectedGender === 'male'}
                        onChange={(e) => setSelectedGender(e.target.value)}
                      />
                      <span>Male</span>
                    </label>
                    <label className="emp-radio-option">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={selectedGender === 'female'}
                        onChange={(e) => setSelectedGender(e.target.value)}
                      />
                      <span>Female</span>
                    </label>
                  </div>
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={personalDetails.dob}
                    onChange={handlePersonalChange}
                    className="emp-form-input"
                  />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={personalDetails.phone}
                    onChange={handlePersonalChange}
                    placeholder="Enter phone number"
                    className="emp-form-input"
                  />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Joining Date</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={personalDetails.joiningDate}
                    onChange={handlePersonalChange}
                    className="emp-form-input"
                  />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Marital Status</label>
                  <div className="emp-radio-group">
                    <label className="emp-radio-option">
                      <input
                        type="radio"
                        name="marital"
                        value="single"
                        checked={selectedMaritalStatus === 'single'}
                        onChange={(e) => setSelectedMaritalStatus(e.target.value)}
                      />
                      <span>Single</span>
                    </label>
                    <label className="emp-radio-option">
                      <input
                        type="radio"
                        name="marital"
                        value="married"
                        checked={selectedMaritalStatus === 'married'}
                        onChange={(e) => setSelectedMaritalStatus(e.target.value)}
                      />
                      <span>Married</span>
                    </label>
                  </div>
                </div>
                <div className="emp-form-group emp-full-width">
                  <label className="emp-form-label">Address</label>
                  <textarea
                    name="address"
                    value={personalDetails.address}
                    onChange={handlePersonalChange}
                    placeholder="Enter your complete address"
                    className="emp-form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <button className="emp-update-btn" onClick={handleUpdateProfile} disabled={updatingProfile}>
                {updatingProfile ? 'Updating...' : 'Update Information'}
              </button>
            </div>
          </div>
        )}

        {/* Leaves Section */}
        {activeSection === 'leaves' && (
          <div className="emp-content-section">
            <div className="emp-info-section">
              <h3 className="emp-section-title">
                <FaCalendarAlt className="emp-section-icon" />
                Apply for Leave
              </h3>
              <div className="emp-form-grid">
                <div className="emp-form-group">
                  <label className="emp-form-label">Start Date</label>
                  <input
                    type="date"
                    name="fromDate"
                    value={leaveForm.fromDate}
                    onChange={handleChange}
                    className="emp-form-input"
                  />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">End Date</label>
                  <input
                    type="date"
                    name="toDate"
                    value={leaveForm.toDate}
                    onChange={handleChange}
                    className="emp-form-input"
                  />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Leave Type</label>
                  <select
                    name="type"
                    value={leaveForm.type}
                    onChange={handleChange}
                    className="emp-form-select"
                  >
                    <option value="">Select leave type</option>
                    <option value="medical">Medical Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="emp-form-group emp-full-width">
                  <label className="emp-form-label">Reason</label>
                  <textarea
                    name="reason"
                    placeholder="Please provide a detailed reason for your leave"
                    value={leaveForm.reason}
                    onChange={handleChange}
                    className="emp-form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <button
                className="emp-apply-btn"
                onClick={handleApplyLeave}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Leave Request"}
              </button>
            </div>

            <div className="emp-info-section">
              <h3 className="emp-section-title">
                <FaCalendarAlt className="emp-section-icon" />
                Your Leave History
              </h3>
              {myLeaves && myLeaves.length > 0 ? (
                <div className="emp-leaves-grid">
                  {myLeaves.map((leave) => (
                    <div key={leave._id} className="emp-leave-card">
                      <div className="emp-leave-header">
                        <span className="emp-leave-type">{leave.type}</span>
                        <span className={`emp-leave-status emp-${leave.status?.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="emp-leave-reason">{leave.reason}</p>
                      <div className="emp-leave-dates">
                        <span>{new Date(leave.fromDate).toLocaleDateString()}</span>
                        <span>to</span>
                        <span>{new Date(leave.toDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emp-no-leaves">
                  <p>No leave requests found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tasks Section */}
        {activeSection === 'tasks' && (
          <div className="emp-content-section">
            <div className="emp-info-section">
              <div className="emp-tasks-header">
                <h3 className="emp-section-title">
                  <FaEdit className="emp-section-icon" />
                  My Tasks
                </h3>
                <div className="emp-task-filters">
                  <FaFilter className="filter-icon" />
                  <button
                    className={`filter-btn ${taskFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('all')}
                  >
                    All Tasks
                  </button>
                  <button
                    className={`filter-btn ${taskFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('pending')}
                  >
                    Pending
                  </button>
                  <button
                    className={`filter-btn ${taskFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`filter-btn ${taskFilter === 'hold' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('hold')}
                  >
                    On Hold
                  </button>
                  <button
                    className={`filter-btn ${taskFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setTaskFilter('completed')}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {myTasksLoading ? (
                <div className="emp-no-tasks"><p>Loading tasks...</p></div>
              ) : filteredTasks.length > 0 ? (
                <div className="emp-tasks-container">
                  {filteredTasks.map((task) => (
                    <div key={task._id} className="emp-task-card">
                      <div className="emp-task-header">
                        <div className="emp-task-header-left">
                          <h4 className="emp-task-title">{task.name}</h4>
                          <span className="emp-task-id">#{task.code}</span>
                        </div>
                        <span
                          className="emp-task-priority"
                          style={{
                            background: getPriorityColor(task.priority?.toUpperCase()) + '20',
                            color: getPriorityColor(task.priority?.toUpperCase()),
                            border: `1px solid ${getPriorityColor(task.priority?.toUpperCase())}40`
                          }}
                        >
                          {task.priority?.toUpperCase()}
                        </span>
                      </div>
                      <p className="emp-task-description">{task.description}</p>
                      {task.lastEmployeeMessage && (
                        <p className="emp-task-last-message"><strong>Your last note:</strong> {task.lastEmployeeMessage}</p>
                      )}

                      <div className="emp-task-meta">
                        <div className="emp-task-assignees">
                          <span className="emp-meta-label">ASSIGNED TO:</span>
                          <div className="emp-assignees-list">
                            {task.assignedTo.map((person) => (
                              <div key={person._id} className="emp-assignee">
                                <span className="emp-assignee-role">{person.role?.toUpperCase()}</span>
                                <span className="emp-assignee-name">{person.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="emp-task-dates">
                          <div className="emp-date-item">
                            <span className="emp-date-label">START:</span>
                            <span className="emp-date-value">{task.startDate ? new Date(task.startDate).toLocaleDateString() : '-'}</span>
                          </div>
                          <div className="emp-date-item">
                            <span className="emp-date-label">DUE:</span>
                            <span className="emp-date-value">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="emp-task-status-section">
                        <label className="emp-status-label">Update Status:</label>
                        <div className="emp-status-buttons">
                          <button
                            className={`emp-status-btn ${mapStatusForDisplay(task.status) === 'not started' ? 'active' : ''}`}
                            style={{
                              background: mapStatusForDisplay(task.status) === 'not started' ? getStatusColor('not started') : 'transparent',
                              color: mapStatusForDisplay(task.status) === 'not started' ? 'white' : getStatusColor('not started'),
                              borderColor: getStatusColor('not started')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'not-started')}
                          >
                            Not Started
                          </button>
                          <button
                            className={`emp-status-btn ${mapStatusForDisplay(task.status) === 'in progress' ? 'active' : ''}`}
                            style={{
                              background: mapStatusForDisplay(task.status) === 'in progress' ? getStatusColor('in progress') : 'transparent',
                              color: mapStatusForDisplay(task.status) === 'in progress' ? 'white' : getStatusColor('in progress'),
                              borderColor: getStatusColor('in progress')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'in-progress')}
                          >
                            In Progress
                          </button>
                          <button
                            className={`emp-status-btn ${mapStatusForDisplay(task.status) === 'on hold' ? 'active' : ''}`}
                            style={{
                              background: mapStatusForDisplay(task.status) === 'on hold' ? getStatusColor('on hold') : 'transparent',
                              color: mapStatusForDisplay(task.status) === 'on hold' ? 'white' : getStatusColor('on hold'),
                              borderColor: getStatusColor('on hold')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'on-hold')}
                          >
                            On Hold
                          </button>
                          <button
                            className={`emp-status-btn ${mapStatusForDisplay(task.status) === 'completed' ? 'active' : ''}`}
                            style={{
                              background: mapStatusForDisplay(task.status) === 'completed' ? getStatusColor('completed') : 'transparent',
                              color: mapStatusForDisplay(task.status) === 'completed' ? 'white' : getStatusColor('completed'),
                              borderColor: getStatusColor('completed')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'completed')}
                          >
                            Completed
                          </button>
                          {(() => {
                            const assigned = Array.isArray(task.assignedTo) && task.assignedTo.some(p => p._id === user?._id);
                            if (!assigned) return null;
                            const assigneeCount = Array.isArray(task.assignedTo) ? task.assignedTo.length : 0;
                            if (assigneeCount === 1) {
                              // Show Delete (sole owner)
                              return (
                                <button
                                  className="emp-status-btn emp-delete-inline"
                                  title="Delete this task"
                                  onClick={() => {
                                    if (window.confirm('Delete this task? This cannot be undone.')) {
                                      dispatch(deleteMyTask(task._id));
                                    }
                                  }}
                                  style={{ borderColor: '#dc2626', color: '#dc2626' }}
                                >
                                  Delete
                                </button>
                              );
                            }
                            // Multiple assignees: allow leaving the task
                            return (
                              <button
                                className="emp-status-btn emp-leave-inline"
                                title="Leave this task (you will be unassigned)"
                                onClick={() => {
                                  if (window.confirm('Leave this task? You will be removed as an assignee.')) {
                                    dispatch(leaveMyTask(task._id));
                                  }
                                }}
                                style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                              >
                                Leave Task
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="emp-no-tasks">
                  <p>No tasks found for this filter</p>
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