import React, { useEffect, useState } from "react";
import { FaUser, FaCalendarAlt, FaClock, FaFileAlt, FaEye, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllLeaves,
  updateLeaveStatus,
  clearMessages,
} from "../redux/slices/leaveSlice.js"; // adjust path as needed
import "./LeavePage.css";

const LeavePage = () => {
  const dispatch = useDispatch();
  const { allLeaves, loading, error, success } = useSelector(
    (state) => state.leave
  );
  
  const [selectedLeave, setSelectedLeave] = useState(null);

  // fetch all leaves on mount
  useEffect(() => {
    dispatch(getAllLeaves());
  }, [dispatch]);

  // clear success/error after showing
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  const handleStatusChange = (id, newStatus) => {
    dispatch(updateLeaveStatus({ id, status: newStatus.toLowerCase() }));
  };

  const getStatusClass = (status) => {
    return `status-badge ${status}`;
  };

  const getLeaveTypeClass = (type) => {
    return `leave-type-badge ${type}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDays = (fromDate, toDate) => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "No reason provided";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Filter leaves by status
  const pendingLeaves = allLeaves.filter(leave => leave.status === 'pending');
  const processedLeaves = allLeaves.filter(leave => leave.status === 'approved' || leave.status === 'rejected');

  // Function to render table rows
  const renderTableRows = (leaves, showActions = true) => {
    return leaves.map((leave, index) => (
      <tr
        key={leave._id}
        className={index % 2 === 0 ? "even-row" : "odd-row"}
      >
        <td>
          <div className="employee-info">
            <div className="profile-icon">
              <FaUser />
            </div>
            <div className="employee-details">
              <h4>{leave.user?.name || "Unknown"}</h4>
              <p>{leave.user?.employeeId || leave.user?._id}</p>
            </div>
          </div>
        </td>
        
        <td>
          <div className="leave-details">
            <span className={getLeaveTypeClass(leave.type)}>
              {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
            </span>
            <div className="applied-date">
              <FaCalendarAlt />
              <span>Applied: {formatDate(leave.appliedDate || leave.createdAt)}</span>
            </div>
          </div>
        </td>
        
        <td>
          <div className="duration-info">
            <div className="date-range">
              {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
            </div>
            <div className="duration-days">
              <FaClock />
              <span>{calculateDays(leave.fromDate, leave.toDate)} day(s)</span>
            </div>
          </div>
        </td>
        
        <td>
          <span className={getStatusClass(leave.status)}>
            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </span>
        </td>
        
        <td>
          <div className="reason-content">
            <p className="reason-text">
              {truncateText(leave.reason, 50)}
            </p>
            {leave.reason && leave.reason.length > 50 && (
              <button
                className="read-more-btn"
                onClick={() => setSelectedLeave(leave)}
              >
                <FaEye />
                Read more
              </button>
            )}
          </div>
        </td>
        
        <td>
          {showActions ? (
            <div className="action-buttons">
              <button
                className={`action-btn approve ${leave.status === 'approved' ? 'active' : ''}`}
                onClick={() => handleStatusChange(leave._id, 'approved')}
                disabled={leave.status !== 'pending'}
              >
                Approve
              </button>
              <button
                className={`action-btn reject ${leave.status === 'rejected' ? 'active' : ''}`}
                onClick={() => handleStatusChange(leave._id, 'rejected')}
                disabled={leave.status !== 'pending'}
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <span className="processed-label">Processed</span>
            </div>
          )}
        </td>
      </tr>
    ));
  };

  // Function to render mobile cards
  const renderMobileCards = (leaves, showActions = true) => {
    return leaves.map((leave) => (
      <div key={leave._id} className="mobile-card">
        <div className="mobile-card-header">
          <div className="mobile-employee-info">
            <div className="profile-icon">
              <FaUser />
            </div>
            <div className="employee-details">
              <h4>{leave.user?.name || "Unknown"}</h4>
              <p>{leave.user?.employeeId || leave.user?._id}</p>
            </div>
          </div>
          <span className={getStatusClass(leave.status)}>
            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
          </span>
        </div>

        <div className="mobile-grid">
          <div className="mobile-field">
            <p className="mobile-label">Leave Type</p>
            <span className={getLeaveTypeClass(leave.type)}>
              {leave.type.charAt(0).toUpperCase() + leave.type.slice(1)}
            </span>
          </div>
          <div className="mobile-field">
            <p className="mobile-label">Duration</p>
            <p className="mobile-value">{calculateDays(leave.fromDate, leave.toDate)} day(s)</p>
          </div>
        </div>

        <div className="mobile-field">
          <p className="mobile-label">Leave Period</p>
          <p className="mobile-value">
            {formatDate(leave.fromDate)} - {formatDate(leave.toDate)}
          </p>
        </div>

        <div className="mobile-reason">
          <p className="mobile-label">Reason</p>
          <p className="mobile-reason-text">
            {truncateText(leave.reason, 80)}
          </p>
          {leave.reason && leave.reason.length > 80 && (
            <button
              className="read-more-btn"
              onClick={() => setSelectedLeave(leave)}
            >
              <FaEye />
              Read full reason
            </button>
          )}
        </div>

        {showActions && leave.status === 'pending' && (
          <div className="mobile-actions">
            <button
              className="action-btn approve"
              onClick={() => handleStatusChange(leave._id, 'approved')}
            >
              Approve
            </button>
            <button
              className="action-btn reject"
              onClick={() => handleStatusChange(leave._id, 'rejected')}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="leave-page">
      <div className="leave-container">
        {/* Header */}
        <div className="leave-header">
          <h1 className="leave-title">Leave Management System</h1>
          
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="status-message loading">
            Loading leaves...
          </div>
        )}
        {error && (
          <div className="status-message error">
            {error}
          </div>
        )}
        {success && (
          <div className="status-message success">
            {success}
          </div>
        )}

        {/* Pending Leaves Section */}
        <div className="section-header">
          <h2 className="section-title">
            Pending Leave Requests ({pendingLeaves.length})
          </h2>
        </div>

        {/* Desktop Table View - Pending */}
        <div className="leave-table-container">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Details</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="no-data-content">
                      <FaFileAlt className="no-data-icon" />
                      <p className="no-data-text">No pending leave requests</p>
                    </div>
                  </td>
                </tr>
              ) : (
                renderTableRows(pendingLeaves, true)
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Pending */}
        
        {/* Processed Leaves Section */}
        <div className="section-header processed-section">
          <h2 className="section-title">
            Processed Leave Requests ({processedLeaves.length})
          </h2>
        </div>

        {/* Desktop Table View - Processed */}
        <div className="leave-table-container">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Details</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {processedLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="no-data-content">
                      <FaFileAlt className="no-data-icon" />
                      <p className="no-data-text">No processed leave requests</p>
                    </div>
                  </td>
                </tr>
              ) : (
                renderTableRows(processedLeaves, false)
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Processed */}
        

        {/* Reason Modal */}
        {selectedLeave && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Leave Request Details</h3>
                <button
                  className="modal-close"
                  onClick={() => setSelectedLeave(null)}
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body">
                <div className="modal-section">
                  <div className="modal-grid">
                    <div className="modal-field">
                      <p className="modal-label">Employee</p>
                      <p className="modal-value">
                        {selectedLeave.user?.name} ({selectedLeave.user?.employeeId})
                      </p>
                    </div>
                    <div className="modal-field">
                      <p className="modal-label">Leave Type</p>
                      <span className={getLeaveTypeClass(selectedLeave.type)}>
                        {selectedLeave.type.charAt(0).toUpperCase() + selectedLeave.type.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="modal-grid">
                    <div className="modal-field">
                      <p className="modal-label">Duration</p>
                      <p className="modal-value">
                        {formatDate(selectedLeave.fromDate)} - {formatDate(selectedLeave.toDate)}
                      </p>
                      <p style={{fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0'}}>
                        ({calculateDays(selectedLeave.fromDate, selectedLeave.toDate)} day(s))
                      </p>
                    </div>
                    <div className="modal-field">
                      <p className="modal-label">Status</p>
                      <span className={getStatusClass(selectedLeave.status)}>
                        {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="modal-field">
                    <p className="modal-label">Reason for Leave</p>
                    <div className="modal-reason">
                      <p className="modal-reason-text">
                        {selectedLeave.reason || "No reason provided"}
                      </p>
                    </div>
                  </div>
                  
                  {selectedLeave.status === 'pending' && (
                    <div className="modal-actions">
                      <button
                        className="modal-btn approve"
                        onClick={() => {
                          handleStatusChange(selectedLeave._id, 'approved');
                          setSelectedLeave(null);
                        }}
                      >
                        Approve Leave
                      </button>
                      <button
                        className="modal-btn reject"
                        onClick={() => {
                          handleStatusChange(selectedLeave._id, 'rejected');
                          setSelectedLeave(null);
                        }}
                      >
                        Reject Leave
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeavePage;