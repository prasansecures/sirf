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
      if (!a || e.defaultPrevented || a.classList.contains('skip')) return;
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

  /* ---------- Booking pop-up: glass panel with cal.com inside, on the page ---------- */
  const cal = $('[data-cal]');
  const calTrigger = $('[data-cal-trigger]');
  if (cal && calTrigger) {
    const root = document.documentElement;
    const body = $('[data-cal-body]', cal);
    const openLink = $('[data-cal-open]', calTrigger);
    const backdrop = $('[data-cal-backdrop]');
    let frame = null, slowT = 0, isOpen = false, pinned = false, openT = 0, closeT = 0;

    // Load the booking page into the panel before anyone reaches for it, so it
    // opens ready. Plain iframe: no third-party script on this page.
    const load = () => {
      if (frame) return;
      body.classList.remove('is-slow', 'is-ready');
      frame = document.createElement('iframe');
      frame.title = 'Book a call with sirf.';
      frame.src = cal.dataset.calSrc;
      frame.allow = 'payment';
      frame.addEventListener('load', () => { clearTimeout(slowT); body.classList.add('is-ready'); }, { once: true });
      body.appendChild(frame);
      slowT = setTimeout(() => body.classList.add('is-slow'), 15000);
    };
    $('[data-cal-retry]', cal).addEventListener('click', () => { frame?.remove(); frame = null; load(); });
    const nearIO = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { load(); nearIO.disconnect(); }
    }, { rootMargin: '900px 0px' });
    nearIO.observe(calTrigger);

    const keep = () => { clearTimeout(closeT); closeT = 0; };
    const within = (el, e) => {
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    const pin = () => { pinned = true; keep(); root.classList.add('cal-pinned'); };

    const open = ({ pinIt = false, focus = false } = {}) => {
      keep();
      load();
      if (pinIt) pin();
      if (isOpen) return;
      // Grow out of the "Let's talk" glow: transform origin = its centre.
      const r = calTrigger.getBoundingClientRect();
      const c = cal.getBoundingClientRect();
      cal.style.setProperty('--ox', `${r.left + r.width / 2 - c.left}px`);
      cal.style.setProperty('--oy', `${r.top + r.height / 2 - c.top}px`);
      isOpen = true;
      root.classList.add('cal-open');
      cal.setAttribute('aria-hidden', 'false');
      openLink.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
      if (focus) setTimeout(() => $('[data-cal-close]', cal).focus({ preventScroll: true }), 60);
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
      if (!pinned && !closeT) closeT = setTimeout(() => { closeT = 0; close(); }, 450);
    };

    // Hover (mouse): peek open after a short intent delay.
    calTrigger.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      calTrigger.classList.add('is-hot');
      keep();
      openT = setTimeout(() => open(), 180);
    });
    calTrigger.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse') return;
      clearTimeout(openT);
      if (!isOpen) calTrigger.classList.remove('is-hot');
    });
    // While peeking, stay open while the pointer is over the panel or the trigger
    // (position-based: moving into the calendar iframe looks like "leaving").
    document.addEventListener('pointermove', e => {
      if (!isOpen || pinned || e.pointerType !== 'mouse') return;
      if (within(cal, e) || within(calTrigger, e)) keep(); else closeSoon();
    }, { passive: true });

    // Click / tap / keyboard: open and keep it open. Never leaves the page.
    openLink.addEventListener('click', e => {
      e.preventDefault();
      open({ pinIt: true, focus: e.detail === 0 });
    });
    // Picking a date moves focus into the calendar iframe: keep it open.
    addEventListener('blur', () => { if (isOpen && document.activeElement === frame) pin(); });

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
