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

  // Determine available columns based on data (per-assessment)
  const hasIAT1 = subjects.some(s => valid(s.iat1));
  const hasIAT2 = subjects.some(s => valid(s.iat2));
  const hasLab1 = subjects.some(s => valid(s.lab1));
  const hasLab2 = subjects.some(s => valid(s.lab2));
  const hasA1 = subjects.some(s => valid(s.assig1));
  const hasA2 = subjects.some(s => valid(s.assig2));
  const hasA3 = subjects.some(s => valid(s.assig3));
  const hasA4 = subjects.some(s => valid(s.assig4));
  const hasVTU = subjects.some(s => valid(s.vtu));

  const head = [[
    'Subject',
    ...(hasIAT1 ? ['IAT1'] : []),
    ...(hasIAT2 ? ['IAT2'] : []),
    ...(hasLab1 ? ['Lab1'] : []),
    ...(hasLab2 ? ['Lab2'] : []),
    ...(hasA1 ? ['Assign1'] : []),
    ...(hasA2 ? ['Assign2'] : []),
    ...(hasA3 ? ['Assign3'] : []),
    ...(hasA4 ? ['Assign4'] : []),
    ...(hasVTU ? ['VTU'] : []),
  ]];

  const body = subjects.map(s => [
    s.name,
    ...(hasIAT1 ? [pretty(s.iat1)] : []),
    ...(hasIAT2 ? [pretty(s.iat2)] : []),
    ...(hasLab1 ? [pretty(s.lab1)] : []),
    ...(hasLab2 ? [pretty(s.lab2)] : []),
    ...(hasA1 ? [pretty(s.assig1)] : []),
    ...(hasA2 ? [pretty(s.assig2)] : []),
    ...(hasA3 ? [pretty(s.assig3)] : []),
    ...(hasA4 ? [pretty(s.assig4)] : []),
    ...(hasVTU ? [pretty(s.vtu)] : []),
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
