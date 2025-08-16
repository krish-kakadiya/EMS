import React from "react";
import "./Navbar.css";
import { useDispatch } from "react-redux";
import { logoutUser } from "../redux/slices/authSlice";

const Navbar = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <nav className="navbar">
      <div className="navbar-title">APPIFLY INFOTECH</div>
      <button className="logout-btn" onClick={handleLogout}>
        LOGOUT
      </button>
    </nav>
  );
};

export default Navbar;
