/* Water wakes on normal scrolling and settles within two seconds. */
(() => {
  const host=document.querySelector('.water-background');if(!host)return;
  const reduced=window.VORTEX_MOTION.reduced;
  const compact=matchMedia('(max-width: 700px), (pointer: coarse)');
  let engine=null,canvas=null,displayObserver=null,loading=false,failed=false,raf=0,lastY=scrollY;
  let lastInput=-Infinity,lastFrame=0,force=0,point=[.12,.5];
  const allowed=()=>!document.hidden&&!reduced.matches&&!window.VORTEX_MEDIA?.isPlaying();
  function fail(){failed=true;cancelAnimationFrame(raf);raf=0;displayObserver?.disconnect();host.classList.remove('water-ready');host.dataset.waterState='fallback';engine?.dispose();engine=null;canvas?.remove();}
  function frame(now){
    raf=0;if(!engine)return;if(!allowed()){sync();return;}
    const age=now-lastInput;
    if(age>=2000){engine.clear();engine.render(0);host.dataset.waterState='idle';return;}
    if(now-lastFrame>=1000/(compact.matches?20:30)){
      lastFrame=now;
      const t=Math.max(0,Math.min(1,(age-200)/1800)),fade=1-t*t*(3-2*t);
      engine.step(point[0],point[1],force);engine.step(point[0],point[1],0);force=0;
      engine.render(fade);host.dataset.waterState='active';
    }
    raf=requestAnimationFrame(frame);
  }
  function wake(){if(engine&&allowed()&&!raf)raf=requestAnimationFrame(frame);}
  function mount(){
    if(reduced.matches||document.hidden){loading=false;return;}
    try{
      canvas=document.createElement('canvas');canvas.className='water-canvas';host.append(canvas);
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();});
      engine=window.TornadoWater.create(canvas,compact.matches);engine.resize(innerWidth,innerHeight,compact.matches);
      displayObserver=new ResizeObserver(()=>{if(reduced.matches||host.dataset.waterState==='reduced')sync();});displayObserver.observe(canvas);
      host.classList.add('water-ready');host.dataset.waterState='idle';wake();
    }catch(error){fail();}
  }
  function ensure(){
    if(engine||loading||failed||!allowed())return;
    loading=true;host.dataset.waterState='loading';
    if(window.TornadoWater){mount();return;}
    const script=document.createElement('script');script.src='assets/water-surface.js';script.async=true;
    script.onload=mount;script.onerror=fail;document.head.append(script);
  }
  function scroll(){
    host.classList.toggle('water-static',reduced.matches);
    const delta=scrollY-lastY;lastY=scrollY;
    if(Math.abs(delta)<.5||!allowed()||failed)return;
    const progress=Math.min(1,Math.max(0,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
    force=Math.max(-.014,Math.min(.014,force+delta*.00008));
    point=[delta>0?.12:.88,.22+.56*progress];host.dataset.direction=delta>0?'down':'up';
    lastInput=performance.now();ensure();wake();
  }
  function sync(){
    host.classList.toggle('water-static',reduced.matches);
    if(!allowed()){
      cancelAnimationFrame(raf);raf=0;force=0;
      host.dataset.waterState=reduced.matches?'reduced':'paused';return;
    }
    if(engine){engine.clear();engine.resize(innerWidth,innerHeight,compact.matches);host.dataset.waterState='idle';}
    else host.dataset.waterState=failed?'fallback':'static';
  }
  function resize(){if(engine&&allowed())engine.resize(innerWidth,innerHeight,compact.matches);}
  addEventListener('scroll',scroll,{passive:true});addEventListener('resize',resize,{passive:true});
  compact.addEventListener('change',resize);
  document.addEventListener('visibilitychange',sync);document.addEventListener('vortex:media-state',sync);
  window.VORTEX_MOTION.subscribe(sync);
  addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});addEventListener('pageshow',sync);
  sync();
})();
