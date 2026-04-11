/* ══════════════════════════════════════
   STEPAN OS v2.0 — app.js
   ══════════════════════════════════════ */
'use strict';

/* ── State ── */
const state = {
  zCounter: 100,
  openApps:  new Set(),
  minimized: new Set(),
};

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
const BOOT_MSGS = [
  { text: '[ <span class="ok">OK</span> ] Loading STEPAN OS v2.0.0…',        delay: 0   },
  { text: '[ <span class="ok">OK</span> ] Initializing workspace…',           delay: 320 },
  { text: '[ <span class="ok">OK</span> ] Importing profile: Крылов Степан…', delay: 620 },
  { text: '[ <span class="ok">OK</span> ] Mounting 6 projects…',              delay: 900 },
  { text: '[ <span class="ok">OK</span> ] Starting terminal…',                delay: 1150},
  { text: '[ <span class="info">--</span> ] Ready.',                           delay: 1380},
];

function boot() {
  const log     = document.getElementById('boot-log');
  const bar     = document.getElementById('boot-bar');
  const bootEl  = document.getElementById('boot');
  const deskEl  = document.getElementById('desktop');

  BOOT_MSGS.forEach(({ text, delay }, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'boot-line';
      el.innerHTML = text;
      log.appendChild(el);
      bar.style.width = ((i + 1) / BOOT_MSGS.length * 100) + '%';
    }, delay + 300);
  });

  const last = BOOT_MSGS[BOOT_MSGS.length - 1].delay + 300;
  setTimeout(() => {
    bootEl.classList.add('hidden');
    deskEl.classList.add('visible');
    startClock();
  }, last + 900);
}

/* ══════════════════════════════════════
   CLOCK
   ══════════════════════════════════════ */
function startClock() {
  function tick() {
    const d = new Date();
    document.getElementById('clock').textContent =
      String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  tick();
  setInterval(tick, 10000);
}

/* ══════════════════════════════════════
   WINDOW MANAGEMENT
   ══════════════════════════════════════ */
function getWin(name) { return document.getElementById('window-' + name); }

function focusWindow(win) {
  state.zCounter++;
  win.style.zIndex = state.zCounter;
}

function centerWindow(win) {
  const vw = window.innerWidth;
  const vh = window.innerHeight - 50;
  const ww = win.offsetWidth  || 540;
  const wh = win.offsetHeight || 420;
  win.style.left = Math.max(110, Math.round((vw - ww) / 2)) + 'px';
  win.style.top  = Math.max(10,  Math.round((vh - wh) / 2)) + 'px';
}

function openApp(name) {
  const win = getWin(name);
  if (!win) return;

  state.openApps.add(name);
  state.minimized.delete(name);
  win.classList.remove('minimized');

  if (!win.dataset.positioned) {
    win.classList.add('open');
    requestAnimationFrame(() => {
      centerWindow(win);
      win.dataset.positioned = '1';
    });
  } else {
    win.classList.add('open');
  }

  focusWindow(win);
  updateTaskbar();
  updateIconState(name, true);

  // Focus terminal input when terminal opens
  if (name === 'terminal') {
    setTimeout(() => document.getElementById('term-input')?.focus(), 200);
  }
}

function closeApp(name) {
  const win = getWin(name);
  if (!win) return;
  win.classList.remove('open', 'minimized');
  state.openApps.delete(name);
  state.minimized.delete(name);
  updateTaskbar();
  updateIconState(name, false);
}

function minimizeApp(name) {
  const win = getWin(name);
  if (!win) return;
  if (state.minimized.has(name)) {
    state.minimized.delete(name);
    win.classList.remove('minimized');
    win.classList.add('open');
    focusWindow(win);
  } else {
    state.minimized.add(name);
    win.classList.add('minimized');
  }
  updateTaskbar();
}

function updateTaskbar() {
  const cont = document.getElementById('tb-apps');
  cont.innerHTML = '';
  state.openApps.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'tb-btn' + (state.minimized.has(name) ? '' : ' active');
    btn.textContent = name + '.app';
    btn.addEventListener('click', () => minimizeApp(name));
    cont.appendChild(btn);
  });
}

function updateIconState(name, open) {
  const ic = document.querySelector('.icon[data-app="' + name + '"]');
  if (ic) ic.classList.toggle('is-open', open);
}

