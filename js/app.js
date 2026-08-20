'use strict';

(function () {
  const { escapeHtml, parseTimeRange, rangesOverlap, getTodayName, delegate } = App;

  const SCHEDULE = {
    "Lunes": [
      { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (T)", time: "12:00 – 14:00", room: "Lab. Fidel", desc: "Bloque teórico, mediodía." },
      { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (P)", time: "14:00 – 16:00", room: "Lab. Fidel", desc: "Práctica continua en laboratorio." },
      { code: "MA006", cls: "c-ma006", name: "Estadística (T/P)", time: "16:00 – 19:00", room: "Aula 13", desc: "Materia incorporada de 2° año." },
      { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (P)", time: "18:30 – 20:30", room: "Aula 3 anexo", desc: "Práctica de cierre del día lunes." }
    ],
    "Martes": [],
    "Miércoles": [
      { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (virtual)", time: "11:30 – 13:30", room: "Aula común", desc: "consulta virtual de Desarrollo de Software." },
      { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (P)", time: "14:00 – 16:00", room: "Aula 103", desc: "Práctica de Fundamentos." },
      { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (T)", time: "16:00 – 17:00", room: "Aula 103", desc: "Teoría de Fundamentos." }
    ],
    "Jueves": [],
    "Viernes": [
      { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (T)", time: "14:00 – 16:00", room: "Aula 7 anexo", desc: "Bloque teórico inicial." },
      { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (P)", time: "16:00 – 19:00", room: "Aula 7 anexo", desc: "Última hora se superpone con Estadística." },
      { code: "MA006", cls: "c-ma006", name: "Estadística (T/P)", time: "18:00 – 21:00", room: "Aula 14 y 12", desc: "Primera hora se superpone con Desarrollo de Software (P)." }
    ],
    "Sábado": []
  };

  /** Compara todas las materias de un día entre sí y devuelve cuáles chocan. */
  function findConflicts(items) {
    const withRange = items.map(it => ({ ...it, range: parseTimeRange(it.time) }));
    const conflictIdx = new Set();
    const pairs = [];

    for (let i = 0; i < withRange.length; i++) {
      for (let j = i + 1; j < withRange.length; j++) {
        const a = withRange[i], b = withRange[j];
        if (a.range && b.range && rangesOverlap(a.range, b.range)) {
          conflictIdx.add(i);
          conflictIdx.add(j);
          pairs.push({ a, b });
        }
      }
    }
    return { conflictIdx, pairs };
  }

  function fmtMin(min) {
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  function overlapLabel(a, b) {
    const start = Math.max(a.range.start, b.range.start);
    const end = Math.min(a.range.end, b.range.end);
    return `${fmtMin(start)}–${fmtMin(end)}`;
  }

  function renderAlert() {
    const box = document.getElementById('alertBox');
    if (!box) return;

    const allPairs = [];
    Object.entries(SCHEDULE).forEach(([day, items]) => {
      findConflicts(items).pairs.forEach(p => allPairs.push({ day, ...p }));
    });

    if (allPairs.length === 0) {
      box.remove();
      return;
    }

    box.innerHTML = `
      <div class="alert-title">⚠ SUPERPOSICIONES DETECTADAS (PLAN 2010)</div>
      ${allPairs.map(p => `
        <div class="alert-item"><b>${escapeHtml(p.day)} ${overlapLabel(p.a, p.b)}:</b> choque entre ${escapeHtml(p.a.code)} y ${escapeHtml(p.b.code)}.</div>
      `).join('')}
    `;
  }

  function renderDays() {
    const dayEl = document.getElementById('days');
    const todayName = getTodayName();
    dayEl.innerHTML = '';

    Object.entries(SCHEDULE).forEach(([day, items]) => {
      const { conflictIdx } = findConflicts(items);
      const det = document.createElement('details');
      det.className = 'day';
      const isToday = day === todayName;
      det.open = isToday;

      det.innerHTML = `
        <summary>
          <span class="summary-left">
            <span class="chev">▸</span>
            <span>${day.toUpperCase()}</span>
            ${isToday ? '<span class="today-badge">HOY</span>' : ''}
          </span>
          <span class="count-badge">${items.length ? items.length + ' materias' : ''}</span>
        </summary>
        <div class="day-body"></div>
      `;

      const body = det.querySelector('.day-body');
      if (items.length === 0) {
        body.innerHTML = '<div class="empty-day">// sin cursada asignada</div>';
      } else {
        items.forEach((it, idx) => {
          const isConflict = conflictIdx.has(idx);
          const block = document.createElement('div');
          block.className = `cls ${it.cls}${isConflict ? ' is-conflict' : ''}`;
          block.dataset.day = day;
          block.dataset.idx = idx;
          block.innerHTML = `
            <div class="cls-top">
              <div>
                <div class="cls-code">${escapeHtml(it.code)}</div>
                <div class="cls-name">${escapeHtml(it.name)}</div>
              </div>
              <div class="cls-time">${escapeHtml(it.time)}</div>
            </div>
            <div class="cls-room">📍 ${escapeHtml(it.room)}</div>
            ${isConflict ? '<div class="conflict-tag">⚠ CHOQUE DE HORARIO</div>' : ''}
          `;
          body.appendChild(block);
        });
      }
      dayEl.appendChild(det);
    });
  }

  function openModal(day, it, isConflict) {
    document.getElementById('mTitle').textContent = `${it.code} — ${it.name}`;
    document.getElementById('mTime').textContent = `${day}, ${it.time} hs`;
    document.getElementById('mRoom').textContent = it.room;
    const desc = document.getElementById('mDesc');
    desc.textContent = it.desc + (isConflict ? ' ⚠ Este bloque se superpone con otra materia.' : '');
    desc.className = 'modal-desc' + (isConflict ? ' warn' : '');
    document.getElementById('modalBg').classList.add('show');
  }

  function closeModal() {
    document.getElementById('modalBg').classList.remove('show');
  }

  function setupDayClicks() {
    delegate(document.getElementById('days'), '.cls', (el) => {
      const day = el.dataset.day;
      const idx = Number(el.dataset.idx);
      const it = SCHEDULE[day][idx];
      const isConflict = findConflicts(SCHEDULE[day]).conflictIdx.has(idx);
      openModal(day, it, isConflict);
    });
  }

  function setupModal() {
    const modalBg = document.getElementById('modalBg');
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalClose2').addEventListener('click', closeModal);
    modalBg.addEventListener('click', e => { if (e.target === modalBg) closeModal(); });
  }

  function updateLiveStatus() {
    const dot = document.getElementById('liveDot');
    const content = document.getElementById('liveContent');
    if (!dot || !content) return;

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const items = SCHEDULE[getTodayName()] || [];
    dot.className = 'live-dot';

    if (items.length === 0) {
      content.innerHTML = `<b>Día libre</b> · No hay cursada programada para hoy.`;
      return;
    }

    let active = [];
    let next = null;

    items.forEach((it) => {
      const range = parseTimeRange(it.time);
      if (!range) return;
      if (currentMin >= range.start && currentMin < range.end) {
        active.push({ it, range });
      } else if (currentMin < range.start && (!next || range.start < next.range.start)) {
        next = { it, range };
      }
    });

    if (active.length > 0) {
      const isConflict = active.length > 1;
      dot.className = 'live-dot active';
      const names = active.map(a => `<b>${escapeHtml(a.it.code)}</b> (${escapeHtml(a.it.room)})`).join(' + ');
      content.innerHTML = `
        <span class="live-tag" style="color:${isConflict ? 'var(--danger)' : 'var(--accent)'}">
          ● ${isConflict ? 'CHOQUE EN VIVO' : 'CURSANDO AHORA'}
        </span><br>
        ${names} · hasta las ${active[0].range.endStr}
      `;
    } else if (next) {
      dot.className = 'live-dot next';
      content.innerHTML = `
        <span class="live-tag" style="color:var(--cyan)">⏳ Próxima clase: ${next.range.startStr} hs</span><br>
        <b>${escapeHtml(next.it.code)} — ${escapeHtml(next.it.name)}</b> · Aula: <i>${escapeHtml(next.it.room)}</i>
      `;
    } else {
      content.innerHTML = `<b>Cursadas finalizadas</b> · Ya terminaron las clases de hoy.`;
    }
  }

  function setupBackup() {
    const btnExport = document.getElementById('btnExportBackup');
    const btnImport = document.getElementById('btnImportBackup');
    const fileInput = document.getElementById('backupFileInput');
    if (!btnExport || !btnImport || !fileInput) return;

    btnExport.addEventListener('click', () => {
      const backup = {
        parciales: JSON.parse(localStorage.getItem('horario_apu_parciales') || '[]'),
        recursos: JSON.parse(localStorage.getItem('horario_apu_recursos') || '[]'),
        tema: localStorage.getItem('horario_apu_theme') || 'dark',
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup_apu_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    });

    btnImport.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.parciales) localStorage.setItem('horario_apu_parciales', JSON.stringify(data.parciales));
          if (data.recursos) localStorage.setItem('horario_apu_recursos', JSON.stringify(data.recursos));
          if (data.tema) localStorage.setItem('horario_apu_theme', data.tema);
          alert('✅ ¡Backup restaurado con éxito!');
          location.reload();
        } catch (err) {
          alert('❌ Error: el archivo JSON no es válido.');
        }
      };
      reader.readAsText(file);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    App.initTheme();
    renderAlert();
    renderDays();
    setupDayClicks();
    setupModal();
    updateLiveStatus();
    setupBackup();
    setInterval(updateLiveStatus, 30000);
  });
})();
