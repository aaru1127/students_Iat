import React, { useContext, useState } from "react";
import SidebarTeacher from "../components/SidebarTeacher";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../global.css";

const departments = ["Computer Science", "Information Science", "Electronics", "Mechanical", "Civil"];
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const sections = ["A", "B", "C", "D"];
const subjects = ["Data Structures", "DBMS", "OS", "Networks", "Mathematics"];

export default function EnterVTUMarks() {
  const { user } = useContext(AuthContext);

  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [rows, setRows] = useState([]); // { _id, usn, name, vtu, locked, missingLabels[] }

  const canLoad = department && year && section && subject;

  const loadStudents = async () => {
    if (!canLoad) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await axiosInstance.get("/marks/students", { params: { department, year, section } });
      const students = res.data.students || [];
      const teacherId = user?.id || user?._id;

      const allMarks = await Promise.all(
        students.map((s) =>
          axiosInstance
            .get("/marks", { params: { studentId: s._id, teacherId, subject } })
            .then((r) => r.data)
            .catch(() => [])
        )
      );

      const merged = students.map((s, idx) => {
        const perStudent = allMarks[idx] || [];
        const byCatSub = (cat, subCat) => perStudent.find((m) => m.category === cat && m.subCategory === subCat);
        const byCat = (cat) => perStudent.filter((m) => m.category === cat);

        const needIAT1 = !!byCatSub("IAT", "IAT1");
        const needIAT2 = !!byCatSub("IAT", "IAT2");
        const needLab1 = !!byCatSub("Lab", "Lab1");
        const needLab2 = !!byCatSub("Lab", "Lab2");
        const needA1 = !!byCatSub("Assignment", "Assig1");
        const needA2 = !!byCatSub("Assignment", "Assig2");
        const needA3 = !!byCatSub("Assignment", "Assig3");
        const needA4 = !!byCatSub("Assignment", "Assig4");

        const missingLabels = [];
        if (!(needIAT1 && needIAT2)) missingLabels.push("IAT");
        if (!(needLab1 && needLab2)) missingLabels.push("Lab");
        if (!(needA1 && needA2 && needA3 && needA4)) missingLabels.push("Assignment");

        const vtuExisting = byCat("VTU");

        return {
          _id: s._id,
          usn: s.usn,
          name: s.name,
          vtu: vtuExisting[0]?.marks ?? "",
          locked: missingLabels.length > 0,
          missingLabels,
          vtuId: vtuExisting[0]?._id || null,
        };
      });

      const hasLocked = merged.some((r) => r.locked);
      if (hasLocked) {
        setInfo("Some students are missing IAT / Lab / Assignment marks. Complete them before adding VTU marks.");
      }

      setRows(merged);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load students for VTU marks");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (idx, value) => {
    const v = value === "" ? "" : Math.max(0, Math.min(100, Number(value)));
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, vtu: v } : r)));
  };

  const handleSave = async () => {
    try {
      const teacherId = user?.id || user?._id;
      const toSave = rows.filter((r) => r.vtu !== "" && !r.locked);
      if (toSave.length === 0) {
        alert("No VTU marks to save (or prerequisites missing).");
        return;
      }

      const requests = toSave.map((r) => {
        if (r.vtuId) {
          return axiosInstance.put(`/marks/${r.vtuId}`, { marks: Number(r.vtu) });
        }
        return axiosInstance.post("/marks", {
          studentId: r._id,
          subject,
          marks: Number(r.vtu),
          teacherId,
          category: "VTU",
        });
      });

      await Promise.all(requests);
      alert("VTU marks saved successfully");
      await loadStudents();
    } catch (e) {
      console.error(e);
      alert("Failed to save VTU marks");
    }
  };

  return (
    <div className="dashboard-flex">
      <SidebarTeacher active="VTU Marks" />
      <div className="entermarks-main">
        <header className="entermarks-header">
          <span className="header-title">Enter VTU Final Marks</span>
        </header>

        <section className="entermarks-form-block">
          <div className="entermarks-form-row">
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select Department</option>
              {departments.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Select Year</option>
              {years.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Select Section</option>
              {sections.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select Subject</option>
              {subjects.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button
              className="entermarks-save-btn"
              onClick={loadStudents}
              disabled={!canLoad || loading}
            >
              {loading ? "Loading..." : "Load Students"}
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ margin: "8px 0" }}>
              {error}
            </div>
          )}
          {info && (
            <div className="info-message" style={{ margin: "8px 0", color: "#b26b00" }}>
              {info}
            </div>
          )}

          {rows.length > 0 && (
            <div className="entermarks-table-block" style={{ marginTop: 16 }}>
              <table className="entermarks-table">
                <thead>
                  <tr>
                    <th>USN</th>
                    <th>Student Name</th>
                    <th>VTU Final Marks (Max: 100)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r._id}>
                      <td>{r.usn}</td>
                      <td>{r.name}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={r.locked ? "Complete IAT/Lab/Assign first" : "Enter marks"}
                          className="marks-input"
                          value={r.vtu}
                          onChange={(e) => handleChange(idx, e.target.value)}
                          disabled={r.locked}
                        />
                      </td>
                      <td>
                        {r.locked
                          ? `Missing: ${r.missingLabels.join(", ")}`
                          : r.vtuId
                          ? "Saved"
                          : "Ready"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="entermarks-save-btn-row">
                <button
                  className="entermarks-save-btn"
                  onClick={handleSave}
                  disabled={rows.length === 0}
                >
                  Save VTU Marks
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
