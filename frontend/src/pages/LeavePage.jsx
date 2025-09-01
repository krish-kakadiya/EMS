import React, { useEffect } from "react";
import { FaUser } from "react-icons/fa";
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
    dispatch(updateLeaveStatus({ id, status: newStatus.toLowerCase() })); // backend expects lowercase: "approved"/"rejected"
  };

  return (
    <div className="leave-page">
      <div className="leave-header">
        <h1 className="leave-title">LEAVES OF EMPLOYEES</h1>
      </div>

      {loading && <p className="info-text">Loading leaves...</p>}
      {error && <p className="error-text">{error}</p>}
      {success && <p className="success-text">{success}</p>}

      <div className="leave-table-container">
        <table className="leave-table">
          <thead>
            <tr>
              <th>EMP ID</th>
              <th>PROFILE</th>
              <th>NAME</th>
              <th>TYPE</th>
              <th>START DATE</th>
              <th>END DATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {allLeaves.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No leave requests found
                </td>
              </tr>
            ) : (
              allLeaves.map((leave, index) => (
                <tr
                  key={leave._id}
                  className={index % 2 === 0 ? "even-row" : "odd-row"}
                >
                  <td>{leave.user?.employeeId || leave.user?._id}</td>
                  <td>
                    <div className="profile-icon">
                      <FaUser />
                    </div>
                  </td>
                  <td>{leave.user?.name || "Unknown"}</td>
                  <td>{leave.type}</td>
                  <td>{new Date(leave.fromDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.toDate).toLocaleDateString()}</td>
                  <td>
                    <div className="status-group">
                      {["approved", "rejected"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`status-chip ${s} ${
                            leave.status === s ? "active" : ""
                          }`}
                          onClick={() => handleStatusChange(leave._id, s)}
                          disabled={leave.status !== "pending"} // prevent changing once approved/rejected
                        >
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeavePage;
