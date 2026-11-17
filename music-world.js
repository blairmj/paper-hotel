'use strict';

async function createMusicWorld({onInspect,onReadyToMove}){
  const canvas=document.getElementById('roomView'),scene=new THREE.Scene();
  scene.background=new THREE.Color(0xe6ebef);
  const camera=new THREE.PerspectiveCamera(55,1,.04,42);
  camera.rotation.order='YXZ';
  let renderer,model,photos;
  try {
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  }catch{
    photos=await paintedPhotoView(canvas);
  }
  if(renderer)model=await buildPaintedRoom(scene);
  const eye=camera.position;
  const keys=new Set(),point=new THREE.Vector3();
  const targets=paintedRoom.targets.map(o=>{
    const button=document.createElement('button'),label=document.createElement('span');
    label.textContent=o.name;button.append(label);button.type='button';button.className='spot';
    button.dataset.object=o.id;button.setAttribute('aria-label',o.name);
    button.onclick=()=>{if(!journey)onInspect(o.id)};
    document.getElementById('spots').append(button);
    return {...o,point:new THREE.Vector3(...o.xyz),button};
  });
  const stopPoints=paintedRoom.stops;
  let width=1,height=1,yaw=0,pitch=0,openness=0,zoom=1,journey,drag,raf=0,previousTime=0;
  const clamp=THREE.MathUtils.clamp, wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
  const minZoom=.8,maxZoom=3,zoomStep=1.25;
  const zoomIn=document.getElementById('zoomIn'),zoomOut=document.getElementById('zoomOut');
  function setZoom(value){
    zoom=clamp(value,minZoom,maxZoom);
    camera.zoom=zoom;
    camera.updateProjectionMatrix();
    zoomOut.disabled=zoom<=minZoom;
    zoomIn.disabled=zoom>=maxZoom;
    queue();
  }
  function heading(position){return Math.atan2(position[0]-eye.x,eye.z-position[2])}
  function tilt(position){return Math.atan2(position[1]-eye.y,Math.hypot(position[0]-eye.x,position[2]-eye.z))}
  function resize(){
    width=canvas.clientWidth;height=canvas.clientHeight;
    if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(width,height,false)}
    camera.aspect=width/height;
    camera.fov=clamp(THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(50*Math.PI/180)/camera.aspect)),55,82);
    camera.updateProjectionMatrix();queue();
  }
  function draw(){
    camera.rotation.set(pitch,-yaw,0,'YXZ');camera.updateMatrixWorld();
    if(renderer)renderer.render(scene,camera);
    else photos.draw(height/(2*Math.tan(camera.fov*Math.PI/360))*zoom,yaw,pitch,openness);
    for(const target of targets){
      const v=point.copy(target.point).project(camera),px=width*(1+v.x)/2,py=height*(1-v.y)/2;
      const b=target.button;
      b.hidden=v.z<0||v.z>=1||px<20||px>width-20||py<55||py>height-56||!!journey||openness===1;
      target.px=px;target.py=py;
      if(b.hidden)continue;
      b.style.left=px+'px';b.style.top=(py+18)+'px';b.classList.toggle('label-left',px>width-95);
    }
  }
  function queue(){if(!raf)raf=requestAnimationFrame(frame)}
  function move(front,side){
    if(!renderer){
      setZoom(zoom*Math.exp(front*.15));yaw=wrap(yaw+side*.20);return;
    }
    const dx=Math.sin(yaw)*front+Math.cos(yaw)*side,dz=-Math.cos(yaw)*front+Math.sin(yaw)*side;
    function walkable(x,z){
      // The two groups of chairs leave a continuous aisle to the teaching wall.
      if(x< -1.55||x>1.55||z< -2.30||z>1.30)return false;
      if(z<-.40&&(x< -.90||x>.90))return false;
      return true;
    }
    if(walkable(eye.x+dx,eye.z))eye.x+=dx;
    if(walkable(eye.x,eye.z+dz))eye.z+=dz;
  }
  function frame(time){
    raf=0;const dt=Math.min(.06,(time-previousTime)/1000);previousTime=time;
    if(journey){
      const j=journey,t=clamp((time-j.start)/j.duration,0,1);
      const aim=1-(1-clamp(t/(j.door ? .42 : 1),0,1))**3;
      yaw=wrap(j.from+wrap(j.to-j.from)*aim);pitch=j.p+(j.targetPitch-j.p)*aim;
      if(j.door){
        if(zoom!==1)setZoom(j.startZoom+(1-j.startZoom)*aim);
        const slide=clamp((t-.28)/.68,0,1);
        openness=slide*slide*(3-2*slide);
        model?.setDoor(openness);
      }
      if(t===1){journey=null;j.done?.()}
    }else if(keys.size&&onReadyToMove()){
      yaw=wrap(yaw+(+keys.has('arrowright')-+keys.has('arrowleft'))*1.4*dt);
      pitch=clamp(pitch+(+keys.has('arrowup')-+keys.has('arrowdown'))*dt,-1.1,1.1);
      move((+keys.has('w')-+keys.has('s'))*dt*2.2,(+keys.has('d')-+keys.has('a'))*dt*2.2);
    }
    draw();if(journey||keys.size)queue();
  }
  function look(target,door=false,done){
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    journey={from:yaw,p:pitch,to:heading(target),targetPitch:tilt(target),door,done,startZoom:zoom,start:performance.now(),duration:reduced?1:door?1200:280};
    queue();
  }
  function turn(direction){
    if(!onReadyToMove()||journey?.door)return;
    const from=journey?journey.to:yaw;
    const ordered=stopPoints.map(target=>({target,angle:((heading(target)-from)*direction+Math.PI*2)%(Math.PI*2)}))
      .filter(stop=>stop.angle>.07).sort((a,b)=>a.angle-b.angle);
    if(ordered.length)look(ordered[0].target);
  }
  const clearKeys=()=>{keys.clear();drag=null};
  canvas.onpointerdown=e=>{
    if(e.button!==0||!onReadyToMove()||journey?.door)return;
    journey=null;drag={x:e.clientX,y:e.clientY,distance:0};canvas.setPointerCapture(e.pointerId);canvas.focus();
  };
  canvas.onpointermove=e=>{
    if(!drag)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y,speed=1.9/Math.max(300,Math.min(width,height));
    yaw=wrap(yaw-dx*speed);pitch=clamp(pitch+dy*speed,-1.1,1.1);
    drag={x:e.clientX,y:e.clientY,distance:drag.distance+Math.hypot(dx,dy)};queue();
  };
  canvas.onpointerup=e=>{
    const tapped=drag&&drag.distance<7;drag=null;
    if(!tapped||!onReadyToMove())return;
    const rect=canvas.getBoundingClientRect();
    for(const t of targets)if(!t.button.hidden&&Math.hypot(e.clientX-rect.left-t.px,e.clientY-rect.top-t.py)<26){onInspect(t.id);return}
  };
  canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null};
  document.addEventListener('keydown',e=>{
    if(!onReadyToMove()||journey?.door||e.metaKey||e.ctrlKey||e.altKey)return;
    const k=e.key.toLowerCase();
    if(['w','s','a','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k)){e.preventDefault();journey=null;keys.add(k);queue()}
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',clearKeys);
  function canZoom(){return onReadyToMove()&&!journey?.door}
  zoomIn.onclick=()=>{if(canZoom())setZoom(zoom*zoomStep)};
  zoomOut.onclick=()=>{if(canZoom())setZoom(zoom/zoomStep)};
  document.getElementById('musicGame').addEventListener('wheel',e=>{
    if(!canZoom()||e.ctrlKey||e.metaKey||!(e.target===canvas||e.target.closest('.spot')))return;
    e.preventDefault();
    const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1);
    setZoom(zoom*Math.exp(-clamp(pixels,-240,240)*.0024));
  },{passive:false});
  document.getElementById('left').onclick=()=>turn(-1);
  document.getElementById('right').onclick=()=>turn(1);
  document.getElementById('walk').onclick=()=>{if(onReadyToMove()&&!journey?.door){move(.36,0);queue()}};
  new ResizeObserver(resize).observe(canvas);resize();
  return {
    clearKeys,setDigits(digits){(model||photos).setDigits(digits);queue()},
    facingDoor(done){clearKeys();look(paintedRoom.door,true,done)},
    reset(open=false,digits=[0,0]){
      clearKeys();journey=null;setZoom(1);
      eye.fromArray(paintedRoom.start);openness=open?1:0;
      const initial=open?paintedRoom.door:(width/height<.85?paintedRoom.portraitView:paintedRoom.firstView);
      yaw=heading(initial);pitch=tilt(initial);
      model?.setDoor(openness);(model||photos).setDigits(digits);
      queue();
    }
  };
}
