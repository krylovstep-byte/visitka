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

const PORTFOLIO_URL = 'https://disk.yandex.ru/d/CUsa3mXcSa4nTg';
const project = (id, name, kicker, description, tags) => ({ id, name, kicker, description, tags, type: 'project' });
const folder = (id, name, description, children) => ({ id, name, description, children, type: 'folder' });

const PORTFOLIO = folder('root', 'projects', 'Выберите папку, чтобы посмотреть проекты.', [
  folder('x5', 'X5 Group · Grand Prix', 'Пять продуктовых и маркетинговых кейсов для бизнес-единиц X5 Group.', [
    project('x5-digital', 'X5 Digital', 'Внутренний бренд работодателя', 'Стратегия повышения узнаваемости X5 Digital внутри группы: события, игровые форматы, цифровые коммуникации и система оценки вовлечённости.', 'Employer Brand · Strategy · Gamification'),
    project('x5-green', 'Зелёная линия', 'Развитие бренда СТМ', 'Исследование рынка и аудитории, новые продуктовые линейки и план расширения ассортимента бренда здорового питания.', 'Research · Product · Retail'),
    project('x5-import', 'X5 Import', 'B2B-стратегия на 2025–2026', 'Стратегия развития импортного направления: ассортимент, ценообразование, маркетплейс, логистика и карта рисков.', 'B2B · Strategy · Logistics'),
    project('x5-paket', 'Сервис «Пакет»', 'Привлечение студенческой аудитории', 'Маркетинговая стратегия для студентов с офлайн-активациями, межвузовской механикой и игровым сценарием.', 'Marketing · Gen Z · Gamification'),
    project('x5-chizhik', 'Чижик', 'Логистика в Красноярском крае', 'Модель складской и транспортной логистики: сеть кросс-доков, сценарии поставок и план развития инфраструктуры.', 'Operations · Logistics · Retail')
  ]),
  folder('yandex', 'Яндекс · серия проектов', 'Четыре этапа продуктовой проработки Алисы и её интеграции в Маркет.', [
    project('yandex-ideas', 'Инициативы для Алисы', 'Пять продуктовых концепций', 'Сценарии развития Алисы: ТВ-компаньон, образовательный ассистент, режим для старшего поколения, магазин расширений и трекер здоровья.', 'Product Discovery · Ecosystem · AI'),
    project('yandex-market', 'Алиса в Маркете', 'Продуктовая концепция', 'Голосовой и текстовый помощник для поиска, сравнения и выбора товаров в Яндекс Маркете на основе проблем пользовательского пути.', 'CJM · Research · Product'),
    project('yandex-architecture', 'Архитектура интеграции', 'Алиса × Яндекс Маркет', 'Схема сервисов и инфраструктуры для быстрой и устойчивой обработки запросов: API Gateway, Kafka, Redis, наблюдаемость и контроль доступа.', 'Architecture · API · Reliability'),
    project('yandex-plan', 'План запуска интеграции', 'Управление проектом', 'План работ по Scrum на десять спринтов: роли, зависимости, критический путь, тестирование, артефакты и релиз.', 'Scrum · Roadmap · Delivery')
  ]),
  folder('alfa', 'Альфа-Банк', 'Два финтех-кейса: мультибанкинг и финал кейс-чемпионата.', [
    project('alfa-cbr', 'Проект с ЦБ РФ', 'Концепция мультибанковской системы', 'Пользовательские сценарии, архитектура и стратегия запуска сервиса, объединяющего финансовые продукты разных банков.', 'Fintech · Product · Roadmap'),
    project('alfa-final', 'Финал кейс-чемпионата 2026', 'Финальный проект Альфа-Банка', 'Комплексная продуктовая концепция, подготовленная для финала кейс-чемпионата Альфа-Банка.', 'Product · Case Championship · Pitch')
  ]),
  folder('hackathons', 'Серия хакатонов по России', 'Научно-управленческие R&D-хакатоны для регионов.', [
    project('hackathons-concept', 'Конструктор хакатонов', 'Наука × бизнес × регионы', 'Адаптируемая модель регионального хакатона: карта стейкхолдеров, механика формирования кейсов, бренд, цифровая платформа и экономика события.', 'Events · R&D · Project Management')
  ]),
  folder('level', 'Level Group', 'Продуктовый проект для девелоперской компании.', [
    project('level-case', 'Проект Level Group', 'Исследование и продуктовая концепция', 'Командный проект с аналитической частью, концепцией решения и презентацией для заказчика.', 'Research · Product · Real Estate')
  ]),
  folder('sber', 'Сбер', 'Развитие приложения «СберИнвестиции» для молодой аудитории.', [
    project('sber-invest', 'СберИнвестиции', 'Привычка инвестировать', 'Концепции для начинающих инвесторов: помощник на базе GigaChat, бонусные механики и игровые сценарии обучения.', 'Fintech · Gamification · Product')
  ]),
  folder('loov', 'LOOV', 'Концепция бренда кастомизируемых очков для азиатского рынка.', [
    project('loov-brand', 'LOOV · Brand Identity', 'Одна оправа — множество образов', 'Позиционирование, аудитория, визуальная система и бизнес-модель очков со сменными шармами.', 'Brand Strategy · Identity · Unit Economics')
  ]),
  folder('certificates', 'Сертификаты и грамоты', 'Обучение, кейс-чемпионаты и подтверждения проектной работы.', [
    project('cert-learning', 'Обучение', 'Курсы и программы', 'Сертификаты по продуктовому и проектному менеджменту, исследованиям и работе с цифровыми инструментами.', 'Education · Product · Management'),
    project('cert-cases', 'Кейс-чемпионаты', 'Финалы и призовые места', 'Грамоты и сертификаты участника, финалиста и призёра проектных соревнований.', 'Awards · Cases · Teamwork')
  ]),
  folder('other', 'Прочее', 'Дополнительные материалы о работе и опыте.', [
    project('other-figma', 'Работа в Figma', 'Пример интерфейсной работы', 'Пример самостоятельной работы с макетами и интерфейсами в Figma.', 'Figma · UI · Prototype'),
    project('other-cv', 'Резюме', 'Опыт и компетенции', 'Краткая версия профессионального опыта, образования, навыков и избранных проектов.', 'CV · Project Management')
  ]),
  { id: 'nda', name: '+3 проекта под NDA', type: 'locked' }
]);

