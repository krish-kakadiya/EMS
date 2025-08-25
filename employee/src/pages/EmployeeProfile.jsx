import React, { useState } from "react";
import "./EmployeeProfile.css";

const EmployeeProfile = () => {
  const [profileImg, setProfileImg] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImg(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="profile-container">
      <h2 className="section-title">MY PROFILE</h2>

      <div className="profile-card">
        {/* Profile Photo */}
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

        {/* Employee Info */}
        <div className="profile-info">
          <div className="row">
            <label>EMP_ID:</label>
            <input type="text" value="EMP1" disabled/>
          </div>
          <div className="row">
            <label>NAME:</label>
            <input type="text" value="HADIYA HARDIK" disabled/>
          </div>
          <div className="row">
            <label>DEPARTMENT:</label>
            <input type="text" value="FRONTEND DEVELOPMENT" disabled/>
          </div>
          <div className="row">
            <label>E-MAIL:</label>
            <input type="email" value="hardikhadiya21@gmail.com" disabled/>
          </div>
          <div className="row">
            <label>PASSWORD:</label>
            <input type="password" value="*****" readOnly/>
            <button className="btn-small">CHANGE PASSWORD</button>
          </div>
          <div className="row">
            <label>ROLE:</label>
            <input type="text" value="EMPLOYEE" disabled/>
          </div>
          <div className="row">
            <label>SALARY:</label>
            <input type="text" value="XXXX" disabled/>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="section">
        <h3>PERSONAL INFORMATION</h3>
        <div className="row radio-group">
          <label>GENDER:</label>
          <div className="radio-options">
            <label><input type="radio" name="gender" /> Male</label>
            <label><input type="radio" name="gender" /> Female</label>
          </div>
        </div>

        <div className="row"><label>DOB:</label><input type="date" /></div>
        <div className="row"><label>NO:</label><input type="text" /></div>
        <div className="row"><label>ADDRESS:</label><textarea /></div>
        <div className="row"><label>JOINING DATE:</label><input type="date" /></div>
        <div className="row radio-group">
          <label>MARITAL STATUS:</label>
          <div className="options">
            <label><input type="radio" name="marital" /> Unmarried</label>
            <label><input type="radio" name="marital" /> Married</label>
          </div>
        </div>
        <button className="btn">UPDATE</button>
      </div>

      {/* Attendance */}
      <div className="section">
        <h3>ATTENDANCE REPORT</h3>
        <div className="row"><label>ATTENDANCE:</label><input type="text" /></div>
      </div>

      {/* Apply Leaves */}
      <div className="section">
        <h3>APPLY LEAVES</h3>
        <div className="row"><label>STARTING DATE:</label><input type="date" /></div>
        <div className="row"><label>ENDING DATE:</label><input type="date" /></div>
        <div className="row radio-group">
          <label>REASON:</label>
          <button className="btn-small">MEDICAL</button>
          <button className="btn-small">PERSONAL</button>
          <button className="btn-small">OTHER</button>
        </div>
        <button className="btn">APPLY</button>
      </div>

      {/* Your Leaves */}
      <div className="section">
        <h3>YOUR LEAVES</h3>
        <table className="leaves-table">
          <thead>
            <tr>
              <th>REASON</th>
              <th>STARTING TIME</th>
              <th>ENDING TIME</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PERSONAL</td>
              <td>17-07-2025</td>
              <td>19-07-2025</td>
              <td className="status rejected">REJECTED</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeProfile;
