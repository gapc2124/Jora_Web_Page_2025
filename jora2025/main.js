/* =========================
   Helpers
   ========================= */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* =========================
   Header: estado "scrolled"
   ========================= */
(function headerScroll() {
  const header = $('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* =========================
   Menú móvil (hamburguesa) — overlay centrado
   ========================= */
(function mobileMenu() {
  const btn = $('.menu-toggle');
  const nav = $('.primary-nav');
  if (!btn || !nav) return;

  // Guardamos el elemento que tenía el foco antes de abrir
  let lastFocus = null;

  const focusFirstLink = () => {
    const first = $('.primary-nav a');
    if (first) first.focus();
  };

  const open = () => {
    lastFocus = document.activeElement;
    document.body.classList.add('menu-open');
    nav.classList.add('active');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú');
    // En overlay centrado, enfoca el primer enlace
    setTimeout(focusFirstLink, 0);
  };

  const close = () => {
    document.body.classList.remove('menu-open');
    nav.classList.remove('active');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    // Devuelve el foco al botón hamburguesa (accesibilidad)
    if (lastFocus) btn.focus();
  };

  const toggle = () => (document.body.classList.contains('menu-open') ? close() : open());

  // Botón hamburguesa
  btn.addEventListener('click', toggle);

  // Cerrar al hacer clic en cualquier enlace del nav
  $$('.primary-nav a').forEach(a => a.addEventListener('click', close));

  // Cerrar con Escape
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Cerrar al hacer clic en el fondo oscuro (pero NO dentro del <ul>)
  nav.addEventListener('click', (e) => {
    // si haces click exactamente en el overlay (nav) y no en su contenido
    if (e.target === nav) close();
  });

  // Si cambias a escritorio, asegura que el overlay se cierre
  const mq = window.matchMedia('(min-width: 901px)');
  const onChange = () => { if (mq.matches) close(); };
  mq.addEventListener ? mq.addEventListener('change', onChange) : mq.addListener(onChange);
})();

/* =========================
   Carrusel (slides + dots + autoplay)
   ========================= */
(function carousel() {
  const root = $('.carousel');
  if (!root) return;

  const slides  = $$('.slides .slide', root);
  const prevBtn = $('.prev', root);
  const nextBtn = $('.next', root);
  const dotsWrap = $('.slider-dots', root);

  if (!slides.length || !dotsWrap) return;

  // 1) Usa dots existentes si están en el HTML; si no, créalos
  let dots = $$('.dot', dotsWrap);
  if (!dots.length) {
    const frag = document.createDocumentFragment();
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'dot';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Ir al slide ${i + 1}`);
      frag.appendChild(b);
    });
    dotsWrap.appendChild(frag);
    dots = $$('.dot', dotsWrap);
  }

  let i = slides.findIndex(s => s.classList.contains('active'));
  if (i < 0) i = 0;
  let autoplay = null;
  const AUTOPLAY_MS = 5000;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(idx) {
    i = (idx + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    if (dots.length) {
      dots.forEach((d, k) => {
        d.classList.toggle('active', k === i);
        d.setAttribute('aria-selected', k === i ? 'true' : 'false');
        d.tabIndex = k === i ? 0 : -1;
      });
    }
  }

  function next() { show(i + 1); }
  function prev() { show(i - 1); }

  // Eventos
  nextBtn && nextBtn.addEventListener('click', next);
  prevBtn && prevBtn.addEventListener('click', prev);
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));

  // Teclado
  root.tabIndex = 0;
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

  // Autoplay con pausa en hover/focus
  const startAuto = () => {
    if (reduceMotion || AUTOPLAY_MS <= 0) return;
    if (!autoplay) autoplay = setInterval(next, AUTOPLAY_MS);
  };
  const stopAuto = () => { if (autoplay) { clearInterval(autoplay); autoplay = null; } };

  root.addEventListener('mouseenter', stopAuto);
  root.addEventListener('mouseleave', startAuto);
  root.addEventListener('focusin', stopAuto);
  root.addEventListener('focusout', startAuto);

  // Init
  show(i);
  startAuto();
})();

/* =========================================================
   PLATOS BANDERA — highlight 2×2 (hl-1..hl-4)
   ========================================================= */
(function platosBandera() {
  // El HTML actual que compartiste no incluye el bloque 2×2;
  // este controlador queda listo para cuando lo actives.
  const grid = document.querySelector('.platos-fotos');
  const optionsWrap = document.querySelector('.platos-opciones');
  const options = optionsWrap ? Array.from(optionsWrap.querySelectorAll('a')) : [];

  if (!grid || !options.length) return;

  let locked = null; // 1..4 si está fijado por click; null = hover-only

  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;
  const clearHL = () => grid.classList.remove('hl-1','hl-2','hl-3','hl-4');
  const setHL = (n) => { clearHL(); grid.classList.add(`hl-${n}`); };

  // Hover/focus en cada opción
  options.forEach(a => {
    const target = parseInt(a.dataset.target, 10);
    if (!target || target < 1 || target > 4) return;

    const onEnter = () => {
      if (!isDesktop()) return;
      if (locked === null) setHL(target);
    };
    const onLeave = () => {
      if (!isDesktop()) return;
      if (locked === null) clearHL();
    };

    a.addEventListener('mouseenter', onEnter);
    a.addEventListener('focus', onEnter);
    a.addEventListener('mouseleave', onLeave);
    a.addEventListener('blur', onLeave);

    // Click fija/defija
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isDesktop()) return;
      if (locked === target) {
        locked = null;
        clearHL();
      } else {
        locked = target;
        setHL(target);
      }
    });
  });

  // Si el mouse sale del contenedor de opciones, limpiar si no hay lock
  if (optionsWrap) {
    optionsWrap.addEventListener('mouseleave', () => {
      if (!isDesktop()) return;
      if (locked === null) clearHL();
    });

    // Si el foco sale por completo del contenedor, limpiar si no hay lock
    optionsWrap.addEventListener('focusout', (e) => {
      if (!isDesktop()) return;
      // ¿El nuevo foco está fuera del contenedor?
      if (!optionsWrap.contains(e.relatedTarget) && locked === null) {
        clearHL();
      }
    });
  }

  // En resize hacia móvil: limpiar y soltar el lock
  const onResize = () => {
    if (!isDesktop()) { locked = null; clearHL(); }
  };
  window.addEventListener('resize', onResize);
  onResize();
})();

/* =========================
   REVISADO: Transición de Fondo al Hacer Scroll (Eventos)
   ========================= */
(function backgroundFadeOnScroll(){
  const blocks = $$('.ev-block');
  // CAMBIO CLAVE: Selecciona .ev-intro en lugar de .ev-intro-heading-group
  const headerGroup = $('.ev-intro'); 
  const elementsToObserve = headerGroup ? [...blocks, headerGroup] : blocks; 

  if (!elementsToObserve.length) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('bg-visible'); 
        io.unobserve(e.target); 
      }
    });
  }, { threshold: 0.15 });

  elementsToObserve.forEach(el => {
     io.observe(el);
  });

})();