function explorerMarkup() {
  return `
    <h2 class="sec-h"><span class="pe-title" tabindex="-1">/ projects /</span><span class="sec-h-cnt pe-count"></span></h2>
    <div class="pe-toolbar" aria-label="Навигация по проектам">
      <button class="pe-nav pe-back" type="button" aria-label="Назад" title="Назад">◀</button>
      <button class="pe-nav pe-forward" type="button" aria-label="Вперёд" title="Вперёд">▶</button>
      <nav class="pe-path" aria-label="Текущая папка"></nav>
      <a class="pe-disk" href="${PORTFOLIO_URL}" target="_blank" rel="noopener">Яндекс Диск ↗</a>
    </div>
    <div class="pe-intro"></div>
    <div class="pe-grid"></div>
    <div class="pe-preview" aria-live="polite"></div>`;
}

function nodeAt(path) {
  return path.reduce((node, id) => node.children?.find(child => child.id === id), PORTFOLIO);
}

function initProjectExplorer(section) {
  const root = $('.project-explorer-root', section);
  if (!root) return;
  root.innerHTML = explorerMarkup();

  const state = { history: [[]], historyIndex: 0, selected: null };
  const path = () => state.history[state.historyIndex];

  const go = (nextPath) => {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(nextPath);
    state.historyIndex += 1;
    state.selected = null;
    render();
    $('.pe-title', root).focus();
  };

  const renderPreview = (item) => {
    const preview = $('.pe-preview', root);
    if (!item) {
      preview.innerHTML = '<span class="pe-preview-empty">Выберите проект — здесь появится короткое описание.</span>';
      return;
    }
    if (item.type === 'locked') {
      preview.innerHTML = '<div class="pe-preview-head">🔒 Доступ ограничен</div><p>Ещё три проекта существуют, но их содержание защищено NDA.</p>';
      return;
    }
    const casePath = item.id.startsWith('x5-') ? 'x5' : item.id.startsWith('yandex-') ? 'alice' : item.id.startsWith('alfa-') ? 'alfa' : null;
    preview.innerHTML = `<div class="pe-preview-head">${item.name}</div><div class="pe-preview-kicker">${item.kicker}</div><p>${item.description}</p><div class="pe-preview-tags">${item.tags}</div>${casePath ? `<a href="/projects/${casePath}/">Открыть полный разбор</a>` : ''}`;
  };

  const render = () => {
    const current = nodeAt(path());
    const items = current.children || [];
    $('.pe-count', root).textContent = `${items.length} объект${items.length === 1 ? '' : items.length < 5 ? 'а' : 'ов'}`;
    $('.pe-intro', root).textContent = current.description;
    $('.pe-back', root).disabled = state.historyIndex === 0;
    $('.pe-forward', root).disabled = state.historyIndex === state.history.length - 1;

    const crumbs = [{ id: 'root', name: 'projects', crumbPath: [] }];
    path().forEach((id, index) => {
      const crumbPath = path().slice(0, index + 1);
      crumbs.push({ id, name: nodeAt(crumbPath).name, crumbPath });
    });
    $('.pe-path', root).innerHTML = crumbs.map((crumb, index) => {
      const active = index === crumbs.length - 1;
      return `${index ? '<span aria-hidden="true">/</span>' : ''}<button type="button" data-path="${crumb.crumbPath.join('/') }"${active ? ' aria-current="page" disabled' : ''}>${crumb.name}</button>`;
    }).join('');

    $('.pe-grid', root).innerHTML = items.map((item, index) => `
      <button class="pe-entry${item.type === 'locked' ? ' is-locked' : ''}" type="button" data-id="${item.id}" data-type="${item.type}">
        <span class="pe-folder${item.type === 'project' ? ` is-file tone-${index % 5}` : ''}${item.type === 'locked' ? ' has-lock' : ''}" aria-hidden="true">${item.type === 'project' ? '' : '<img class="pe-folder-img" src="projects-icon.png" alt="">'}${item.type === 'locked' ? '<span class="pe-lock">🔒</span>' : ''}</span>
        <span class="pe-entry-name">${item.name}</span>
        <span class="pe-entry-kind">${item.type === 'folder' ? 'папка' : item.type === 'locked' ? 'закрыто' : 'проект'}</span>
      </button>`).join('');
    renderPreview(state.selected);
  };

  on(root, 'click', (event) => {
    const pathButton = event.target.closest('[data-path]');
    if (pathButton) {
      go(pathButton.dataset.path ? pathButton.dataset.path.split('/') : []);
      return;
    }
    if (event.target.closest('.pe-back') && state.historyIndex > 0) {
      state.historyIndex -= 1;
      state.selected = null;
      render();
      $('.pe-title', root).focus();
      return;
    }
    if (event.target.closest('.pe-forward') && state.historyIndex < state.history.length - 1) {
      state.historyIndex += 1;
      state.selected = null;
      render();
      $('.pe-title', root).focus();
      return;
    }
    const entry = event.target.closest('.pe-entry');
    if (!entry) return;
    const item = nodeAt(path()).children.find(child => child.id === entry.dataset.id);
    if (item.type === 'folder') go([...path(), item.id]);
    else {
      state.selected = item;
      $$('.pe-entry', root).forEach(button => button.classList.toggle('is-selected', button === entry));
      renderPreview(item);
    }
  });

  render();
}

