const LOCAL_STORAGE_KEY = 'horario_apu_parciales';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getExams() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
  } catch (e) { return []; }
}

function saveExams(exams) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exams));
  renderExams();
}

function renderExams() {
  const examListEl = document.getElementById('examList');
  const exams = getExams();
  exams.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (exams.length === 0) {
    examListEl.innerHTML = '<div class="empty-day">// no hay deadlines registrados</div>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  examListEl.innerHTML = exams.map(ex => {
    const [y, m, d] = ex.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let badgeHtml = '';
    if (diffDays === 0) badgeHtml = `<span class="exam-badge badge-today">¡ES HOY!</span>`;
    else if (diffDays === 1) badgeHtml = `<span class="exam-badge badge-soon">¡MAÑANA!</span>`;
    else if (diffDays > 1) badgeHtml = `<span class="exam-badge badge-soon">Faltan ${diffDays} días</span>`;
    else badgeHtml = `<span class="exam-badge badge-past">Rendido</span>`;

    const formattedDate = `${d} de ${MONTHS[m - 1]}`;

    return `
      <div class="exam-card">
        <div class="exam-info">
          <div class="exam-name">${ex.name}</div>
          <div class="exam-date">📅 ${formattedDate} (${ex.date})</div>
        </div>
        ${badgeHtml}
        <div class="exam-btns">
          <button class="btn-icon" title="Editar" onclick="onEditExam(${ex.id})">✏️</button>
          <button class="btn-icon" title="Borrar" onclick="onDeleteExam(${ex.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

window.onDeleteExam = function(id) {
  if (confirm('¿Eliminar este deadline?')) {
    saveExams(getExams().filter(x => x.id != id));
  }
};

window.onEditExam = function(id) {
  const ex = getExams().find(x => x.id == id);
  if (!ex) return;
  document.getElementById('editExamId').value = ex.id;
  document.getElementById('examNameInput').value = ex.name;
  document.getElementById('examDateInput').value = ex.date;
  document.getElementById('formTitle').textContent = 'Editar Deadline';
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
    document.getElementById('formTitle').textContent = 'Nuevo Deadline';
    examForm.classList.toggle('open');
  });

  btnCancel.addEventListener('click', () => examForm.classList.remove('open'));

  examForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editExamId').value;
    const name = document.getElementById('examNameInput').value.trim();
    const date = document.getElementById('examDateInput').value;
    if (!name || !date) return;

    let exams = getExams();
    if (id) {
      exams = exams.map(x => x.id == id ? { ...x, name, date } : x);
    } else {
      exams.push({ id: Date.now(), name, date });
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