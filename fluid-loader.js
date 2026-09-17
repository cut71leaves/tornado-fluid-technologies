/* Lazy desktop WebGL; mobile and reduced-motion keep a local poster. */
(() => {
  const stage=document.querySelector('[data-fluid-stage]');if(!stage)return;
  const button=stage.querySelector('[data-fluid-toggle]'),poster=stage.querySelector('.sculpture-poster');
  const hint=stage.querySelector('.sculpture-hint');
  const reduced=window.VORTEX_MOTION.reduced;
  const mobile=matchMedia('(max-width: 700px), (pointer: coarse)');
  let controller=null,loading=false,failed=false,near=false,visible=false,userPaused=false,raf=0;
  let pointer={x:0,y:0};
  function active(){return visible&&!document.hidden&&!reduced.matches&&!userPaused&&!window.VORTEX_MEDIA?.isPlaying();}
  function position(){const r=stage.getBoundingClientRect();return Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));}
  function failure(){failed=true;stage.classList.remove('sculpture-ready');stage.dataset.fluidState='fallback';button.hidden=true;controller?.setEnabled(false);}
  function sync(){
    const staticMode=reduced.matches||mobile.matches||failed;
    stage.classList.toggle('sculpture-static',staticMode);
    button.hidden=reduced.matches||failed||(!controller&&!mobile.matches);
    button.textContent=userPaused?'继续互动':'暂停互动';
    hint.firstChild.textContent=reduced.matches||failed?'银青流体 · 形态与光':mobile.matches?'上下滑动，感受形态变化':'移动鼠标，或上下滚动';
    if(!failed)stage.dataset.fluidState=staticMode?'static':controller?'ready':'waiting';
    controller?.setEnabled(active()&&!staticMode);
    if(reduced.matches||failed){poster.style.transform='';return;}
    if(active()){
      const progress=position();
      if(mobile.matches)poster.style.transform=`translateY(${(progress-.5)*24}px)`;
      else {poster.style.transform='';controller?.setTargets({progress,...pointer});}
    }
    if(near&&!staticMode&&!controller&&!loading){
      loading=true;
      function mount(){try{controller=window.TornadoSculpture.mount(stage,failure);stage.classList.add('sculpture-ready');sync();}catch(error){failure();}}
      if(window.TornadoSculpture){mount();return;}
      const script=document.createElement('script');script.src='assets/fluid-interactive.min.js';script.async=true;
      script.onload=mount;script.onerror=failure;document.head.append(script);
    }
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;sync();});}
  stage.addEventListener('pointermove',e=>{if(mobile.matches||reduced.matches)return;const r=stage.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};schedule();});
  stage.addEventListener('pointerleave',()=>{pointer={x:0,y:0};schedule();});
  button.addEventListener('click',()=>{userPaused=!userPaused;sync();});
  window.addEventListener('scroll',()=>{if(visible)schedule();},{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('vortex:media-state',sync);
  window.VORTEX_MOTION.subscribe(sync);mobile.addEventListener('change',sync);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(stage);
  const nearby=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){near=true;sync();nearby.disconnect();}},{rootMargin:'240px'});nearby.observe(stage);
  window.addEventListener('pagehide',()=>controller?.setEnabled(false));
  window.addEventListener('pageshow',sync);
  sync();
})();
