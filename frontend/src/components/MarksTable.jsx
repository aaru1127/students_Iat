import React from 'react';
import './MarksTable.css';

const MarksTable = ({ marks }) => {
  return (
    <div className="table-container">
      <table className="marks-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Marks</th>
            <th>Grade</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {marks.map((mark, index) => (
            <tr key={index}>
              <td>{mark.subject}</td>
              <td>{mark.marks}/100</td>
              <td>{mark.grade || 'N/A'}</td>
              <td className={mark.passed ? 'pass' : 'fail'}>
                {mark.passed ? 'Pass' : 'Fail'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarksTable;
