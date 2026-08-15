const LOCAL_STORAGE_KEY = 'horario_apu_recursos';

const DEFAULT_RECURSOS = [
  {
    id: 1,
    name: "Plan de Estudios UNPSJB",
    url: "https://plan-estudios-unpsjb.vercel.app/",
    desc: "Malla curricular interactiva"
  },
];

function getRecursos() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_RECURSOS;
  } catch (e) {
    return DEFAULT_RECURSOS;
  }
}

function saveRecursos(items) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  renderRecursos();
}

function normalizeUrl(url) {
  let clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  return clean;
}

function renderRecursos() {
  const container = document.getElementById('recursosList');
  const items = getRecursos();

  if (items.length === 0) {
    container.innerHTML = '<div class="empty-day">// no hay bookmarks registrados</div>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="recurso-card">
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="recurso-btn-link">
        <div class="recurso-icon">🔗</div>
        <div class="recurso-info">
          <span class="recurso-name">${item.name}</span>
          <span class="recurso-desc">${item.desc || item.url}</span>
        </div>
        <span class="recurso-arrow">↗</span>
      </a>
      <div class="recurso-actions">
        <button class="btn-icon" title="Editar" onclick="onEditRecurso(${item.id})">✏️</button>
        <button class="btn-icon" title="Borrar" onclick="onDeleteRecurso(${item.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

window.onDeleteRecurso = function(id) {
  if (confirm('¿Eliminar este enlace?')) {
    saveRecursos(getRecursos().filter(x => x.id != id));
  }
};

window.onEditRecurso = function(id) {
  const item = getRecursos().find(x => x.id == id);
  if (!item) return;

  document.getElementById('editRecursoId').value = item.id;
  document.getElementById('recursoNameInput').value = item.name;
  document.getElementById('recursoUrlInput').value = item.url;
  document.getElementById('recursoDescInput').value = item.desc || '';
  document.getElementById('recursoFormTitle').textContent = 'Editar Enlace';
  document.getElementById('recursoForm').classList.add('open');
};

function setupRecursosEvents() {
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
    let items = getRecursos();

    if (id) {
      items = items.map(x => x.id == id ? { ...x, name, url, desc } : x);
    } else {
      items.push({ id: Date.now(), name, url, desc });
    }

    saveRecursos(items);
    form.classList.remove('open');
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
  renderRecursos();
  setupRecursosEvents();
});