import React, { useContext, useEffect, useMemo, useState } from "react";
import SidebarTeacher from "../components/SidebarTeacher";
import Sidebar from "../components/Sidebar";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../global.css";

const departments = ["Computer Science", "Information Science", "Electronics", "Mechanical", "Civil"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const sections = ["A", "B", "C", "D"];

export default function SubjectMarks() {
  const { user } = useContext(AuthContext);

  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]); // { _id, usn, name, iat, lab, assignment, markIds: {iat?, lab?, assignment?} }

  // Student mode state
  const isStudent = user?.role === 'student';
  const [studentSubjects, setStudentSubjects] = useState([]); // [{name, iat, lab, assignment}]
  const studentAverages = useMemo(() => {
    if (!studentSubjects || studentSubjects.length === 0) return { iat: 0, lab: 0, assignment: 0 };
    const vals = { iat: [], lab: [], assignment: [] };
    studentSubjects.forEach(s => {
      if (s.iat !== '-' && s.iat !== '' && s.iat !== undefined) vals.iat.push(Number(s.iat));
      if (s.lab !== '-' && s.lab !== '' && s.lab !== undefined) vals.lab.push(Number(s.lab));
      if (s.assignment !== '-' && s.assignment !== '' && s.assignment !== undefined) vals.assignment.push(Number(s.assignment));
    });
    const avg = (arr) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    return { iat: avg(vals.iat), lab: avg(vals.lab), assignment: avg(vals.assignment) };
  }, [studentSubjects]);

  const canLoad = department && year && section;

  // Student: load own marks and group by subject
  useEffect(() => {
    const loadMine = async () => {
      if (!isStudent) return;
      if (!user?.id && !user?._id) return;
      setError('');
      setLoading(true);
      try {
        const res = await axiosInstance.get('/marks', { params: { studentId: user.id || user._id } });
        const list = Array.isArray(res.data) ? res.data : [];
        const map = new Map();
        list.forEach(m => {
          const key = m.subject || 'Unknown';
          if (!map.has(key)) map.set(key, { name: key, iat: '-', lab: '-', assignment: '-' });
          const rec = map.get(key);
          if (m.category === 'IAT') rec.iat = m.marks;
          if (m.category === 'Lab') rec.lab = m.marks;
          if (m.category === 'Assignment') rec.assignment = m.marks;
        });
        setStudentSubjects(Array.from(map.values()));
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load my marks');
        setStudentSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    loadMine();
  }, [isStudent, user]);

  const downloadMyPdf = async () => {
    try {
      const { generateStudentReportCard } = await import('../utils/reportCard');
      await generateStudentReportCard(user, studentSubjects);
    } catch (e) {
      console.error('PDF error', e);
    }
  };

  const loadStudents = async () => {
    if (!canLoad) return;
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.get('/marks/students', { params: { department, year, section } });
      const students = res.data.students || [];

      // For each student, fetch their marks once and map categories
      const allMarks = await Promise.all(
        students.map(s => axiosInstance.get('/marks', { params: { studentId: s._id, teacherId: (user?.id || user?._id) } })
          .then(r => r.data)
          .catch(() => []))
      );

      const merged = students.map((s, idx) => {
        const perStudent = allMarks[idx] || [];
        const byCat = (cat) => perStudent.find(m => m.category === cat);
        return {
          _id: s._id,
          usn: s.usn,
          name: s.name,
          iat: byCat('IAT')?.marks ?? '',
          lab: byCat('Lab')?.marks ?? '',
          assignment: byCat('Assignment')?.marks ?? '',
          markIds: {
            iat: byCat('IAT')?._id,
            lab: byCat('Lab')?._id,
            assignment: byCat('Assignment')?._id,
          }
        };
      });

      setRows(merged);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load students/marks');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  const setCell = (idx, key, value) => {
    const v = value === '' ? '' : Math.max(0, Math.min(100, Number(value)));
    setRows(prev => prev.map((r,i)=> i===idx ? { ...r, [key]: v } : r));
  };

  const saveUpdates = async () => {
    try {
      const payloads = [];
      const teacherId = user?.id || user?._id;
      rows.forEach(r => {
        // Save IAT, Lab and Assignment if provided
        ["IAT","Lab","Assignment"].forEach(cat => {
          const key = cat.toLowerCase();
          const val = r[key];
          if (val === '' || !subject) return; // require subject
          const existingId = r.markIds[key];
          if (existingId) {
            payloads.push(axiosInstance.put(`/marks/${existingId}`, { marks: Number(val) }));
          } else {
            payloads.push(axiosInstance.post('/marks', {
              studentId: r._id,
              subject,
              marks: Number(val),
              teacherId,
              category: cat,
            }));
          }
        });
      });
      if (payloads.length === 0) return alert('No changes to save');
      await Promise.all(payloads);
      alert('Marks saved');
      await loadStudents();
    } catch (err) {
      alert('Failed to save marks');
    }
  };

  const exportCsv = () => {
    const header = ['USN','Name','IAT','Lab','Assignment'];
    const lines = [header.join(',')].concat(rows.map(r => [r.usn, r.name, r.iat, r.lab, r.assignment].join(',')));
    const blob = new Blob(["\uFEFF" + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const title = useMemo(() => `View Marks ${year && `• ${year}`} ${section && `• ${section}`}`.trim(), [year, section]);

  if (isStudent) {
    return (
      <div className="dashboard-flex">
        <Sidebar />
        <div className="dashboard-main">
          <header className="dashboard-header-row">
            <div>
              <h1 className="dashboard-title">My Marks</h1>
              <p className="dashboard-subtitle">View and download all your marks.</p>
            </div>
            <div className="header-actions">
              <button className="entermarks-save-btn" onClick={downloadMyPdf} disabled={studentSubjects.length===0 || loading}>Download PDF</button>
            </div>
          </header>

          {/* Marks widgets row: table + chart */}
          <div className="subj-widgets-row">
            <section className="subj-table-block" style={{ flex: 1 }}>
              {error && <div className="error-message" style={{ margin: '8px 0' }}>{error}</div>}
              {loading && <div className="muted">Loading marks...</div>}
              {(() => {
                const hasIAT = studentSubjects.some(s => s.iat !== '-' && s.iat !== '' && s.iat !== undefined);
                const hasLab = studentSubjects.some(s => s.lab !== '-' && s.lab !== '' && s.lab !== undefined);
                const hasAssign = studentSubjects.some(s => s.assignment !== '-' && s.assignment !== '' && s.assignment !== undefined);
                const colCount = 1 + (hasIAT?1:0) + (hasLab?1:0) + (hasAssign?1:0);
                return (
                  <table className="subj-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        {hasIAT && <th>IAT</th>}
                        {hasLab && <th>Lab</th>}
                        {hasAssign && <th>Assignment</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {studentSubjects.map(s => (
                        <tr key={s.name}>
                          <td><i className="fa-solid fa-book-open" style={{ marginRight: 6 }} />{s.name}</td>
                          {hasIAT && <td>{s.iat === '-' ? '-' : s.iat}</td>}
                          {hasLab && <td>{s.lab === '-' ? '-' : s.lab}</td>}
                          {hasAssign && <td>{s.assignment === '-' ? '-' : s.assignment}</td>}
                        </tr>
                      ))}
                      {studentSubjects.length===0 && !loading && (
                        <tr><td colSpan={colCount} className="muted" style={{textAlign:'center'}}>No marks yet</td></tr>
                      )}
                    </tbody>
                  </table>
                );
              })()}
            </section>

            {/* Right: simple bar chart */}
            <aside className="subj-chart-block">
              <div className="subj-chart-title-row">
                <div>
                  <div className="subj-chart-title">Marks Overview</div>
                  <div className="subj-chart-desc">Visual summary of your performance.</div>
                </div>
                <i className="fa-solid fa-chart-column subj-chart-icon" />
              </div>
              <div className="subj-bar-chart">
                <div className="subj-bar-outer">
                  <div className="subj-bar" style={{ height: `${studentAverages.iat}%` }} />
                  <div className="subj-bar-label">IAT</div>
                </div>
                <div className="subj-bar-outer">
                  <div className="subj-bar" style={{ height: `${studentAverages.lab}%` }} />
                  <div className="subj-bar-label">Lab</div>
                </div>
                <div className="subj-bar-outer">
                  <div className="subj-bar" style={{ height: `${studentAverages.assignment}%` }} />
                  <div className="subj-bar-label">Assign.</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-flex">
      <SidebarTeacher active="View Marks" />

      <main className="dashboard-main">
        <header className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">{title}</h1>
            <p className="dashboard-subtitle">Filter students and manage Lab/Assignment marks. Export CSV or print.</p>
          </div>
          <div className="header-actions">
            <button className="entermarks-save-btn" onClick={exportCsv} disabled={rows.length===0}>Export CSV</button>
            <button className="entermarks-save-btn" onClick={()=>window.print()} disabled={rows.length===0}>Print</button>
          </div>
        </header>

        <section className="entermarks-form-block">
          <div className="entermarks-form-row">
            <select value={department} onChange={e=>setDepartment(e.target.value)}>
              <option value="">Select Department</option>
              {departments.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(e.target.value)}>
              <option value="">Select Year</option>
              {years.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={section} onChange={e=>setSection(e.target.value)}>
              <option value="">Select Section</option>
              {sections.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <button className="entermarks-save-btn" onClick={loadStudents} disabled={!canLoad || loading}>
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>

          {rows.length > 0 && (
            <div className="entermarks-form-row" style={{ marginTop: 12 }}>
              <select value={subject} onChange={e=>setSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {["Data Structures","DBMS","OS","Networks","Mathematics"].map(opt=> <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="muted">You can edit IAT, Lab and Assignment columns.</div>
            </div>
          )}

          {error && <div className="error-message" style={{ margin: '8px 0' }}>{error}</div>}

          {rows.length > 0 && (
            <div className="entermarks-table-block">
              <table className="entermarks-table">
                <thead>
                  <tr>
                    <th>USN</th>
                    <th>Name</th>
                    <th>IAT</th>
                    <th>Lab</th>
                    <th>Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r._id}>
                      <td>{r.usn}</td>
                      <td>{r.name}</td>
                      <td>
                        <input type="number" min="0" max="100" className="marks-input" value={r.iat}
                          onChange={e=>setCell(idx,'iat', e.target.value)} placeholder="0-100" />
                      </td>
                      <td>
                        <input type="number" min="0" max="100" className="marks-input" value={r.lab}
                          onChange={e=>setCell(idx,'lab', e.target.value)} placeholder="0-100" />
                      </td>
                      <td>
                        <input type="number" min="0" max="100" className="marks-input" value={r.assignment}
                          onChange={e=>setCell(idx,'assignment', e.target.value)} placeholder="0-100" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="entermarks-save-btn-row">
                <button className="entermarks-save-btn" onClick={saveUpdates} disabled={rows.length===0 || !subject}>Save Changes</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
