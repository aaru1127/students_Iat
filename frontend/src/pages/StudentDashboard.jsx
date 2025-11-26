import React, { useContext, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import SubjectCard from "../components/SubjectCard";
import { AuthContext } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import "../global.css";

const StudentDashboard = () => {
  const { user, login } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]); // [{name, iat1, iat2, lab1, lab2, assig1, assig2, assig3, assig4, vtu}]
  const [loading, setLoading] = useState(false);
  const [errMarks, setErrMarks] = useState("");
  const needsProfile = useMemo(() => {
    if (!user || user.role !== "student") return false;
    return !user.profileCompleted || !user.usn || !user.department || !user.section || !user.year;
  }, [user]);

  const [form, setForm] = useState({
    usn: "",
    department: "",
    section: "",
    year: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const departments = ["Computer Science", "Information Science", "Electronics", "Mechanical", "Civil"];
  const sections = ["A", "B", "C", "D"];
  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  useEffect(() => {
    const loadMarks = async () => {
      if (!user?.id && !user?._id) return;
      setErrMarks("");
      setLoading(true);
      try {
        const res = await axiosInstance.get('/marks', { params: { studentId: user.id || user._id } });
        const list = Array.isArray(res.data) ? res.data : [];
        // group by subject with detailed fields from subCategory
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
        setSubjects(Array.from(map.values()));
      } catch (e) {
        setErrMarks(e.response?.data?.message || 'Failed to load marks');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    loadMarks();
  }, [user]);

  const downloadPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      doc.text(`Marks Statement - ${user?.name || ''}`, 14, 16);
      const body = subjects.map(s => [s.name, s.iat, s.lab, s.assignments]);
      autoTable(doc, { head: [["Subject","IAT","Lab","Assignment"]], body, startY: 22 });
      doc.save('my-marks.pdf');
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await axiosInstance.put("/auth/profile", {
        userId: user?.id,
        usn: form.usn,
        department: form.department,
        section: form.section,
        year: form.year,
        profileCompleted: true,
      });
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (needsProfile) {
    return (
      <div className="dashboard-flex">
        <Sidebar />
        <div className="dashboard-main" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="login-card">
            <div className="login-card-right" style={{ width: "100%" }}>
              <div className="login-form-container">
                <h2 className="login-title">Complete your profile</h2>
                <p className="login-subtitle">Please provide the details to continue.</p>
                {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}
                <form className="login-form" onSubmit={submit}>
                  <div className="input-group">
                    <label>USN</label>
                    <div className="input-with-icon">
                      <i className="fa-solid fa-id-card" />
                      <input name="usn" value={form.usn} onChange={onChange} placeholder="Enter your USN" required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Department</label>
                    <div className="input-with-icon">
                      <i className="fa-solid fa-building" />
                      <select name="department" value={form.department} onChange={onChange} required style={{ border: "none", background: "transparent", width: "100%" }}>
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Section</label>
                    <div className="input-with-icon">
                      <i className="fa-solid fa-users" />
                      <select name="section" value={form.section} onChange={onChange} required style={{ border: "none", background: "transparent", width: "100%" }}>
                        <option value="">Select Section</option>
                        {sections.map((s) => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Year</label>
                    <div className="input-with-icon">
                      <i className="fa-solid fa-graduation-cap" />
                      <select name="year" value={form.year} onChange={onChange} required style={{ border: "none", background: "transparent", width: "100%" }}>
                        <option value="">Select Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="login-btn" disabled={saving}>{saving ? "Saving..." : "Complete Profile"}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-flex">
      <Sidebar />
      <div className="dashboard-main">
        <div className="dashboard-banner">
          <h2>Welcome back{user?.name ? `, ${user.name}!` : "!"}</h2>
          <p>Here's a summary of your academic progress.</p>
        </div>
        {errMarks && <div className="error-message" style={{ margin: '8px 0' }}>{errMarks}</div>}
        {loading && <div className="muted">Loading marks...</div>}
        <div className="subjects-grid">
          {subjects.map((subject) => (
            <SubjectCard key={subject.name} {...subject} />
          ))}
          {subjects.length===0 && !loading && (
            <div className="muted" style={{ padding: 12 }}>No marks yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