/* ══════════════════════════════════════
   DRAG
   ══════════════════════════════════════ */
function initDrag(titlebar) {
  titlebar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('dot')) return;
    const win  = titlebar.closest('.window');
    if (!win) return;
    focusWindow(win);

    const rect  = win.getBoundingClientRect();
    const offX  = e.clientX - rect.left;
    const offY  = e.clientY - rect.top;

    function onMove(e) {
      const nx = Math.max(-win.offsetWidth + 80,  Math.min(window.innerWidth  - 80, e.clientX - offX));
      const ny = Math.max(0, Math.min(window.innerHeight - 50 - 40, e.clientY - offY));
      win.style.left = nx + 'px';
      win.style.top  = ny + 'px';
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  });
}

/* ══════════════════════════════════════
   TERMINAL
   ══════════════════════════════════════ */
const FUN_FACTS = [
  'Говорит на 3 языках: английский C1, немецкий B1, итальянский A2 🌍',
  'Запускает Taskin — первую фриланс-биржу с геймификацией в РФ 🚀',
  'Работал над проектами Сбера, X5, Альфа-Банка и Яндекса ⚡',
  'Учится в РАНХиГС на бюджете 📚',
  'Может управлять командой до 10 человек 👥',
  'Участник GRAND PRIX\'25 от X5 Group 🏆',
  'Базово умеет Python и HTML/CSS 💻',
];

const CMD = {
  help: () => `Доступные команды:
  about      — кто такой Степан
  skills     — навыки и инструменты
  projects   — все проекты
  exp        — опыт работы
  edu        — образование
  lang       — языки
  contact    — как связаться
  fun        — случайный факт
  clear      — очистить терминал`,

  about: () => `Крылов Степан — Project Manager
  Особенно силён в генерации идей и запуске продуктов.
  Работаю на стыке бизнеса и технологий:
  сбор требований, планирование, бэклог, координация команды.`,

  skills: () => `Инструменты:   Jira, Notion, Figma, Miro, Google Sheets/Docs
  Методологии:   Scrum / Kanban, CustDev, MVP, бэклог, WBS
  Аналитика:     CJM, SNW, PESTEL, SWOT, 5 сил Портера, бенчмарк
  Управление:    команды 3–10 человек, коммуникация со стейкхолдерами
  Базовый:       Python, HTML / CSS`,

  projects: () => `1. Taskin          — фриланс-биржа с геймификацией (2025 — н.в.)
  2. GRAND PRIX'25   — 5 кейсов X5 Group, финал хакатона (2025)
  3. X5 Group        — employer brand X5 Digital (2024–2025)
  4. Альфа-Банк      — мультибанк с цифровым рублём, ЦБ РФ (2024)
  5. СберИнвестиции  — геймификация брокерского приложения (2024)
  6. Яндекс          — продуктовые инициативы для Алисы (2024)`,

  exp: () => `X5 Group | ТД Перекрёсток          нояб. 2025 — фев. 2026
    Стажёр, категорийный менеджмент СТМ «Зелёная линия»
    — сопровождение проектов, промо, аналитика, ЭДО

  ЦПР «Просто будущее»                  окт. 2024 — нояб. 2025
    Project Manager
    — анализ рынков, концепции, KPI, координация команд`,

  edu: () => `Президентская Академия (РАНХиГС), ФМ (ФЭСН)
    Бакалавриат, Менеджмент — 2024 — н.в. (бюджет)

  Доп. образование:
    Skillbox — Продакт-менеджмент, Продуктовый маркетолог, CX и UX
    РУДН    — Проектный менеджмент
    Нетология — Figma`,

  lang: () => `Английский  ████████████░░  C1
  Немецкий    ████████░░░░░░  B1
  Итальянский ████░░░░░░░░░░  A2`,

  contact: () => `Telegram:  @krygerman        → t.me/krygerman
  Email:     directstep@mail.ru`,

  fun: () => '→ ' + FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)],

  clear: () => null, // handled separately
};

const ALIASES = { h: 'help', p: 'projects', s: 'skills', c: 'contact', e: 'exp' };

