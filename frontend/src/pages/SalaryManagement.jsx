import React, { useState, useEffect } from "react";
import { Search, Download, FileText } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ must import like this
import logo from "../assets/logo.png"; // ✅ Appifly logo
import background from "../assets/bg.png"; // ✅ background image

import {
  getAllEmployees,
  updateEmployeeSalary,
  exportEmployees,
} from "../redux/slices/employeeSlice";
import "./SalaryManagement.css";

// ✅ Convert image to Base64 for jsPDF
const getBase64Image = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (err) => reject(err);
  });
};

const SalaryTable = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((state) => state.employees);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [newSalary, setNewSalary] = useState("");

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    dispatch(getAllEmployees());
  }, [dispatch]);

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
    };
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "All" || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ["All", ...new Set(employees.map((emp) => emp.department))];

  // ✅ Update Salary
  const handleUpdateSalary = () => {
    if (newSalary && !isNaN(newSalary)) {
      dispatch(
        updateEmployeeSalary({
          id: currentEmployee._id,
          newBasic: parseInt(newSalary),
        })
      )
        .unwrap()
        .then(() => {
          setIsModalOpen(false);
          setNewSalary("");
          setCurrentEmployee(null);
          dispatch(getAllEmployees());

          setNotification({
            show: true,
            message: "Salary updated successfully!",
            type: "success",
          });
          setTimeout(() => {
            setNotification({ show: false, message: "", type: "" });
          }, 3000);
        })
        .catch(() => {
          setNotification({
            show: true,
            message: "Failed to update salary. Try again.",
            type: "error",
          });
          setTimeout(() => {
            setNotification({ show: false, message: "", type: "" });
          }, 3000);
        });
    }
  };

  // ✅ Download Salary Slip (with working images)
  const handleDownloadSlip = async (employee) => {
  try {
    const salary = calculateSalary(employee.salary?.basic || 0);
    const doc = new jsPDF();

    const logoBase64 = await getBase64Image(logo);
    const bgBase64 = await getBase64Image(background);

    // Background watermark
    doc.addImage(bgBase64, "PNG", 30, 50, 150, 200);

    // Logo
    doc.addImage(logoBase64, "PNG", 90, 5, 30, 30);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("APPIFLY INFOTECH", 105, 45, { align: "center" });

    doc.setFontSize(16);
    doc.text("Salary Slip", 105, 60, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${employee.name}`, 20, 80);
    doc.text(`Employee ID: ${employee.employeeId}`, 20, 90);
    doc.text(`Department: ${employee.department}`, 20, 100);

    // ✅ Use autoTable like this
    autoTable(doc, {
      startY: 125,
      theme: "grid",
      head: [["Particulars", "Amount"]],
      body: [
        ["Basic Salary", `₹${(employee.salary?.basic || 0).toLocaleString()}`],
        ["Allowances", `₹${salary.allowances.toLocaleString()}`],
        ["Deductions", `₹${salary.deductions.toLocaleString()}`],
        ["Gross Salary", `₹${salary.grossSalary.toLocaleString()}`],
        ["Net Salary", `₹${salary.netSalary.toLocaleString()}`],
      ],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      bodyStyles: { fontSize: 12 },
    });

    doc.save(`SalarySlip_${employee.employeeId}.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
  }
};


  return (
    <div className="salary-container">
      <div className="salary-header">
        <h2>SALARY MANAGEMENT</h2>
        <p>Manage employee salary details and calculations</p>
      </div>

      {/* ✅ Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept} Department
            </option>
          ))}
        </select>

        <button
          className="export-btn"
          onClick={() => dispatch(exportEmployees())}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">Loading employees...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>BASIC SALARY</th>
                <th>ALLOWANCES</th>
                <th>DEDUCTIONS</th>
                <th>GROSS SALARY</th>
                <th>NET SALARY</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => {
                const salary = calculateSalary(employee.salary?.basic || 0);
                return (
                  <tr key={employee._id}>
                    <td>
                      <div className="employee">
                        <div className="avatar">{employee.name.charAt(0)}</div>
                        <div>
                          <div className="name">{employee.name}</div>
                          <div className="emp-id">{employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="dept-badge">{employee.department}</span>
                      <div className="designation">
                        {employee.designation}
                      </div>
                    </td>
                    <td className="amount">
                      ₹{(employee.salary?.basic || 0).toLocaleString()}
                    </td>
                    <td className="allowance">
                      +₹{salary.allowances.toLocaleString()}
                    </td>
                    <td className="deduction">
                      -₹{salary.deductions.toLocaleString()}
                    </td>
                    <td className="amount">
                      ₹{salary.grossSalary.toLocaleString()}
                    </td>
                    <td className="net-salary">
                      ₹{salary.netSalary.toLocaleString()}
                    </td>
                    <td className="action-buttons">
                      <button
                        className="update-btn"
                        onClick={() => {
                          setCurrentEmployee(employee);
                          setNewSalary(employee.salary?.basic || 0);
                          setIsModalOpen(true);
                        }}
                      >
                        Update Salary
                      </button>
                      <button
                        className="slip-btn"
                        onClick={() => {
                          setCurrentEmployee(employee);
                          setIsSlipOpen(true);
                        }}
                      >
                        <FileText size={14} /> Salary Slip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filteredEmployees.length === 0 && !loading && (
          <div className="empty-state">
            <div>No employees found</div>
            <p>Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Update Salary Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Update Salary</h3>
            <input
              type="number"
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="save-btn" onClick={handleUpdateSalary}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Slip Modal */}
      {isSlipOpen && currentEmployee && (
        <div className="modal-overlay">
          <div className="modal slip-modal">
            <h3>Salary Slip</h3>
            <div className="slip-content">
              <p>
                <strong>Name:</strong> {currentEmployee.name}
              </p>
              <p>
                <strong>Employee ID:</strong> {currentEmployee.employeeId}
              </p>
              <p>
                <strong>Department:</strong> {currentEmployee.department}
              </p>
              
              <hr />
              <p>
                <strong>Basic Salary:</strong> ₹
                {(currentEmployee.salary?.basic || 0).toLocaleString()}
              </p>
              <p>
                <strong>Allowances:</strong> ₹
                {calculateSalary(
                  currentEmployee.salary?.basic || 0
                ).allowances.toLocaleString()}
              </p>
              <p>
                <strong>Deductions:</strong> ₹
                {calculateSalary(
                  currentEmployee.salary?.basic || 0
                ).deductions.toLocaleString()}
              </p>
              <p>
                <strong>Gross Salary:</strong> ₹
                {calculateSalary(
                  currentEmployee.salary?.basic || 0
                ).grossSalary.toLocaleString()}
              </p>
              <p>
                <strong>Net Salary:</strong> ₹
                {calculateSalary(
                  currentEmployee.salary?.basic || 0
                ).netSalary.toLocaleString()}
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={() => setIsSlipOpen(false)}>Close</button>
              <button
                className="download-btn"
                onClick={() => handleDownloadSlip(currentEmployee)}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryTable;
