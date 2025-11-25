// PDF Generator Utility
const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateMarksReport = (studentName, marks, filename) => {
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filename);

  doc.pipe(stream);

  // Title
  doc.fontSize(20).text('Marks Report', { align: 'center' });
  doc.moveDown();

  // Student Info
  doc.fontSize(14).text(`Student: ${studentName}`);
  doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  // Marks Table
  doc.fontSize(12).text('Subject Marks:', { underline: true });
  doc.moveDown(0.5);

  marks.forEach((mark) => {
    doc.text(`${mark.subject}: ${mark.marks}/100`);
  });

  doc.moveDown();
  
  // Calculate average
  const average = (marks.reduce((sum, m) => sum + m.marks, 0) / marks.length).toFixed(2);
  doc.fontSize(12).text(`Average: ${average}/100`, { bold: true });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
};

module.exports = { generateMarksReport };
