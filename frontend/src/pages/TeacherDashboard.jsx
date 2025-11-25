import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SidebarTeacher from '../components/SidebarTeacher';
import axiosInstance from '../api/axios';
import '../global.css';
import './Dashboard.css';

const DUMMY_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'Electronics',
  'Mechanics',
  'Data Structures',
  'Operating Systems',
  'Database Systems',
];

const TeacherDashboard = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const needsSetup = useMemo(() => {
    if (!user || user.role !== 'teacher') return false;
    return !user.profileCompleted || !user.year || !user.department || !user.subjects || user.subjects.length === 0;
  }, [user]);

  const [stats, setStats] = useState({
    totalStudents: 0,
    classesManaged: 0,
    pendingEvaluations: 0,
  });
  const [activity, setActivity] = useState([]); // {desc, who, date}
  const [searchUSN, setSearchUSN] = useState("");
  const [searched, setSearched] = useState(null); // { student, marks }
  const [searchError, setSearchError] = useState("");

  const [formData, setFormData] = useState({
    studentId: '',
    subject: '',
    marks: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [setup, setSetup] = useState({ year: '', department: '', subjects: [] });
  const [savingSetup, setSavingSetup] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/marks/teacher-summary', {
          params: { teacherId: user?.id || user?._id },
        });
        setStats(res.data);
      } catch (err) {
        console.error('Error loading teacher summary', err);
      }
    };

    const fetchActivity = async () => {
      try {
        const list = await axiosInstance
          .get('/marks', { params: { teacherId: user?.id || user?._id } })
          .then(r => Array.isArray(r.data) ? r.data : [])
          .catch(() => []);
        // sort latest first by createdAt/updatedAt and take top 8
        const sorted = list
          .map(m => ({
            id: m._id,
            category: m.category,
            subject: m.subject,
            date: m.updatedAt || m.createdAt,
            who: m.studentId?.name || '-',
            usn: m.studentId?.usn,
          }))
          .sort((a,b) => new Date(b.date) - new Date(a.date))
          .slice(0, 8)
          .map(m => ({
            desc: `${m.category} marks ${m.usn ? `for ${m.usn}` : ''} added/updated in ${m.subject}`.trim(),
            who: m.who,
            date: new Date(m.date).toLocaleDateString(),
          }));
        setActivity(sorted);
      } catch (e) {
        setActivity([]);
      }
    };

    if ((user?.id || user?._id) && !needsSetup) {
      fetchStats();
      fetchActivity();
    }
  }, [user, needsSetup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axiosInstance.post('/marks', {
        ...formData,
        teacherId: user?.id,
        category: 'IAT',
      });
      setSuccess('Marks added successfully!');
      setFormData({ studentId: '', subject: '', marks: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add marks');
    }
  };

  const toggleSubject = (subj) => {
    setSetup((p) => {
      const exists = p.subjects.includes(subj);
      return { ...p, subjects: exists ? p.subjects.filter((s) => s !== subj) : [...p.subjects, subj] };
    });
  };

  const saveSetup = async (e) => {
    e.preventDefault();
    setError('');
    setSavingSetup(true);
    try {
      const res = await axiosInstance.put('/auth/subjects', {
        userId: user?.id,
        year: setup.year,
        department: setup.department,
        subjects: setup.subjects,
      });
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subjects');
    } finally {
      setSavingSetup(false);
    }
  };

  if (needsSetup) {
    return (
      <div className="dashboard-flex">
        <SidebarTeacher active="Dashboard" />
        <main className="dashboard-main">
          <header className="dashboard-header-row">
            <div>
              <h1 className="dashboard-title">Welcome, {user?.name || 'Teacher'}!</h1>
              <p className="dashboard-subtitle">Let’s set up your teaching profile.</p>
            </div>
          </header>

          <div className="login-card" style={{ maxWidth: 720 }}>
            <div className="login-card-right" style={{ width: '100%' }}>
              <div className="login-form-container">
                <h2 className="login-title">Choose your subjects</h2>
                <p className="login-subtitle">Select academic year, department and the subjects you handle.</p>
                {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}
                <form className="login-form" onSubmit={saveSetup}>
                  <div className="input-group">
                    <label>Year</label>
                    <div className="input-with-icon">
                      <i className="fa-solid fa-graduation-cap" />
                      <select name="year" value={setup.year} onChange={(e) => setSetup((p) => ({ ...p, year: e.target.value }))} required style={{ border: 'none', background: 'transparent', width: '100%' }}>
                        <option value="">Select Year</option>
                        {['1st Year','2nd Year','3rd Year','4th Year'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Department</label>
                    <div className="input-with-icon">
                      <i className="fa-solid fa-building" />
                      <select name="department" value={setup.department} onChange={(e) => setSetup((p) => ({ ...p, department: e.target.value }))} required style={{ border: 'none', background: 'transparent', width: '100%' }}>
                        <option value="">Select Department</option>
                        {['Computer Science','Information Science','Electronics','Mechanical','Civil'].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Subjects</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                      {DUMMY_SUBJECTS.map((s) => (
                        <label key={s} className="checkbox-item" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, border: '1px solid #eee', borderRadius: 8 }}>
                          <input type="checkbox" checked={setup.subjects.includes(s)} onChange={() => toggleSubject(s)} />
                          <span>{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="login-btn" disabled={savingSetup}>
                    {savingSetup ? 'Saving...' : 'Save & Continue'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-flex">
      <SidebarTeacher active="Dashboard" />

      <main className="dashboard-main">
        <header className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">
              Welcome, {user?.name || 'Dr. Carter'}!
            </h1>
            <p className="dashboard-subtitle">
              Here’s a summary of your classes and student marks.
            </p>
          </div>
          <div className="dashboard-header-actions">
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search student by USN..."
                value={searchUSN}
                onChange={(e)=>setSearchUSN(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==='Enter'){ (async()=>{ try{ setSearchError(''); const res= await axiosInstance.get('/marks/by-usn',{ params:{ usn: searchUSN }}); setSearched(res.data); } catch(err){ setSearchError(err.response?.data?.message || 'Not found'); setSearched(null);} })(); } }}
              />
            </div>
            <button className="icon-button" aria-label="Notifications">
              <i className="fa-regular fa-bell" />
            </button>
            <div className="header-profile-chip" onClick={()=>navigate('/teacher/profile')} title="View profile" style={{cursor:'pointer'}}>
              <div className="chip-avatar">{(user?.name || 'EC')[0]}</div>
              <div className="chip-info">
                <span className="chip-name">{user?.name || 'Dr. Emily Carter'}</span>
                <span className="chip-role">Teacher</span>
              </div>
            </div>
          </div>
        </header>

        <section className="stats-row">
          <div className="stat-summary-card">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
          <div className="stat-summary-card">
            <div className="stat-label">Classes Managed</div>
            <div className="stat-value">{stats.classesManaged}</div>
          </div>
          <div className="stat-summary-card">
            <div className="stat-label">Pending Evaluations</div>
            <div className="stat-value">{stats.pendingEvaluations}</div>
          </div>
        </section>

        <section className="marks-cards-row">
          <div className="marks-card" onClick={() => navigate('/teacher/marks/iat')}>
            <div className="marks-card-icon iat">
              <i className="fa-solid fa-file-lines" />
            </div>
            <h3>IAT Marks</h3>
            <p>Manage Internal Assessment Test scores for all classes.</p>
            <button className="text-link">Manage Marks →</button>
          </div>
          <div className="marks-card" onClick={() => navigate('/teacher/marks/lab')}>
            <div className="marks-card-icon lab">
              <i className="fa-solid fa-flask" />
            </div>
            <h3>Lab Marks</h3>
            <p>Update and track student performance in practical sessions.</p>
            <button className="text-link">Update Records →</button>
          </div>
          <div className="marks-card" onClick={() => navigate('/teacher/marks/assignment')}>
            <div className="marks-card-icon assignment">
              <i className="fa-solid fa-clipboard-list" />
            </div>
            <h3>Assignment Marks</h3>
            <p>Review submissions and enter marks for assignments.</p>
            <button className="text-link">View Submissions →</button>
          </div>
        </section>

        <section className="dashboard-bottom-row" style={{ gridTemplateColumns: searched?.student ? undefined : '1fr' }}>
          <div className="recent-activity-card" style={{ width: '100%' }}>
            <div className="recent-activity-header">
              <h2>Recent Activity</h2>
              <span className="muted">Latest updates</span>
            </div>
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Activity Description</th>
                  <th>Student</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 && (
                  <tr><td colSpan={3} className="muted" style={{textAlign:'center'}}>No recent activity</td></tr>
                )}
                {activity.map((a, i) => (
                  <tr key={i}>
                    <td>{a.desc}</td>
                    <td>{a.who}</td>
                    <td>{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {searched?.student && (
            <div className="profile-card" style={{ width: '100%', marginTop: 16 }}>
              <div className="recent-activity-header">
                <h2>Student Details</h2>
                <span className="muted">USN: {searched.student.usn}</span>
              </div>
              <div className="profile-fields">
                <div><strong>Name:</strong> {searched.student.name}</div>
                <div><strong>Email:</strong> {searched.student.email || '-'}</div>
                <div><strong>Class:</strong> {searched.student.class || '-'}</div>
                <div><strong>Section:</strong> {searched.student.section || '-'}</div>
              </div>
              <div className="entermarks-table-block" style={{ marginTop: 12 }}>
                <table className="entermarks-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(searched.marks || []).map(m => (
                      <tr key={m._id}>
                        <td>{m.subject}</td>
                        <td>{m.category}</td>
                        <td>{m.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {searchError && (
            <div className="error-message" style={{ marginTop: 12 }}>{searchError}</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TeacherDashboard;
