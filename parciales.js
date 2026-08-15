const LOCAL_STORAGE_KEY = 'horario_apu_parciales';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

let currentTab = 'pendientes'; // 'pendientes' | 'aprobados' | 'recus'

function getExams() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [
      { id: 1, name: "1° Parcial Dev. Software", date: "2026-09-28", room: "Aula 7", status: "pendiente", grade: "", isRecu: false }
    ];
  } catch (e) { return []; }
}

function saveExams(exams) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exams));
  renderExams();
}

window.switchTab = function(tab) {
  currentTab = tab;
  document.getElementById('tabPendientes').classList.toggle('active', tab === 'pendientes');
  document.getElementById('tabAprobados').classList.toggle('active', tab === 'aprobados');
  document.getElementById('tabRecu').classList.toggle('active', tab === 'recus');

  const titles = {
    pendientes: '// PARCIALES PENDIENTES (POR RENDIR)',
    aprobados: '// HISTORIAL DE APROBADOS',
    recus: '// HISTORIAL DE RECUPERATORIOS Y DESAPROBADOS'
  };
  document.getElementById('currentViewTitle').textContent = titles[tab];

  // El botón "+ Nuevo Parcial" solo es relevante en la pestaña de pendientes
  document.getElementById('btnToggleExamForm').style.display = (tab === 'pendientes') ? 'inline-block' : 'none';

  closeAllForms();
  renderExams();
};

window.onGradeStatusChange = function() {
  const status = document.getElementById('gradeStatusInput').value;
  const group = document.getElementById('recuAutoGroup');
  group.style.display = (status === 'recu') ? 'flex' : 'none';
  if (status === 'recu') {
    document.getElementById('autoRecuDateInput').required = true;
  } else {
    document.getElementById('autoRecuDateInput').required = false;
  }
};

function updateCounters(exams) {
  let pendientes = 0, aprobados = 0, recus = 0;
  exams.forEach(x => {
    if (x.status === 'aprobado') aprobados++;
    else if (x.status === 'recu' || x.status === 'desaprobado') recus++;
    else pendientes++;
  });
  document.getElementById('countPendientes').textContent = pendientes;
  document.getElementById('countAprobados').textContent = aprobados;
  document.getElementById('countRecus').textContent = recus;
}

function renderExams() {
  const container = document.getElementById('examList');
  const exams = getExams();
  updateCounters(exams);

  // Filtrar según pestaña activa
  let filtered = [];
  if (currentTab === 'pendientes') {
    filtered = exams.filter(x => x.status === 'pendiente');
  } else if (currentTab === 'aprobados') {
    filtered = exams.filter(x => x.status === 'aprobado');
  } else if (currentTab === 'recus') {
    filtered = exams.filter(x => x.status === 'recu' || x.status === 'desaprobado');
  }

  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length === 0) {
    const emptyMsgs = {
      pendientes: '// no tenés parciales pendientes',
      aprobados: '// todavía no registraste parciales aprobados',
      recus: '// sin parciales en recuperatorio o desaprobados'
    };
    container.innerHTML = `<div class="empty-day">${emptyMsgs[currentTab]}</div>`;
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  container.innerHTML = filtered.map(ex => {
    const [y, m, d] = ex.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let statusBadge = '';
    let actionBtn = '';
    let isRecuBadge = ex.isRecu ? `<span class="recu-tag">⚡ RECU</span>` : '';

    if (ex.status === 'aprobado') {
      statusBadge = `<span class="exam-badge badge-aprobado">🟢 APROBADO (${ex.grade})</span>`;
      actionBtn = `<button class="btn-action-card" onclick="openGradeModal(${ex.id})">✏️ Cambiar Nota</button>`;
    } else if (ex.status === 'recu') {
      statusBadge = `<span class="exam-badge badge-recu">🟡 A RECU (${ex.grade})</span>`;
      actionBtn = `<button class="btn-action-card" onclick="openGradeModal(${ex.id})">✏️ Modificar</button>`;
    } else if (ex.status === 'desaprobado') {
      statusBadge = `<span class="exam-badge badge-desaprobado">🔴 DESAPROBADO (${ex.grade})</span>`;
      actionBtn = `<button class="btn-action-card" onclick="openGradeModal(${ex.id})">✏️ Modificar</button>`;
    } else {
      // Pendiente
      if (diffDays === 0) statusBadge = `<span class="exam-badge badge-today">¡ES HOY!</span>`;
      else if (diffDays === 1) statusBadge = `<span class="exam-badge badge-soon">¡MAÑANA!</span>`;
      else if (diffDays > 1) statusBadge = `<span class="exam-badge badge-soon">Faltan ${diffDays}d</span>`;
      else statusBadge = `<span class="exam-badge badge-past">Rendido</span>`;

      actionBtn = `<button class="btn-action-card btn-accent-action" onclick="openGradeModal(${ex.id})">📝 Cargar Nota / Resultado</button>`;
    }

    const formattedDate = `${d} de ${MONTHS[m - 1]} (${ex.date})`;

    return `
      <div class="exam-card ${ex.isRecu ? 'is-recu-card' : ''}">
        <div class="exam-card-main">
          <div class="exam-info">
            <div class="exam-name-wrap">
              ${isRecuBadge}
              <span class="exam-name">${ex.name}</span>
            </div>
            <div class="exam-date">📅 ${formattedDate} ${ex.room ? '· 📍 ' + ex.room : ''}</div>
          </div>
          <div class="exam-status-col">
            ${statusBadge}
          </div>
          <div class="exam-btns">
            <button class="btn-icon" title="Editar" onclick="onEditExam(${ex.id})">✏️</button>
            <button class="btn-icon" title="Borrar" onclick="onDeleteExam(${ex.id})">🗑️</button>
          </div>
        </div>

        <div class="exam-card-actions">
          ${actionBtn}
        </div>
      </div>
    `;
  }).join('');
}

