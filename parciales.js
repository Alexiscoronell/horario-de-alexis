'use strict';

(function () {
  const { escapeHtml, delegate } = App;
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const store = App.createLocalStore('horario_apu_parciales', [
    { id: 1, name: "1° Parcial Dev. Software", date: "2026-09-28", room: "Aula 7", status: "pendiente", grade: "", isRecu: false }
  ]);

  let currentTab = 'pendientes'; // 'pendientes' | 'aprobados' | 'recus'

  function switchTab(tab) {
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
    document.getElementById('btnToggleExamForm').style.display = (tab === 'pendientes') ? 'inline-block' : 'none';

    closeAllForms();
    render();
  }

  function onGradeStatusChange() {
    const status = document.getElementById('gradeStatusInput').value;
    const group = document.getElementById('recuAutoGroup');
    const dateInput = document.getElementById('autoRecuDateInput');
    const show = status === 'recu';
    group.style.display = show ? 'flex' : 'none';
    dateInput.required = show;
  }

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

  function daysUntil(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }

  function statusBadge(ex, diffDays) {
    if (ex.status === 'aprobado') return `<span class="exam-badge badge-aprobado">🟢 APROBADO (${escapeHtml(ex.grade)})</span>`;
    if (ex.status === 'recu') return `<span class="exam-badge badge-recu">🟡 A RECU (${escapeHtml(ex.grade)})</span>`;
    if (ex.status === 'desaprobado') return `<span class="exam-badge badge-desaprobado">🔴 DESAPROBADO (${escapeHtml(ex.grade)})</span>`;
    if (diffDays === 0) return `<span class="exam-badge badge-today">¡ES HOY!</span>`;
    if (diffDays === 1) return `<span class="exam-badge badge-soon">¡MAÑANA!</span>`;
    if (diffDays > 1) return `<span class="exam-badge badge-soon">Faltan ${diffDays}d</span>`;
    return `<span class="exam-badge badge-past">Rendido</span>`;
  }

  function actionButton(ex) {
    if (ex.status === 'pendiente') {
      return `<button class="btn-action-card btn-accent-action" data-action="grade" data-id="${ex.id}">📝 Cargar Nota / Resultado</button>`;
    }
    const label = ex.status === 'aprobado' ? '✏️ Cambiar Nota' : '✏️ Modificar';
    return `<button class="btn-action-card" data-action="grade" data-id="${ex.id}">${label}</button>`;
  }

  function render() {
    const container = document.getElementById('examList');
    const exams = store.getAll();
    updateCounters(exams);

    const filters = {
      pendientes: x => x.status === 'pendiente',
      aprobados: x => x.status === 'aprobado',
      recus: x => x.status === 'recu' || x.status === 'desaprobado'
    };
    const filtered = exams.filter(filters[currentTab]).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filtered.length === 0) {
      const emptyMsgs = {
        pendientes: '// no tenés parciales pendientes',
        aprobados: '// todavía no registraste parciales aprobados',
        recus: '// sin parciales en recuperatorio o desaprobados'
      };
      container.innerHTML = `<div class="empty-day">${emptyMsgs[currentTab]}</div>`;
      return;
    }

    container.innerHTML = filtered.map(ex => {
      const diffDays = daysUntil(ex.date);
      const [y, m, d] = ex.date.split('-').map(Number);
      const formattedDate = `${d} de ${MONTHS[m - 1]} (${ex.date})`;
      const isRecuBadge = ex.isRecu ? `<span class="recu-tag">⚡ RECU</span>` : '';

      return `
        <div class="exam-card ${ex.isRecu ? 'is-recu-card' : ''}">
          <div class="exam-card-main">
            <div class="exam-info">
              <div class="exam-name-wrap">
                ${isRecuBadge}
                <span class="exam-name">${escapeHtml(ex.name)}</span>
              </div>
              <div class="exam-date">📅 ${escapeHtml(formattedDate)} ${ex.room ? '· 📍 ' + escapeHtml(ex.room) : ''}</div>
            </div>
            <div class="exam-status-col">${statusBadge(ex, diffDays)}</div>
            <div class="exam-btns">
              <button class="btn-icon" title="Editar" data-action="edit" data-id="${ex.id}">✏️</button>
              <button class="btn-icon" title="Borrar" data-action="delete" data-id="${ex.id}">🗑️</button>
            </div>
          </div>
          <div class="exam-card-actions">${actionButton(ex)}</div>
        </div>
      `;
    }).join('');
  }

  function openGradeModal(id) {
    const ex = store.find(id);
    if (!ex) return;
    closeAllForms();
    document.getElementById('gradeExamId').value = ex.id;
    document.getElementById('gradeInput').value = ex.grade || '';
    document.getElementById('gradeStatusInput').value = ex.status !== 'pendiente' ? ex.status : 'aprobado';
    document.getElementById('autoRecuDateInput').value = '';
    document.getElementById('autoRecuRoomInput').value = ex.room || '';
    document.getElementById('gradeFormTitle').textContent = `📝 Calificar: ${ex.name}`;
    onGradeStatusChange();
    document.getElementById('gradeForm').classList.add('open');
  }

  function openEditForm(id) {
    const ex = store.find(id);
    if (!ex) return;
    closeAllForms();
    document.getElementById('editExamId').value = ex.id;
    document.getElementById('examNameInput').value = ex.name;
    document.getElementById('examDateInput').value = ex.date;
    document.getElementById('examRoomInput').value = ex.room || '';
    document.getElementById('formTitle').textContent = 'Editar Datos';
    document.getElementById('examForm').classList.add('open');
  }

  function deleteExam(id) {
    if (confirm('¿Eliminar este registro?')) {
      store.remove(id);
      render();
    }
  }

  function closeAllForms() {
    document.getElementById('examForm').classList.remove('open');
    document.getElementById('gradeForm').classList.remove('open');
  }

  function setupListDelegation() {
    delegate(document.getElementById('examList'), '[data-action]', (el) => {
      const id = el.dataset.id;
      const action = el.dataset.action;
      if (action === 'grade') openGradeModal(id);
      else if (action === 'edit') openEditForm(id);
      else if (action === 'delete') deleteExam(id);
    });
  }

  function setupTabs() {
    document.getElementById('tabPendientes').addEventListener('click', () => switchTab('pendientes'));
    document.getElementById('tabAprobados').addEventListener('click', () => switchTab('aprobados'));
    document.getElementById('tabRecu').addEventListener('click', () => switchTab('recus'));
  }

  function setupForms() {
    const btnToggle = document.getElementById('btnToggleExamForm');
    btnToggle.addEventListener('click', () => {
      closeAllForms();
      document.getElementById('editExamId').value = '';
      document.getElementById('examNameInput').value = '';
      document.getElementById('examDateInput').value = '';
      document.getElementById('examRoomInput').value = '';
      document.getElementById('formTitle').textContent = 'Nuevo Parcial';
      document.getElementById('examForm').classList.add('open');
    });

    document.getElementById('btnCancelExam').addEventListener('click', closeAllForms);
    document.getElementById('btnCancelGrade').addEventListener('click', closeAllForms);
    document.getElementById('gradeStatusInput').addEventListener('change', onGradeStatusChange);

    document.getElementById('examForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editExamId').value;
      const name = document.getElementById('examNameInput').value.trim();
      const date = document.getElementById('examDateInput').value;
      const room = document.getElementById('examRoomInput').value.trim();
      if (!name || !date) return;

      if (id) store.update(id, { name, date, room });
      else store.add({ name, date, room, status: 'pendiente', grade: '', isRecu: false });

      closeAllForms();
      render();
    });

    document.getElementById('gradeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('gradeExamId').value;
      const grade = document.getElementById('gradeInput').value.trim();
      const status = document.getElementById('gradeStatusInput').value;
      const recuDate = document.getElementById('autoRecuDateInput').value;
      const recuRoom = document.getElementById('autoRecuRoomInput').value.trim();
      if (!grade) return;

      const parent = store.find(id);
      store.update(id, { grade, status });

      // Si va a recuperatorio y se cargó fecha, se crea automáticamente
      // el nuevo parcial pendiente correspondiente al recu.
      if (status === 'recu' && recuDate && parent) {
        const recuName = parent.name.startsWith('Recu:') ? parent.name : `Recu: ${parent.name}`;
        store.add({ name: recuName, date: recuDate, room: recuRoom, status: 'pendiente', grade: '', isRecu: true });
      }

      closeAllForms();
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    App.initTheme();
    setupTabs();
    setupForms();
    setupListDelegation();
    render();
  });
})();
