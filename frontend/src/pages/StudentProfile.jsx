import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../global.css";

function PwdModal({ onClose, onSubmit }){
  const [oldPwd,setOld] = useState('');
  const [newPwd,setNew] = useState('');
  const [confirm,setConfirm] = useState('');
  const mismatch = newPwd && confirm && newPwd !== confirm;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
      <div className="profile-card" style={{ width:420, padding:20 }}>
        <h3 style={{ marginTop:0 }}>Change Password</h3>
        <div className="input-group"><label>Current Password</label><div className="input-with-icon"><i className="fa-solid fa-lock"/><input type="password" value={oldPwd} onChange={e=>setOld(e.target.value)} /></div></div>
        <div className="input-group"><label>New Password</label><div className="input-with-icon"><i className="fa-solid fa-key"/><input type="password" value={newPwd} onChange={e=>setNew(e.target.value)} /></div></div>
        <div className="input-group"><label>Confirm New Password</label><div className="input-with-icon"><i className="fa-solid fa-key"/><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} /></div></div>
        {mismatch && <div className="error-message" style={{marginTop:8}}>Passwords do not match</div>}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:10 }}>
          <button className="signout-btn" onClick={onClose}>Cancel</button>
          <button className="entermarks-save-btn" onClick={()=> !mismatch && onSubmit(oldPwd,newPwd)} disabled={mismatch}>Update</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { user, logout, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [marks, setMarks] = useState([]); // raw list of marks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Local avatar storage helpers
  const avatarKey = useMemo(() => (user?.id || user?._id) ? `avatar:${user.id || user._id}` : null, [user]);
  const [avatar, setAvatar] = useState(null);
  useEffect(() => {
    if (avatarKey) {
      const saved = localStorage.getItem(avatarKey);
      setAvatar(saved || null);
    }
  }, [avatarKey]);

  // Modal states
  const [showEdit, setShowEdit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for edit
  const [form, setForm] = useState({ department: "", usn: "", year: "", section: "", className: "", avatarFile: null, avatarPreview: null });
  useEffect(() => {
    setForm({
      department: user?.department || "",
      usn: user?.usn || "",
      year: user?.year || "",
      section: user?.section || "",
      className: user?.class || "",
      avatarFile: null,
      avatarPreview: avatar || null,
    });
  }, [user, avatar]);

  const onPickAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, avatarFile: file, avatarPreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      if (avatarKey && form.avatarPreview) {
        localStorage.setItem(avatarKey, form.avatarPreview);
        setAvatar(form.avatarPreview);
      }
      // Persist profile fields supported by backend
      const res = await axiosInstance.put('/auth/profile', {
        userId: user?.id || user?._id,
        department: form.department,
        usn: form.usn,
        year: form.year,
        section: form.section,
        profileCompleted: true,
      });
      if (res?.data?.token && res?.data?.user) {
        login(res.data.token, res.data.user);
      }
      setShowEdit(false);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (oldPwd, newPwd) => {
    try {
      // Backend has no change-password endpoint currently; show guidance.
      alert('Password change is not yet connected to backend. Please ask to enable /api/auth/change-password on server.');
    } finally {
      setShowPwd(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user?.id && !user?._id) return;
      setError("");
      setLoading(true);
      try {
        const res = await axiosInstance.get('/marks', { params: { studentId: user.id || user._id } });
        setMarks(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load marks');
        setMarks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-flex">
      <Sidebar />
      <div className="dashboard-main">
        <header className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">My Profile</h1>
            <p className="dashboard-subtitle">View and manage your personal information.</p>
          </div>
          <div className="header-actions">
            <button className="signout-btn" onClick={onLogout}>
              <i className="fa-solid fa-right-from-bracket" style={{ marginRight: 6 }} /> Logout
            </button>
          </div>
        </header>

        {/* Profile card */}
        <section className="profile-card" style={{ display:'flex', alignItems:'flex-start', gap:24, padding:24 }}>
          {/* Left: avatar + name */}
          <div style={{ display:'flex', alignItems:'center', gap:16, minWidth:280 }}>
            <div style={{ width:86, height:86, borderRadius:'50%', overflow:'hidden', background:'#eaf0ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, fontWeight:800 }}>
              {(showEdit ? form.avatarPreview : avatar) ? (
                <img src={showEdit ? form.avatarPreview : avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                (user?.name || 'S').slice(0,1)
              )}
            </div>
            <div>
              <h2 style={{ margin:'4px 0 2px 0' }}>{user?.name || '-'}</h2>
              <div style={{ color:'#6b7280' }}>Student</div>
              <div style={{ marginTop:12, display:'flex', gap:10 }}>
                {!showEdit && (
                  <>
                    <button className="entermarks-save-btn" style={{ padding:'10px 16px', borderRadius:10 }} onClick={()=>setShowEdit(true)}>Edit Profile</button>
                    <button className="signout-btn" style={{ margin:0 }} onClick={()=>setShowPwd(v=>!v)}>Change Password</button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width:1, minHeight:130, background:'#edf0f4' }} />

          {/* Right: details or inline edit fields */}
          <div style={{ flex:1 }}>
            {!showEdit ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:14 }}>
                <div>
                  <div style={{ color:'#6b7280', fontWeight:600, marginBottom:6 }}>Department</div>
                  <div>{user?.department || 'Computer Science'}</div>
                </div>
                <div>
                  <div style={{ color:'#6b7280', fontWeight:600, marginBottom:6 }}>Student ID</div>
                  <div>{user?.usn || 'ST12345'}</div>
                </div>
                <div>
                  <div style={{ color:'#6b7280', fontWeight:600, marginBottom:6 }}>Email</div>
                  <div>{user?.email || 'alex.doe@university.edu'}</div>
                </div>
                <div>
                  <div style={{ color:'#6b7280', fontWeight:600, marginBottom:6 }}>Class</div>
                  <div>{user?.class || user?.year || 'B.Tech 3rd Year'}</div>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginTop:0 }}>Edit Profile</h3>
                <div className="input-group">
                  <label>Department</label>
                  <div className="input-with-icon"><i className="fa-solid fa-building"/><input value={form.department} onChange={e=>setForm(p=>({...p, department:e.target.value}))} placeholder="Department"/></div>
                </div>
                <div className="input-group">
                  <label>USN</label>
                  <div className="input-with-icon"><i className="fa-solid fa-id-card"/><input value={form.usn} onChange={e=>setForm(p=>({...p, usn:e.target.value}))} placeholder="USN"/></div>
                </div>
                <div className="input-group" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label>Year</label>
                    <div className="input-with-icon"><i className="fa-solid fa-graduation-cap"/><input value={form.year} onChange={e=>setForm(p=>({...p, year:e.target.value}))} placeholder="Year"/></div>
                  </div>
                  <div>
                    <label>Section</label>
                    <div className="input-with-icon"><i className="fa-solid fa-users"/><input value={form.section} onChange={e=>setForm(p=>({...p, section:e.target.value}))} placeholder="Section"/></div>
                  </div>
                </div>
                <div className="input-group">
                  <label>Profile Image</label>
                  <input type="file" accept="image/*" onChange={onPickAvatar} />
                </div>
                <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <button className="signout-btn" onClick={()=>{ setShowEdit(false); setForm(p=>({ ...p, avatarPreview: avatar })); }} disabled={saving}>Cancel</button>
                  <button className="entermarks-save-btn" onClick={saveProfile} disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Change Password Inline Section */}
        {showPwd && (
          <section className="profile-card" style={{ padding:20, marginTop:16 }}>
            <h3 style={{ marginTop:0 }}>Change Password</h3>
            <div className="input-group"><label>Current Password</label><div className="input-with-icon"><i className="fa-solid fa-lock"/><input type="password" /></div></div>
            <div className="input-group"><label>New Password</label><div className="input-with-icon"><i className="fa-solid fa-key"/><input type="password" /></div></div>
            <div className="input-group"><label>Confirm New Password</label><div className="input-with-icon"><i className="fa-solid fa-key"/><input type="password" /></div></div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:10 }}>
              <button className="signout-btn" onClick={()=>setShowPwd(false)}>Cancel</button>
              <button className="entermarks-save-btn" onClick={()=>{ alert('Backend change-password not implemented'); setShowPwd(false); }}>Update</button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
