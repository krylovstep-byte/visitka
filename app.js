/* ══════════════════════════════════════
   STEPAN OS v2.1 — app.js
   ══════════════════════════════════════ */
'use strict';

const state = {
  zCounter: 100,
  openApps: new Set(),
  minimized: new Set(),
};

/* ══════════════════════════════════════
   BOOT
   ══════════════════════════════════════ */
const BOOT_MSGS = [
  { text: '[ <span class="ok">OK</span> ]  Loading STEPAN OS v2.1…',         delay: 0    },
  { text: '[ <span class="ok">OK</span> ]  Initializing workspace…',          delay: 300  },
  { text: '[ <span class="ok">OK</span> ]  Profile loaded: Крылов Степан',    delay: 580  },
  { text: '[ <span class="ok">OK</span> ]  15+ projects mounted…',            delay: 840  },
  { text: '[ <span class="ok">OK</span> ]  Terminal ready…',                  delay: 1080 },
  { text: '[ <span class="info">--</span> ]  System online.',                  delay: 1300 },
];

function boot() {
  const log    = document.getElementById('boot-log');
  const bar    = document.getElementById('boot-bar');
  const bootEl = document.getElementById('boot');
  const desk   = document.getElementById('desktop');

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
    desk.classList.add('visible');
    startClock();
  }, last + 850);
}

/* ══════════════════════════════════════
   CLOCK
   ══════════════════════════════════════ */
function startClock() {
  const el = document.getElementById('clock');
  function tick() {
    const d = new Date();
    el.textContent = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  tick();
  setInterval(tick, 10000);
}

/* ══════════════════════════════════════
   WINDOWS
   ══════════════════════════════════════ */
function getWin(name) { return document.getElementById('window-' + name); }

function focusWindow(win) {
  state.zCounter++;
  win.style.zIndex = state.zCounter;
}

function centerWindow(win) {
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;
  const tbH = 48;
  const dkH = 90;   // dock height + gap
  const ww  = win.offsetWidth  || 520;
  const wh  = win.offsetHeight || 420;
  const availH = vh - tbH - dkH;

  win.style.left = Math.max(20, Math.round((vw - ww) / 2)) + 'px';
  win.style.top  = Math.max(10, Math.round((availH - wh) / 2)) + 'px';
}

function openApp(name) {
  const win = getWin(name);
  if (!win) return;

  state.openApps.add(name);
  state.minimized.delete(name);
  win.classList.remove('minimized');

  if (!win.dataset.positioned) {
    win.classList.add('open');
    requestAnimationFrame(() => { centerWindow(win); win.dataset.positioned = '1'; });
  } else {
    win.classList.add('open');
  }

  focusWindow(win);
  updateTaskbar();
  updateDockState(name, true);

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
  updateDockState(name, false);
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
  const c = document.getElementById('tb-apps');
  c.innerHTML = '';
  state.openApps.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'tb-btn' + (state.minimized.has(name) ? '' : ' active');
    btn.textContent = name + '.app';
    btn.addEventListener('click', () => minimizeApp(name));
    c.appendChild(btn);
  });
}

function updateDockState(name, open) {
  const ic = document.querySelector('.dock-icon[data-app="' + name + '"]');
  if (ic) ic.classList.toggle('is-open', open);
}

/* ══════════════════════════════════════
   DRAG
   ══════════════════════════════════════ */
