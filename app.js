/* ═══════════════════════════════════════════════════════════════════
   STEPAN OS v5.2 — JS logic (full-viewport scene, overlay icons)
═══════════════════════════════════════════════════════════════════ */

(() => {
'use strict';

/* ── Utilities ── */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
const pad = (n) => String(n).padStart(2, '0');

/* ═══════════════ BACKGROUND AUDIO — СТАРТУЕТ СРАЗУ ═══════════════
   Вызываем на этапе парсинга скрипта (скрипт в конце body,
   значит <audio> уже в DOM). Не ждём DOMContentLoaded — это экономит ~50-200мс. */
let audioStarted = false;
function startBgAudio() {
  const audio = $('#bg-audio');
  if (!audio || audioStarted) return;
  audio.volume = 0.6;
  // Форсируем скачивание буфера — preload="auto" в HTML тоже помогает,
  // но load() явно запускает/пере-запускает загрузку
  try { audio.load(); } catch {}

  const markStarted = () => { audioStarted = true; };
  const unlock = () => {
    if (audioStarted) return;
    audio.play().then(markStarted).catch(() => {});
  };

  audio.play()
    .then(markStarted)
    .catch(() => {
      // Автоплей заблокирован (iOS Safari, Chrome без interaction) —
      // ловим первый же user gesture и стартуем
      document.addEventListener('pointerdown', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
      document.addEventListener('click', unlock, { once: true });
    });
}
// ВЫЗЫВАЕМ СРАЗУ — не ждём DOMContentLoaded
startBgAudio();

/* ═══════════════ BOOT SEQUENCE (Windows84 mp4, ~3 sec) ═══════════════
   Тайминг: 0 → fade-in (300мс из CSS) → 2750мс .fading (плавное затемнение видео 250мс)
           → 3000мс .hidden (весь #boot уходит за 400мс) */
const BOOT_TOTAL   = 3000;  // общая длительность экрана загрузки
const BOOT_FADE    = 250;   // длительность затемнения в конце

function boot() {
  const bootEl = $('#boot');
  if (!bootEl) return;

  // Заставляем видео стартовать (на iOS Safari autoplay работает при muted+playsinline,
  // но иногда нужно явно .play() чтобы не ждать paint-тайминга).
  const vid = $('#boot-media');
  if (vid) {
    try { vid.play().catch(() => {}); } catch {}
  }

  // Звук — на всякий случай повторяем startBgAudio (idempotent через audioStarted флаг)
  startBgAudio();

  // За 250мс до конца — плавное затемнение картинки в чёрный
  setTimeout(() => bootEl.classList.add('fading'), BOOT_TOTAL - BOOT_FADE);
  // В конце — скрываем весь boot (fade opacity из CSS = .4s)
  setTimeout(() => bootEl.classList.add('hidden'), BOOT_TOTAL);

  // Клик по boot — пропуск (также разблокирует звук)
  on(bootEl, 'click', () => {
    bootEl.classList.add('hidden');
    startBgAudio();
  });
}

/* ═══════════════ MONITOR WINDOW TABS ═══════════════ */
function monitorTabs() {
  const tabs = $$('.mw-tab');
  const secs = $$('.mw-section');
  const body = $('.mw-body');

  const goto = (name) => {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    secs.forEach(s => s.classList.toggle('active', s.dataset.sec === name));
    if (body) body.scrollTop = 0;
  };

  tabs.forEach(t => on(t, 'click', () => goto(t.dataset.tab)));

  // Buttons / links inside sections jumping to tabs
  $$('[data-goto]').forEach(el => on(el, 'click', (e) => {
    e.preventDefault();
    goto(el.dataset.goto);
  }));

  // External links
  $$('[data-ext]').forEach(el => on(el, 'click', () => {
    window.open(el.dataset.ext, '_blank', 'noopener');
  }));

  return goto;
}

/* ═══════════════ DESKTOP ICONS (inside monitor /home/) ═══════════════ */
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

function desktopIcons(gotoTab) {
  const icons = $$('.mw-icon');

  icons.forEach(ic => {
    // Single click = open (with short highlight flash)
    on(ic, 'click', (e) => {
      ic.classList.add('active');
      setTimeout(() => ic.classList.remove('active'), 180);
      openApp(ic.dataset.app, gotoTab);
      e.stopPropagation();
    });
  });
}

function openApp(app, gotoTab) {
  switch (app) {
    case 'about':
    case 'projects':
    case 'contact':
      if (isMobile()) openMobileModal(app);
      else gotoTab(app);
      break;
    case 'telegram': window.open('https://t.me/krygerman', '_blank', 'noopener'); break;
    case 'games':    $('#games-modal')?.classList.remove('hidden'); break;
    case 'trash':    $('#trash-modal')?.classList.remove('hidden'); break;
  }
}

/* ═══════════════ MOBILE FULLSCREEN MODAL (variant B) ═══════════════ */
function openMobileModal(app) {
  const modal = $('#mobile-modal');
  const body  = $('#mm-body');
  const title = $('#mm-title');
  if (!modal || !body || !title) return;

  const titles = {
    about:    'О себе — СтепанКрылов.exe',
    projects: 'Проекты — СтепанКрылов.exe',
    contact:  'Контакты — СтепанКрылов.exe'
  };
  title.textContent = titles[app] || 'Окно';

  // Клонируем нужную секцию, делаем active, вставляем в модалку
  const src = $(`.mw-section[data-sec="${app}"]`);
  body.innerHTML = '';
  if (src) {
    const clone = src.cloneNode(true);
    clone.classList.add('active');
    body.appendChild(clone);
  }

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  body.scrollTop = 0;
}

function closeMobileModal() {
  const modal = $('#mobile-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ═══════════════ MODALS ═══════════════ */
function modals() {
  on($('#gm-close'), 'click', () => $('#games-modal')?.classList.add('hidden'));
  on($('#tm-close'), 'click', () => $('#trash-modal')?.classList.add('hidden'));
  on($('#mm-close'), 'click', () => closeMobileModal());

  // ESC closes everything
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      $('#games-modal')?.classList.add('hidden');
      $('#trash-modal')?.classList.add('hidden');
      closeMobileModal();
    }
  });
  // Backdrop click closes
  on($('#games-modal'), 'click', (e) => { if (e.target.id === 'games-modal') e.target.classList.add('hidden'); });
  on($('#trash-modal'), 'click', (e) => { if (e.target.id === 'trash-modal') e.target.classList.add('hidden'); });
  on($('#mobile-modal'), 'click', (e) => { if (e.target.id === 'mobile-modal') closeMobileModal(); });
}

/* ═══════════════ CLOCK (МСК) ═══════════════ */

// Moscow-time formatter (always MSK regardless of user's local timezone)
const MSK_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Moscow',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

function tickClock() {
  // Frame titlebar clock — Moscow time
  const mskNow = MSK_FMT.format(new Date());  // "HH:MM"
  const tbc = $('#tb-clock'); if (tbc) tbc.textContent = mskNow;
}

/* ═══════════════ GAMES: TIC-TAC-TOE ═══════════════ */
function initTTT() {
  const grid = $('#ttt-grid');
  const status = $('#ttt-status');
  const resetBtn = $('#ttt-reset');
  if (!grid || !status || !resetBtn) return;

  const cells = Array(9).fill(null);
  let active = true;
  const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  const render = () => {
    $$('.ttt-cell', grid).forEach((c, i) => {
      c.textContent = cells[i] || '';
      c.className = 'ttt-cell' + (cells[i]==='X' ? ' x' : cells[i]==='O' ? ' o' : '');
    });
  };
  const won = (p) => WINS.some(([a,b,c]) => cells[a]===p && cells[b]===p && cells[c]===p);
  const ai = () => {
    for (let i=0;i<9;i++) if (!cells[i]) { cells[i]='O'; if (won('O')) return; cells[i]=null; }
    for (let i=0;i<9;i++) if (!cells[i]) { cells[i]='X'; if (won('X')) { cells[i]='O'; return; } cells[i]=null; }
    if (!cells[4]) { cells[4]='O'; return; }
    const free = cells.map((v,i)=> v?null:i).filter(v=> v!==null);
    if (free.length) cells[free[Math.floor(Math.random()*free.length)]] = 'O';
  };

  on(grid, 'click', (e) => {
    const cell = e.target.closest('.ttt-cell');
    if (!cell || !active) return;
    const i = +cell.dataset.i;
    if (cells[i]) return;
    cells[i] = 'X'; render();
    if (won('X')) { status.textContent = '✓ Ты выиграл!'; active=false; return; }
    if (cells.every(Boolean)) { status.textContent = '[ ничья ]'; active=false; return; }
    status.textContent = 'Думаю...';
    setTimeout(() => {
      ai(); render();
      if (won('O'))   { status.textContent = '× Ты проиграл!'; active=false; return; }
      if (cells.every(Boolean)) { status.textContent = '[ ничья ]'; active=false; return; }
      status.textContent = 'Твой ход (X)';
    }, 260);
  });

  on(resetBtn, 'click', () => {
    for (let i=0;i<9;i++) cells[i]=null;
    active = true;
    status.textContent = 'Твой ход (X)';
    render();
  });
}

/* ═══════════════ GAMES: SNAKE ═══════════════ */
function initSnake() {
  const canvas = $('#snake-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const S = 10;
  const COLS = W/S, ROWS = H/S;

  let snake, dir, nextDir, food, score, best, loop, running;

  best = +(localStorage.getItem('snake-best') || 0);
  const bestEl = $('#snake-best'); if (bestEl) bestEl.textContent = best;

  const reset = () => {
    snake = [{x:5, y:10}, {x:4, y:10}, {x:3, y:10}];
    dir = {x:1, y:0}; nextDir = dir;
    placeFood();
    score = 0;
    const s = $('#snake-score'); if (s) s.textContent = 0;
  };

  const placeFood = () => {
    do {
      food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
    } while (snake.some(s => s.x===food.x && s.y===food.y));
  };

  const tick = () => {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
        snake.some(s => s.x===head.x && s.y===head.y)) {
      running = false; clearInterval(loop);
      if (score > best) {
        best = score;
        localStorage.setItem('snake-best', best);
        const b = $('#snake-best'); if (b) b.textContent = best;
      }
      const sb = $('#snake-start'); if (sb) sb.textContent = '[ старт ]';
      draw(true);
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      const s = $('#snake-score'); if (s) s.textContent = score;
      placeFood();
    } else snake.pop();
    draw();
  };

  const draw = (dead=false) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(food.x*S+1, food.y*S+1, S-2, S-2);
    snake.forEach((s, i) => {
      ctx.fillStyle = i===0 ? '#00ff41' : '#00a030';
      ctx.fillRect(s.x*S+1, s.y*S+1, S-2, S-2);
    });
    if (dead) {
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#ff3333'; ctx.font = '18px VT323, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('× game over ×', W/2, H/2 - 6);
      ctx.fillStyle = '#fff'; ctx.font = '14px VT323, monospace';
      ctx.fillText('счёт: ' + score, W/2, H/2 + 14);
    }
  };

  const start = () => {
    reset(); running = true;
    const sb = $('#snake-start'); if (sb) sb.textContent = '[ рестарт ]';
    clearInterval(loop);
    loop = setInterval(tick, 110);
    draw();
  };

  on($('#snake-start'), 'click', start);

  on(document, 'keydown', (e) => {
    if (!running) return;
    const k = e.key;
    if ((k==='ArrowUp'||k==='w') && dir.y !== 1) nextDir = {x:0, y:-1};
    else if ((k==='ArrowDown'||k==='s') && dir.y !== -1) nextDir = {x:0, y:1};
    else if ((k==='ArrowLeft'||k==='a') && dir.x !== 1) nextDir = {x:-1, y:0};
    else if ((k==='ArrowRight'||k==='d') && dir.x !== -1) nextDir = {x:1, y:0};
  });

  $$('.dpad').forEach(b => on(b, 'click', () => {
    if (!running) return;
    const d = b.dataset.dir;
    if (d==='up'    && dir.y !== 1)  nextDir = {x:0, y:-1};
    if (d==='down'  && dir.y !== -1) nextDir = {x:0, y:1};
    if (d==='left'  && dir.x !== 1)  nextDir = {x:-1, y:0};
    if (d==='right' && dir.x !== -1) nextDir = {x:1, y:0};
  }));

  // Initial idle screen
  snake = [{x:5, y:10}, {x:4, y:10}, {x:3, y:10}]; food = {x:15, y:10};
  draw();
  ctx.fillStyle = '#fff'; ctx.font = '14px VT323, monospace'; ctx.textAlign = 'center';
  ctx.fillText('нажми [ старт ]', W/2, H/2);
}

/* ═══════════════ INIT ═══════════════ */
document.addEventListener('DOMContentLoaded', () => {
  boot();
  const goto = monitorTabs();
  desktopIcons(goto);
  modals();
  initTTT();
  initSnake();

  tickClock(); setInterval(tickClock, 1000);
});

})();
