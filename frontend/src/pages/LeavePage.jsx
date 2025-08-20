import React, { useState } from "react";
import { FaUser } from "react-icons/fa";
import "./LeavePage.css";

const LeavePage = () => {
  const [leaves, setLeaves] = useState([
    {
      employeeId: "EMP1",
      name: "HARDIK HADIYA",
      type: "PERSONAL",
      startDate: "17-07-2025",
      endDate: "19-07-2025",
      status: "APPROVED",
    },
    {
      employeeId: "EMP2",
      name: "JAGDISH HADIYAL",
      type: "MEDICAL",
      startDate: "20-07-2025",
      endDate: "23-07-2025",
      status: "PENDING",
    },
  ]);

  const handleStatusChange = (index, newStatus) => {
    const updated = [...leaves];
    updated[index] = { ...updated[index], status: newStatus };
    setLeaves(updated);
  };

  return (
    <div className="leave-page">
      <div className="leave-header">
        <h1 className="leave-title">LEAVES OF EMPLOYEES</h1>
      </div>

      <div className="leave-table-container">
        <table className="leave-table">
          <thead>
            <tr>
              <th>EMP ID</th>
              <th>PROFILE</th>
              <th>NAME</th>
              <th>TYPE</th>
              <th>START TIME</th>
              <th>END TIME</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave, index) => (
              <tr key={index} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                <td>{leave.employeeId}</td>
                <td>
                  <div className="profile-icon">
                    <FaUser />
                  </div>
                </td>
                <td>{leave.name}</td>
                <td>{leave.type}</td>
                <td>{leave.startDate}</td>
                <td>{leave.endDate}</td>
                <td>
                  <div className="status-group">
                    {["APPROVE", "REJECT"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`status-chip ${s.toLowerCase()} ${
                          leave.status === s ? "active" : ""
                        }`}
                        onClick={() => handleStatusChange(index, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeavePage;


