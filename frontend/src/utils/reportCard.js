// Report card PDF generator for students
// subjects: [{ name, iat, lab, assignment }]
export async function generateStudentReportCard(user = {}, subjects = []) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // Header
  const title = 'Student Marks Report';
  doc.setFontSize(16);
  doc.text(title, 14, 14);

  doc.setFontSize(11);
  const header = `Name: ${user?.name || '-'}    USN: ${user?.usn || '-'}    Year: ${user?.year || '-'}    Dept: ${user?.department || '-'}`;
  doc.text(header, 14, 22);

  // Determine available columns based on data
  const hasIAT = subjects.some(s => valid(s.iat));
  const hasLab = subjects.some(s => valid(s.lab));
  const hasAssign = subjects.some(s => valid(s.assignment));

  const head = [[
    'Subject',
    ...(hasIAT ? ['IAT'] : []),
    ...(hasLab ? ['Lab'] : []),
    ...(hasAssign ? ['Assignment'] : []),
  ]];

  const body = subjects.map(s => [
    s.name,
    ...(hasIAT ? [pretty(s.iat)] : []),
    ...(hasLab ? [pretty(s.lab)] : []),
    ...(hasAssign ? [pretty(s.assignment)] : []),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 30,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [53, 99, 233] },
    columnStyles: { 0: { cellWidth: 70 } },
  });

  // Footer
  const date = new Date().toLocaleString();
  doc.setFontSize(9);
  doc.text(`Generated on: ${date}`, 14, doc.internal.pageSize.getHeight() - 10);

  doc.save('marks-report.pdf');
}

function valid(v) {
  return v !== undefined && v !== null && v !== '' && v !== '-';
}

function pretty(v) {
  return valid(v) ? String(v) : '-';
}