// Modal Cargar Nota
window.openGradeModal = function(id) {
  const ex = getExams().find(x => x.id == id);
  if (!ex) return;

  closeAllForms();
  document.getElementById('gradeExamId').value = ex.id;
  document.getElementById('gradeInput').value = ex.grade || '';
  document.getElementById('gradeStatusInput').value = ex.status !== 'pendiente' ? ex.status : 'aprobado';
  document.getElementById('autoRecuDateInput').value = '';
  document.getElementById('autoRecuRoomInput').value = ex.room || '';
  document.getElementById('gradeFormTitle').textContent = `📝 Calificar: ${ex.name}`;
  
  window.onGradeStatusChange();
  document.getElementById('gradeForm').classList.add('open');
};

window.onEditExam = function(id) {
  const ex = getExams().find(x => x.id == id);
  if (!ex) return;

  closeAllForms();
  document.getElementById('editExamId').value = ex.id;
  document.getElementById('examNameInput').value = ex.name;
  document.getElementById('examDateInput').value = ex.date;
  document.getElementById('examRoomInput').value = ex.room || '';
  document.getElementById('formTitle').textContent = 'Editar Datos';
  document.getElementById('examForm').classList.add('open');
};

window.onDeleteExam = function(id) {
  if (confirm('¿Eliminar este registro?')) {
    saveExams(getExams().filter(x => x.id != id));
  }
};

function closeAllForms() {
  document.getElementById('examForm').classList.remove('open');
  document.getElementById('gradeForm').classList.remove('open');
}

function setupEventListeners() {
  const btnToggle = document.getElementById('btnToggleExamForm');
  const btnCancelExam = document.getElementById('btnCancelExam');
  const btnCancelGrade = document.getElementById('btnCancelGrade');

  btnToggle.addEventListener('click', () => {
    closeAllForms();
    document.getElementById('editExamId').value = '';
    document.getElementById('examNameInput').value = '';
    document.getElementById('examDateInput').value = '';
    document.getElementById('examRoomInput').value = '';
    document.getElementById('formTitle').textContent = 'Nuevo Parcial';
    document.getElementById('examForm').classList.add('open');
  });

  btnCancelExam.addEventListener('click', closeAllForms);
  btnCancelGrade.addEventListener('click', closeAllForms);

  // 1. Guardar Parcial Base
  document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editExamId').value;
    const name = document.getElementById('examNameInput').value.trim();
    const date = document.getElementById('examDateInput').value;
    const room = document.getElementById('examRoomInput').value.trim();

    if (!name || !date) return;
    let exams = getExams();

    if (id) {
      exams = exams.map(x => x.id == id ? { ...x, name, date, room } : x);
    } else {
      exams.push({ id: Date.now(), name, date, room, status: "pendiente", grade: "", isRecu: false });
    }

    saveExams(exams);
    closeAllForms();
  });

  // 2. Guardar Calificación / Crear Recuperatorio automático
  document.getElementById('gradeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('gradeExamId').value);
    const grade = document.getElementById('gradeInput').value.trim();
    const status = document.getElementById('gradeStatusInput').value;
    const recuDate = document.getElementById('autoRecuDateInput').value;
    const recuRoom = document.getElementById('autoRecuRoomInput').value.trim();

    if (!grade) return;
    let exams = getExams();

    // Actualizar parcial rendido
    exams = exams.map(x => {
      if (x.id === id) {
        return { ...x, grade, status };
      }
      return x;
    });

    // Si va a recuperatorio y se ingresó fecha, creamos el nuevo parcial pendiente
    if (status === 'recu' && recuDate) {
      const parentExam = exams.find(x => x.id === id);
      const recuName = parentExam.name.startsWith('Recu:') ? parentExam.name : `Recu: ${parentExam.name}`;
      
      exams.push({
        id: Date.now(),
        name: recuName,
        date: recuDate,
        room: recuRoom,
        status: "pendiente",
        grade: "",
        isRecu: true
      });
    }

    saveExams(exams);
    closeAllForms();
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