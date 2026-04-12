/* STEPAN OS v4.0 */
'use strict';

const state = { z: 100, open: new Set(), min: new Set() };

/* ── BOOT ── */
const BOOT = [
  { t: '[ <span class="ok">OK</span> ]  Loading STEPAN OS v4.0…',   d: 0    },
  { t: '[ <span class="ok">OK</span> ]  Workspace initialized…',     d: 320  },
  { t: '[ <span class="ok">OK</span> ]  Profile: Крылов Степан, PM', d: 600  },
  { t: '[ <span class="ok">OK</span> ]  15+ projects mounted…',       d: 860  },
  { t: '[ <span class="info">--</span> ]  System ready.',             d: 1080 },
];

function boot() {
  const log    = document.getElementById('boot-log');
  const bar    = document.getElementById('boot-bar');
  const bootEl = document.getElementById('boot');
  const desk   = document.getElementById('desktop');

  BOOT.forEach(({ t, d }, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'boot-line'; el.innerHTML = t;
      log.appendChild(el);
      bar.style.width = ((i + 1) / BOOT.length * 100) + '%';
    }, d + 300);
  });

  const last = BOOT[BOOT.length - 1].d + 300;
  setTimeout(() => {
    bootEl.classList.add('hidden');
    desk.classList.add('visible');
    startClocks();
    scheduleClippy();
  }, last + 700);
}

/* ── CLOCKS ── */
function startClocks() {
  const tbC   = document.getElementById('clock');
  const mbC   = document.getElementById('mb-clock');
  const mbC2  = document.getElementById('mb-clock2');
  function tick() {
    const d  = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const t  = hh + ':' + mm;
    if (tbC)  tbC.textContent  = t;
    if (mbC)  mbC.textContent  = t;
    if (mbC2) mbC2.textContent = t;
  }
  tick(); setInterval(tick, 1000);
}

/* ── WINDOWS ── */
function getWin(n) { return document.getElementById('window-' + n); }
function focusWin(win) { state.z++; win.style.zIndex = state.z; }

function centerWin(win) {
  if (window.innerWidth <= 600) return; // на мобиле позиция через CSS
  const vw = window.innerWidth, vh = window.innerHeight;
  const menuH = 22, tbH = 28, pad = 16;
  const ww = win.offsetWidth || 500, wh = win.offsetHeight || 400;
  const avH = vh - menuH - tbH - pad * 2;
  win.style.left = Math.max(20, Math.round((vw - ww) / 2)) + 'px';
  win.style.top  = Math.max(menuH + 8, Math.round(menuH + pad + (avH - wh) / 2)) + 'px';
}

function openApp(n) {
  const win = getWin(n);
  if (!win) return;
  state.open.add(n); state.min.delete(n);
  win.classList.remove('minimized');
  if (!win.dataset.pos) {
    win.classList.add('open');
    requestAnimationFrame(() => { centerWin(win); win.dataset.pos = '1'; });
  } else {
    win.classList.add('open');
  }
  focusWin(win); updateTaskbar(); updateIcon(n, true);
  clippyReactToApp(n);
}

function closeApp(n) {
  const win = getWin(n);
  if (!win) return;
  win.classList.remove('open', 'minimized');
  state.open.delete(n); state.min.delete(n);
  updateTaskbar(); updateIcon(n, false);
}

function minApp(n) {
  const win = getWin(n);
  if (!win) return;
  if (state.min.has(n)) {
    state.min.delete(n);
    win.classList.remove('minimized'); win.classList.add('open');
    focusWin(win);
  } else {
    state.min.add(n); win.classList.add('minimized');
  }
  updateTaskbar();
}

function updateTaskbar() {
  const c = document.getElementById('tb-apps');
  c.innerHTML = '';
  state.open.forEach(n => {
    const b = document.createElement('button');
    b.className = 'tb-btn' + (state.min.has(n) ? '' : ' active');
    b.textContent = n + '.app';
    b.addEventListener('click', () => minApp(n));
    c.appendChild(b);
  });
  updateDock();
}

