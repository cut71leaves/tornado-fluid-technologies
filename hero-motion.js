/* Decorative film: content and navigation work independently of playback. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero--motion');
  if (!hero) return;
  const video = hero.querySelector('video');
  const toggle = hero.querySelector('[data-motion-toggle]');
  const text = toggle.querySelector('span');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 700px)');
  let visible = false, userPaused = false, blocked = false, failed = false;
  let source = '', generation = 0, pending = false;

  function label() {
    const paused = video.paused || userPaused || blocked;
    text.textContent = paused ? '播放流体动效' : '暂停流体动效';
    toggle.setAttribute('aria-label', text.textContent);
    toggle.dataset.state = paused ? 'paused' : 'playing';
    toggle.hidden = reduced.matches || failed || !source;
  }
  function fallback() {
    video.pause();
    hero.classList.remove('motion-ready');
    label();
  }
  function active() {
    return visible && !document.hidden && !reduced.matches && !userPaused && !blocked && !failed;
  }
  function sync() {
    if (reduced.matches) { fallback(); return; }
    if (!active()) { video.pause(); label(); return; }
    const next = portrait.matches ? video.dataset.mobile : video.dataset.desktop;
    if (source !== next) {
      generation++;
      pending = false;
      hero.classList.remove('motion-ready');
      source = next;
      video.src = source;
      video.load();
    }
    label();
    if (pending || !video.paused) return;
    const token = generation;
    pending = true;
    video.play().then(() => {
      if (token !== generation) return;
      pending = false;
      if (!active()) video.pause();
      else hero.classList.add('motion-ready');
      label();
    }).catch(error => {
      if (token !== generation) return;
      pending = false;
      if (error.name === 'AbortError') { if (active()) sync(); return; }
      blocked = true;
      fallback();
    });
  }
  toggle.addEventListener('click', () => {
    if (!video.paused && !userPaused) userPaused = true;
    else { userPaused = false; blocked = false; }
    sync();
  });
  video.addEventListener('error', () => { failed = true; fallback(); });
  video.addEventListener('playing', () => {
    if (active()) hero.classList.add('motion-ready');
    else video.pause();
    label();
  });
  video.addEventListener('pause', label);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => video.pause());
  window.addEventListener('pageshow', sync);
  reduced.addEventListener('change', sync);
  portrait.addEventListener('change', () => {
    generation++;
    pending = false;
    video.pause();
    failed = false;
    hero.classList.remove('motion-ready');
    sync();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, {threshold: 0}).observe(hero);
  label();
})();
