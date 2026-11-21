/* sirf. × BBW deck: scale the 1920×1080 slides to fit, play each slide's
   motion when it comes into view, and a simple Present mode. */
(() => {
  const deck = document.getElementById('deck');
  if (!deck) return;
  const frames = [...deck.querySelectorAll('.deck-frame')];
  const root = document.documentElement;

  // Every frame is the same size, so one scale factor fits them all.
  const fit = () => {
    const f = frames.find(x => x.offsetWidth) || frames[0];
    deck.style.setProperty('--s', (f.getBoundingClientRect().width / 1920).toFixed(5));
  };
  new ResizeObserver(fit).observe(deck);
  fit();

  // Motion plays once, when a slide first scrolls into view.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && !root.classList.contains('presenting')) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .35 });
  frames.forEach(f => io.observe(f));

  // Present mode: one slide at a time, fullscreen when the browser allows it.
  const count = document.querySelector('[data-count]');
  let cur = 0;
  const show = i => {
    cur = Math.max(0, Math.min(frames.length - 1, i));
    frames.forEach((f, k) => { f.classList.toggle('is-current', k === cur); f.classList.remove('is-in'); });
    void frames[cur].offsetWidth; // restart the slide's motion
    frames[cur].classList.add('is-in');
    if (count) count.textContent = `${cur + 1} / ${frames.length}`;
    fit();
  };
  const start = () => {
    const seen = frames.findIndex(f => f.getBoundingClientRect().bottom > innerHeight * .4);
    root.classList.add('presenting');
    show(seen < 0 ? 0 : seen);
    if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
  };
  const stop = () => {
    if (!root.classList.contains('presenting')) return;
    root.classList.remove('presenting');
    frames.forEach(f => { f.classList.remove('is-current'); f.classList.add('is-in'); });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    fit();
    frames[cur].scrollIntoView({ block: 'center' });
  };

  document.querySelector('[data-present]')?.addEventListener('click', start);
  document.querySelector('[data-prev]')?.addEventListener('click', () => show(cur - 1));
  document.querySelector('[data-next]')?.addEventListener('click', () => show(cur + 1));
  document.querySelector('[data-exit]')?.addEventListener('click', stop);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) stop(); });
  addEventListener('keydown', e => {
    if (!root.classList.contains('presenting')) return;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); show(cur + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); show(cur - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(frames.length - 1);
    else if (e.key === 'Escape') stop();
  });
  // Tap or click: right two thirds go forward, left third goes back (links still work).
  deck.addEventListener('click', e => {
    if (!root.classList.contains('presenting') || e.target.closest('a')) return;
    show(e.clientX > innerWidth / 3 ? cur + 1 : cur - 1);
  });
})();
