/* STEPAN OS v4.0 */
'use strict';

const state = { z: 100, open: new Set(), min: new Set() };

/* ── BOOT ── */
const BOOT = [
  { t: '[ <span class="ok">OK</span> ]  Loading STEPAN OS v4.0…',        d: 0    },
  { t: '[ <span class="ok">OK</span> ]  Workspace initialized…',          d: 300  },
  { t: '[ <span class="ok">OK</span> ]  Profile: Крылов Степан, PM',      d: 580  },
  { t: '[ <span class="ok">OK</span> ]  15+ projects mounted…',           d: 840  },
  { t: '[ <span class="ok">OK</span> ]  Taskin sprint 4 loaded…',         d: 1080 },
  { t: '[ <span class="info">--</span> ]  System ready.',                  d: 1300 },
];

function boot() {
  const log = document.getElementById('boot-log');
  const bar = document.getElementById('boot-bar');
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
  }, last + 800);
}

/* ── CLOCKS ── */
const MON = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DOW = ['вс','пн','вт','ср','чт','пт','сб'];

function startClocks() {
  const tbC = document.getElementById('clock');
  const dcT = document.getElementById('dc-time');
  const dcD = document.getElementById('dc-date');
  function tick() {
    const d  = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    tbC.textContent = hh + ':' + mm;
    if (dcT) dcT.textContent = hh + ':' + mm + ':' + ss;
    if (dcD) dcD.textContent = DOW[d.getDay()] + ' · ' + d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  tick(); setInterval(tick, 1000);
}

/* ── WINDOWS ── */
function getWin(n) { return document.getElementById('window-' + n); }

function focusWin(win) { state.z++; win.style.zIndex = state.z; }

function centerWin(win) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const tbH = 44, pad = 16;
  const ww = win.offsetWidth || 500, wh = win.offsetHeight || 400;
  const avH = vh - tbH - pad * 2;
  win.style.left = Math.max(20, Math.round((vw - ww) / 2)) + 'px';
  win.style.top  = Math.max(10, Math.round((avH - wh) / 2 + pad)) + 'px';
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
    const safe = 44 + 16;
    function onMove(e) {
      win.style.left = Math.max(-win.offsetWidth+80, Math.min(window.innerWidth-80, e.clientX-ox)) + 'px';
      win.style.top  = Math.max(0, Math.min(window.innerHeight-safe-20, e.clientY-oy)) + 'px';
    }
    function onUp() { document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); }
    document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp);
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

/* ── CLIPPY ── */
const CQA = [
  { q:['taskin','таскин','фриланс','биржа'],
    a:'Taskin — фриланс-биржа с канбан-доской и геймификацией.\nЗапуск апрель–май 2026. Рынок: РФ. 🚀' },
  { q:['контакт','написать','связь','telegram','телеграм','почта','email'],
    a:'Telegram: @krygerman\nEmail: directstep@mail.ru\nОтвечает быстро!' },
  { q:['образование','учёба','ранхигс','академия','вуз'],
    a:'РАНХиГС, менеджмент, бюджет, 2024–н.в.\n+ Skillbox, РУДН, Нетология.' },
  { q:['навыки','умения','инструменты','стек','скиллы'],
    a:'Figma, Jira, Notion, Miro\nScrum/Kanban, CustDev, PESTEL\nPython, HTML. Полный PM-стек!' },
  { q:['опыт','работа','стажировка','x5','перекрёсток'],
    a:'X5 Group/Перекрёсток (2025–2026)\nЦПР «Просто будущее» (2024–2025)\n15+ проектов с топовыми компаниями.' },
  { q:['ярославль','москва','откуда','город'],
    a:'Из Ярославля, сейчас в Москве.\n3 языка: EN (C1), DE (B1), IT (A2).' },
  { q:['языки','английский','немецкий'],
    a:'Английский — C1\nНемецкий — B1\nИтальянский — A2\nМногоязычный PM!' },
  { q:['кто','степан','крылов','расскажи'],
    a:'Степан Крылов — PM и предприниматель.\nЯрославль → Москва. 15+ проектов\nв IT, финансах и дизайне.' },
  { q:['проекты','портфолио','кейсы'],
    a:'Taskin, GRAND PRIX\'25, X5 Employer Brand,\nАльфа-Банк, СберИнвестиции, Яндекс.\nОткрой projects.app!' },
  { q:['привет','hi','hello','хей','салют'],
    a:'Привет! Я Скрепкин 📎\nСпроси меня про Степана — знаю всё!' },
];

const CDEF = [
  'Хочешь узнать про Taskin?\nНапиши "Taskin" или нажми кнопку!',
  'Степан говорит на 3 языках.\nСпроси меня — расскажу!',
  'Открой projects.app — там 6 интересных кейсов!',
  'Знаешь, этот сайт написан на\nчистом HTML без фреймворков 💅',
];

/* Рандомные фразы Скрепкина — появляются сами */
const CRAND = [
  'Похоже, ты засмотрелся... 👀\nОткрой taskin.app!',
  'Кстати, Taskin запускается в апреле.\nСледи за обновлениями! 📅',
  'Степан был на финале X5 GRAND PRIX\'25.\nСерьёзный парень 🏆',
  'Этот сайт написан за один вечер\nна чистом HTML. Факт.',
  'Кликни правой кнопкой по рабочему столу —\nесть пасхалка!',
  'Степан управлял командами до 10 человек.\nА ты?',
  'Слышал? Taskin = Kanban + геймификация.\nДовольно нестандартно 🎮',
  'Нужен PM для твоего проекта?\nЗаходи в contact.app! 😉',
];