function updateDock() {
  document.querySelectorAll('.dock-btn').forEach(b => {
    const n = b.dataset.app;
    b.classList.toggle('active', state.open.has(n) && !state.min.has(n));
  });
}

function updateIcon(n, isOpen) {
  const ic = document.querySelector(`.desk-icon[data-app="${n}"]`);
  if (ic) ic.classList.toggle('is-open', isOpen);
}

/* ── DRAG ── */
function initDrag(bar) {
  bar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('dot')) return;
    const win = bar.closest('.window');
    if (!win) return;
    focusWin(win);
    const r = win.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    function onMove(e) {
      win.style.left = Math.max(-win.offsetWidth + 80, Math.min(window.innerWidth - 80, e.clientX - ox)) + 'px';
      win.style.top  = Math.max(22, Math.min(window.innerHeight - 56, e.clientY - oy)) + 'px';
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

/* ── CURSOR ── */
function initCursor() {
  const cur = document.getElementById('cursor');
  if (!cur) return;
  document.addEventListener('mousemove', e => {
    cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    cur.classList.add('visible');
  });
  document.addEventListener('mouseleave', () => cur.classList.remove('visible'));
}

/* ── CLIPPY — интерактивный персонаж без инпута ── */

/* Реплики при открытии конкретного окна */
const APP_REPLIES = {
  about:    ['Это про Степана. Читай внимательно.', 'Там есть навыки. Много навыков.', 'Ярославль → Москва. Серьёзный маршрут.'],
  projects: ['15+ проектов. Не каждый PM столько делает.', 'X5, Сбер, Яндекс. Неплохо для студента.', 'Taskin — самый свежий. Смотри сам.'],
  folder:   ['Там две игры. Я не говорил? Говорил.', 'Крестики-нолики. ИИ там не дурак, предупреждаю.', 'Кликер на 5 секунд. Рекорд — побей.'],
  contact:  ['Пиши в Telegram. Он отвечает быстро.', 'directstep@mail.ru — серьёзная почта.', 'Не стесняйся. Он не кусается.'],
  terminal: ['Нашёл терминал. Уважаю.', 'Введи "help" если потерялся.', 'Попробуй "neofetch". Серьёзно.'],
};

/* Случайные реплики при клике на скрепку */
const CLIPPY_PHRASES = [
  'О, гость. Уже интересно.',
  'Да, я Скрепочка. И да, я в курсе всего.',
  'Степан сам сделал этот сайт, и меня.',
  'В папке folder_01 есть две игры.',
  'Нажми уже что-нибудь. Я тут не для декора, блин.',
  'О, живой человек. А я уж думал, опять бот.',
  'Со Степаном можно пообщаться в телеге: @krygerman',
  'Судя по курсору, ты пока не определился. Бывает.',
  'Не делай вид, что ты просто мимо проходил.',
  'Смотришь так, будто я тебе деньги должен.',
  'Да не мнись ты. Это не госуслуги.',
];

let clippyPhraseIdx = 0;
let clippyTypingId  = 0; // отменяет старый typing при новом вызове

function clippyShow(text, showNav) {
  const bubble = document.getElementById('clippy-bubble');
  const msg    = document.getElementById('clippy-msg');
  const nav    = document.getElementById('clippy-nav');
  if (!bubble || !msg) return;

  bubble.classList.remove('hidden');
  msg.textContent = '';

  // Каждый новый вызов инвалидирует предыдущий typing loop
  const myId = ++clippyTypingId;
  let i = 0;
  function type() {
    if (myId !== clippyTypingId) return; // старый вызов — стоп
    if (i < text.length) {
      msg.textContent += text[i]; i++;
      setTimeout(type, 26);
    }
  }
  type();

  if (nav) nav.style.display = showNav ? 'flex' : 'none';
}

function clippyReactToApp(appName) {
  const list = APP_REPLIES[appName];
  if (!list) return;
  const txt = list[Math.floor(Math.random() * list.length)];
  clippyShow(txt, false);
}

function clippyClick() {
  const txt = CLIPPY_PHRASES[clippyPhraseIdx % CLIPPY_PHRASES.length];
  clippyPhraseIdx++;
  const showNav = clippyPhraseIdx % 3 === 0; // каждый 3й клик — показывать навигацию
  clippyShow(txt, showNav);
}

function scheduleClippy() {
  // Первое приветствие через 2с
  setTimeout(() => {
    clippyShow('О, гость. Уже интересно. Нажми на иконку.', true);
  }, 2000);

  // Случайные реплики каждые 30–50с
  function next() {
    const delay = 30000 + Math.random() * 20000;
    setTimeout(() => {
      const bubble = document.getElementById('clippy-bubble');
      if (bubble && bubble.classList.contains('hidden')) {
        const txt = CLIPPY_PHRASES[Math.floor(Math.random() * CLIPPY_PHRASES.length)];
        clippyShow(txt, Math.random() > 0.6);
      }
      next();
    }, delay);
  }
  next();
}

function initClippy() {
  const char   = document.getElementById('clippy-char');
  const close  = document.getElementById('clippy-close');
  const bubble = document.getElementById('clippy-bubble');
  if (!char) return;

  // Клик на скрепку
  char.addEventListener('click', clippyClick);

  // Двойной клик — секретная реплика
  char.addEventListener('dblclick', e => {
    e.stopPropagation();
    clippyShow('Ладно, признаюсь. Я просто скрепка. Но с характером.', false);
  });

  // Закрыть пузырь
  if (close) close.addEventListener('click', e => {
    e.stopPropagation();
    bubble.classList.add('hidden');
  });

  // Навигационные кнопки внутри пузыря
  document.querySelectorAll('.clippy-nav-btn[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      openApp(btn.dataset.open);
      bubble.classList.add('hidden');
    });
  });

  // Proximity detection — реагирует на приближение курсора
  document.addEventListener('mousemove', e => {
    const r = char.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 180) {
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) * 0.07;
      char.style.transform = `scale(1.05) rotate(${angle}deg)`;
      char.style.animationPlayState = 'paused';
    } else {
      char.style.transform = '';
      char.style.animationPlayState = 'running';
    }
  });

  // Idle escalation — 20с без движения → Скрепочка подаёт знак
  let idleTimer = null;
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (bubble.classList.contains('hidden')) {
        clippyShow('Эй. Ты там вообще?', false);
      }
    }, 20000);
  }
  document.addEventListener('mousemove', resetIdle);
  document.addEventListener('click', resetIdle);
  resetIdle();
}

