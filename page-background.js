/* Scroll-responsive page atmosphere. No mouse capture, canvas or continuous loop. */
(() => {
  const backdrop=document.querySelector('.site-ambient');if(!backdrop)return;
  const reduced=window.VORTEX_MOTION.reduced;
  let pending=0;
  function draw(){
    pending=0;
    if(document.hidden)return;
    if(reduced.matches){backdrop.style.setProperty('--drift-x','0px');backdrop.style.setProperty('--drift-y','0px');backdrop.style.setProperty('--drift-angle','0deg');return;}
    const progress=Math.min(1,Math.max(0,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
    const scale=innerWidth<=700?.4:1;
    backdrop.style.setProperty('--drift-x',((progress-.5)*80*scale).toFixed(2)+'px');
    backdrop.style.setProperty('--drift-y',((progress-.5)*150*scale).toFixed(2)+'px');
    backdrop.style.setProperty('--drift-angle',((progress-.5)*14*scale).toFixed(2)+'deg');
  }
  function schedule(){if(!pending&&!document.hidden)pending=requestAnimationFrame(draw);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(pending);pending=0;}else schedule();});
  window.VORTEX_MOTION.subscribe(draw);
  schedule();
})();