let clippyTimerLock = false;

function clippyRespond(text) {
  const msg   = document.getElementById('clippy-msg');
  const chips = document.getElementById('clippy-chips');
  if (!msg) return;

  const lower = text.toLowerCase();
  let ans = null;
  for (const qa of CQA) {
    if (qa.q.some(k => lower.includes(k))) { ans = qa.a; break; }
  }
  if (!ans) ans = CDEF[Math.floor(Math.random() * CDEF.length)];

  if (chips) chips.style.display = 'none';
  msg.innerHTML = '';
  let i = 0;
  function type() {
    if (i < ans.length) {
      if (ans[i] === '\n') {
        msg.appendChild(document.createElement('br'));
      } else {
        const last = msg.lastChild;
        if (last && last.nodeType === Node.TEXT_NODE) last.textContent += ans[i];
        else msg.appendChild(document.createTextNode(ans[i]));
      }
      i++; setTimeout(type, 14);
    } else {
      if (chips) chips.style.display = 'flex';
    }
  }
  type();
}

function clippyShowRandom() {
  const bubble = document.getElementById('clippy-bubble');
  const msg    = document.getElementById('clippy-msg');
  const chips  = document.getElementById('clippy-chips');
  if (!bubble || !msg) return;

  const txt = CRAND[Math.floor(Math.random() * CRAND.length)];
  bubble.classList.remove('hidden');
  if (chips) chips.style.display = 'none';
  msg.innerHTML = '';
  let i = 0;
  function type() {
    if (i < txt.length) {
      if (txt[i] === '\n') msg.appendChild(document.createElement('br'));
      else {
        const last = msg.lastChild;
        if (last && last.nodeType === Node.TEXT_NODE) last.textContent += txt[i];
        else msg.appendChild(document.createTextNode(txt[i]));
      }
      i++; setTimeout(type, 14);
    } else {
      if (chips) chips.style.display = 'flex';
    }
  }
  type();
}

function initClippy() {
  const char   = document.getElementById('clippy-char');
  const bubble = document.getElementById('clippy-bubble');
  const close  = document.getElementById('clippy-close');
  const input  = document.getElementById('clippy-input');
  if (!char || !bubble || !input) return;

  char.addEventListener('click', () => {
    bubble.classList.toggle('hidden');
    if (!bubble.classList.contains('hidden')) setTimeout(() => input.focus(), 80);
  });
  close.addEventListener('click', e => { e.stopPropagation(); bubble.classList.add('hidden'); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      clippyRespond(input.value.trim()); input.value = '';
    }
  });
  document.querySelectorAll('.clippy-chip').forEach(ch => {
    ch.addEventListener('click', () => clippyRespond(ch.dataset.q || ch.textContent));
  });

  // Рандомные фразы по таймеру
  function scheduleRandom() {
    const delay = 22000 + Math.random() * 18000; // 22–40 секунд
    setTimeout(() => {
      const bubble = document.getElementById('clippy-bubble');
      if (bubble && bubble.classList.contains('hidden')) {
        clippyShowRandom();
      }
      scheduleRandom();
    }, delay);
  }
  scheduleRandom();
}

/* ── CONTEXT MENU ── */
function initCtxMenu() {
  const menu = document.getElementById('ctx-menu');
  if (!menu) return;
  document.getElementById('desktop')?.addEventListener('contextmenu', e => {
    if (e.target.closest('.window,.desk-icons,#taskbar,#clippy')) return;
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth  - menu.offsetWidth  - 8);
    const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 8);
    menu.style.left = x+'px'; menu.style.top = y+'px';
    menu.classList.add('visible');
  });
  menu.querySelectorAll('.ctx-item[data-action]').forEach(it => {
    it.addEventListener('click', () => {
      if (it.dataset.action === 'open-all')
        ['about','projects','tasks','contact'].forEach(openApp);
      else if (it.dataset.action === 'close-all')
        ['about','projects','tasks','contact'].forEach(closeApp);
      menu.classList.remove('visible');
    });
  });
  document.addEventListener('click',  e => { if (!menu.contains(e.target)) menu.classList.remove('visible'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') menu.classList.remove('visible'); });
}

/* ── BIND ── */
function bind() {
  // Desktop icon clicks
  document.querySelectorAll('.desk-icon').forEach(ic => {
    ic.addEventListener('click', () => {
      const n = ic.dataset.app;
      if (state.open.has(n) && !state.min.has(n)) focusWin(getWin(n));
      else openApp(n);
    });
  });

  // Window control dots
  document.querySelectorAll('.dot[data-action]').forEach(dot => {
    dot.addEventListener('click', e => {
      e.stopPropagation();
      dot.dataset.action === 'close' ? closeApp(dot.dataset.app) : minApp(dot.dataset.app);
    });
  });

  // Drag
  document.querySelectorAll('.window-titlebar').forEach(initDrag);

  // Focus on click
  document.querySelectorAll('.window').forEach(win => {
    win.addEventListener('mousedown', () => focusWin(win));
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  bind(); initCursor(); initCtxMenu(); initClippy(); boot();
});
