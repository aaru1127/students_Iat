import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import SidebarTeacher from "../components/SidebarTeacher";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../global.css";

const departments = ["Computer Science", "Information Science", "Electronics", "Mechanical", "Civil"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"]; // academic year
const sections = ["A", "B", "C", "D"];
const subjects = ["Data Structures", "DBMS", "OS", "Networks", "Mathematics"]; // dummy subject list

export default function EnterMarks() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [studentList, setStudentList] = useState([]); // {_id, usn, name}
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("IAT");
  const [subCategory, setSubCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usnQuery, setUsnQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null); // { student, marks }
  const [searchError, setSearchError] = useState("");

  // Infer category from path (/iat, /lab, /assignment)
  useEffect(() => {
    const p = location.pathname.toLowerCase();
    if (p.includes("lab")) setCategory("Lab");
    else if (p.includes("assignment")) setCategory("Assignment");
    else if (p.includes("iat")) setCategory("IAT");
  }, [location.pathname]);

  const canLoad = department && year && section;

  const subCategoryOptions = () => {
    if (category === 'IAT') return ['IAT1', 'IAT2'];
    if (category === 'Lab') return ['Lab1', 'Lab2'];
    if (category === 'Assignment') return ['Assig1', 'Assig2', 'Assig3', 'Assig4'];
    return [];
  };

  const loadStudents = async () => {
    if (!canLoad) return;
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.get('/marks/students', {
        params: { department, year, section }
      });
      const withMarks = (res.data.students || []).map(s => ({ ...s, marks: '' }));
      setStudentList(withMarks);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load students');
      setStudentList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (idx, value) => {
    if (value === '') {
      setStudentList(prev => prev.map((s,i)=> i===idx ? { ...s, marks: '' } : s));
      return;
    }
    const raw = Number(value);
    const maxMarks = category === 'Assignment' ? 10 : 50; // IAT / Lab : 50, Assignment : 10
    const v = Math.max(0, Math.min(maxMarks, isNaN(raw) ? 0 : raw));
    setStudentList(prev => prev.map((s,i)=> i===idx ? { ...s, marks: v } : s));
  };

  const handleSave = async () => {
    try {
      const items = studentList.filter(s => s.marks !== '' && subject && subCategory);
      if (items.length === 0) return alert('No marks to save');

      const teacherId = user?.id || user?._id;

      const requests = [];
      for (const s of items) {
        // find if a record already exists
        const existing = await axiosInstance.get('/marks', {
          params: { studentId: s._id, subject, category, subCategory, teacherId }
        }).then(r => (Array.isArray(r.data) ? r.data[0] : null)).catch(() => null);

        if (existing && existing._id) {
          requests.push(axiosInstance.put(`/marks/${existing._id}`, { marks: Number(s.marks) }));
        } else {
          requests.push(axiosInstance.post('/marks', {
            studentId: s._id,
            subject,
            marks: Number(s.marks),
            teacherId,
            category,
            subCategory,
          }));
        }
      }

      await Promise.all(requests);
      alert('Marks saved to database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save marks');
    }
  };

  return (
    <div className="dashboard-flex">
      <SidebarTeacher active="Enter Marks" />

      <div className="entermarks-main">
        <header className="entermarks-header">
          <span className="header-title">Enter {category} Marks</span>
          <div className="header-actions">
            <input
              className="search"
              placeholder="Search student by USN..."
              value={usnQuery}
              onChange={(e)=>setUsnQuery(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ (async()=>{ try{ setSearchError(''); const res = await axiosInstance.get('/marks/by-usn', { params: { usn: usnQuery.trim().toUpperCase() } }); setSearchResult(res.data); } catch(err){ setSearchResult(null); setSearchError(err.response?.data?.message || 'Student not found'); } })(); } }}
            />
            <i className="fa-regular fa-bell"></i>
            <i className="fa-solid fa-gear"></i>
          </div>
        </header>
        <div className="entermarks-form-block">
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
              {loading ? 'Loading...' : 'Load Students'}
            </button>
          </div>

          {studentList.length > 0 && (
            <div className="entermarks-form-row" style={{ marginTop: 12 }}>
              <select value={subject} onChange={e=>setSubject(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select value={category} onChange={e=>setCategory(e.target.value)}>
                {['IAT','Lab','Assignment'].map(opt=> <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {subCategoryOptions().length > 0 && (
                <select value={subCategory} onChange={e=>setSubCategory(e.target.value)}>
                  <option value="">Select Assessment</option>
                  {subCategoryOptions().map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && <div className="error-message" style={{ margin: '8px 0' }}>{error}</div>}

          {searchError && <div className="error-message" style={{ margin: '8px 0' }}>{searchError}</div>}

          {searchResult?.student && (
            <div className="profile-card" style={{ marginTop: 12 }}>
              <div className="recent-activity-header">
                <h2>Student Details</h2>
                <span className="muted">USN: {searchResult.student.usn}</span>
              </div>
              <div className="profile-fields">
                <div><strong>Name:</strong> {searchResult.student.name}</div>
                <div><strong>Email:</strong> {searchResult.student.email || '-'}</div>
                <div><strong>Class:</strong> {searchResult.student.class || '-'}</div>
                <div><strong>Section:</strong> {searchResult.student.section || '-'}</div>
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
                    {(searchResult.marks||[]).map(m => (
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

          {studentList.length > 0 && (
        <div className="entermarks-table-block">
  <table className="entermarks-table">
    <thead>
      <tr>
        <th>USN</th>
        <th>Student Name</th>
        <th>Marks</th>
      </tr>
    </thead>
    <tbody>
      {studentList.map((s, i) => (
        <tr key={s._id}>
          <td>{s.usn}</td>
          <td>{s.name}</td>
          <td>
            <input
              className="marks-input"
              type="number"
              min="0"
              max={category === 'Assignment' ? 10 : 50}
              placeholder={category === 'Assignment' ? 'Max: 10' : 'Max: 50'}
              value={s.marks}
              onChange={e => handleMarkChange(i, e.target.value)}
            />
          </td>
        </tr>
      ))}
    </tbody>
  </table>


            {category === 'Lab' && (
              <div style={{marginTop: 16}}>
                <div className="muted">Uploaded Lab Records (placeholder)</div>
                <ul className="muted">
                  <li>Chemistry Lab - Week 3 - John Doe.pdf</li>
                  <li>Physics Lab - Week 2 - Jane Smith.pdf</li>
                </ul>
              </div>
            )}

            <div className="entermarks-save-btn-row">
              <button className="entermarks-save-btn" onClick={handleSave} disabled={studentList.length===0 || !subject}>Save Marks</button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
