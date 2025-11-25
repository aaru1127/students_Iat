import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function SidebarTeacher({ active = "" }) {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-profile-teacher">
        <img src="https://randomuser.me/api/portraits/women/65.jpg" className="sidebar-avatar" alt={user?.name || "Teacher"}/>
        <div>
          <div className="sidebar-profile-name">{user?.name || "Teacher"}</div>
          <div className="sidebar-profile-email">Teacher</div>
        </div>
      </div>
      <nav className="sidebar-menu">
        <Link className={active==="Dashboard"?'active':''} to="/teacher-dashboard"><i className="fa-solid fa-table-columns"></i> Dashboard</Link>
        <Link className={active==="Enter Marks"?'active':''} to="/teacher/enter-marks">
          <i className="fa-solid fa-edit"></i> Enter Marks
        </Link>
        <Link className={active==="View Marks"?'active':''} to="/teacher/view-marks"><i className="fa-solid fa-list"></i> View Marks</Link>
        <Link className={active==="Profile"?'active':''} to="/teacher/profile"><i className="fa-solid fa-user"></i> Profile</Link>
      </nav>
      <button className="signout-btn" onClick={handleLogout}>Logout</button>
    </aside>
  );
}
