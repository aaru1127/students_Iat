import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <i className="fa-solid fa-graduation-cap" />
        <span>{user?.name || 'Student'}</span>
      </div>
      <nav className="sidebar-menu">
        <Link className="active" to="/student-dashboard"><i className="fa-solid fa-gauge"></i> Dashboard</Link>
        <Link to="/marks"><i className="fa-solid fa-list-check"></i> My Marks</Link>
        <Link to="/profile"><i className="fa-solid fa-user"></i> Profile</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;

