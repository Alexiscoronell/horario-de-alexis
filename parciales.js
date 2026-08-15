const LOCAL_STORAGE_KEY = 'horario_apu_parciales';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function getExams() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [
      { id: 1, name: "1° Parcial Dev. Software", date: "2026-09-28", room: "Aula 7", status: "pendiente", grade: null, isRecu: false, parentId: null }
    ];
  } catch (e) { return []; }
}

function saveExams(exams) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exams));
  renderExams();
}

function updateStats(exams) {
  let aprobados = 0, pendientes = 0, recu = 0, sumaNotas = 0, cantNotas = 0;

  exams.forEach(x => {
    if (x.status === 'aprobado') {
      aprobados++;
      if (x.grade) { sumaNotas += parseFloat(x.grade); cantNotas++; }
    } else if (x.status === 'desaprobado') {
      recu++;
      if (x.grade) { sumaNotas += parseFloat(x.grade); cantNotas++; }
    } else {
      pendientes++;
    }
  });

  document.getElementById('countAprobados').textContent = aprobados;
  document.getElementById('countPendientes').textContent = pendientes;
  document.getElementById('countRecu').textContent = recu;
  
  const promedio = cantNotas > 0 ? (sumaNotas / cantNotas).toFixed(1) : '—';
  document.getElementById('promedioGeneral').textContent = promedio;
}