/* ═══════════════ COMPACT-VH DETECT ═══════════════
   Telegram WebView (и другие in-app браузеры) рапортуют media-query
   и vh-юнитам полную высоту экрана, игнорируя собственный тулбар.
   window.innerHeight же возвращает РЕАЛЬНУЮ visible-area, поэтому
   используем его для детекта компактных viewport (≤ 750px высоты)
   и навешиваем класс на body — CSS подхватывает компактный layout
   home-сетки иконок (44px вместо 52px). */
function applyCompactVH() {
  const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  document.body.classList.toggle('compact-vh', h < 750);
}
applyCompactVH();
window.addEventListener('resize', applyCompactVH);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', applyCompactVH);
}

/* ═══════════════ BACKGROUND AUDIO — СТАРТУЕТ СРАЗУ ═══════════════
   На мобильных autoplay со звуком запрещён до первого жеста. Поэтому заранее
   грузим файл ОДИН раз и на первом pointer/touch пытаемся включить его снова.
   Повторный audio.load() здесь нельзя вызывать: он обнуляет уже скачанный буфер. */
let audioStarted = false;
let bgAudioSuppressed = false;
let soundEnabled = false;
function clearAudioUnlock() {}
function armAudioUnlock() {}
async function tryPlayBgAudio() {
  if (!soundEnabled || bgAudioSuppressed) return;
  const audio = $('#bg-audio');
  try { audio.volume = 0.35; await audio.play(); audioStarted = true; }
  catch { soundEnabled = false; audioStarted = false; updateSoundButton(); }
}
function updateSoundButton() {
  const button = $('#room-sound');
  button.textContent = soundEnabled ? 'Звук включён' : 'Звук выключен';
  button.setAttribute('aria-pressed', String(soundEnabled));
}
on($('#room-sound'), 'click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) tryPlayBgAudio();
  else { $('#bg-audio').pause(); audioStarted = false; }
  updateSoundButton();
});

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
let mobileProjectSection;
let mobileTrigger;

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

  // Проводник получает отдельное состояние; остальные статичные секции можно клонировать.
  const src = $(`.mw-section[data-sec="${app}"]`);
  body.innerHTML = '';
  if (app === 'projects') {
    if (!mobileProjectSection) {
      mobileProjectSection = document.createElement('section');
      mobileProjectSection.className = 'mw-section project-explorer active';
      mobileProjectSection.innerHTML = '<div class="project-explorer-root"></div>';
      initProjectExplorer(mobileProjectSection);
    }
    body.appendChild(mobileProjectSection);
  } else if (src) {
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

/* ═══════════════ DOOM: локальный js-dos + shareware v1.9 ═══════════════ */
let doomRuntimePromise;
let doomPlayer;
let doomLaunchTask;
let doomSession = 0;
let doomClosingPromise = Promise.resolve();
let doomPreviousOverflow = '';
let doomResumeBgAudio = false;

function loadDoomRuntime() {
  if (window.Dos && window.emulators) return Promise.resolve();
  if (doomRuntimePromise) return doomRuntimePromise;

  doomRuntimePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'vendor/js-dos/js-dos.js?v=7.5.0';
    script.async = true;
    script.dataset.doomRuntime = 'true';
    script.onload = () => {
      if (window.Dos && window.emulators) resolve();
      else reject(new Error('js-dos runtime is unavailable'));
    };
    script.onerror = () => reject(new Error('js-dos runtime failed to load'));
    document.head.appendChild(script);
  }).catch((error) => {
    doomRuntimePromise = undefined;
    throw error;
  });

  return doomRuntimePromise;
}

