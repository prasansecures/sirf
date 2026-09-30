/* sirf. One thing at a time. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Smooth scroll (Lenis, if it loaded) ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('skip')) return;
      const hash = a.getAttribute('href');
      const target = hash === '#top' ? 0 : document.querySelector(hash);
      if (target === null) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 0;
      lenis.scrollTo(target, { offset: target === 0 ? 0 : -navH, duration: 1.4 });
      history.pushState(null, '', hash);
    });
  }

  /* ---------- Scroll-linked work, batched into one rAF ---------- */
  const onScrollFns = [];
  let ticking = false;
  const runScroll = () => { ticking = false; onScrollFns.forEach(fn => fn()); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(runScroll); } }, { passive: true });
  addEventListener('resize', runScroll, { passive: true });

  /* ---------- Nav: solid after hero, hide on scroll down ---------- */
  const nav = $('[data-nav]');
  let lastY = scrollY;
  onScrollFns.push(() => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!document.documentElement.classList.contains('menu-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > 400);
    }
    lastY = y;
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', open);
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Reveal on enter ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  /* ---------- Current section in nav ---------- */
  const navLinks = $$('.nav__links a');
  const sectionIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-current', a.hash === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['what', 'fit', 'method'].forEach(id => { const s = document.getElementById(id); if (s) sectionIO.observe(s); });

  /* ---------- Manifesto: words light up as you read ---------- */
  const words = $('[data-words]');
  if (words) {
    const text = words.textContent.trim().replace(/\s+/g, ' ');
    words.setAttribute('aria-label', text);
    words.innerHTML = text.split(' ').map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    const spans = $$('.w', words);
    // mark the "one thing at a time." and "full attention." phrases
    spans.forEach((s, i) => {
      const run = spans.slice(i, i + 5).map(x => x.textContent.toLowerCase()).join(' ');
      if (run === 'one thing at a time.' || run === 'five clients, never a sixth,') spans.slice(i, i + 5).forEach(x => x.classList.add('is-key'));
      if (run.startsWith('full attention.')) spans.slice(i, i + 2).forEach(x => x.classList.add('is-key'));
    });
    const light = () => {
      const r = words.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = reduced ? 1 : clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0, 1);
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('is-lit', i < n));
    };
    onScrollFns.push(light);
    light();
  }

  /* ---------- What we do: only one thing in focus ---------- */
  const list = $('[data-focus-list]');
  if (list) {
    const items = $$('.focus-item', list);
    const activate = item => items.forEach(i => i.classList.toggle('is-active', i === item));
    const hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;

    const pick = () => {
      const r = list.getBoundingClientRect();
      const engaged = r.top < innerHeight * .6 && r.bottom > innerHeight * .4;
      list.classList.toggle('is-engaged', engaged);
      if (!engaged || list.dataset.hovering) return;
      const mid = innerHeight * .5;
      let best = items[0], bestD = Infinity;
      items.forEach(i => {
        const b = i.getBoundingClientRect();
        const d = Math.abs(b.top + Math.min(b.height, 140) / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      activate(best);
    };
    onScrollFns.push(pick);
    pick();

    if (hoverable) {
      items.forEach(i => i.addEventListener('mouseenter', () => { list.dataset.hovering = '1'; activate(i); }));
      list.addEventListener('mouseleave', () => { delete list.dataset.hovering; pick(); });
    }
  }

  /* ---------- Fit check: one persona at a time ---------- */
  const fit = $('[data-fit]');
  if (fit) {
    const lines = $$('[data-fit-list] li', fit);
    const bars = $$('[data-fit-bar] i', fit);
    const cur = $('[data-fit-current]', fit);
    let last = -1;
    const step = () => {
      const r = fit.getBoundingClientRect();
      const span = r.height - innerHeight;
      if (span <= 0) return;
      const p = clamp(-r.top / span, 0, .9999);
      const idx = Math.floor(p * lines.length);
      if (idx === last) return;
      last = idx;
      lines.forEach((l, i) => {
        l.classList.toggle('is-active', i === idx);
        l.classList.toggle('is-before', i < idx);
      });
      bars.forEach((b, i) => { b.classList.toggle('is-active', i === idx); b.classList.toggle('is-done', i < idx); });
      cur.textContent = String(idx + 1).padStart(2, '0');
    };
    onScrollFns.push(step);
    step();
  }

  /* ---------- Contact: compose an email (no backend needed) ---------- */
  const form = $('[data-contact]');
  if (form) {
    const note = $('[data-form-note]', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(f => {
        const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.closest('.field').classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { note.textContent = 'Just the essentials: name, email and a line on what excellent looks like.'; return; }
      const d = new FormData(form);
      const subject = `New project: ${d.get('need')} for ${d.get('brand') || d.get('name')}`;
      const body = [
        `Name: ${d.get('name')}`,
        `Email: ${d.get('email')}`,
        `Brand: ${d.get('brand') || 'Not given'}`,
        `The one thing: ${d.get('need')}`,
        '',
        d.get('message'),
      ].join('\n');
      location.href = `mailto:hello@sirf.website?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      note.textContent = 'Opening your email app. If nothing happens, write to hello@sirf.website.';
    });
    form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('is-invalid'));
  }

  /* ---------- Booking pop-up: peeks open on hover, pins on click ---------- */
  const cal = $('[data-cal]');
  const calTrigger = $('[data-cal-trigger]');
  if (cal && calTrigger) {
    const root = document.documentElement;
    const body = $('[data-cal-body]', cal);
    const openLink = $('[data-cal-open]', calTrigger);
    const backdrop = $('[data-cal-backdrop]');
    let frame = false, isOpen = false, pinned = false, openT = 0, closeT = 0;

    // Load the cal.com inline embed before anyone reaches for it, so the pop-up
    // opens ready. This is cal.com's own embed snippet, run on demand.
    const load = () => {
      if (frame) return;
      frame = true;
      (function (C, A, L) { const p = (a, ar) => { a.q.push(ar); }; const d = C.document; C.Cal = C.Cal || function () { const cal = C.Cal; const ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
      const Cal = window.Cal;
      Cal('init', '30min', { origin: 'https://app.cal.com' });
      Cal.config = Cal.config || {};
      Cal.config.forwardQueryParams = true;
      Cal.ns['30min']('inline', {
        elementOrSelector: '#my-cal-inline-30min',
        config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme: 'dark' },
        calLink: 'prasan-singh/30min',
      });
      Cal.ns['30min']('ui', { theme: 'dark', cssVarsPerTheme: { light: { 'cal-brand': '#1c1c1c' }, dark: { 'cal-brand': '#f4f2ee' } }, hideEventTypeDetails: true, layout: 'month_view' });
      const ready = () => body.classList.add('is-ready');
      // If cal.com can't load (blocked network, strict host), offer a direct link
      // instead of an endless spinner.
      const fail = () => { if (!body.classList.contains('is-ready')) body.classList.add('is-fallback'); };
      Cal.ns['30min']('on', { action: 'linkReady', callback: ready });
      $('script[src="https://app.cal.com/embed/embed.js"]')?.addEventListener('error', fail);
      setTimeout(() => ($('#my-cal-inline-30min iframe') ? ready() : fail()), 12000);
    };
    const nearIO = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { load(); nearIO.disconnect(); }
    }, { rootMargin: '900px 0px' });
    nearIO.observe(calTrigger);

    const open = ({ pin = false, focus = false } = {}) => {
      keep();
      load();
      pinned = pinned || pin;
      root.classList.toggle('cal-pinned', pinned);
      if (!isOpen) {
        // Grow out of the "Let's talk" hue: set the transform origin to its centre.
        const r = calTrigger.getBoundingClientRect();
        const c = cal.getBoundingClientRect();
        cal.style.setProperty('--ox', `${r.left + r.width / 2 - c.left}px`);
        cal.style.setProperty('--oy', `${r.top + r.height / 2 - c.top}px`);
        isOpen = true;
        root.classList.add('cal-open');
        cal.setAttribute('aria-hidden', 'false');
        openLink.setAttribute('aria-expanded', 'true');
        if (lenis) lenis.stop();
      }
      if (focus) setTimeout(() => $('[data-cal-close]', cal).focus({ preventScroll: true }), 50);
    };
    const close = ({ returnFocus = false } = {}) => {
      clearTimeout(openT); keep();
      if (!isOpen) return;
      isOpen = false; pinned = false;
      root.classList.remove('cal-open', 'cal-pinned');
      cal.setAttribute('aria-hidden', 'true');
      openLink.setAttribute('aria-expanded', 'false');
      calTrigger.classList.remove('is-hot');
      if (lenis) lenis.start();
      if (returnFocus) openLink.focus({ preventScroll: true });
    };
    const closeSoon = () => {
      clearTimeout(openT);
      if (!pinned && !closeT) closeT = setTimeout(() => { closeT = 0; close(); }, 420);
    };
    const keep = () => { clearTimeout(closeT); closeT = 0; };
    const within = (el, e) => {
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };

    // Hover (mouse only): a short intent delay so scrolling past doesn't pop it.
    calTrigger.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      calTrigger.classList.add('is-hot');
      keep();
      openT = setTimeout(() => open(), 160);
    });
    calTrigger.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(openT);
      if (!isOpen) calTrigger.classList.remove('is-hot');
    });
    // While peeking, stay open as long as the pointer is over the pop-up or the
    // trigger. Position-based, because moving into the calendar iframe looks like
    // "leaving" to this page.
    document.addEventListener('pointermove', e => {
      if (!isOpen || pinned || e.pointerType !== 'mouse') return;
      if (within(cal, e) || within(calTrigger, e)) keep(); else closeSoon();
    }, { passive: true });

    // Click / tap / keyboard: open and keep it open.
    openLink.addEventListener('click', e => {
      e.preventDefault();
      open({ pin: true, focus: e.detail === 0 });
    });
    // Picking a time inside the calendar moves focus into the iframe: pin it.
    addEventListener('blur', () => {
      if (isOpen && cal.contains(document.activeElement)) { pinned = true; keep(); root.classList.add('cal-pinned'); }
    });

    $('[data-cal-close]', cal).addEventListener('click', () => close({ returnFocus: true }));
    backdrop.addEventListener('click', () => close());
    $('[data-cal-alt]', cal).addEventListener('click', () => close());
    addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) close({ returnFocus: true }); });
  }

  /* ---------- Cursor: the brand dot follows you ---------- */
  const cursor = $('.cursor');
  if (cursor && getComputedStyle(cursor).display !== 'none') {
    let x = -100, y = -100, cx = x, cy = y, raf = 0;
    const loop = () => {
      cx += (x - cx) * .22; cy += (y - cy) * .22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > .1 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      cursor.classList.add('is-on');
      const t = e.target;
      cursor.classList.toggle('is-hover', !!t.closest('a, button, label, input, textarea, .focus-item'));
      cursor.classList.toggle('is-dark', !!t.closest('.manifesto, .fit, .footer, .marquee, .menu'));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  }

  /* ---------- Footer year ---------- */
  const yr = $('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
