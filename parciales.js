const LOCAL_STORAGE_KEY = 'horario_apu_parciales';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getExams() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [
      { id: 1, name: "1° Parcial Dev. Software", date: "2026-10-05", status: "pendiente", grade: "", recuDate: "", recuGrade: "" }
    ];
  } catch (e) { return []; }
}

function saveExams(exams) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exams));
  renderExams();
}

window.toggleRecuFields = function() {
  const status = document.getElementById('examStatusInput').value;
  const group = document.getElementById('recuFieldsGroup');
  group.style.display = (status === 'recu') ? 'flex' : 'none';
};

function updateStats(exams) {
  let aprobados = 0, pendientes = 0, recu = 0;
  exams.forEach(x => {
    if (x.status === 'aprobado') aprobados++;
    else if (x.status === 'recu') recu++;
    else if (x.status === 'pendiente') pendientes++;
  });
  document.getElementById('countAprobados').textContent = aprobados;
  document.getElementById('countPendientes').textContent = pendientes;
  document.getElementById('countRecu').textContent = recu;
}

function renderExams() {
  const examListEl = document.getElementById('examList');
  const exams = getExams();
  exams.sort((a, b) => new Date(a.date) - new Date(b.date));
  updateStats(exams);

  if (exams.length === 0) {
    examListEl.innerHTML = '<div class="empty-day">// no hay exámenes registrados</div>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  examListEl.innerHTML = exams.map(ex => {
    const [y, m, d] = ex.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let statusBadge = '';
    let gradeLabel = ex.grade ? `<span class="exam-grade-pill">Nota: <b>${ex.grade}</b></span>` : '';

    if (ex.status === 'aprobado') {
      statusBadge = `<span class="exam-badge badge-aprobado">🟢 APROBADO</span>`;
    } else if (ex.status === 'recu') {
      let recuInfo = '';
      if (ex.recuDate) {
        const [ry, rm, rd] = ex.recuDate.split('-').map(Number);
        recuInfo = ` · Recu: ${rd}/${rm}`;
      }
      statusBadge = `<span class="exam-badge badge-recu">🟡 A RECU${recuInfo}</span>`;
    } else if (ex.status === 'desaprobado') {
      statusBadge = `<span class="exam-badge badge-desaprobado">🔴 DESAPROBADO</span>`;
    } else {
      if (diffDays === 0) statusBadge = `<span class="exam-badge badge-today">¡ES HOY!</span>`;
      else if (diffDays === 1) statusBadge = `<span class="exam-badge badge-soon">¡MAÑANA!</span>`;
      else if (diffDays > 1) statusBadge = `<span class="exam-badge badge-soon">Faltan ${diffDays}d</span>`;
      else statusBadge = `<span class="exam-badge badge-past">Rendido</span>`;
    }

    const formattedDate = `${d} de ${MONTHS[m - 1]}`;

    let recuDetail = '';
    if (ex.status === 'recu' && ex.recuDate) {
      recuDetail = `<div class="recu-notice">⏳ Fecha de Recuperatorio: <b>${ex.recuDate}</b> ${ex.recuGrade ? '· Nota Recu: <b>' + ex.recuGrade + '</b>' : ''}</div>`;
    }

    return `
      <div class="exam-card">
        <div class="exam-info">
          <div class="exam-name">${ex.name} ${gradeLabel}</div>
          <div class="exam-date">📅 ${formattedDate} (${ex.date})</div>
          ${recuDetail}
        </div>
        ${statusBadge}
        <div class="exam-btns">
          <button class="btn-icon" title="Editar" onclick="onEditExam(${ex.id})">✏️</button>
          <button class="btn-icon" title="Borrar" onclick="onDeleteExam(${ex.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

window.onDeleteExam = function(id) {
  if (confirm('¿Eliminar este registro?')) {
    saveExams(getExams().filter(x => x.id != id));
  }
};

window.onEditExam = function(id) {
  const ex = getExams().find(x => x.id == id);
  if (!ex) return;

  document.getElementById('editExamId').value = ex.id;
  document.getElementById('examNameInput').value = ex.name;
  document.getElementById('examDateInput').value = ex.date;
  document.getElementById('examStatusInput').value = ex.status || 'pendiente';
  document.getElementById('examGradeInput').value = ex.grade || '';
  document.getElementById('examRecuDateInput').value = ex.recuDate || '';
  document.getElementById('examRecuGradeInput').value = ex.recuGrade || '';

  window.toggleRecuFields();
  document.getElementById('formTitle').textContent = 'Editar Examen / Calificación';
  document.getElementById('examForm').classList.add('open');
};

function setupEventListeners() {
  const examForm = document.getElementById('examForm');
  const btnToggle = document.getElementById('btnToggleExamForm');
  const btnCancel = document.getElementById('btnCancelExam');

  btnToggle.addEventListener('click', () => {
    document.getElementById('editExamId').value = '';
    document.getElementById('examNameInput').value = '';
    document.getElementById('examDateInput').value = '';
    document.getElementById('examStatusInput').value = 'pendiente';
    document.getElementById('examGradeInput').value = '';
    document.getElementById('examRecuDateInput').value = '';
    document.getElementById('examRecuGradeInput').value = '';
    window.toggleRecuFields();
    document.getElementById('formTitle').textContent = 'Nuevo Registro de Parcial';
    examForm.classList.toggle('open');
  });

  btnCancel.addEventListener('click', () => examForm.classList.remove('open'));

  examForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editExamId').value;
    const name = document.getElementById('examNameInput').value.trim();
    const date = document.getElementById('examDateInput').value;
    const status = document.getElementById('examStatusInput').value;
    const grade = document.getElementById('examGradeInput').value;
    const recuDate = document.getElementById('examRecuDateInput').value;
    const recuGrade = document.getElementById('examRecuGradeInput').value;

    if (!name || !date) return;

    let exams = getExams();
    if (id) {
      exams = exams.map(x => x.id == id ? { ...x, name, date, status, grade, recuDate, recuGrade } : x);
    } else {
      exams.push({ id: Date.now(), name, date, status, grade, recuDate, recuGrade });
    }

    saveExams(exams);
    examForm.classList.remove('open');
  });
}

function initTheme() {
  const saved = localStorage.getItem('horario_apu_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  const btnDark = document.getElementById('btnDark');
  const btnLight = document.getElementById('btnLight');

  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('horario_apu_theme', mode);
    if (btnDark) btnDark.classList.toggle('active', mode === 'dark');
    if (btnLight) btnLight.classList.toggle('active', mode === 'light');
  }

  setTheme(saved);
  if (btnDark) btnDark.addEventListener('click', () => setTheme('dark'));
  if (btnLight) btnLight.addEventListener('click', () => setTheme('light'));
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderExams();
  setupEventListeners();
});