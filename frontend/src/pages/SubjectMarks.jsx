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
  const [studentSubjects, setStudentSubjects] = useState([]); // [{name, iat1, iat2, lab1, lab2, assig1-4, vtu}]
  const studentAverages = useMemo(() => {
    if (!studentSubjects || studentSubjects.length === 0) return { iat: 0, lab: 0, assignment: 0 };
    const vals = { iat: [], lab: [], assignment: [] };
    studentSubjects.forEach(s => {
      const iats = [s.iat1, s.iat2].filter(v => v !== '-' && v !== '' && v !== undefined);
      const labs = [s.lab1, s.lab2].filter(v => v !== '-' && v !== '' && v !== undefined);
      const assigns = [s.assig1, s.assig2, s.assig3, s.assig4].filter(v => v !== '-' && v !== '' && v !== undefined);
      iats.forEach(v => vals.iat.push(Number(v)));
      labs.forEach(v => vals.lab.push(Number(v)));
      assigns.forEach(v => vals.assignment.push(Number(v)));
    });
    const avg = (arr) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    return { iat: avg(vals.iat), lab: avg(vals.lab), assignment: avg(vals.assignment) };
  }, [studentSubjects]);

  const canLoad = department && year && section && subject;

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
          if (!map.has(key)) {
            map.set(key, {
              name: key,
              iat1: '-', iat2: '-',
              lab1: '-', lab2: '-',
              assig1: '-', assig2: '-', assig3: '-', assig4: '-',
              vtu: '-',
            });
          }
          const rec = map.get(key);
          if (m.category === 'VTU') {
            rec.vtu = m.marks;
          } else if (m.category === 'IAT') {
            if (m.subCategory === 'IAT1') rec.iat1 = m.marks;
            else if (m.subCategory === 'IAT2') rec.iat2 = m.marks;
          } else if (m.category === 'Lab') {
            if (m.subCategory === 'Lab1') rec.lab1 = m.marks;
            else if (m.subCategory === 'Lab2') rec.lab2 = m.marks;
          } else if (m.category === 'Assignment') {
            if (m.subCategory === 'Assig1') rec.assig1 = m.marks;
            else if (m.subCategory === 'Assig2') rec.assig2 = m.marks;
            else if (m.subCategory === 'Assig3') rec.assig3 = m.marks;
            else if (m.subCategory === 'Assig4') rec.assig4 = m.marks;
          }
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

      // For each student, fetch their marks for the chosen subject once and map categories
      const allMarks = await Promise.all(
        students.map(s => axiosInstance.get('/marks', { params: { studentId: s._id, teacherId: (user?.id || user?._id), subject } })
          .then(r => r.data)
          .catch(() => []))
      );

      const merged = students.map((s, idx) => {
        const perStudent = allMarks[idx] || [];
        const byCat = (cat) => perStudent.filter(m => m.category === cat);
        const byCatSub = (cat, subCat) => perStudent.find(m => m.category === cat && m.subCategory === subCat);

        const iatMarks = byCat('IAT');
        const labMarks = byCat('Lab');
        const assignMarks = byCat('Assignment');
        const vtuMarks = byCat('VTU');

        const firstOrEmpty = (arr) => (arr && arr.length ? arr[0].marks : '');
        const avgOrEmpty = (vals) => {
          const nums = vals
            .map(v => (v === '' || v === undefined || v === null ? null : Number(v)))
            .filter(v => v !== null && !Number.isNaN(v));
          if (!nums.length) return '';
          return Math.round(nums.reduce((a,b)=>a+b,0) / nums.length);
        };

        const iat1Val = byCatSub('IAT','IAT1')?.marks ?? '';
        const iat2Val = byCatSub('IAT','IAT2')?.marks ?? '';
        const lab1Val = byCatSub('Lab','Lab1')?.marks ?? '';
        const lab2Val = byCatSub('Lab','Lab2')?.marks ?? '';
        const assig1Val = byCatSub('Assignment','Assig1')?.marks ?? '';
        const assig2Val = byCatSub('Assignment','Assig2')?.marks ?? '';
        const assig3Val = byCatSub('Assignment','Assig3')?.marks ?? '';
        const assig4Val = byCatSub('Assignment','Assig4')?.marks ?? '';

        return {
          _id: s._id,
          usn: s.usn,
          name: s.name,
          // aggregate columns used in UI table (if any existing record without subCategory)
          iat: firstOrEmpty(iatMarks),
          lab: firstOrEmpty(labMarks),
          assignment: firstOrEmpty(assignMarks),
          vtu: firstOrEmpty(vtuMarks),
          // per-assessment fields for CSV export and averages
          iat1: iat1Val,
          iat2: iat2Val,
          lab1: lab1Val,
          lab2: lab2Val,
          assig1: assig1Val,
          assig2: assig2Val,
          assig3: assig3Val,
          assig4: assig4Val,
          iatAvg: avgOrEmpty([iat1Val, iat2Val]),
          labAvg: avgOrEmpty([lab1Val, lab2Val]),
          assigAvg: avgOrEmpty([assig1Val, assig2Val, assig3Val, assig4Val]),
          markIds: {
            iat: iatMarks[0]?._id,
            lab: labMarks[0]?._id,
            assignment: assignMarks[0]?._id,
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
  const exportCsv = () => {
    const header = ['USN','Name','IAT1','IAT2','Lab1','Lab2','Assignment1','Assignment2','Assignment3','Assignment4','VTU'];
    const lines = [header.join(',')].concat(
      rows.map(r => [
        r.usn,
        r.name,
        r.iat1 ?? '',
        r.iat2 ?? '',
        r.lab1 ?? '',
        r.lab2 ?? '',
        r.assig1 ?? '',
        r.assig2 ?? '',
        r.assig3 ?? '',
        r.assig4 ?? '',
        r.vtu ?? '',
      ].join(','))
    );
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
            <select value={subject} onChange={e=>setSubject(e.target.value)}>
              <option value="">Select Subject</option>
              {["Data Structures","DBMS","OS","Networks","Mathematics"].map(opt=> <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <button className="entermarks-save-btn" onClick={loadStudents} disabled={!canLoad || loading}>
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>

          {error && <div className="error-message" style={{ margin: '8px 0' }}>{error}</div>}

          {rows.length > 0 && (
            <div className="entermarks-table-block">
              <table className="entermarks-table">
                <thead>
                  <tr>
                    <th>USN</th>
                    <th>Name</th>
                    <th>IAT 1</th>
                    <th>IAT 2</th>
                    <th>Lab 1</th>
                    <th>Lab 2</th>
                    <th>Assignment 1</th>
                    <th>Assignment 2</th>
                    <th>Assignment 3</th>
                    <th>Assignment 4</th>
                    <th>IAT Avg</th>
                    <th>Lab Avg</th>
                    <th>Assign Avg</th>
                    <th>VTU</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id}>
                      <td>{r.usn}</td>
                      <td>{r.name}</td>
                      <td>{r.iat1 ?? ''}</td>
                      <td>{r.iat2 ?? ''}</td>
                      <td>{r.lab1 ?? ''}</td>
                      <td>{r.lab2 ?? ''}</td>
                      <td>{r.assig1 ?? ''}</td>
                      <td>{r.assig2 ?? ''}</td>
                      <td>{r.assig3 ?? ''}</td>
                      <td>{r.assig4 ?? ''}</td>
                      <td>{r.iatAvg ?? ''}</td>
                      <td>{r.labAvg ?? ''}</td>
                      <td>{r.assigAvg ?? ''}</td>
                      <td>{r.vtu ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
