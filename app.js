const SCHEDULE = {
  "Lunes": [
    { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (T)", time: "12:00 – 14:00", room: "Lab. Fidel", desc: "Bloque teórico, mediodía.", conflict: false, dayIndex: 1 },
    { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (P)", time: "14:00 – 16:00", room: "Lab. Fidel", desc: "Práctica continua en laboratorio.", conflict: false, dayIndex: 1 },
    { code: "MA006", cls: "c-ma006", name: "Estadística (T/P)", time: "16:00 – 19:00", room: "Aula 13", desc: "Últimos 30 min (18:30–19:00) se superponen con Desarrollo de Software (P).", conflict: true, dayIndex: 1 },
    { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (P)", time: "18:30 – 20:30", room: "Aula 3 anexo", desc: "Primeros 30 min (18:30–19:00) se superponen con Estadística.", conflict: true, dayIndex: 1 }
  ],
  "Martes": [],
  "Miércoles": [
    { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (T)", time: "11:30 – 13:30", room: "Aula común", desc: "Teoría de Desarrollo de Software.", conflict: false, dayIndex: 3 },
    { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (P)", time: "14:00 – 16:00", room: "Aula 103", desc: "Práctica de Fundamentos.", conflict: false, dayIndex: 3 },
    { code: "IF013", cls: "c-if013", name: "Fundamentos Teóricos (T)", time: "16:00 – 18:00", room: "Aula 103", desc: "Teoría de Fundamentos.", conflict: false, dayIndex: 3 }
  ],
  "Jueves": [],
  "Viernes": [
    { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (T)", time: "14:00 – 16:00", room: "Aula 7 anexo", desc: "Bloque teórico inicial.", conflict: false, dayIndex: 5 },
    { code: "IF012", cls: "c-if012", name: "Desarrollo de Software (P)", time: "16:00 – 19:00", room: "Aula 7 anexo", desc: "Última hora (18:00–19:00) se superpone con Estadística.", conflict: true, dayIndex: 5 },
    { code: "MA006", cls: "c-ma006", name: "Estadística (T/P)", time: "18:00 – 21:00", room: "Aula 14 y 12", desc: "Primera hora (18:00–19:00) se superpone con Desarrollo de Software (P).", conflict: true, dayIndex: 5 }
  ],
  "Sábado": []
};

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function getTodayName() {
  return DAYS_OF_WEEK[new Date().getDay()];
}

function parseMinutes(timeStr) {
  const parts = timeStr.split(/[-–]/).map(s => s.trim());
  if (parts.length !== 2) return null;
  const [h1, m1] = parts[0].split(':').map(Number);
  const [h2, m2] = parts[1].split(':').map(Number);
  return { start: h1 * 60 + m1, end: h2 * 60 + m2, startStr: parts[0], endStr: parts[1], h1, m1, h2, m2 };
}

function renderDays() {
  const dayEl = document.getElementById('days');
  const todayName = getTodayName();
  dayEl.innerHTML = '';

  Object.keys(SCHEDULE).forEach(day => {
    const items = SCHEDULE[day];
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
      items.forEach(it => {
        const block = document.createElement('div');
        block.className = 'cls ' + it.cls + (it.conflict ? ' is-conflict' : '');
        block.innerHTML = `
          <div class="cls-top">
            <div>
              <div class="cls-code">${it.code}</div>
              <div class="cls-name">${it.name}</div>
            </div>
            <div class="cls-time">${it.time}</div>
          </div>
          <div class="cls-room">📍 ${it.room}</div>
          ${it.conflict ? '<div class="conflict-tag">⚠ CHOQUE DE HORARIO</div>' : ''}
        `;
        block.addEventListener('click', () => openModal(day, it));
        body.appendChild(block);
      });
    }
    dayEl.appendChild(det);
  });
}

function updateLiveStatus() {
  const dot = document.getElementById('liveDot');
  const content = document.getElementById('liveContent');
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const todayName = getTodayName();

  dot.className = 'live-dot';

  const rawToday = SCHEDULE[todayName];
  if (!rawToday || rawToday.length === 0) {
    content.innerHTML = `<b>Día libre</b> · No hay procesos de cursada programados para hoy.`;
    return;
  }

  let activeClasses = [];
  let nextClass = null;

  for (const c of rawToday) {
    const parsed = parseMinutes(c.time);
    if (!parsed) continue;

    if (currentMin >= parsed.start && currentMin < parsed.end) {
      activeClasses.push({ ...c, parsed });
    } else if (currentMin < parsed.start) {
      if (!nextClass || parsed.start < nextClass.parsed.start) {
        nextClass = { ...c, parsed };
      }
    }
  }

  if (activeClasses.length > 0) {
    dot.className = 'live-dot active';
    const names = activeClasses.map(a => `<b>${a.code}</b> (${a.room})`).join(' + ');
    const isConflict = activeClasses.length > 1;
    content.innerHTML = `
      <span class="live-tag" style="color:${isConflict ? 'var(--danger)' : 'var(--accent)'}">
        ● ${isConflict ? 'CHOQUE EN VIVO' : 'CURSANDO AHORA'}
      </span><br>
      ${names} · hasta las ${activeClasses[0].parsed.endStr}
    `;
  } else if (nextClass) {
    dot.className = 'live-dot next';
    content.innerHTML = `
      <span class="live-tag" style="color:var(--cyan)">⏳ Próxima clase: ${nextClass.parsed.startStr} hs</span><br>
      <b>${nextClass.code} — ${nextClass.name}</b> · Aula: <i>${nextClass.room}</i>
    `;
  } else {
    content.innerHTML = `<b>Cursadas finalizadas</b> · Procesos del día completados.`;
  }
}

// ==========================================
// EXPORTADOR A GOOGLE CALENDAR (.ICS)
// ==========================================
function generateICSFile() {
  const pad = (n) => String(n).padStart(2, '0');
  let icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alexis Coronel//Horario APU Informática//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Horario APU - Informática",
    "X-WR-TIMEZONE:America/Argentina/Buenos_Aires"
  ];

  // 1. Exportar Cursadas Semanales (Hasta fin de año)
  const now = new Date();
  const year = now.getFullYear();

  const daysMap = { "Lunes": "MO", "Martes": "TU", "Miércoles": "WE", "Jueves": "TH", "Viernes": "FR", "Sábado": "SA" };

  Object.keys(SCHEDULE).forEach(day => {
    const list = SCHEDULE[day];
    const byDay = daysMap[day];
    if (!byDay || list.length === 0) return;

    list.forEach((item, idx) => {
      const p = parseMinutes(item.time);
      if (!p) return;

      // Buscar el próximo día de la semana correspondiente
      const baseDate = new Date();
      const targetDay = item.dayIndex;
      const currentDay = baseDate.getDay();
      let diff = targetDay - currentDay;
      if (diff < 0) diff += 7;
      baseDate.setDate(baseDate.getDate() + diff);

      const dStr = `${baseDate.getFullYear()}${pad(baseDate.getMonth() + 1)}${pad(baseDate.getDate())}`;
      const dtStart = `${dStr}T${pad(p.h1)}${pad(p.m1)}00`;
      const dtEnd = `${dStr}T${pad(p.h2)}${pad(p.m2)}00`;

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:clase-${item.code}-${day}-${idx}-${year}@horario-apu`,
        `DTSTAMP:${year}0101T000000Z`,
        `DTSTART;TZID=America/Argentina/Buenos_Aires:${dtStart}`,
        `DTEND;TZID=America/Argentina/Buenos_Aires:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${year}1220T235959Z;BYDAY=${byDay}`,
        `SUMMARY:${item.code} — ${item.name}`,
        `LOCATION:${item.room}`,
        `DESCRIPTION:${item.desc.replace(/,/g, '\\,')}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Recordatorio de clase en 15 minutos",
        "END:VALARM",
        "END:VEVENT"
      );
    });
  });

  // 2. Exportar Parciales y Recuperatorios
  try {
    const exams = JSON.parse(localStorage.getItem('horario_apu_parciales') || '[]');
    exams.forEach(ex => {
      if (!ex.date) return;
      const cleanDate = ex.date.replace(/-/g, '');
      icsLines.push(
        "BEGIN:VEVENT",
        `UID:parcial-${ex.id}@horario-apu`,
        `DTSTAMP:${year}0101T000000Z`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `DTEND;VALUE=DATE:${cleanDate}`,
        `SUMMARY:📝 ${ex.name} ${ex.grade ? '(Nota: ' + ex.grade + ')' : ''}`,
        `DESCRIPTION:Estado: ${ex.status || 'Pendiente'}. ${ex.recuDate ? 'Recu: ' + ex.recuDate : ''}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        "DESCRIPTION:¡Mañana rinden examen!",
        "END:VALARM",
        "END:VEVENT"
      );

      // Si tiene recuperatorio cargado
      if (ex.recuDate) {
        const cleanRecuDate = ex.recuDate.replace(/-/g, '');
        icsLines.push(
          "BEGIN:VEVENT",
          `UID:recu-${ex.id}@horario-apu`,
          `DTSTAMP:${year}0101T000000Z`,
          `DTSTART;VALUE=DATE:${cleanRecuDate}`,
          `DTEND;VALUE=DATE:${cleanRecuDate}`,
          `SUMMARY:🟡 RECUPERATORIO: ${ex.name}`,
          `DESCRIPTION:Recuperatorio registrado para ${ex.name}`,
          "BEGIN:VALARM",
          "TRIGGER:-P1D",
          "ACTION:DISPLAY",
          "DESCRIPTION:¡Mañana es el recuperatorio!",
          "END:VALARM",
          "END:VEVENT"
        );
      }
    });
  } catch (e) {}

  icsLines.push("END:VCALENDAR");

  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `horario_apu_calendar.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// ==========================================
// BACKUP Y MODAL
// ==========================================
const modalBg = document.getElementById('modalBg');
function openModal(day, it) {
  document.getElementById('mTitle').textContent = `${it.code} — ${it.name}`;
  document.getElementById('mTime').textContent = `${day}, ${it.time} hs`;
  document.getElementById('mRoom').textContent = it.room;
  const desc = document.getElementById('mDesc');
  desc.textContent = it.desc;
  desc.className = 'modal-desc' + (it.conflict ? ' warn' : '');
  modalBg.classList.add('show');
}
function closeModal() { modalBg.classList.remove('show'); }
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalClose2').addEventListener('click', closeModal);
modalBg.addEventListener('click', e => { if (e.target === modalBg) closeModal(); });

function setupBackupAndSync() {
  const btnSync = document.getElementById('btnSyncCalendar');
  const btnExport = document.getElementById('btnExportBackup');
  const btnImport = document.getElementById('btnImportBackup');
  const fileInput = document.getElementById('backupFileInput');

  if (btnSync) btnSync.addEventListener('click', generateICSFile);

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const backupData = {
        parciales: JSON.parse(localStorage.getItem('horario_apu_parciales') || '[]'),
        recursos: JSON.parse(localStorage.getItem('horario_apu_recursos') || '[]'),
        tema: localStorage.getItem('horario_apu_theme') || 'dark',
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup_apu_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  }

  if (btnImport && fileInput) {
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
          alert('❌ Error: Archivo JSON inválido.');
        }
      };
      reader.readAsText(file);
    });
  }
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
  renderDays();
  updateLiveStatus();
  setupBackupAndSync();
  setInterval(updateLiveStatus, 30000);
});