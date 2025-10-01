import React, { useState, useEffect } from "react";
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
import "./EmployeeProfile.css";

const EmployeeProfile = () => {
  const [profileImg, setProfileImg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [tempProfileImg, setTempProfileImg] = useState(null);
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState('');

  const [leaveForm, setLeaveForm] = useState({
    type: "",
    reason: "",
    fromDate: "",
    toDate: "",
  });

  const [tasks, setTasks] = useState([
    {
      id: 'TSK001',
      title: 'UI Design for Task Dashboard',
      description: 'Create a clean and responsive dashboard where users can add, edit, and delete tasks with priority levels.',
      priority: 'HIGH',
      assignedTo: ['yash bhesdiya', 'Jagdish Hadiyal'],
      startDate: '15/10/25',
      dueDate: '16/10/25',
      status: 'not started'
    }
  ]);

  const { user } = useSelector((state) => state.auth);
  const { myLeaves, loading, error, success } = useSelector(
    (state) => state.leave
  );

  const dispatch = useDispatch();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imageUrl = URL.createObjectURL(e.target.files[0]);
      setTempProfileImg(imageUrl);
    }
  };

  const handleSaveImage = () => {
    if (tempProfileImg) {
      setProfileImg(tempProfileImg);
      alert("Profile image saved successfully!");
      setTempProfileImg(null);
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

  const handleTaskStatusChange = (task, status) => {
    setSelectedTask(task);
    setNewStatus(status);
    setShowStatusPopup(true);
  };

  const confirmStatusChange = () => {
    if (selectedTask) {
      setTasks(tasks.map(task => 
        task.id === selectedTask.id ? { ...task, status: newStatus } : task
      ));
      setShowStatusPopup(false);
      setSelectedTask(null);
      setNewStatus('');
    }
  };

  const cancelStatusChange = () => {
    setShowStatusPopup(false);
    setSelectedTask(null);
    setNewStatus('');
  };

  const getFilteredTasks = () => {
    switch(taskFilter) {
      case 'pending':
        return tasks.filter(task => task.status === 'not started');
      case 'active':
        return tasks.filter(task => task.status === 'in progress');
      case 'hold':
        return tasks.filter(task => task.status === 'on hold');
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      default:
        return tasks;
    }
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
                <p className="popup-task-title">"{selectedTask?.title}"</p>
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
                  <button className="emp-save-image-btn" onClick={handleSaveImage}>
                    <FaSave /> Save Image
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
                  <input type="date" className="emp-form-input" />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Phone Number</label>
                  <input type="tel" placeholder="Enter phone number" className="emp-form-input" />
                </div>
                <div className="emp-form-group">
                  <label className="emp-form-label">Joining Date</label>
                  <input type="date" className="emp-form-input" />
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
                    placeholder="Enter your complete address"
                    className="emp-form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <button className="emp-update-btn">Update Information</button>
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
              
              {getFilteredTasks().length > 0 ? (
                <div className="emp-tasks-container">
                  {getFilteredTasks().map((task) => (
                    <div key={task.id} className="emp-task-card">
                      <div className="emp-task-header">
                        <div className="emp-task-header-left">
                          <h4 className="emp-task-title">{task.title}</h4>
                          <span className="emp-task-id">#{task.id}</span>
                        </div>
                        <span 
                          className="emp-task-priority"
                          style={{ 
                            background: getPriorityColor(task.priority) + '20',
                            color: getPriorityColor(task.priority),
                            border: `1px solid ${getPriorityColor(task.priority)}40`
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <p className="emp-task-description">{task.description}</p>

                      <div className="emp-task-meta">
                        <div className="emp-task-assignees">
                          <span className="emp-meta-label">ASSIGNED TO:</span>
                          <div className="emp-assignees-list">
                            {task.assignedTo.map((person, index) => (
                              <div key={index} className="emp-assignee">
                                <span className="emp-assignee-role">
                                  {person.includes('yash') ? 'UI/UX DESIGNER' : 'FULL STACK DEVELOPER'}
                                </span>
                                <span className="emp-assignee-name">{person}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="emp-task-dates">
                          <div className="emp-date-item">
                            <span className="emp-date-label">START:</span>
                            <span className="emp-date-value">{task.startDate}</span>
                          </div>
                          <div className="emp-date-item">
                            <span className="emp-date-label">DUE:</span>
                            <span className="emp-date-value">{task.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="emp-task-status-section">
                        <label className="emp-status-label">Update Status:</label>
                        <div className="emp-status-buttons">
                          <button
                            className={`emp-status-btn ${task.status === 'not started' ? 'active' : ''}`}
                            style={{ 
                              background: task.status === 'not started' ? getStatusColor('not started') : 'transparent',
                              color: task.status === 'not started' ? 'white' : getStatusColor('not started'),
                              borderColor: getStatusColor('not started')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'not started')}
                          >
                            Not Started
                          </button>
                          <button
                            className={`emp-status-btn ${task.status === 'in progress' ? 'active' : ''}`}
                            style={{ 
                              background: task.status === 'in progress' ? getStatusColor('in progress') : 'transparent',
                              color: task.status === 'in progress' ? 'white' : getStatusColor('in progress'),
                              borderColor: getStatusColor('in progress')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'in progress')}
                          >
                            In Progress
                          </button>
                          <button
                            className={`emp-status-btn ${task.status === 'on hold' ? 'active' : ''}`}
                            style={{ 
                              background: task.status === 'on hold' ? getStatusColor('on hold') : 'transparent',
                              color: task.status === 'on hold' ? 'white' : getStatusColor('on hold'),
                              borderColor: getStatusColor('on hold')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'on hold')}
                          >
                            On Hold
                          </button>
                          <button
                            className={`emp-status-btn ${task.status === 'completed' ? 'active' : ''}`}
                            style={{ 
                              background: task.status === 'completed' ? getStatusColor('completed') : 'transparent',
                              color: task.status === 'completed' ? 'white' : getStatusColor('completed'),
                              borderColor: getStatusColor('completed')
                            }}
                            onClick={() => handleTaskStatusChange(task, 'completed')}
                          >
                            Completed
                          </button>
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