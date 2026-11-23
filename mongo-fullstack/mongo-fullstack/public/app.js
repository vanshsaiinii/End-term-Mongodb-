const $ = s => document.querySelector(s);
const api = async (url, method = 'GET', body) => {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
};

let timer;
const toast = msg => {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.remove('show'), 2200);
};

const safe = fn => async (...a) => {
  try { await fn(...a); } catch (e) { toast(e.message); }
};

document.querySelectorAll('nav button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('nav button, section').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    $('#' + b.dataset.tab).classList.add('on');
  };
});

const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const loadStudents = safe(async () => {
  const dept = $('#deptFilter').value;
  const [rows, c] = await Promise.all([
    api('/api/students' + (dept ? '?dept=' + dept : '')),
    api('/api/students/count')
  ]);
  $('#count').textContent = c.count + ' students in total';
  $('#stuBody').innerHTML = rows.length ? rows.map(s => `
    <tr>
      <td>${s.rollNo}</td><td>${esc(s.name)}</td><td>${esc(s.dept)}</td>
      <td>${s.marks}</td><td>${esc(s.city)}</td><td>${s.semester ?? '-'}</td>
      <td class="act">
        <button class="btn sm" data-edit="${s.rollNo}" data-marks="${s.marks}">Edit marks</button>
        <button class="btn sm danger" data-del="${s.rollNo}">Delete</button>
      </td>
    </tr>`).join('') : '<tr><td class="empty" colspan="7">No students yet. Add one above or load the sample data.</td></tr>';
});

$('#deptFilter').onchange = loadStudents;

$('#resetStu').onclick = safe(async () => {
  await api('/api/students/reset', 'POST');
  toast('Sample students loaded');
  loadStudents();
});

$('#addStu').onsubmit = safe(async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  await api('/api/students', 'POST', data);
  e.target.reset();
  toast('Student added');
  loadStudents();
});

$('#setSem').onclick = safe(async () => {
  const r = await api('/api/students/semester', 'PUT', { dept: $('#semDept').value, semester: $('#semVal').value });
  toast(r.modifiedCount + ' students updated');
  loadStudents();
});

$('#stuBody').onclick = safe(async e => {
  const edit = e.target.dataset.edit;
  const del = e.target.dataset.del;
  if (edit) {
    const m = prompt('New marks for roll no ' + edit, e.target.dataset.marks);
    if (m === null || m === '') return;
    await api('/api/students/' + edit, 'PUT', { marks: m });
    toast('Marks updated');
    loadStudents();
  }
  if (del && confirm('Delete roll no ' + del + '?')) {
    await api('/api/students/' + del, 'DELETE');
    toast('Student deleted');
    loadStudents();
  }
});

const showEmp = rows => {
  if (!rows.length) {
    $('#empHead').innerHTML = '';
    $('#empBody').innerHTML = '<tr><td class="empty">No employees match this query.</td></tr>';
    return;
  }
  const cols = Object.keys(rows[0]).filter(k => k !== '_id');
  $('#empHead').innerHTML = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>';
  $('#empBody').innerHTML = rows.map(r => '<tr>' + cols.map(c => `<td>${esc(r[c])}</td>`).join('') + '</tr>').join('');
};

document.querySelectorAll('[data-q]').forEach(b => {
  b.onclick = safe(async () => {
    const rows = await api('/api/employees/query/' + b.dataset.q);
    $('#empNote').textContent = b.textContent + ': ' + rows.length + ' result' + (rows.length === 1 ? '' : 's');
    showEmp(rows);
  });
});

$('#allEmp').onclick = safe(async () => {
  const rows = await api('/api/employees');
  $('#empNote').textContent = 'All employees: ' + rows.length;
  showEmp(rows);
});

$('#resetEmp').onclick = safe(async () => {
  await api('/api/employees/reset', 'POST');
  toast('Sample employees loaded');
  $('#allEmp').click();
});

loadStudents();
