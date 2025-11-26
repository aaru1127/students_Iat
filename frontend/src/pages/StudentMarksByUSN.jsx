import React, { useState, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SidebarTeacher from "../components/SidebarTeacher";
import axiosInstance from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "../global.css";

const CATEGORIES = ["IAT", "Lab", "Assignment"];

const getSubCategories = (category) => {
  if (category === "IAT") return ["IAT1", "IAT2"];
  if (category === "Lab") return ["Lab1", "Lab2"];
  if (category === "Assignment") return ["Assig1", "Assig2", "Assig3", "Assig4"];
  return [];
};

export default function StudentMarksByUSN() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [usn, setUsn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { student, marks }

  const [category, setCategory] = useState("IAT");
  const [subCategory, setSubCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [saving, setSaving] = useState(false);

  // If navigated with ?usn=... from dashboard, prefill and auto-search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qUsn = params.get("usn");
    if (qUsn) {
      const normalized = qUsn.toUpperCase();
      setUsn(normalized);
      // auto-run search once when param present
      (async () => {
        try {
          setLoading(true);
          setError("");
          const res = await axiosInstance.get("/marks/by-usn", {
            params: { usn: normalized },
          });
          setResult(res.data);
        } catch (err) {
          setResult(null);
          setError(err.response?.data?.message || "Student not found");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [location.search]);

  const searchByUSN = async () => {
    if (!usn.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/marks/by-usn", {
        params: { usn: usn.trim().toUpperCase() },
      });
      setResult(res.data);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Student not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!result?.student?._id || !subject || !category || !subCategory || marks === "") return;
    try {
      setSaving(true);
      const teacherId = user?.id || user?._id;

      // Check if existing marks record for this combo
      const existing = await axiosInstance
        .get("/marks", {
          params: {
            studentId: result.student._id,
            subject,
            category,
            subCategory,
            teacherId,
          },
        })
        .then((r) => (Array.isArray(r.data) ? r.data[0] : null))
        .catch(() => null);

      if (existing && existing._id) {
        await axiosInstance.put(`/marks/${existing._id}`, {
          marks: Number(marks),
          subCategory,
        });
      } else {
        await axiosInstance.post("/marks", {
          studentId: result.student._id,
          subject,
          marks: Number(marks),
          teacherId,
          category,
          subCategory,
        });
      }

      // refresh view
      const refreshed = await axiosInstance.get("/marks/by-usn", {
        params: { usn: result.student.usn },
      });
      setResult(refreshed.data);
      alert("Marks saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const currentSubCategories = getSubCategories(category);

  return (
    <div className="dashboard-flex">
      <SidebarTeacher active="Enter Marks" />
      <div className="entermarks-main">
        <header className="entermarks-header">
          <span className="header-title">Search Student & Update Marks</span>
          <div className="header-actions">
            <input
              className="search"
              placeholder="Search student by USN..."
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchByUSN();
              }}
            />
            <button className="entermarks-save-btn" onClick={searchByUSN} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </header>

        <div className="entermarks-form-block">
          {error && (
            <div className="error-message" style={{ margin: "8px 0" }}>
              {error}
            </div>
          )}

          {result?.student && (
            <div className="profile-card" style={{ marginTop: 12 }}>
              <div className="recent-activity-header">
                <h2>Student Details</h2>
                <span className="muted">USN: {result.student.usn}</span>
              </div>
              <div className="profile-fields">
                <div>
                  <strong>Name:</strong> {result.student.name}
                </div>
                <div>
                  <strong>Email:</strong> {result.student.email || "-"}
                </div>
                <div>
                  <strong>Class:</strong> {result.student.class || "-"}
                </div>
                <div>
                  <strong>Section:</strong> {result.student.section || "-"}
                </div>
              </div>

              <div className="entermarks-table-block" style={{ marginTop: 12 }}>
                <table className="entermarks-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Assessment</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.marks || []).map((m) => (
                      <tr key={m._id}>
                        <td>{m.subject}</td>
                        <td>{m.category}</td>
                        <td>{m.subCategory || "-"}</td>
                        <td>{m.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="entermarks-form-row" style={{ marginTop: 16 }}>
                <input
                  type="text"
                  placeholder="Subject (e.g., Networks)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory("");
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {currentSubCategories.length > 0 && (
                  <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                    <option value="">Select Assessment</option>
                    {currentSubCategories.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="number"
                  className="marks-input"
                  min="0"
                  max="100"
                  placeholder="Marks"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                />
                <button
                  className="entermarks-save-btn"
                  onClick={handleSaveMarks}
                  disabled={saving || !subject || !category || !subCategory || marks === ""}
                >
                  {saving ? "Saving..." : "Save Marks"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