/* ── STICKY NOTE DRAG ── */
function initNoteDrag() {
  const el = document.getElementById('desk-note');
  if (!el) return;
  el.addEventListener('mousedown', e => {
    const r = el.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    function onMove(e) {
      el.style.left = Math.max(0, e.clientX - ox) + 'px';
      el.style.top  = Math.max(22, e.clientY - oy) + 'px';
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

/* ── TERMINAL ── */
const TERM_CMDS = {
  help: '  whoami\n  ls\n  ping\n  uptime\n  neofetch\n  clear',
  whoami: 'stepan_krylov — PM, предприниматель, создатель этого сайта',
  ls: 'about.app   projects.app   folder_01   contact.app   terminal.app   clippy.exe',
  ping: 'PING @krygerman ... 12ms  reply from Telegram ✓',
  uptime: () => 'StepanOS v4.0 — uptime: ' + (Math.floor(Math.random() * 72) + 1) + 'h ' + (Math.floor(Math.random() * 59) + 1) + 'm',
  neofetch: '  ██████  OS: StepanOS v4.0\n  █ СК █  Host: Yaroslavl → Moscow\n  ██████  PM: Степан Крылов\n          Projects: 15+\n          Languages: RU EN DE IT\n          Shell: ideas → execution',
  taskin: 'taskin.app — фриланс-биржа. В разработке. Следи.',
  cv: 'Открой about.app — там всё про него.',
  clear: '__clear__',
};

function initTerminal() {
  const input  = document.getElementById('term-input');
  const output = document.getElementById('term-output');
  if (!input || !output) return;

  function addLine(text, cls) {
    (text + '').split('\n').forEach(t => {
      const d = document.createElement('div');
      d.className = 'term-line' + (cls ? ' ' + cls : '');
      d.textContent = t;
      output.appendChild(d);
    });
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
  }

  addLine('StepanOS Terminal v1.0', 'info');
  addLine('введи "help" для списка команд', 'info');
  addLine('');

  // focus input when terminal body clicked
  output.parentElement.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const raw = input.value.trim();
    const cmd = raw.toLowerCase();
    input.value = '';
    addLine('stepanos:~$ ' + raw);
    if (!cmd) return;
    const res = TERM_CMDS[cmd];
    if (res === '__clear__') {
      output.innerHTML = '';
    } else if (typeof res === 'function') {
      addLine(res());
    } else if (res) {
      addLine(res);
    } else {
      addLine('command not found: ' + cmd + '  (try "help")', 'err');
    }
    addLine('');
  });
}

/* ── CONTEXT MENU ── */
function initCtxMenu() {
  const menu = document.getElementById('ctx-menu');
  if (!menu) return;
  document.getElementById('desktop')?.addEventListener('contextmenu', e => {
    if (e.target.closest('.window, #desk-icons, #taskbar, #clippy, #menubar')) return;
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth  - menu.offsetWidth  - 8);
    const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 8);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
    menu.classList.add('visible');
  });
  menu.querySelectorAll('.ctx-item').forEach(it => {
    it.addEventListener('click', () => {
      if (it.dataset.open) {
        openApp(it.dataset.open);
      } else if (it.dataset.action === 'open-all') {
        ['about', 'projects', 'folder', 'contact'].forEach(openApp);
      } else if (it.dataset.action === 'close-all') {
        ['about', 'projects', 'folder', 'contact', 'terminal'].forEach(closeApp);
      }
      menu.classList.remove('visible');
    });
  });
  document.addEventListener('click',  e => { if (!menu.contains(e.target)) menu.classList.remove('visible'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') menu.classList.remove('visible'); });
}

/* ── MENUBAR items ── */
function initMenubar() {
  document.querySelectorAll('.mb-item[data-open]').forEach(item => {
    item.addEventListener('click', () => openApp(item.dataset.open));
  });
}

/* ── BIND ── */
function bind() {
  document.querySelectorAll('.desk-icon').forEach(ic => {
    ic.addEventListener('click', () => {
      const n = ic.dataset.app;
      if (state.open.has(n) && !state.min.has(n)) focusWin(getWin(n));
      else openApp(n);
    });
  });

  document.querySelectorAll('.dot[data-action]').forEach(dot => {
    dot.addEventListener('click', e => {
      e.stopPropagation();
      dot.dataset.action === 'close' ? closeApp(dot.dataset.app) : minApp(dot.dataset.app);
    });
  });

  document.querySelectorAll('.window-titlebar').forEach(initDrag);

  document.querySelectorAll('.window').forEach(win => {
    win.addEventListener('mousedown', () => focusWin(win));
  });

  /* ── MOBILE DOCK ── */
  document.querySelectorAll('.dock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = btn.dataset.app;
      if (state.open.has(n) && !state.min.has(n)) {
        closeApp(n);
      } else {
        openApp(n);
      }
    });
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  bind(); initCursor(); initCtxMenu(); initClippy(); initMenubar();
  initNoteDrag(); initTerminal();
  boot();
});
