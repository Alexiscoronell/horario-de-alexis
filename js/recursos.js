'use strict';

(function () {
  const { escapeHtml, delegate } = App;

  const store = App.createLocalStore('horario_apu_recursos', [
    { id: 1, name: "Plan de Estudios UNPSJB", url: "https://plan-estudios-unpsjb.vercel.app/", desc: "Malla curricular interactiva" }
  ]);

  function normalizeUrl(url) {
    let clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean;
    return clean;
  }

  function render() {
    const container = document.getElementById('recursosList');
    const items = store.getAll();

    if (items.length === 0) {
      container.innerHTML = '<div class="empty-day">// no hay bookmarks registrados</div>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="recurso-card">
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="recurso-btn-link">
          <div class="recurso-icon">🔗</div>
          <div class="recurso-info">
            <span class="recurso-name">${escapeHtml(item.name)}</span>
            <span class="recurso-desc">${escapeHtml(item.desc || item.url)}</span>
          </div>
          <span class="recurso-arrow">↗</span>
        </a>
        <div class="recurso-actions">
          <button class="btn-icon" title="Editar" data-action="edit" data-id="${item.id}">✏️</button>
          <button class="btn-icon" title="Borrar" data-action="delete" data-id="${item.id}">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  function openEditForm(id) {
    const item = store.find(id);
    if (!item) return;
    document.getElementById('editRecursoId').value = item.id;
    document.getElementById('recursoNameInput').value = item.name;
    document.getElementById('recursoUrlInput').value = item.url;
    document.getElementById('recursoDescInput').value = item.desc || '';
    document.getElementById('recursoFormTitle').textContent = 'Editar Enlace';
    document.getElementById('recursoForm').classList.add('open');
  }

  function deleteItem(id) {
    if (confirm('¿Eliminar este enlace?')) {
      store.remove(id);
      render();
    }
  }

  function setupListDelegation() {
    delegate(document.getElementById('recursosList'), '[data-action]', (el) => {
      const id = el.dataset.id;
      if (el.dataset.action === 'edit') openEditForm(id);
      else if (el.dataset.action === 'delete') deleteItem(id);
    });
  }

  function setupForm() {
    const form = document.getElementById('recursoForm');
    const btnToggle = document.getElementById('btnToggleRecursoForm');
    const btnCancel = document.getElementById('btnCancelRecurso');

    btnToggle.addEventListener('click', () => {
      document.getElementById('editRecursoId').value = '';
      document.getElementById('recursoNameInput').value = '';
      document.getElementById('recursoUrlInput').value = '';
      document.getElementById('recursoDescInput').value = '';
      document.getElementById('recursoFormTitle').textContent = 'Nuevo Enlace';
      form.classList.toggle('open');
    });

    btnCancel.addEventListener('click', () => form.classList.remove('open'));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editRecursoId').value;
      const name = document.getElementById('recursoNameInput').value.trim();
      const rawUrl = document.getElementById('recursoUrlInput').value.trim();
      const desc = document.getElementById('recursoDescInput').value.trim();
      if (!name || !rawUrl) return;

      const url = normalizeUrl(rawUrl);
      if (id) store.update(id, { name, url, desc });
      else store.add({ name, url, desc });

      render();
      form.classList.remove('open');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    App.initTheme();
    render();
    setupListDelegation();
    setupForm();
  });
})();
