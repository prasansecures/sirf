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
