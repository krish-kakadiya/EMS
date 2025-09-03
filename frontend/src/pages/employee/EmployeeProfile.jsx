import React, { useState, useEffect } from "react";
import "./EmployeeProfile.css";
import Navbar from "../../components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  applyLeave,
  getMyLeaves,
  clearMessages,
} from "../../redux/slices/leaveSlice";
import { getCurrentUser } from "../../redux/slices/authSlice"; // ✅ make sure you have this in your auth slice

const EmployeeProfile = () => {
  const [profileImg, setProfileImg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ leave form state aligned with backend
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
      dispatch(getCurrentUser()); // fetch updated user including salary
    }
  }, [user, dispatch]);

  // ✅ load user & leaves
  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    dispatch(getMyLeaves());
  }, [dispatch, user]);

  // ✅ handle form change
  const handleChange = (e) => {
    setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
  };

  // ✅ apply leave
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

  // ✅ show success/error
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

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-photo-section">
          <img
            src={profileImg || "https://avatar.iran.liara.run/public/17"}
            alt="Profile"
            className="profile-photo"
          />
          <label className="upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
            UPDATE YOUR PICTURE
          </label>
        </div>

        <div className="profile-info">
          <div className="row">
            <label>EMP_ID:</label>
            <input type="text" value={user?.employeeId || ""} disabled />
          </div>
          <div className="row">
            <label>NAME:</label>
            <input type="text" value={user?.name || ""} disabled />
          </div>
          <div className="row">
            <label>DEPARTMENT:</label>
            <input type="text" value={user?.department || ""} disabled />
          </div>
          <div className="row">
            <label>E-MAIL:</label>
            <input type="email" value={user?.email || ""} disabled />
          </div>

          {/* Password with Eye Toggle */}
          <div className="row password-row">
            <label>PASSWORD:</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                value="*****"
                readOnly
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
              <button className="btn-small">CHANGE PASSWORD</button>
            </div>
          </div>

          <div className="row">
            <label>ROLE:</label>
            <input type="text" value={user?.role || ""} disabled />
          </div>
          <div className="row">
            <label>SALARY:</label>
            <input
              type="text"
              value={user?.salary?.basic ? `${calculateSalary(user.salary.basic).basicSalary}` : ""}
              disabled
            />
            <label>ALLOWANCE:</label>
            <input
              type="text"
              value={user?.salary?.basic ? `${calculateSalary(user.salary.basic).allowances}` : ""}
              disabled
            />
            <label>NET SALARY:</label>
            <input
              type="text"
              value={user?.salary?.basic ? `${calculateSalary(user.salary.basic).netSalary}` : ""}
              disabled
            />
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="section">
        <h3>PERSONAL INFORMATION</h3>
        <div className="row radio-group">
          <label>GENDER:</label>
          <div className="radio-options">
            <label>
              <input type="radio" name="gender" /> Male
            </label>
            <label>
              <input type="radio" name="gender" /> Female
            </label>
          </div>
        </div>

        <div className="row">
          <label>DOB:</label>
          <input type="date" />
        </div>
        <div className="row">
          <label>NO:</label>
          <input type="text" />
        </div>
        <div className="row">
          <label>ADDRESS:</label>
          <textarea />
        </div>
        <div className="row">
          <label>JOINING DATE:</label>
          <input type="date" />
        </div>
        <div className="row radio-group">
          <label>MARITAL STATUS:</label>
          <div className="options">
            <label>
              <input type="radio" name="marital" /> Unmarried
            </label>
            <label>
              <input type="radio" name="marital" /> Married
            </label>
          </div>
        </div>
        <button className="btn">UPDATE</button>
      </div>

      {/* Attendance */}
      <div className="section">
        <h3>ATTENDANCE REPORT</h3>
        <div className="row">
          <label>ATTENDANCE:</label>
          <input type="text" />
        </div>
      </div>

      {/* Apply Leaves */}
      <div className="section">
        <h3>APPLY LEAVES</h3>
        <div className="row">
          <label>STARTING DATE:</label>
          <input
            type="date"
            name="fromDate"
            value={leaveForm.fromDate}
            onChange={handleChange}
          />
        </div>
        <div className="row">
          <label>ENDING DATE:</label>
          <input
            type="date"
            name="toDate"
            value={leaveForm.toDate}
            onChange={handleChange}
          />
        </div>
        <div className="row radio-group">
          <label>TYPE:</label>
          <select name="type" value={leaveForm.type} onChange={handleChange}>
            <option value="">Select Type</option>
            <option value="medical">Medical</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="row">
          <label>REASON:</label>
          <input
            type="text"
            name="reason"
            placeholder="Enter your reason"
            value={leaveForm.reason}
            onChange={handleChange}
          />
        </div>
        <button className="btn" onClick={handleApplyLeave} disabled={loading}>
          {loading ? "Applying..." : "APPLY"}
        </button>
      </div>

      {/* Your Leaves */}
      <div className="section">
        <h3>YOUR LEAVES</h3>
        <table className="leaves-table">
          <thead>
            <tr>
              <th>TYPE</th>
              <th>REASON</th>
              <th>STARTING TIME</th>
              <th>ENDING TIME</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {myLeaves && myLeaves.length > 0 ? (
              myLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.type}</td>
                  <td>{leave.reason}</td>
                  <td>{new Date(leave.fromDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.toDate).toLocaleDateString()}</td>
                  <td className={`status ${leave.status?.toLowerCase()}`}>
                    {leave.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No leaves applied yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeProfile;