function renderExams() {
  const container = document.getElementById('examList');
  const exams = getExams();
  
  // Ordenar por fecha cronológica
  exams.sort((a, b) => new Date(a.date) - new Date(b.date));
  updateStats(exams);

  if (exams.length === 0) {
    container.innerHTML = '<div class="empty-day">// no hay parciales registrados</div>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  container.innerHTML = exams.map(ex => {
    const [y, m, d] = ex.date.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 1. Badges y etiquetas
    let statusBadge = '';
    let actionBtn = '';
    let isRecuBadge = ex.isRecu ? `<span class="recu-tag">⚡ RECUPERATORIO</span>` : '';

    if (ex.status === 'aprobado') {
      statusBadge = `<span class="exam-badge badge-aprobado">🟢 APROBADO (Nota: ${ex.grade})</span>`;
      actionBtn = `<button class="btn-action-card" onclick="openGradeModal(${ex.id})">✏️ Cambiar Nota</button>`;
    } else if (ex.status === 'desaprobado') {
      statusBadge = `<span class="exam-badge badge-desaprobado">🔴 DESAPROBADO (Nota: ${ex.grade})</span>`;
      
      // Chequear si ya se le creó un recuperatorio
      const yaTieneRecu = exams.some(child => child.parentId === ex.id);
      if (!yaTieneRecu) {
        actionBtn = `
          <button class="btn-action-card" onclick="openGradeModal(${ex.id})">✏️ Nota</button>
          <button class="btn-action-card btn-danger-action" onclick="openRecuModal(${ex.id})">⚡ + Crear Recu</button>
        `;
      } else {
        actionBtn = `<button class="btn-action-card" onclick="openGradeModal(${ex.id})">✏️ Cambiar Nota</button>`;
      }
    } else {
      // Estado Pendiente
      if (diffDays === 0) statusBadge = `<span class="exam-badge badge-today">¡ES HOY!</span>`;
      else if (diffDays === 1) statusBadge = `<span class="exam-badge badge-soon">¡MAÑANA!</span>`;
      else if (diffDays > 1) statusBadge = `<span class="exam-badge badge-soon">Faltan ${diffDays}d</span>`;
      else statusBadge = `<span class="exam-badge badge-past">Rendido</span>`;

      actionBtn = `<button class="btn-action-card btn-accent-action" onclick="openGradeModal(${ex.id})">📝 Cargar Nota</button>`;
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
            <button class="btn-icon" title="Editar datos" onclick="onEditExam(${ex.id})">✏️</button>
            <button class="btn-icon" title="Borrar" onclick="onDeleteExam(${ex.id})">🗑️</button>
          </div>
        </div>

        <!-- Barra inferior de acciones (Cargar nota / Crear Recu) -->
        <div class="exam-card-actions">
          ${actionBtn}
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// MODAL CARGAR NOTA
// ==========================================
window.openGradeModal = function(id) {
  const ex = getExams().find(x => x.id == id);
  if (!ex) return;

  closeAllForms();
  document.getElementById('gradeExamId').value = ex.id;
  document.getElementById('gradeInput').value = ex.grade || '';
  document.getElementById('gradeStatusOverride').value = 'auto';
  document.getElementById('gradeFormTitle').textContent = `📝 Calificación: ${ex.name}`;
  document.getElementById('gradeForm').classList.add('open');
  document.getElementById('gradeInput').focus();
};

// ==========================================
// MODAL CREAR RECUPERATORIO
// ==========================================
window.openRecuModal = function(parentId) {
  const parent = getExams().find(x => x.id == parentId);
  if (!parent) return;

  closeAllForms();
  document.getElementById('recuParentId').value = parent.id;
  document.getElementById('recuNameInput').value = `Recuperatorio: ${parent.name}`;
  document.getElementById('recuDateInput').value = '';
  document.getElementById('recuRoomInput').value = parent.room || '';
  document.getElementById('recuFormTitle').textContent = `⚡ Programar Recu para ${parent.name}`;
  document.getElementById('recuForm').classList.add('open');
};

// ==========================================
// MODAL EDITAR / CREAR PARCIAL BASE
// ==========================================
window.onEditExam = function(id) {
  const ex = getExams().find(x => x.id == id);
  if (!ex) return;

  closeAllForms();
  document.getElementById('editExamId').value = ex.id;
  document.getElementById('examNameInput').value = ex.name;
  document.getElementById('examDateInput').value = ex.date;
  document.getElementById('examRoomInput').value = ex.room || '';
  document.getElementById('formTitle').textContent = 'Editar Datos del Parcial';
  document.getElementById('examForm').classList.add('open');
};

window.onDeleteExam = function(id) {
  if (confirm('¿Eliminar este examen de la lista?')) {
    saveExams(getExams().filter(x => x.id != id));
  }
};

function closeAllForms() {
  document.getElementById('examForm').classList.remove('open');
  document.getElementById('gradeForm').classList.remove('open');
  document.getElementById('recuForm').classList.remove('open');
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  const btnToggle = document.getElementById('btnToggleExamForm');
  const btnCancelExam = document.getElementById('btnCancelExam');
  const btnCancelGrade = document.getElementById('btnCancelGrade');
  const btnCancelRecu = document.getElementById('btnCancelRecu');

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
  btnCancelRecu.addEventListener('click', closeAllForms);

  // 1. Submit Parcial Base
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
      exams.push({ id: Date.now(), name, date, room, status: "pendiente", grade: null, isRecu: false, parentId: null });
    }

    saveExams(exams);
    closeAllForms();
  });

  // 2. Submit Cargar Nota
  document.getElementById('gradeForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('gradeExamId').value;
    const gradeVal = parseFloat(document.getElementById('gradeInput').value);
    const override = document.getElementById('gradeStatusOverride').value;

    if (isNaN(gradeVal)) return;

    let status = 'pendiente';
    if (override === 'auto') {
      status = (gradeVal >= 6) ? 'aprobado' : 'desaprobado';
    } else {
      status = override;
    }

    let exams = getExams().map(x => {
      if (x.id == id) {
        return { ...x, grade: gradeVal, status: status };
      }
      return x;
    });

    saveExams(exams);
    closeAllForms();
  });

  // 3. Submit Crear Recuperatorio
  document.getElementById('recuForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const parentId = parseInt(document.getElementById('recuParentId').value);
    const name = document.getElementById('recuNameInput').value.trim();
    const date = document.getElementById('recuDateInput').value;
    const room = document.getElementById('recuRoomInput').value.trim();

    if (!name || !date) return;

    let exams = getExams();
    exams.push({
      id: Date.now(),
      name: name,
      date: date,
      room: room,
      status: "pendiente",
      grade: null,
      isRecu: true,
      parentId: parentId
    });

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