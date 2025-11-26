import React from "react";

const show = (v) => !(v === undefined || v === null || v === '' || v === '-' );

const SubjectCard = ({
  name,
  // legacy aggregate props (kept for safety)
  iat,
  iatTotal = 100,
  lab,
  labTotal = 100,
  assignments,
  assignmentsTotal = 100,
  // new detailed props
  iat1,
  iat2,
  lab1,
  lab2,
  assig1,
  assig2,
  assig3,
  assig4,
  vtu,
}) => (
  <div className="subject-card">
    <div className="subject-card-header">
      <div className="subject-icon">
        <i className="fa-solid fa-book-open" />
      </div>
      <span className="subject-title">{name}</span>
    </div>
    <div className="subject-card-body">
      {(show(iat1) || show(iat2)) && (
        <div>
          IAT:
          {show(iat1) && <> IAT1 <b>{iat1}</b></>}
          {show(iat2) && <>
            {show(iat1) && ','} IAT2 <b>{iat2}</b>
          </>}
        </div>
      )}
      {(show(lab1) || show(lab2)) && (
        <div>
          Lab:
          {show(lab1) && <> Lab1 <b>{lab1}</b></>}
          {show(lab2) && <>
            {show(lab1) && ','} Lab2 <b>{lab2}</b>
          </>}
        </div>
      )}
      {(show(assig1) || show(assig2) || show(assig3) || show(assig4)) && (
        <div>
          Assignments:
          {show(assig1) && <> A1 <b>{assig1}</b></>}
          {show(assig2) && <>
            {show(assig1) && ','} A2 <b>{assig2}</b>
          </>}
          {show(assig3) && <>
            {(show(assig1) || show(assig2)) && ','} A3 <b>{assig3}</b>
          </>}
          {show(assig4) && <>
            {(show(assig1) || show(assig2) || show(assig3)) && ','} A4 <b>{assig4}</b>
          </>}
        </div>
      )}
      {show(vtu) && <div>VTU Marks: <b>{vtu}</b></div>}
      {!show(iat1) && !show(iat2) && !show(lab1) && !show(lab2)
        && !show(assig1) && !show(assig2) && !show(assig3) && !show(assig4)
        && !show(vtu) && (
          <div className="muted">No marks yet</div>
        )}
    </div>
  </div>
);

export default SubjectCard;
