/* Shared, click-to-play content videos. Background films are coordinated separately. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const motionSubscribers=new Set();
  window.VORTEX_MOTION={reduced,subscribe:callback=>motionSubscribers.add(callback)};
  reduced.addEventListener('change',()=>motionSubscribers.forEach(callback=>callback()));
  const videos = [...document.querySelectorAll('video[data-content-video]')];
  if (!videos.length) return;
  const dialog = document.querySelector('#demo-dialog');
  let opener = null, notificationPending = false;
  window.VORTEX_MEDIA = {isPlaying: () => videos.some(v => !v.paused && !v.ended)};
  function notify() {
    if (notificationPending) return;
    notificationPending = true;
    queueMicrotask(() => {
      notificationPending = false;
      document.dispatchEvent(new CustomEvent('vortex:media-state', {detail:{playing:window.VORTEX_MEDIA.isPlaying()}}));
    });
  }
  function failure(video) {
    const card = video.closest('[data-media-card]');
    video.pause(); card.classList.remove('has-started'); card.classList.add('media-failed');
    card.querySelector('.media-error').hidden = false;
    notify();
  }
  function start(video, retry = false) {
    const card = video.closest('[data-media-card]');
    videos.forEach(other => { if (other !== video) other.pause(); });
    card.classList.remove('media-failed'); card.querySelector('.media-error').hidden = true;
    if (retry || video.error) video.load();
    video.play().catch(error => { if (error.name !== 'AbortError') failure(video); });
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) entry.target.pause();
  }), {threshold:0});
  videos.forEach(video => {
    const card = video.closest('[data-media-card]');
    card.querySelector('[data-media-start]').addEventListener('click',()=>start(video));
    card.querySelector('[data-media-retry]').addEventListener('click',()=>start(video,true));
    video.addEventListener('play', () => {
      if (video.paused) { notify(); return; }
      videos.forEach(other => { if (other !== video) other.pause(); });
      if (document.hidden || (video.closest('dialog') && !video.closest('dialog').open)) video.pause();
      notify();
    });
    video.addEventListener('playing', () => { if(video.paused)return; card.classList.add('has-started'); card.classList.remove('media-failed'); card.querySelector('.media-error').hidden=true; notify(); });
    video.addEventListener('pause',notify);
    video.addEventListener('ended',notify);
    video.addEventListener('error',()=>failure(video));
    observer.observe(video);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(v=>v.pause()); });
  window.addEventListener('pagehide',()=>videos.forEach(v=>v.pause()));
  document.querySelectorAll('[data-open-demo]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    dialog.showModal();
    start(dialog.querySelector('video'));
  }));
  dialog?.addEventListener('close', () => {
    dialog.querySelectorAll('video').forEach(v=>v.pause());
    opener?.focus({preventScroll:true});
    opener = null;
  });
})();
