import React from "react";

const show = (v) => !(v === undefined || v === null || v === '' || v === '-' );

const SubjectCard = ({ name, iat, iatTotal = 100, lab, labTotal = 100, assignments, assignmentsTotal = 100 }) => (
  <div className="subject-card">
    <div className="subject-card-header">
      <div className="subject-icon">
        <i className="fa-solid fa-book-open" />
      </div>
      <span className="subject-title">{name}</span>
    </div>
    <div className="subject-card-body">
      {show(iat) && <div>IAT Marks: <b>{iat} / {iatTotal}</b></div>}
      {show(lab) && <div>Lab Marks: <b>{lab} / {labTotal}</b></div>}
      {show(assignments) && <div>Assignments: <b>{assignments} / {assignmentsTotal}</b></div>}
      {!show(iat) && !show(lab) && !show(assignments) && (
        <div className="muted">No marks yet</div>
      )}
    </div>
  </div>
);

export default SubjectCard;
