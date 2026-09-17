/* Scroll water: finite-difference height field adapted from the MIT-licensed
 * three.js webgl_gpgpu_water example. See design/water/README.md and WATER-LICENSE.txt.
 * Original full-screen lighting/composition; no external textures or dependencies.
 */
(() => {
  const vertex=`#version 300 es
  out vec2 uv;
  void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const simulation=`#version 300 es
  precision highp float;
  uniform sampler2D field;
  uniform vec2 point;
  uniform float force;
  uniform float size;
  in vec2 uv;out vec4 result;
  void main(){
    ivec2 p=ivec2(gl_FragCoord.xy),limit=ivec2(int(size)-1);
    vec2 h=texelFetch(field,p,0).rg;
    float n=texelFetch(field,clamp(p+ivec2(0,1),ivec2(0),limit),0).r;
    float s=texelFetch(field,clamp(p-ivec2(0,1),ivec2(0),limit),0).r;
    float e=texelFetch(field,clamp(p+ivec2(1,0),ivec2(0),limit),0).r;
    float w=texelFetch(field,clamp(p-ivec2(1,0),ivec2(0),limit),0).r;
    float height=((n+s+e+w)*.5-h.y)*.965;
    vec2 d=(uv-point)*vec2(1.,.8);
    height+=exp(-dot(d,d)/.003)*force;
    vec2 d2=(uv-vec2(1.-point.x,1.-point.y))*vec2(1.,.8);
    height+=exp(-dot(d2,d2)/.004)*force*.65;
    float edge=smoothstep(0.,.05,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
    result=vec4(clamp(height*edge,-.10,.10),h.x,0.,1.);
  }`;
  const surface=`#version 300 es
  precision highp float;
  uniform sampler2D field;
  uniform float size;
  uniform float strength;
  uniform float aspect;
  in vec2 uv;out vec4 color;
  float base(vec2 p){return .006*sin(p.x*13.+p.y*3.)+.004*sin(p.y*15.-p.x*4.)+.002*cos(p.x*28.+p.y*23.);}
  float height(vec2 p){return base(p)+texture(field,p).r*strength;}
  void main(){
    vec2 dx=vec2(1./size,0.),dy=vec2(0.,1./size);
    vec2 slope=vec2(height(uv-dx)-height(uv+dx),height(uv-dy)-height(uv+dy))*size*.75;
    vec3 normal=normalize(vec3(slope,.75));
    vec2 refracted=uv+normal.xy*.095;
    vec2 q=refracted*vec2(aspect,1.);
    float caustic=pow(1.-abs(sin(q.x*8.+sin(q.y*9.))*sin(q.y*10.+sin(q.x*7.))),10.);
    vec3 light=normalize(vec3(-.25,.45,.86));
    float reflection=pow(max(dot(reflect(-light,normal),vec3(0.,0.,1.)),0.),28.);
    float edge=.35+.65*pow(abs(uv.x-.5)*2.,1.2);
    vec3 calm=vec3(.91,.955,.96);
    vec3 water=calm-vec3(.14,.085,.068)*clamp(length(normal.xy)*1.8,0.,1.);
    water+=vec3(.065)*caustic+vec3(.16)*reflection;
    water=mix(vec3(.956,.974,.975),water,edge);
    color=vec4(clamp(water,0.,1.),1.);
  }`;
  function create(canvas,compact){
    const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power',preserveDrawingBuffer:true});
    if(!gl||!gl.getExtension('EXT_color_buffer_float'))throw Error('Floating-point WebGL water is unavailable');
    function program(fragment){
      const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{
        const shader=gl.createShader(type);gl.shaderSource(shader,i?fragment:vertex);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;
      });
      const p=gl.createProgram();shaders.forEach(s=>gl.attachShader(p,s));gl.linkProgram(p);shaders.forEach(s=>gl.deleteShader(s));
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;
    }
    const sim=program(simulation),view=program(surface);
    const locations=p=>Object.fromEntries(['field','point','force','size','strength','aspect'].map(n=>[n,gl.getUniformLocation(p,n)]));
    const su=locations(sim),vu=locations(view);
    let grid=compact?64:128,targets=[],index=0,frames=0;
    function makeTarget(){
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RG16F,grid,grid,0,gl.RG,gl.HALF_FLOAT,null);
      const framebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Water framebuffer unavailable');
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);return {texture,framebuffer};
    }
    function resetGrid(){targets.forEach(t=>{gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.framebuffer);});targets=[makeTarget(),makeTarget()];index=0;canvas.dataset.grid=String(grid);}
    resetGrid();
    function clear(){for(const t of targets){gl.bindFramebuffer(gl.FRAMEBUFFER,t.framebuffer);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}index=0;}
    function step(x,y,force){
      gl.useProgram(sim);gl.bindFramebuffer(gl.FRAMEBUFFER,targets[1-index].framebuffer);gl.viewport(0,0,grid,grid);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,targets[index].texture);
      gl.uniform1i(su.field,0);gl.uniform1f(su.size,grid);gl.uniform2f(su.point,x,y);gl.uniform1f(su.force,force);
      gl.drawArrays(gl.TRIANGLES,0,3);index=1-index;
    }
    function render(strength=1){
      gl.useProgram(view);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,targets[index].texture);
      gl.uniform1i(vu.field,0);gl.uniform1f(vu.size,grid);gl.uniform1f(vu.strength,strength);gl.uniform1f(vu.aspect,canvas.width/canvas.height);
      gl.drawArrays(gl.TRIANGLES,0,3);canvas.dataset.frames=String(++frames);
    }
    function resize(width,height,isCompact){
      const next=isCompact?64:128;if(next!==grid){grid=next;resetGrid();}
      const scale=Math.min(1,1280/width);canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);render(0);
    }
    function dispose(){targets.forEach(t=>{gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.framebuffer);});gl.deleteProgram(sim);gl.deleteProgram(view);}
    return {step,render,clear,resize,dispose};
  }
  window.TornadoWater={create};
})();
