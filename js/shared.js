'use strict';

/**
 * App = namespace compartido por todas las páginas (index, parciales, recursos).
 * Se usa un objeto global en vez de <script type="module"> a propósito:
 * los módulos ES6 no cargan sobre file:// en Chrome/Android, y este sitio
 * está pensado para abrirse como acceso directo local en el celular.
 */
const App = (function () {

  const THEME_KEY = 'horario_apu_theme';
  const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  function getTodayName() {
    return DAYS_OF_WEEK[new Date().getDay()];
  }

  /** Escapa texto antes de insertarlo con innerHTML (evita romper el layout o inyectar HTML). */
  function escapeHtml(value) {
    if (value == null) return '';
    return String(value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  /** "14:00 – 16:00" -> { start, end, startStr, endStr } en minutos desde las 00:00 */
  function parseTimeRange(timeStr) {
    const parts = String(timeStr).split(/[-–]/).map(s => s.trim());
    if (parts.length !== 2) return null;
    const [h1, m1] = parts[0].split(':').map(Number);
    const [h2, m2] = parts[1].split(':').map(Number);
    if ([h1, m1, h2, m2].some(Number.isNaN)) return null;
    return { start: h1 * 60 + m1, end: h2 * 60 + m2, startStr: parts[0], endStr: parts[1] };
  }

  function rangesOverlap(a, b) {
    return a.start < b.end && b.start < a.end;
  }

  /**
   * Patrón Repository: centraliza el acceso a localStorage (lectura, guardado,
   * alta/edición/baja) para no repetir la misma lógica get/save en cada módulo.
   * Cada página (parciales, recursos) crea su propio store con su propia key.
   */
  function createLocalStore(key, defaults = []) {
    function getAll() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaults;
      } catch (e) {
        console.warn(`No se pudo leer "${key}" de localStorage:`, e);
        return defaults;
      }
    }

    function saveAll(items) {
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch (e) {
        console.warn(`No se pudo guardar "${key}" en localStorage:`, e);
      }
      return items;
    }

    function add(item) {
      const items = getAll();
      items.push({ id: Date.now(), ...item });
      return saveAll(items);
    }

    function update(id, patch) {
      const items = getAll().map(x => (x.id == id ? { ...x, ...patch } : x));
      return saveAll(items);
    }

    function remove(id) {
      return saveAll(getAll().filter(x => x.id != id));
    }

    function find(id) {
      return getAll().find(x => x.id == id);
    }

    return { getAll, saveAll, add, update, remove, find };
  }

  /** Modo claro/oscuro compartido: lee/guarda una sola vez en localStorage. */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    const btnDark = document.getElementById('btnDark');
    const btnLight = document.getElementById('btnLight');

    function apply(mode) {
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem(THEME_KEY, mode);
      if (btnDark) btnDark.classList.toggle('active', mode === 'dark');
      if (btnLight) btnLight.classList.toggle('active', mode === 'light');
    }

    apply(saved);
    if (btnDark) btnDark.addEventListener('click', () => apply('dark'));
    if (btnLight) btnLight.addEventListener('click', () => apply('light'));
  }

  /**
   * Delegación de eventos: un solo listener en `container` en vez de uno
   * por tarjeta. Evita usar window.onClick="..." inline y funciona aunque
   * el contenido se vuelva a renderizar (no hay que re-enganchar listeners).
   */
  function delegate(container, selector, handler) {
    if (!container) return;
    container.addEventListener('click', (e) => {
      const el = e.target.closest(selector);
      if (el && container.contains(el)) handler(el, e);
    });
  }

  return {
    DAYS_OF_WEEK,
    getTodayName,
    escapeHtml,
    parseTimeRange,
    rangesOverlap,
    createLocalStore,
    initTheme,
    delegate
  };
})();
