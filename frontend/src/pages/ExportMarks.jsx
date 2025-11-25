import React, { useState, useMemo, useContext } from "react";
import SidebarTeacher from "../components/SidebarTeacher";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../global.css";

const classes = ["First Year", "Second Year", "Third Year", "Fourth Year"];
const sections = ["A", "B", "C"];
const subjects = ["Data Structures", "Computer Networks", "Database Systems"];
const markCategories = ["IAT", "Lab", "Assignment"];

export default function ExportMarks() {
  const { user } = useContext(AuthContext);

  const [department, setDepartment] = useState("Computer Science");
  const [selectedClass, setSelectedClass] = useState("Second Year");
  const [section, setSection] = useState("A");
  const [subject, setSubject] = useState("Data Structures");
  const [category, setCategory] = useState("IAT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const applyFilters = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch by subject/category/teacher; class/section will be filtered client-side
      const res = await axiosInstance.get('/marks', {
        params: { subject, category, teacherId: user?.id },
      });

      const filtered = res.data.filter(m => {
        const cls = m.studentId?.class || '';
        const sec = m.studentId?.section || '';
        return (!selectedClass || cls === selectedClass) && (!section || sec === section);
      });

      const tableRows = filtered.map(m => ({
        id: m.studentId?._id || m.studentId,
        name: m.studentId?.name || '-',
        marks: m.marks,
        max: 100,
      }));

      setRows(tableRows);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load marks');
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.text(`${subject} - ${category} | ${selectedClass} ${section}`, 14, 16);

      const table = rows.map(r => [r.id, r.name, r.marks, 100]);
      autoTable(doc, {
        head: [["Student ID", "Name", "Marks", "Max"]],
        body: table,
        startY: 22,
      });

      doc.save(`${subject}-${category}-${selectedClass}-${section}.pdf`);
    } catch (_) {
      window.print();
    }
  };

  const description = useMemo(() => `You are about to generate a PDF for ${selectedClass} - ${section} students for the ${subject} - ${category} marks.`, [selectedClass, section, subject, category]);

  return (
    <div className="dashboard-flex">
      <SidebarTeacher active="Reports" />

      <div className="export-marks-main">
        <header className="export-marks-header">
          <span className="header-star"><i className="fa-solid fa-star"></i></span>
          <span className="header-title">Marks Tracker</span>
          <div className="header-actions">
            <input className="search" placeholder="Search..." />
            <i className="fa-regular fa-bell"></i>
            <i className="fa-regular fa-circle-question"></i>
            <img className="teacher-avatar" src="https://randomuser.me/api/portraits/women/48.jpg" alt="Mrs. Davis" />
          </div>
        </header>

        <div className="export-marks-title">Export Marks as PDF</div>
        <div className="export-marks-content">
          <div className="export-marks-filters">
            <h3>Filter Students</h3>
            <div className="filter-group">
              <label>Department</label>
              <select value={department} onChange={e => setDepartment(e.target.value)}>
                <option>Computer Science</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {classes.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Section</label>
              <select value={section} onChange={e => setSection(e.target.value)}>
                {sections.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}>
                {subjects.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Mark Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {markCategories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button className="apply-filters-btn" onClick={applyFilters} disabled={loading}>
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
            {error && <div className="error-message" style={{marginTop: 8}}>{error}</div>}
          </div>
          <div className="export-marks-preview">
            <h3>PDF Preview</h3>
            <div className="export-pdf-preview-box">
              <div className="export-pdf-preview-header">
                <div className="university-logo" />
                <div>
                  <b>University Name</b>
                  <div className="export-pdf-subhead">Department of Computer Science</div>
                </div>
                <div className="export-pdf-head-right">
                  <b>Marks Statement</b>
                  <div className="export-pdf-catlab">{category}</div>
                </div>
              </div>
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Marks Obtained</th>
                    <th>Max Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.name}</td>
                      <td>{r.marks}</td>
                      <td>{r.max}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No data. Apply filters to load marks.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="export-pdf-footer">-- End of Document --</div>
            </div>
            <div className="export-pdf-desc">{description}</div>
          </div>
        </div>
        <div className="export-marks-bottom">
          <button className="generate-pdf-btn" onClick={generatePdf} disabled={rows.length === 0}>
            <i className="fa-solid fa-file-arrow-down"></i> Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
