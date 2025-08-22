import React from 'react';
import DashboardCard from '../components/DashboardCard';
import './DashboardPage.css';
import { FaDollarSign, FaUser, FaBuilding } from 'react-icons/fa';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <DashboardCard icon={<FaDollarSign />} title="Monthly Pay" value="₹5,00,000" />
        <DashboardCard icon={<FaUser />} title="Total Employees" value="3" />
        <DashboardCard icon={<FaBuilding />} title="Total Departments" value="3" />
      </div>
    </div>
  );
};

export default DashboardPage;