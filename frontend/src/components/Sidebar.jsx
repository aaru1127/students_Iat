import React, { useContext, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { user } = useContext(AuthContext);

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
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-avatar" style={{ marginRight: 10 }}>
          {avatar ? (
            <img src={avatar} alt={user?.name || 'Student'} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
          ) : (
            <i className="fa-solid fa-graduation-cap" />
          )}
        </div>
        <span>{user?.name || 'Student'}</span>
      </div>
      <nav className="sidebar-menu">
        <NavLink className={({isActive})=> isActive ? "active" : ""} to="/student-dashboard"><i className="fa-solid fa-gauge"></i> Dashboard</NavLink>
        <NavLink className={({isActive})=> isActive ? "active" : ""} to="/marks"><i className="fa-solid fa-list-check"></i> My Marks</NavLink>
        <NavLink className={({isActive})=> isActive ? "active" : ""} to="/profile"><i className="fa-solid fa-user"></i> Profile</NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;