function launchDoom() {
  if (doomLaunchTask) {
    // Если пользователь уже закрыл загружающийся Doom и сразу нажал снова,
    // повторный запуск начнётся автоматически после полной уборки старого.
    if ($('#doom-modal')?.classList.contains('hidden')) {
      return doomLaunchTask.finally(() => launchDoom());
    }
    return doomLaunchTask;
  }

  const task = launchDoomImpl();
  let trackedTask;
  trackedTask = task.finally(() => {
    if (doomLaunchTask === trackedTask) doomLaunchTask = undefined;
  });
  doomLaunchTask = trackedTask;
  return trackedTask;
}

async function launchDoomImpl() {
  const modal = $('#doom-modal');
  const root = $('#doom-player');
  const loading = $('#doom-loading');
  if (!modal || !root || !loading) return;

  // Не создаём новый canvas, пока старый worker и его DOM полностью не остановлены.
  await doomClosingPromise;
  if (doomPlayer || !modal.classList.contains('hidden')) return;

  const session = ++doomSession;
  let instance;
  const bgAudio = $('#bg-audio');
  bgAudioSuppressed = true;
  clearAudioUnlock();
  doomResumeBgAudio = Boolean(bgAudio && (!bgAudio.paused || audioStarted));
  bgAudio?.pause();
  doomPreviousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  $('#doom-close')?.focus();
  loading.textContent = 'Загрузка DOOM...';
  loading.classList.remove('hidden');

  try {
    await loadDoomRuntime();
    if (session !== doomSession) return;

    window.emulators.pathPrefix = 'vendor/js-dos/';
    // js-dos по умолчанию показывает длинный onboarding поверх первого запуска.
    // Для этой визитки управление уже подписано под окном, поэтому сразу открываем игру.
    window.emulatorsUi.dom.storage.setItem('ui.tipsV2', 'false');
    window.emulatorsUi.dom.storage.setItem('ui.autolockTipsV2', 'false');
    instance = window.Dos(root, {
      clickToStart: false,
      scaleControls: 1,
      noSideBar: true,
      noSocialLinks: true,
      withNetworkingApi: false,
      preventUnload: false
    });
    doomPlayer = instance;
    await instance.run('games/doom-shareware.jsdos?v=2');
    if (isMobile()) await instance.enableMobileControls();

    // При закрытии cleanup уже принадлежит closeDoom(); второй stop опасен для worker API.
    if (session !== doomSession) return;
    loading.classList.add('hidden');
  } catch (error) {
    // Старый запуск мог завершиться уже после закрытия/нового запроса.
    // В таком случае он не имеет права трогать актуальный player и интерфейс.
    if (session !== doomSession) return;
    console.error('DOOM launch failed:', error);
    if (doomPlayer === instance) doomPlayer = undefined;
    if (instance) {
      try { await instance.stop(); }
      catch (stopError) { console.warn('Failed DOOM cleanup:', stopError); }
    }
    root.replaceChildren();
    loading.textContent = 'Не удалось запустить DOOM. Закрой окно и попробуй ещё раз.';
  }
}

