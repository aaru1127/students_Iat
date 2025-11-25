import React, { useContext, useEffect, useMemo, useState } from "react";
import SidebarTeacher from "../components/SidebarTeacher";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import "../global.css";
import "./Dashboard.css";

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

const SUBJECTS = ['Mathematics','Computer Science','Electronics','Data Structures','Operating Systems','Database Systems','Networks'];

export default function TeacherProfile() {
  const { user, login } = useContext(AuthContext);

  const avatarKey = useMemo(() => (user?.id || user?._id) ? `avatar:${user.id || user._id}` : null, [user]);
  const [avatar, setAvatar] = useState(null);
  useEffect(() => {
    if (avatarKey) {
      const saved = localStorage.getItem(avatarKey);
      setAvatar(saved || null);
    }
  }, [avatarKey]);

  const [showEdit, setShowEdit] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ department: '', year: '', phone: '', avatarPreview: null });
  useEffect(() => {
    setForm({
      department: user?.department || '',
      year: user?.year || '',
      phone: user?.phone || '',
      avatarPreview: avatar || null,
    });
  }, [user, avatar]);

  const [subjectSel, setSubjectSel] = useState([]);
  useEffect(() => { setSubjectSel(Array.isArray(user?.subjects)? user.subjects : []); }, [user]);

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm(p=>({ ...p, avatarPreview: reader.result }));
    reader.readAsDataURL(f);
  };

  const saveTeacherProfile = async () => {
    try{
      setSaving(true);
      if (avatarKey && form.avatarPreview) {
        localStorage.setItem(avatarKey, form.avatarPreview);
        setAvatar(form.avatarPreview);
      }
      const res = await axiosInstance.put('/auth/profile', {
        userId: user?.id || user?._id,
        department: form.department,
        year: form.year,
        profileCompleted: true,
      });
      if (res?.data?.token && res?.data?.user) login(res.data.token, res.data.user);
      setShowEdit(false);
    } catch(e){
      alert(e.response?.data?.message || 'Failed to save');
    } finally{ setSaving(false); }
  };

  const saveSubjects = async () => {
    try{
      setSaving(true);
      const res = await axiosInstance.put('/auth/subjects', {
        userId: user?.id || user?._id,
        subjects: subjectSel,
        year: form.year || user?.year,
        department: form.department || user?.department,
      });
      if (res?.data?.token && res?.data?.user) login(res.data.token, res.data.user);
      setShowSubjects(false);
    } catch(e){
      alert(e.response?.data?.message || 'Failed to update subjects');
    } finally{ setSaving(false); }
  };

  const onChangePassword = async () => {
    alert('Password change is not yet connected to backend. Please enable /api/auth/change-password on the server.');
    setShowPwd(false);
  };

  return (
    <div className="dashboard-flex">
      <SidebarTeacher active="Profile" />

      <main className="dashboard-main">
        <header className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">My Profile</h1>
            <p className="dashboard-subtitle">View and manage your personal information.</p>
          </div>
        </header>

        <section className="profile-card" style={{ display:'flex', alignItems:'center', gap:24, padding:24 }}>
          {/* Left: avatar + name */}
          <div style={{ display:'flex', alignItems:'center', gap:16, minWidth:280 }}>
            <div style={{ width:86, height:86, borderRadius:'50%', overflow:'hidden', background:'#fde7d8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, fontWeight:800 }}>
              {avatar ? (
                <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                (user?.name || 'T').slice(0,1)
              )}
            </div>
            <div>
              <div style={{ display:'inline-block', padding:'4px 10px', borderRadius:999, background:'#e9edff', color:'#3f51f5', fontWeight:800, fontSize:12, marginBottom:6 }}>TEACHER</div>
              <h2 style={{ margin:'4px 0 2px 0' }}>{user?.name || 'Teacher'}</h2>
              <div style={{ color:'#6b7280' }}>{user?.email || 'teacher@university.edu'}</div>
              <div style={{ marginTop:12, display:'flex', gap:10 }}>
                <button className="entermarks-save-btn" style={{ padding:'10px 16px', borderRadius:10 }} onClick={()=>setShowEdit(true)}>Edit Profile</button>
                <button className="signout-btn" style={{ margin:0 }} onClick={()=>setShowPwd(true)}>Change Pass...</button>
                <button className="signout-btn" style={{ margin:0 }} onClick={()=>setShowSubjects(true)}>Edit Subjects</button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width:1, height:130, background:'#edf0f4' }} />

          {/* Right: fields or inline edit */}
          <div style={{ flex:1 }}>
            {!showEdit ? (
              <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', rowGap:14, columnGap:18 }}>
                <div style={{ color:'#6b7280' }}>Department</div>
                <div>{user?.department || 'Computer Science'}</div>
                <div style={{ color:'#6b7280' }}>Year</div>
                <div>{user?.year || '-'}</div>
                <div style={{ color:'#6b7280' }}>Subjects Handled</div>
                <div>{Array.isArray(user?.subjects) && user.subjects.length>0 ? user.subjects.join(', ') : 'Data Structures, Algorithms, Web Development'}</div>
                <div style={{ color:'#6b7280' }}>Phone Number</div>
                <div>{user?.phone || '+91 12345 67890'}</div>
              </div>
            ) : (
              <div>
                <h3 style={{ marginTop:0 }}>Edit Profile</h3>
                <div className="input-group"><label>Department</label><div className="input-with-icon"><i className="fa-solid fa-building"/><input value={form.department} onChange={e=>setForm(p=>({...p, department:e.target.value}))} placeholder="Department"/></div></div>
                <div className="input-group"><label>Year</label><div className="input-with-icon"><i className="fa-solid fa-graduation-cap"/><input value={form.year} onChange={e=>setForm(p=>({...p, year:e.target.value}))} placeholder="Year"/></div></div>
                <div className="input-group"><label>Profile Image</label><input type="file" accept="image/*" onChange={onPickAvatar} /></div>
                <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <button className="signout-btn" onClick={()=>{ setShowEdit(false); setForm(p=>({ ...p, avatarPreview: avatar })); }} disabled={saving}>Cancel</button>
                  <button className="entermarks-save-btn" onClick={saveTeacherProfile} disabled={saving}>{saving?'Saving...':'Save'}</button>
                </div>
              </div>
            )}
          </div>
        </section>
        {/* Edit Subjects Inline Section */}
        {showSubjects && (
          <section className="profile-card" style={{ padding:20, marginTop:16 }}>
            <h3 style={{ marginTop:0 }}>Edit Subjects</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:10, margin:'12px 0 18px 0' }}>
              {SUBJECTS.map(s => (
                <label key={s} className="checkbox-item" style={{ display:'flex', gap:8, alignItems:'center', padding:8, border:'1px solid #eee', borderRadius:8 }}>
                  <input type="checkbox" checked={subjectSel.includes(s)} onChange={() => setSubjectSel(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button className="signout-btn" onClick={()=>setShowSubjects(false)} disabled={saving}>Cancel</button>
              <button className="entermarks-save-btn" onClick={saveSubjects} disabled={saving}>{saving?'Saving...':'Save'}</button>
            </div>
          </section>
        )}

        {/* Change Password Inline Section */}
        {showPwd && (
          <section className="profile-card" style={{ padding:20, marginTop:16 }}>
            <h3 style={{ marginTop:0 }}>Change Password</h3>
            <div className="input-group"><label>Current Password</label><div className="input-with-icon"><i className="fa-solid fa-lock"/><input type="password" /></div></div>
            <div className="input-group"><label>New Password</label><div className="input-with-icon"><i className="fa-solid fa-key"/><input type="password" /></div></div>
            <div className="input-group"><label>Confirm New Password</label><div className="input-with-icon"><i className="fa-solid fa-key"/><input type="password" /></div></div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:10 }}>
              <button className="signout-btn" onClick={()=>setShowPwd(false)}>Cancel</button>
              <button className="entermarks-save-btn" onClick={()=>{ onChangePassword(); }}>Update</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
