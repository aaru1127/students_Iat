import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './global.css';

import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import EnterMarks from './pages/EnterMarks';
import SubjectMarks from './pages/SubjectMarks';
import TeacherProfile from './pages/TeacherProfile';
import StudentProfile from './pages/StudentProfile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/marks" element={<SubjectMarks />} />
      <Route path="/profile" element={<StudentProfile />} />
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />

      {/* Teacher scoped routes */}
      <Route path="/teacher/enter-marks" element={<EnterMarks />} />
      <Route path="/teacher/view-marks" element={<SubjectMarks />} />
      <Route path="/teacher/profile" element={<TeacherProfile />} />

      {/* Direct category routes reuse EnterMarks with path-based category */}
      <Route path="/teacher/marks/iat" element={<EnterMarks />} />
      <Route path="/teacher/marks/lab" element={<EnterMarks />} />
      <Route path="/teacher/marks/assignment" element={<EnterMarks />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;




// import React from 'react';
// import './global.css';

// // Import all page components so we can render them stacked one below another
// import StudentDashboard from './pages/StudentDashboard';
// import TeacherDashboard from './pages/TeacherDashboard';
// import Login from './pages/Login';
// import Signup from './pages/Signup';
// import ExportMarks from './pages/ExportMarks';
// import SubjectMarks from './pages/SubjectMarks';
// import EnterMarks from './pages/EnterMarks';

// function App() {
//   return (
//     // simple column layout: all pages rendered sequentially, one below another
//     <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem'}}>
//       {/* Order can be changed as needed. These are rendered top-to-bottom. */}
//       <StudentDashboard />
//       <TeacherDashboard />
//       <Login />
      
//       <ExportMarks />
//       <SubjectMarks />
//       <EnterMarks />
//     </div>
//   );
// }

// export default App;