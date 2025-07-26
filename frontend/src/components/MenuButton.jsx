// src/components/MenuButton.js
import React from 'react';
import './MenuButton.css';

const MenuButton = ({ icon, label }) => {
  return (
    <div className="menu-button">
      <div className="icon">{icon}</div>
      <div className="label">{label}</div>
    </div>
  );
};

export default MenuButton;
