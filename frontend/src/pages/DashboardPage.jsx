import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardCard from "../components/DashboardCard";
import "./DashboardPage.css";
import { FaDollarSign, FaUser, FaBuilding } from "react-icons/fa";
import { getAllEmployees, getMonthlyPay } from "../redux/slices/employeeSlice";

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { employees, monthlyPay } = useSelector((state) => state.employees);

  useEffect(() => {
    dispatch(getAllEmployees());
    dispatch(getMonthlyPay());
  }, [dispatch]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <DashboardCard
          icon={<FaDollarSign />}
          title="Monthly Pay"
          value={`₹${monthlyPay.toLocaleString()}`}
        />
        <DashboardCard
          icon={<FaUser />}
          title="Total Employees"
          value={employees.length}
        />
        <DashboardCard
          icon={<FaBuilding />}
          title="Total Departments"
          value={3}  // constant
        />
      </div>
    </div>
  );
};

export default DashboardPage;
