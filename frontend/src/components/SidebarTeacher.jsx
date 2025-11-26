import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function SidebarTeacher({ active = "" }) {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const avatarKey = useMemo(() => (user?.id || user?._id) ? `avatar:${user.id || user._id}` : null, [user]);
  const [avatar, setAvatar] = useState(null);
  useEffect(() => {
    if (avatarKey) {
      const saved = localStorage.getItem(avatarKey);
      setAvatar(saved || null);
    } else {
      setAvatar(null);
    }
  }, [avatarKey]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-profile-teacher">
        {avatar ? (
          <img src={avatar} className="sidebar-avatar" alt={user?.name || "Teacher"} />
        ) : (
          <div className="sidebar-avatar" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
            {(user?.name || 'T').slice(0,1)}
          </div>
        )}
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
        <Link className={active==="VTU Marks"?'active':''} to="/teacher/vtu-marks">
          <i className="fa-solid fa-graduation-cap"></i> Enter VTU Marks
        </Link>
        <Link className={active==="View Marks"?'active':''} to="/teacher/view-marks"><i className="fa-solid fa-list"></i> View Marks</Link>
        <Link className={active==="Profile"?'active':''} to="/teacher/profile"><i className="fa-solid fa-user"></i> Profile</Link>
      </nav>
      <button className="signout-btn" onClick={handleLogout}>Logout</button>
    </aside>
  );
}
