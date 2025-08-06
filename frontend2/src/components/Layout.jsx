import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children, activePage = 'dashboard' }) => {
  return (
    <div className="layout">
      <Navbar />
      <div className="layout-content">
        <Sidebar activePage={activePage} />
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout; 