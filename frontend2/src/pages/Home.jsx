// src/pages/Home.js
import React from 'react';
import Navbar from '../components/Navbar';
import MenuButton from '../components/MenuButton';
import { FaClock, FaUser, FaBuilding, FaUserCheck, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  return (
    <>
    <div className="main">

      <Navbar />
      <div className="menu-container">
        <MenuButton icon={<FaClock />} label="DASHBOARD" />
        <MenuButton icon={<FaUser />} label="EMPLOYEES" />
        <MenuButton icon={<FaBuilding />} label="DEPARTMENTS" />
        <MenuButton icon={<FaUserCheck />} label="ATTENDANCE" />
        <MenuButton icon={<FaCalendarAlt />} label="LEAVE STATUS" />
        <MenuButton icon={<FaDollarSign />} label="SALARY" />
      </div>
    </div>
    </>
  );
};

export default Home;
