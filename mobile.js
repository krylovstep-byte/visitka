(() => {
  const root = document.querySelector('.lowpoly');
  const dock = document.querySelector('.desk-controls');
  const controls = document.createElement('div');
  controls.className = 'phone-controls';
  controls.innerHTML = '<button data-phone="computer" data-camera="computer">▣<span>К компьютеру</span></button><button data-phone="room" data-camera="room">⌂<span>Комната</span></button>';
  dock.append(controls);
  const menu = document.createElement('nav');
  menu.className = 'phone-menu';
  menu.hidden = true;
  menu.setAttribute('aria-label', 'Разделы компьютера');
  menu.innerHTML = [['about','Обо мне'],['projects','Проекты'],['games','Игры'],['contact','Контакты']].map(([route,title]) => `<button data-route="${route}">${title}</button>`).join('');
  root.append(menu);
  const menuButton = controls.querySelector('[data-phone="menu"]');
  function closeMenu() { menu.hidden = true; menuButton?.setAttribute('aria-expanded','false'); }
  controls.addEventListener('click', event => {
    const action = event.target.closest('[data-phone]')?.dataset.phone;
    if(action === 'menu') { menu.hidden = !menu.hidden; menuButton?.setAttribute('aria-expanded',String(!menu.hidden)); return; }
    closeMenu();
    if(action === 'room') window.portalView.exit();
    if(action === 'computer') window.portalView.enter();
  });
  menu.addEventListener('click', event => {
    const route = event.target.closest('[data-route]')?.dataset.route;
    if(route) { closeMenu(); window.workshopNavigate(route); }
  });
  document.addEventListener('keydown',event => { if(event.key === 'Escape') closeMenu(); });
  document.addEventListener('pointerdown',event => { if(!menu.contains(event.target) && !controls.contains(event.target)) closeMenu(); });
  const contactWindow = document.querySelector('#mobile-modal');
  new MutationObserver(() => {
    const mail = contactWindow.querySelector('a[href^="mailto:"]');
    if(!mail || contactWindow.querySelector('.copy-email')) return;
    const copy = document.createElement('button');
    copy.className = 'copy-email';
    copy.textContent = 'Скопировать почту';
    copy.addEventListener('click',async () => {
      try { await navigator.clipboard.writeText(mail.getAttribute('href').slice(7)); copy.textContent = 'Почта скопирована'; }
      catch { copy.textContent = mail.getAttribute('href').slice(7); }
    });
    mail.after(copy);
  }).observe(contactWindow,{childList:true,subtree:true});

  const ideas = document.querySelector('#trash-modal');
  ideas.setAttribute('aria-label','Идеи');
  ideas.querySelector('.tm-body').innerHTML = '<div class="ideas-page"><h2>На полях блокнота</h2><p>Четыре идеи. Пока — на бумаге.</p><ol><li><strong>ИИ для созвонов</strong><p>Чтобы после разговора оставалось не только «ну, договорились».</p></li><li><strong>Умный городской маршрут</strong><p>Доехать — хорошо. По пути найти что-нибудь интересное — ещё лучше.</p></li><li><strong>Архив личных знаний</strong><p>Для всего, что сохранил «на потом» и больше не нашёл.</p></li><li><strong>Знакомства по интересам</strong><p>Начать разговор с общего увлечения.</p></li></ol></div>';
  ideas.querySelector('.gm-tb-left span').textContent = 'Идеи';
  ideas.querySelector('.mw-tb-icon').textContent = '▤';
  ideas.querySelector('#tm-close').setAttribute('aria-label','Закрыть идеи');

  if(matchMedia('(max-width:900px)').matches) {
    let seen = false;
    try { seen = sessionStorage.getItem('room-intro') === '1'; } catch {}
    if(!seen) {
      const intro = document.createElement('button');
      intro.className = 'phone-intro';
      intro.innerHTML = '<strong>Здесь всё можно<br>потрогать.</strong><span>Нажимай на предметы<br>и ярлыки</span>';
      document.body.append(intro);
      const dismiss = () => { intro.remove(); try { sessionStorage.setItem('room-intro','1'); } catch {} };
      intro.addEventListener('click',dismiss,{once:true});
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(dismiss,2000)));
    }
  }
})();