function closeDoom() {
  const modal = $('#doom-modal');
  const root = $('#doom-player');
  if (modal?.classList.contains('hidden') && !doomPlayer) return doomClosingPromise;

  const instance = doomPlayer;
  const activeLaunchTask = doomLaunchTask;
  const closingSession = ++doomSession;
  const shouldResumeBgAudio = doomResumeBgAudio;
  doomPlayer = undefined;
  doomResumeBgAudio = false;

  modal?.classList.add('hidden');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = doomPreviousOverflow;
  $('#doom-launch')?.focus();

  doomClosingPromise = doomClosingPromise.catch(() => {}).then(async () => {
    if (instance) {
      try { await instance.stop(); }
      catch (error) { console.warn('DOOM stop failed:', error); }
    }
    if (activeLaunchTask) {
      try { await activeLaunchTask; }
      catch {}
    }
    if (closingSession !== doomSession) return;
    if (root) root.replaceChildren();
    bgAudioSuppressed = false;
    if (shouldResumeBgAudio) {
      tryPlayBgAudio(true);
    } else if (!audioStarted) {
      armAudioUnlock();
    }
  });

  return doomClosingPromise;
}

/* ═══════════════ MODALS ═══════════════ */
function modals() {
  on($('#gm-close'), 'click', () => $('#games-modal')?.classList.add('hidden'));
  on($('#doom-launch'), 'click', () => launchDoom());
  on($('#doom-close'), 'click', () => closeDoom());
  on($('#tm-close'), 'click', () => $('#trash-modal')?.classList.add('hidden'));
  on($('#mm-close'), 'click', () => closeMobileModal());

  // ESC closes everything
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#doom-modal')?.classList.contains('hidden')) {
        closeDoom();
        return;
      }
      $('#games-modal')?.classList.add('hidden');
      $('#trash-modal')?.classList.add('hidden');
      closeMobileModal();
    }
  });
  // Backdrop click closes
  on($('#games-modal'), 'click', (e) => { if (e.target.id === 'games-modal') e.target.classList.add('hidden'); });
  on($('#doom-modal'), 'click', (e) => { if (e.target.id === 'doom-modal') closeDoom(); });
  on($('#trash-modal'), 'click', (e) => { if (e.target.id === 'trash-modal') e.target.classList.add('hidden'); });
  on($('#mobile-modal'), 'click', (e) => { if (e.target.id === 'mobile-modal') closeMobileModal(); });
}

