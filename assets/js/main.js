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

  /* ---------- Fit check: one persona at a time, moving with the scroll ---------- */
  const fit = $('[data-fit]');
  if (fit) {
    const lines = $$('[data-fit-list] li', fit);
    const bars = $$('[data-fit-bar] i', fit);
    const cur = $('[data-fit-current]', fit);
    const n = lines.length;
    const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    let lastIdx = -1;
    const step = () => {
      const r = fit.getBoundingClientRect();
      const span = r.height - innerHeight;
      if (span <= 0 || r.bottom < 0 || r.top > innerHeight) return;
      // f runs 0 → n across the pinned stretch; line i is centred at f = i + .5
      const f = clamp(-r.top / span, 0, 1) * n;
      lines.forEach((l, i) => {
        let d = f - (i + .5);
        if (i === 0 && d < 0) d = 0;          // first line is already in place
        if (i === n - 1 && d > 0) d = 0;      // last line stays until the end
        const o = 1 - smooth(.26, .56, Math.abs(d)); // neighbours cross-fade, faintly
        l.style.opacity = o.toFixed(3);
        l.style.transform = `translate3d(0, calc(-50% + ${(-d * 170).toFixed(1)}px), 0)`;
        l.style.filter = reduced || o > .98 ? 'none' : `blur(${((1 - o) * 6).toFixed(2)}px)`;
      });
      const idx = clamp(Math.floor(f), 0, n - 1);
      bars.forEach((b, i) => {
        b.style.setProperty('--fill', clamp(f - i, 0, 1).toFixed(3));
        b.classList.toggle('is-active', i === idx);
        b.classList.toggle('is-done', i < idx);
      });
      if (idx !== lastIdx) {
        lastIdx = idx;
        lines.forEach((l, i) => l.classList.toggle('is-active', i === idx));
        cur.textContent = String(idx + 1).padStart(2, '0');
      }
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
      location.href = `mailto:sirfconvos@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      note.textContent = 'Opening your email app. If nothing happens, write to sirfconvos@gmail.com.';
    });
    form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('is-invalid'));
  }

  /* ---------- cal.com: one loader, mounted inline wherever it's needed ---------- */
  const CAL_LINK = 'prasan-singh/sirfyou';
  const CAL_SCRIPT = 'https://app.cal.com/embed/embed.js';
  // The calendar's own surfaces are made transparent so our glass shows through.
  const CAL_GLASS = {
    'cal-bg': 'transparent',
    'cal-bg-muted': 'rgba(255,255,255,0.28)',
    'cal-bg-subtle': 'rgba(255,255,255,0.22)',
    'cal-bg-emphasis': 'rgba(28,28,28,0.08)',
    'cal-border': 'rgba(28,28,28,0.10)',
    'cal-border-subtle': 'rgba(28,28,28,0.06)',
    'cal-border-booker': 'transparent',
    'cal-brand': '#1e1e1e',
  };
  const mountCal = (ns, host) => {
    // cal.com's embed snippet (adds its script once, queues calls until it loads)
    (function (C, A, L) { const p = (a, ar) => { a.q.push(ar); }; const d = C.document; C.Cal = C.Cal || function () { const cal = C.Cal; const ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, CAL_SCRIPT, 'init');
    const Cal = window.Cal;
    const stage = host.closest('[data-cal-stage]');
    Cal('init', ns, { origin: 'https://app.cal.com' });
    Cal.config = Cal.config || {};
    Cal.config.forwardQueryParams = true;
    Cal.ns[ns]('inline', {
      elementOrSelector: host,
      calLink: CAL_LINK,
      config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme: 'light' },
    });
    Cal.ns[ns]('ui', { theme: 'light', cssVarsPerTheme: { light: CAL_GLASS, dark: CAL_GLASS }, hideEventTypeDetails: true, layout: 'month_view' });
    const ready = () => stage.classList.add('is-ready');
    const fail = () => { if (!stage.classList.contains('is-ready')) stage.classList.add('is-failed'); };
    Cal.ns[ns]('on', { action: 'linkReady', callback: ready });
    $(`script[src="${CAL_SCRIPT}"]`)?.addEventListener('error', fail);
    setTimeout(() => ($('iframe', host) ? ready() : fail()), 12000);
  };
  // Mount a calendar when the visitor gets within ~900px of it.
  const mountWhenNear = (ns, host, watch = host) => {
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); mountCal(ns, host); }
    }, { rootMargin: '900px 0px' });
    io.observe(watch);
  };

  /* ---------- Booking pop-up: cal.com on a liquid-glass sheet, on the page ---------- */
  const cal = $('[data-cal]');
  const calTrigger = $('[data-cal-trigger]');
  if (cal && calTrigger) {
    const root = document.documentElement;
    const openLink = $('[data-cal-open]', calTrigger);
    const backdrop = $('[data-cal-backdrop]');
    let isOpen = false, pinned = false, openT = 0, closeT = 0;
    let loaded = false;
    const load = () => { if (!loaded) { loaded = true; mountCal('sirfyou', $('#sirf-cal-inline')); } };
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
    addEventListener('blur', () => { if (isOpen && cal.contains(document.activeElement)) pin(); });

    $('[data-cal-close]', cal).addEventListener('click', () => close({ returnFocus: true }));
    backdrop.addEventListener('click', () => close());
    $('[data-cal-alt]', cal).addEventListener('click', () => close());
    addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) close({ returnFocus: true }); });
  }

  /* ---------- Contact: "Book a call" | "Send a brief" ---------- */
  const contactCal = $('#sirf-cal-contact');
  if (contactCal) mountWhenNear('sirfcontact', contactCal);
  const tabs = $$('[data-pane-tab]');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    $$('[role="tab"][data-pane-tab]').forEach(t => t.setAttribute('aria-selected', String(t.dataset.paneTab === tab.dataset.paneTab)));
    $$('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== tab.dataset.paneTab; });
  }));

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
