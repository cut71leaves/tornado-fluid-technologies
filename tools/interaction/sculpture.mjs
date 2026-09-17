import * as THREE from 'three';

// Original procedural object and studio lighting. No model, image fetch or CDN.
function studioTexture() {
  const width=512,height=256,pixels=new Float32Array(width*height*4);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const u=x/width,v=y/height;
    let r=.055,g=.09,b=.105;
    for(const [center,spread,strength,color] of [
      [.12,.042,5,[1,1,1]],[.36,.065,2.4,[.65,.91,1]],
      [.62,.022,7,[1,1,1]],[.86,.095,1.8,[.8,.98,1]]
    ]) {
      const light=Math.exp(-Math.pow((u-center)/spread,8))*(.2+.8*Math.sin(v*Math.PI)**2)*strength;
      r+=light*color[0];g+=light*color[1];b+=light*color[2];
    }
    const i=(y*width+x)*4;pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=1;
  }
  const texture=new THREE.DataTexture(pixels,width,height,THREE.RGBAFormat,THREE.FloatType);
  texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.needsUpdate=true;
  return texture;
}

function mount(stage, onFailure) {
  const host=stage.querySelector('.sculpture-canvas');
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  camera.position.set(0,0,8.4);
  const texture=studioTexture(),pmrem=new THREE.PMREMGenerator(renderer);
  const environment=pmrem.fromEquirectangular(texture);
  scene.environment=environment.texture;
  texture.dispose();pmrem.dispose();
  const uniforms={morph:{value:.5},pointer:{value:new THREE.Vector2()}};
  const material=new THREE.MeshPhysicalMaterial({color:0xb7d9df,metalness:1,roughness:.17,clearcoat:.6,clearcoatRoughness:.12,envMapIntensity:1.25});
  material.onBeforeCompile=shader=>{
    shader.uniforms.fluidMorph=uniforms.morph;
    shader.uniforms.fluidPointer=uniforms.pointer;
    shader.vertexShader=`uniform float fluidMorph; uniform vec2 fluidPointer;
      vec3 fluidShape(vec3 p) {
        float phase=fluidMorph*3.14159265;
        float angle=(fluidMorph-.5)*.65*p.y+fluidPointer.x*.12;
        mat2 twist=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
        p.xz=twist*p.xz;
        float wave=.065*sin(p.x*2.5+p.y*3.0+phase)+.025*fluidPointer.y*cos(p.z*3.0);
        p+=normalize(p)*wave;
        p.x*=.87+fluidMorph*.30;
        p.y*=1.04-.13*sin(phase);
        return p;
      }
      `+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
      vec3 axis=abs(normal.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.);
      vec3 tangentA=normalize(cross(normal,axis));
      vec3 tangentB=normalize(cross(normal,tangentA));
      vec3 at=fluidShape(position);
      objectNormal=normalize(cross(fluidShape(position+tangentA*.001)-at,fluidShape(position+tangentB*.001)-at));`);
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','vec3 transformed=fluidShape(position);');
  };
  const geometry=new THREE.TorusKnotGeometry(1.19,.38,220,36,2,3);
  const object=new THREE.Mesh(geometry,material);
  object.rotation.set(.3,.3,-.25);
  scene.add(object);
  scene.add(new THREE.HemisphereLight(0xf2ffff,0x50777c,1.1));
  host.append(renderer.domElement);
  let enabled=false,raf=0,disposed=false,frames=0;
  const current={progress:.5,x:0,y:0},target={...current};
  function draw() {
    uniforms.morph.value=current.progress;
    uniforms.pointer.value.set(current.x,current.y);
    object.rotation.x=.25+current.y*.12;
    object.rotation.y=.3+(current.progress-.5)*.75+current.x*.16;
    object.rotation.z=-.25+(current.progress-.5)*.22;
    renderer.render(scene,camera);
    renderer.domElement.dataset.frames=String(++frames);
  }
  function tick() {
    raf=0;if(!enabled||disposed)return;
    let delta=0;
    for(const key of Object.keys(current)){const diff=target[key]-current[key];current[key]+=diff*.13;delta+=Math.abs(diff);}
    draw();
    if(delta>.001)raf=requestAnimationFrame(tick);
  }
  function wake(){if(enabled&&!raf&&!disposed)raf=requestAnimationFrame(tick);}
  function resize(){
    const {width,height}=host.getBoundingClientRect();
    if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    camera.position.z=camera.aspect<.85?10:8.4;
    camera.updateProjectionMatrix();draw();
  }
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(host);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();enabled=false;cancelAnimationFrame(raf);onFailure();});
  resize();
  return {
    setEnabled(value){enabled=value;if(value)wake();else{cancelAnimationFrame(raf);raf=0;}},
    setTargets(values){Object.assign(target,values);wake();},
    dispose(){disposed=true;cancelAnimationFrame(raf);sizeObserver.disconnect();geometry.dispose();material.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
window.TornadoSculpture={mount};
