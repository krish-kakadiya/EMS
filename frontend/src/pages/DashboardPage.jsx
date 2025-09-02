import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllEmployees, getMonthlyPay, exportEmployees } from "../redux/slices/employeeSlice";
import { getAllLeaves } from "../redux/slices/leaveSlice"; // ✅ added
import {
  DollarSign,
  User,
  Download,
  Plus,
  Briefcase,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./DashboardPage.css";

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { employees, monthlyPay, loading, error } = useSelector(
    (state) => state.employees
  );
  const { allLeaves } = useSelector((state) => state.leave); // ✅ real leave data

  // Fetch data on mount
  useEffect(() => {
    dispatch(getAllEmployees());
    dispatch(getMonthlyPay());
    dispatch(getAllLeaves()); // ✅ fetch leaves for admin
  }, [dispatch]);

  const handleExport = () => {
    dispatch(exportEmployees()); // ✅ export Excel
  };

  const handleAddNewEmployee = () => {
    navigate("/add-new-user");
  };

  const totalEmployees = employees.length;

  // Group by department
  const departmentMap = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  const departmentData = Object.entries(departmentMap).map(([dept, count]) => ({
    dept,
    employees: count,
  }));

  // Salary Distribution
  const salaryDistribution = { "30-50K": 0, "50-70K": 0, "70-85K": 0, "85K+": 0 };
  employees.forEach((emp) => {
    const salary = emp.salary?.basic || 0;
    if (salary >= 30000 && salary <= 50000) salaryDistribution["30-50K"]++;
    else if (salary > 50000 && salary <= 70000) salaryDistribution["50-70K"]++;
    else if (salary > 70000 && salary <= 85000) salaryDistribution["70-85K"]++;
    else if (salary > 85000) salaryDistribution["85K+"]++;
  });

  const salaryDistributionData = Object.entries(salaryDistribution).map(
    ([range, count], i) => ({
      range,
      count,
      color: ["#6366F1", "#22C55E", "#FACC15", "#F87171"][i],
    })
  );

  const avgSalary =
    totalEmployees > 0
      ? employees.reduce((sum, emp) => sum + (emp.salary?.basic || 0), 0) /
        totalEmployees
      : 0;

  // ✅ Dynamic Leave Status (Admin view)
  const leaveCounts = allLeaves.reduce(
    (acc, leave) => {
      acc[leave.status] = (acc[leave.status] || 0) + 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  const leaveStatusData = [
    { name: "Approved", value: leaveCounts.approved, color: "#4ade80" },
    { name: "Pending", value: leaveCounts.pending, color: "#fbbf24" },
    { name: "Rejected", value: leaveCounts.rejected, color: "#f87171" },
  ];

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>HR Dashboard</h1>
          <p>Welcome back! Here's your workforce overview</p>
          <span className="timestamp">
            Last updated: {new Date().toLocaleDateString()}{" "}
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="header-actions">
          <button onClick={handleExport} className="btn btn-primary">
            <Download size={16} /> Export Report
          </button>
          <button onClick={handleAddNewEmployee} className="btn btn-success">
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid-4">
        <DashboardCard
          icon={<User size={24} />}
          title="Total Employees"
          value={totalEmployees}
          subtitle="Active workforce"
          trendPositive
          color="purple"
        />
        <DashboardCard
          icon={<DollarSign size={24} />}
          title="Monthly Payroll"
          value={`₹${(monthlyPay / 100000).toFixed(1)}L`}
          subtitle="Total monthly cost"
          trendPositive
          color="red"
        />
        <DashboardCard
          icon={<Briefcase size={24} />}
          title="Departments"
          value={departmentData.length}
          subtitle="Active departments"
          color="orange"
        />
      </div>

      {/* Department Chart */}
      <div className="chart-card">
        <h3>Department Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={departmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dept" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="employees" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Two Charts */}
      <div className="grid-2">
        <div className="chart-card">
          <h3>Salary Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={salaryDistributionData}
                dataKey="count"
                outerRadius={100}
                label={({ range, count }) => `${range}: ${count}`}
              >
                {salaryDistributionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Leave Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={leaveStatusData}
                dataKey="value"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {leaveStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <h3>Quick Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span>Average Salary</span>
            <strong>₹{avgSalary.toFixed(0)}</strong>
          </div>
          <div className="stat-card">
            <span>Total Departments</span>
            <strong>{departmentData.length}</strong>
          </div>
          <div className="stat-card">
            <span>Active Projects</span>
            <strong>24</strong>
          </div>
          <div className="stat-card">
            <span>Pending Reviews</span>
            <strong>12</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

// Card Component
const DashboardCard = ({ icon, title, value, subtitle, color }) => (
  <div className={`card card-${color}`}>
    <div className="card-header">
      <div className="icon">{icon}</div>
    </div>
    <h2>{value}</h2>
    <p className="title">{title}</p>
    <p className="subtitle">{subtitle}</p>
  </div>
);

export default DashboardPage;
  