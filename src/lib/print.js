// Printable class lists — opens a clean, print-styled document in a new window
// and triggers the browser's print dialog (no dependencies, exports to PDF too).

const nameOf = (a) => `${a.form?.lastName || ''}, ${a.form?.firstName || ''} ${a.form?.middleName || ''}`.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim() || '—';
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function shell(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>
    *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
    body{margin:34px;color:#1f1f1f}
    h1{font-size:15px;margin:0;text-align:center;text-transform:uppercase;letter-spacing:1px}
    .sub{text-align:center;font-size:12px;color:#555;margin:3px 0 18px}
    .meta{display:flex;flex-wrap:wrap;gap:5px 30px;font-size:12.5px;margin-bottom:12px}
    .meta b{color:#000}
    table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px}
    th,td{border:1px solid #8a8a8a;padding:5px 8px;text-align:left}
    th{background:#ececec;text-transform:uppercase;font-size:9.5px;letter-spacing:.4px}
    td.n{width:34px;text-align:center}
    .sec-title{font-size:12.5px;font-weight:bold;margin:16px 0 5px}
    .sign{margin-top:44px;display:flex;justify-content:space-between;font-size:12px}
    .sign div{text-align:center}
    .line{border-top:1px solid #000;width:210px;margin:0 auto 4px}
    .empty{text-align:center;color:#999}
    @media print{body{margin:0 12mm}}
  </style></head><body>${body}
  <script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>
  </body></html>`;
}

function openPrint(html) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to print the list.'); return; }
  w.document.write(html); w.document.close(); w.focus();
}

// One section's class list.
export function printClassList({ grade, section, adviser, schoolYear, students }) {
  const rows = students.map((a, i) =>
    `<tr><td class="n">${i + 1}</td><td>${esc(a.student_no || '')}</td><td>${esc(nameOf(a))}</td><td>${esc(a.form?.sex || '')}</td><td>${esc(a.form?.gwa || '')}</td></tr>`
  ).join('');
  const body = `
    <h1>Nuestra Señora de Guia Academy of Marikina</h1>
    <div class="sub">Official Class List</div>
    <div class="meta"><span><b>Grade:</b> ${esc(grade)}</span><span><b>Section:</b> ${esc(section)}</span><span><b>Adviser:</b> ${esc(adviser || '—')}</span><span><b>S.Y.:</b> ${esc(schoolYear)}</span><span><b>Total:</b> ${students.length}</span></div>
    <table><thead><tr><th class="n">No.</th><th>Student No.</th><th>Name (Last, First, M.I.)</th><th>Sex</th><th>GWA</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="empty">No students in this section</td></tr>'}</tbody></table>
    <div class="sign"><div><div class="line"></div>Prepared by · Registrar</div><div><div class="line"></div>${esc(adviser || 'Adviser')}</div></div>`;
  openPrint(shell(`Class List — ${grade} ${section}`, body));
}

// A whole grade's master list, grouped by section.
export function printGradeList({ grade, schoolYear, sections, students }) {
  const blocks = sections.map((s) => {
    const mem = students.filter((a) => a.form?.section === s.name);
    const rows = mem.map((a, i) => `<tr><td class="n">${i + 1}</td><td>${esc(a.student_no || '')}</td><td>${esc(nameOf(a))}</td><td>${esc(a.form?.gwa || '')}</td></tr>`).join('');
    return `<div class="sec-title">${esc(s.name)} — Adviser: ${esc(s.adviser || '—')} (${mem.length})</div>
      <table><thead><tr><th class="n">No.</th><th>Student No.</th><th>Name</th><th>GWA</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" class="empty">—</td></tr>'}</tbody></table>`;
  }).join('');
  const unassigned = students.filter((a) => !a.form?.section);
  const unBlock = unassigned.length
    ? `<div class="sec-title">Unassigned (${unassigned.length})</div><table><thead><tr><th class="n">No.</th><th>Student No.</th><th>Name</th></tr></thead><tbody>${unassigned.map((a, i) => `<tr><td class="n">${i + 1}</td><td>${esc(a.student_no || '')}</td><td>${esc(nameOf(a))}</td></tr>`).join('')}</tbody></table>` : '';
  const body = `
    <h1>Nuestra Señora de Guia Academy of Marikina</h1>
    <div class="sub">${esc(grade)} — Master List · S.Y. ${esc(schoolYear)} · ${students.length} students</div>
    ${blocks || '<p class="empty">No sections yet.</p>'}${unBlock}`;
  openPrint(shell(`${grade} Master List`, body));
}