function initDrag(titlebar) {
  titlebar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('dot')) return;
    const win = titlebar.closest('.window');
    if (!win) return;
    focusWindow(win);

    const rect = win.getBoundingClientRect();
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    const dockSafe = 48 + 90; // taskbar + dock

    function onMove(e) {
      const nx = Math.max(-win.offsetWidth + 80, Math.min(window.innerWidth - 80, e.clientX - ox));
      const ny = Math.max(0, Math.min(window.innerHeight - dockSafe - 20, e.clientY - oy));
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
const FUN = [
  'Говорит на 3 языках: английский C1, немецкий B1, итальянский A2 🌍',
  'Запускает Taskin — первую фриланс-биржу с геймификацией в РФ 🚀',
  'Работал над проектами Сбера, X5, Альфа-Банка и Яндекса ⚡',
  'Учится в РАНХиГС на бюджете 📚',
  'Управлял командами до 10 человек 👥',
  'Финалист GRAND PRIX\'25 от X5 Group 🏆',
  'Базово умеет Python и HTML/CSS 💻',
  'Запустил этот сайт на чистом HTML без фреймворков 🛠',
];

const CMD = {
  help:     () => `Доступные команды:
  about      — кто такой Степан
  skills     — навыки и инструменты
  projects   — все проекты
  exp        — опыт работы
  edu        — образование
  lang       — языки
  contact    — как связаться
  fun        — случайный факт
  clear      — очистить`,

  about:    () => `Крылов Степан — Project Manager
  Силён в генерации идей и запуске продуктов от концепции до клиентов.
  Работаю на стыке бизнеса и технологий.`,

  skills:   () => `Инструменты:   Jira, Notion, Figma, Miro, Google Sheets
  Методологии:   Scrum / Kanban, CustDev, MVP, WBS
  Аналитика:     CJM, SNW, PESTEL, SWOT, 5 сил Портера
  Управление:    команды 3–10 человек
  Базовый:       Python, HTML / CSS`,

  projects: () => `1.  Taskin          — фриланс-биржа, геймификация (2025 — н.в.)
  2.  GRAND PRIX'25  — 5 кейсов X5 Group, финал хакатона
  3.  X5 Group       — employer brand X5 Digital
  4.  Альфа-Банк     — мультибанк с цифровым рублём, ЦБ РФ
  5.  СберИнвест.    — геймификация брокерского приложения
  6.  Яндекс         — продуктовые инициативы для Алисы`,

  exp:      () => `X5 Group | ТД Перекрёсток           нояб. 2025 — фев. 2026
    Стажёр, категорийный менеджмент СТМ «Зелёная линия»

  ЦПР «Просто будущее»               окт. 2024 — нояб. 2025
    Project Manager`,

  edu:      () => `Президентская Академия (РАНХиГС), ФМ (ФЭСН)
    Бакалавриат, Менеджмент — 2024 — н.в. (бюджет)

  Дополнительно:
    Skillbox — Продакт-менеджмент, CX и UX
    РУДН    — Проектный менеджмент
    Нетология — Figma`,

  lang:     () => `Английский  ████████████░░  C1
  Немецкий    ████████░░░░░░  B1
  Итальянский ████░░░░░░░░░░  A2`,

  contact:  () => `Telegram:  @krygerman         → t.me/krygerman
  Email:     directstep@mail.ru`,

  fun:      () => '→  ' + FUN[Math.floor(Math.random() * FUN.length)],
};

const ALIAS = { h: 'help', p: 'projects', s: 'skills', c: 'contact', e: 'exp', l: 'lang' };

function termExec(raw) {
  const screen = document.getElementById('term-screen');
  const cmd    = raw.trim().toLowerCase();

  const echoEl = document.createElement('div');
  echoEl.className = 'term-line term-cmd';
  echoEl.textContent = 'stepan@os:~$ ' + raw;
  screen.appendChild(echoEl);

  if (!cmd) { screen.scrollTop = screen.scrollHeight; return; }

  const key = ALIAS[cmd] || cmd;

  if (key === 'clear') { screen.innerHTML = ''; return; }

  const handler = CMD[key];
  const outEl = document.createElement('div');
  outEl.className = 'term-line term-out';

  if (handler) {
    const result = handler();
    if (result) { outEl.textContent = result; screen.appendChild(outEl); }
  } else {
    outEl.className = 'term-line term-err';
    outEl.textContent = `Команда не найдена: ${cmd}. Введи 'help' для списка.`;
    screen.appendChild(outEl);
  }

  const sp = document.createElement('div');
  sp.className = 'term-spacer';
  screen.appendChild(sp);
  screen.scrollTop = screen.scrollHeight;
}

function initTerminal() {
  const input = document.getElementById('term-input');
  if (!input) return;

  const history = [];
  let hi = -1;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = input.value;
      if (v.trim()) { history.unshift(v); hi = -1; }
      termExec(v); input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hi < history.length - 1) hi++;
      input.value = history[hi] || '';
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hi > 0) hi--;
      else { hi = -1; input.value = ''; return; }
      input.value = history[hi] || '';
    }
  });

  document.getElementById('window-terminal')?.addEventListener('click', () => input.focus());
}

/* ══════════════════════════════════════
   CURSOR — fixed lag
   ══════════════════════════════════════ */
function initCursor() {
  const ring = document.getElementById('cursor-ring');
  if (!ring) return;

  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    ring.classList.add('visible');
  });
  document.addEventListener('mouseleave', () => ring.classList.remove('visible'));
  document.addEventListener('mousedown',  () => ring.classList.add('clicking'));
  document.addEventListener('mouseup',    () => ring.classList.remove('clicking'));

  const SIZE = 10; // half of 20px ring

  function animate() {
    // 0.45 = fast follow, minimal lag
    rx += (mx - rx) * 0.45;
    ry += (my - ry) * 0.45;
    ring.style.transform = `translate(${rx - SIZE}px, ${ry - SIZE}px)`;
    requestAnimationFrame(animate);
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
    if (e.target.closest('.window') || e.target.closest('#dock') || e.target.closest('#taskbar')) return;
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth  - menu.offsetWidth  - 10);
    const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 10);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    menu.classList.add('visible');
  });

  menu.querySelectorAll('.ctx-item[data-action]').forEach(item => {
    item.addEventListener('click', () => {
      if (item.dataset.action === 'open-all')
        ['about','projects','terminal','contact'].forEach(openApp);
      else if (item.dataset.action === 'close-all')
        ['about','projects','terminal','contact'].forEach(closeApp);
      menu.classList.remove('visible');
    });
  });

  document.addEventListener('click',   e => { if (!menu.contains(e.target)) menu.classList.remove('visible'); });
  document.addEventListener('keydown',  e => { if (e.key === 'Escape') menu.classList.remove('visible'); });
}

/* ══════════════════════════════════════
   BIND
   ══════════════════════════════════════ */
function bindEvents() {
  // Dock icon clicks
  document.querySelectorAll('.dock-icon').forEach(ic => {
    ic.addEventListener('click', () => {
      const name = ic.dataset.app;
      if (state.openApps.has(name) && !state.minimized.has(name)) focusWindow(getWin(name));
      else openApp(name);
    });
  });

  // Window control dots
  document.querySelectorAll('.dot[data-action]').forEach(dot => {
    dot.addEventListener('click', e => {
      e.stopPropagation();
      dot.dataset.action === 'close' ? closeApp(dot.dataset.app) : minimizeApp(dot.dataset.app);
    });
  });

  // Draggable titlebars
  document.querySelectorAll('.window-titlebar').forEach(initDrag);

  // Focus window on click
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