function termExec(raw) {
  const screen = document.getElementById('term-screen');
  const cmd    = raw.trim().toLowerCase();

  // Echo the command
  const cmdLine = document.createElement('div');
  cmdLine.className = 'term-line term-cmd';
  cmdLine.textContent = 'stepan@os:~$ ' + raw;
  screen.appendChild(cmdLine);

  if (!cmd) { screen.scrollTop = screen.scrollHeight; return; }

  const resolved = ALIASES[cmd] || cmd;

  if (resolved === 'clear') {
    screen.innerHTML = '';
    return;
  }

  const handler = CMD[resolved];
  if (handler) {
    const output = handler();
    if (output) {
      const outLine = document.createElement('div');
      outLine.className = 'term-line term-out';
      outLine.textContent = output;
      screen.appendChild(outLine);
    }
  } else {
    const errLine = document.createElement('div');
    errLine.className = 'term-line term-err';
    errLine.textContent = `command not found: ${cmd}. Type 'help' for commands.`;
    screen.appendChild(errLine);
  }

  const spacer = document.createElement('div');
  spacer.className = 'term-spacer';
  screen.appendChild(spacer);
  screen.scrollTop = screen.scrollHeight;
}

function initTerminal() {
  const input = document.getElementById('term-input');
  if (!input) return;

  const history = [];
  let histIdx = -1;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = input.value;
      if (val.trim()) { history.unshift(val); histIdx = -1; }
      termExec(val);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) histIdx++;
      input.value = history[histIdx] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) histIdx--;
      else { histIdx = -1; input.value = ''; return; }
      input.value = history[histIdx] || '';
    }
  });

  // Click on terminal body → focus input
  document.getElementById('window-terminal')?.addEventListener('click', () => {
    input.focus();
  });
}

/* ══════════════════════════════════════
   CUSTOM CURSOR
   ══════════════════════════════════════ */
function initCursor() {
  const ring = document.getElementById('cursor-ring');
  if (!ring) return;

  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let raf;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    ring.classList.add('visible');
  });
  document.addEventListener('mouseleave', () => ring.classList.remove('visible'));
  document.addEventListener('mousedown', () => ring.classList.add('clicking'));
  document.addEventListener('mouseup',   () => ring.classList.remove('clicking'));

  function animate() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx - 11}px, ${ry - 11}px)`;
    raf = requestAnimationFrame(animate);
  }
  animate();
}

/* ══════════════════════════════════════
   CONTEXT MENU
   ══════════════════════════════════════ */
function initContextMenu() {
  const menu = document.getElementById('ctx-menu');
  if (!menu) return;

  document.getElementById('desktop')?.addEventListener('contextmenu', e => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth  - menu.offsetWidth  - 10);
    const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 10);
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';
    menu.classList.add('visible');
  });

  menu.querySelectorAll('.ctx-item[data-action]').forEach(item => {
    item.addEventListener('click', () => {
      const act = item.dataset.action;
      if (act === 'open-all') {
        ['about','projects','terminal','contact'].forEach(n => openApp(n));
      } else if (act === 'close-all') {
        ['about','projects','terminal','contact'].forEach(n => closeApp(n));
      }
      menu.classList.remove('visible');
    });
  });

  document.addEventListener('click', e => {
    if (!menu.contains(e.target)) menu.classList.remove('visible');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') menu.classList.remove('visible');
  });
}

/* ══════════════════════════════════════
   BIND EVENTS
   ══════════════════════════════════════ */
function bindEvents() {
  // Icon clicks
  document.querySelectorAll('.icon').forEach(ic => {
    ic.addEventListener('click', () => {
      const name = ic.dataset.app;
      if (state.openApps.has(name) && !state.minimized.has(name)) {
        focusWindow(getWin(name));
      } else {
        openApp(name);
      }
    });
  });

  // Dot buttons
  document.querySelectorAll('.dot[data-action]').forEach(dot => {
    dot.addEventListener('click', e => {
      e.stopPropagation();
      dot.dataset.action === 'close'
        ? closeApp(dot.dataset.app)
        : minimizeApp(dot.dataset.app);
    });
  });

  // Drag titlebars
  document.querySelectorAll('.window-titlebar').forEach(initDrag);

  // Click window → focus
  document.querySelectorAll('.window').forEach(win => {
    win.addEventListener('mousedown', () => focusWindow(win));
  });
}

/* ══════════════════════════════════════
   INIT
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  initTerminal();
  initCursor();
  initContextMenu();
  boot();
});