/* ═══════════════ POKE WINDOW — шутка при клике по сцене ═══════════════
   Клик мимо «компуктера» (по столу, фону, чёрным полям) → маленькое
   Win95-окошко с случайной фразой в точке клика. Само тает через 4с. */
const POKES = [
  'Это стол. По нему можно только стучать.',
  'Клик мимо. Но я ценю настойчивость.',
  'Здесь ничего нет. Честно, я проверял.',
  'Не трогай монитор — он старенький, нервный.',
  'Ошибка 404: смысл клика не найден.',
  'Пыль успешно потревожена.',
  'Это пиксели. Им приятно, кстати.',
  'Системе нравится твой энтузиазм.',
  'Тут могла быть ваша реклама. Но нет.',
  'Анжуманя. Потом пресс качат.',
  'Кофе в кружке остыл ещё вчера.',
  'Загрузка смысла... 99%... зависло.',
  'Стол несёт декоративную функцию.',
  'А мог бы уже написать в телегу.',
  'Win95 не виноват. Это ты кликнул.'
];

function pokeWindow() {
  const win = $('#poke-win');
  const txt = $('#pw-text');
  if (!win || !txt) return;

  let hideTimer;
  let lastIdx = -1;
  const close = () => { win.classList.add('hidden'); clearTimeout(hideTimer); };

  // Клик в любое место окошка закрывает его (крестик — для красоты, но тоже работает)
  on(win, 'click', (e) => { e.stopPropagation(); close(); });

  on(document, 'click', (e) => {
    // composedPath сохраняет исходных родителей даже когда клик перерисовал папку до всплытия события.
    const blockedClick = e.composedPath().some(node => node instanceof Element && node.matches(
      '#monitor-win, .mw-icon, #mobile-modal, #games-modal, #doom-modal, #trash-modal, #poke-win, #frame-titlebar, #rotate-overlay, #boot'
    ));
    if (blockedClick) return;

    // Случайная фраза без повтора подряд
    let i;
    do { i = Math.floor(Math.random() * POKES.length); } while (i === lastIdx && POKES.length > 1);
    lastIdx = i;
    txt.textContent = POKES[i];

    // Показ с гарантированным перезапуском анимации появления
    win.classList.add('hidden');
    void win.offsetWidth;
    win.classList.remove('hidden');

    // Позиция у точки клика, с клампом в границы вьюпорта
    const r = win.getBoundingClientRect();
    let x = e.clientX + 6, y = e.clientY + 8;
    if (x + r.width  > innerWidth  - 8) x = innerWidth  - r.width  - 8;
    if (y + r.height > innerHeight - 8) y = innerHeight - r.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
    win.style.left = x + 'px';
    win.style.top  = y + 'px';

    clearTimeout(hideTimer);
    hideTimer = setTimeout(close, 4000);
  });
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

  initProjectExplorer($('.project-explorer[data-explorer="desktop"]'));
  const goto = monitorTabs();
  desktopIcons(goto);
  modals();
  pokeWindow();
  initTTT();
  initSnake();

  tickClock(); setInterval(tickClock, 1000);
});

})();

// Keep keyboard focus inside the currently open game or mobile window.
document.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const dialogs = ['doom-modal', 'games-modal', 'trash-modal', 'mobile-modal'];
  const modal = dialogs.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
  if (!modal) return;
  const items = [...modal.querySelectorAll('button:not([disabled]),a[href],input,[tabindex="0"]')].filter(el => el.getClientRects().length);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (!modal.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
  else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
