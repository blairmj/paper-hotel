'use strict';

async function createMusicWorld({onInspect,onReadyToMove,room=paintedRoom,buildRoom=buildPaintedRoom}){
  // Each interior supplies the same metre-based limits as its geometry.
  const roomLimits = room.bounds ?? {left:-9.06, right:9.06, front:-7.54, back:4.94};
  const obstacles = room.obstacles ?? [[-3.96,-1.10,-4.96,-1.96],[1.10,3.96,-4.96,-1.96]];
  const occluders = (room.occluders ?? []).map(([left,right,bottom,top,front,back]) =>
    new THREE.Box3(new THREE.Vector3(left,bottom,front),new THREE.Vector3(right,top,back)));
  function onOpenFloor(x,z) {
    return x>=roomLimits.left && x<=roomLimits.right && z>=roomLimits.front && z<=roomLimits.back &&
      !obstacles.some(([l,r,f,b])=>x>l && x<r && z>f && z<b);
  }
  function clearSegment(a,b) {
    const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.11));
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      if(!onOpenFloor(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)) return false;
    }
    return true;
  }
  function floorRoute(start,goal) {
    if(clearSegment(start,goal)) return [goal];
    const nodes=[start,goal];
    for(const [l,r,f,b] of obstacles) for(const x of [l-.09,r+.09]) for(const z of [f-.09,b+.09]) nodes.push({x,z});
    const cost=nodes.map(()=>Infinity), prev=nodes.map(()=>-1), visited=new Set();cost[0]=0;
    for(let i=0;i<nodes.length;i++){
      let current=-1;
      for(let k=0;k<nodes.length;k++) if(!visited.has(k) && cost[k]<Infinity && (current<0||cost[k]<cost[current])) current=k;
      if(current<0) return [];
      if(current===1) break;
      visited.add(current);
      for(let k=1;k<nodes.length;k++){
        if(visited.has(k)||!clearSegment(nodes[current],nodes[k])) continue;
        const next=cost[current]+Math.hypot(nodes[k].x-nodes[current].x,nodes[k].z-nodes[current].z);
        if(next<cost[k]){cost[k]=next;prev[k]=current}
      }
    }
    const path=[];for(let k=1;k>0;k=prev[k]) path.unshift(nodes[k]);
    return prev[1]<0?[]:path;
  }

  const canvas=document.getElementById('roomView'),scene=new THREE.Scene();
  scene.background=new THREE.Color(0xe6ebef);
  const viewAngle=room.viewAngle??55;
  const camera=new THREE.PerspectiveCamera(viewAngle,1,.04,42);
  camera.rotation.order='YXZ';
  let renderer,model,photos;
  try {
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=!!room.interior;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  }catch{renderer=null}
  model=await buildRoom(scene,room);
  if(!renderer){
    if(room.interior)throw new Error('WebGL is required for this interior');
    photos=paintedPhotoView(canvas,scene);
  }
  const eye=camera.position;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const keys=new Set(),point=new THREE.Vector3(),corner=new THREE.Vector3();
  const sight = new THREE.Ray(), hit = new THREE.Vector3();
  function targetOccluded(target) {
    if(!occluders.length)return false;
    sight.origin.copy(eye);
    sight.direction.subVectors(target.point,eye);
    const distance = sight.direction.length();
    sight.direction.divideScalar(distance);
    return occluders.some(block => sight.intersectBox(block,hit) && hit.distanceToSquared(eye)<(distance-.01)**2);
  }
  const targets=room.targets.map(o=>{
    const button=document.createElement('button'),label=document.createElement('span');
    button.hidden=true;
    label.textContent=o.name;button.append(label);button.type='button';button.className='spot';
    button.dataset.object=o.id;button.setAttribute('aria-label',o.name);
    button.onclick=e=>{if(e.detail===0 && !journey?.door && onReadyToMove()) inspectTarget(o.id)};
    button.onpointerdown=e=>startPointer(e,o.id);
    document.getElementById('spots').append(button);
    const surface=o.surface || (o.id==='clock'?room.clock:o.id==='lock'?room.lock:{width:.79,height:.50});
    return {...o,point:new THREE.Vector3(...o.xyz),surface,button};
  });
  const stopPoints=room.stops;
  const puzzleTarget=room.lock?.id??'lock';
  let width=1,height=1,yaw=0,pitch=0,openness=0,journey,trail,drag,finale,raf=0,previousTime=0;
  const clamp=THREE.MathUtils.clamp, wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
  function heading(position){return Math.atan2(position[0]-eye.x,eye.z-position[2])}
  function tilt(position){return Math.atan2(position[1]-eye.y,Math.hypot(position[0]-eye.x,position[2]-eye.z))}
  function resize(){
    width=canvas.clientWidth;height=canvas.clientHeight;
    if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(width,height,false)}
    camera.aspect=width/height;
    // Keep furniture at the same relative height across landscape screens.
    // Portrait screens get a wider vertical view within a comfortable limit.
    camera.fov=clamp(THREE.MathUtils.radToDeg(
      2*Math.atan(Math.tan(viewAngle*Math.PI/360)/Math.min(camera.aspect,1))
    ),viewAngle,74);
    camera.updateProjectionMatrix();queue();
  }
  function draw(){
    if(finale){
      if(finale.camera.aspect!==width/height){
        finale.camera.aspect=width/height;
        finale.camera.updateProjectionMatrix();
      }
      renderer.render(finale.scene,finale.camera);
      return;
    }
    camera.rotation.set(pitch,-yaw,0,'YXZ');camera.updateMatrixWorld();
    model.updateViews?.(eye);
    if(renderer)renderer.render(scene,camera);
    else photos.draw(height/(2*Math.tan(camera.fov*Math.PI/360)),yaw,pitch,eye);
    canvas.dataset.position=[eye.x,eye.y,eye.z].map(n=>n.toFixed(3)).join(',');
    canvas.dataset.heading=yaw.toFixed(3);
    canvas.dataset.door=openness.toFixed(3);
    for(const target of targets){
      point.copy(target.point);
      const v=point.project(camera),px=width*(1+v.x)/2,py=height*(1-v.y)/2;
      const b=target.button;
      const sin=Math.sin(target.rotationY||0),cos=Math.cos(target.rotationY||0);
      const viewNormal=new THREE.Vector3(sin,0,cos);
      const behindSurface=viewNormal.dot(new THREE.Vector3().subVectors(eye,target.point))<.025;
      b.hidden=behindSurface||v.z<0||v.z>=1||px<20||px>width-20||py<55||py>height-56||!!journey||
        (openness===1&&target.id===puzzleTarget)||model.canInspect?.(target.id)===false||targetOccluded(target);
      target.px=px;target.py=py;
      if(b.hidden)continue;
      let halfWidth=0,halfHeight=0;
      const depth=target.surface.depth??0,depthOffsets=depth?[-depth/2,depth/2]:[0];
      for(const dx of [-.5,.5])for(const dy of [-.5,.5])for(const dz of depthOffsets){
        corner.copy(target.point);
        corner.x+=dx*target.surface.width*cos+dz*sin;
        corner.z+=dz*cos-dx*target.surface.width*sin;
        corner.y+=dy*target.surface.height;
        corner.project(camera);
        halfWidth=Math.max(halfWidth,Math.abs(width*(1+corner.x)/2-px));
        halfHeight=Math.max(halfHeight,Math.abs(height*(1-corner.y)/2-py));
      }
      b.style.width=Math.max(44,2*halfWidth)+'px';b.style.height=Math.max(44,2*halfHeight)+'px';
      b.style.left=px+'px';b.style.top=py+'px';b.classList.toggle('label-left',px>width-95);
    }
  }
  function queue(){if(!raf)raf=requestAnimationFrame(frame)}
  function moveEye(x,z){
    if(x!==eye.x||z!==eye.z)model.onWalk?.(eye.x,eye.z,x,z);
    eye.x=x;
    eye.z=z;
  }
  function move(front,side){
    const increments=Math.max(1,Math.ceil(Math.hypot(front,side)/.1));
    const dx=(Math.sin(yaw)*front+Math.cos(yaw)*side)/increments;
    const dz=(-Math.cos(yaw)*front+Math.sin(yaw)*side)/increments;
    for(let i=0;i<increments;i++){
      const x=onOpenFloor(eye.x+dx,eye.z)?eye.x+dx:eye.x;
      const z=onOpenFloor(x,eye.z+dz)?eye.z+dz:eye.z;
      moveEye(x,z);
    }
  }
  function walkTo(goal, face=null, done=null) {
    if(!onOpenFloor(goal.x,goal.z)) return;
    const path=floorRoute(eye,goal);
    if(!path.length) return;
    journey=null;keys.clear();
    if (reducedMotion.matches) {
      for(const point of path)moveEye(point.x,point.z);
      if(face){yaw=heading(face);pitch=tilt(face)}
      queue();done?.();return;
    }
    trail={path,face,done};previousTime=performance.now();queue();
  }
  function advanceTrail(dt){
    const next=trail.path[0],dx=next.x-eye.x,dz=next.z-eye.z,dist=Math.hypot(dx,dz);
    const step=Math.min(dt*4.8,dist);
    if(dist>0)moveEye(eye.x+dx*step/dist,eye.z+dz*step/dist);
    if(trail.face){
      yaw=wrap(yaw+wrap(heading(trail.face)-yaw)*Math.min(1,dt*9));
      pitch+=(tilt(trail.face)-pitch)*Math.min(1,dt*9);
    }
    if(dist-step>.001)return;
    trail.path.shift();
    if(trail.path.length)return;
    const {face,done}=trail;trail=null;
    if(face){yaw=heading(face);pitch=tilt(face)}
    done?.();
  }
  function inspectTarget(id){
    if(model.canInspect?.(id)===false)return;
    const object=targets.find(t=>t.id===id), [x,,z]=object.xyz;
    const approachX=id==='paper'?x+.65:x;
    const approach=object.approach || {x:clamp(approachX,-5.3,5.3),z:clamp(z+2.35,-6.2,-5.16)};
    const sideBySide=width>=800&&width/height>=1.25;
    const inspectionView=sideBySide?object.inspectionView?.wide:object.inspectionView?.compact;
    walkTo(approach,inspectionView??object.xyz,()=>onInspect(id));
  }
  const raycaster=new THREE.Raycaster(),mousePoint=new THREE.Vector2(),destination=new THREE.Vector3();
  const roomBox=new THREE.Box3(
    new THREE.Vector3(-room.wall.width/2,0,room.wall.z),
    new THREE.Vector3(room.wall.width/2,room.wall.height,room.wall.back??5.4)
  );
  function aimRay(x,y){
    mousePoint.set(2*x/width-1,1-2*y/height);
    raycaster.setFromCamera(mousePoint,camera);
  }
  function walkToPixel(x,y){
    aimRay(x,y);
    if(!raycaster.ray.intersectBox(roomBox,destination))return;
    for(const block of occluders){
      if(raycaster.ray.intersectBox(block,hit)&&hit.distanceToSquared(eye)<destination.distanceToSquared(eye)){
        destination.copy(hit);
      }
    }
    if(destination.y>=room.wall.height-.001)return;
    let goal={
      x:clamp(destination.x,roomLimits.left,roomLimits.right),
      z:clamp(destination.z,roomLimits.front,roomLimits.back)
    };
    for(const [left,right,front,back] of obstacles){
      if(goal.x<=left||goal.x>=right||goal.z<=front||goal.z>=back)continue;
      const approaches=[
        {x:left-.10,z:goal.z},{x:right+.10,z:goal.z},
        {x:goal.x,z:front-.10},{x:goal.x,z:back+.10}
      ].filter(({x,z})=>onOpenFloor(x,z));
      approaches.sort((a,b)=>Math.hypot(a.x-eye.x,a.z-eye.z)-Math.hypot(b.x-eye.x,b.z-eye.z));
      if(!approaches.length)return;
      goal=approaches[0];
    }
    walkTo(goal);
  }
  function commandAt(clientX,clientY){
    if(!model.commandPads)return null;
    const rect=canvas.getBoundingClientRect();
    aimRay(clientX-rect.left,clientY-rect.top);
    return raycaster.intersectObjects(model.commandPads,false)[0]?.object.userData.command??null;
  }
  function frame(time){
    raf=0;const dt=Math.min(.06,(time-previousTime)/1000);previousTime=time;
    if(finale){
      const t=clamp((time-finale.start)/finale.duration,0,1);
      const swing=clamp((t-.14)/.72,0,1);
      finale.setDoor(swing*swing*(3-2*swing));
      draw();
      if(t<1)queue();
      else if(finale.done){
        const done=finale.done;
        finale.done=null;
        done();
      }
      return;
    }
    if(journey){
      const j=journey,t=clamp((time-j.start)/j.duration,0,1);
      const aim=1-(1-clamp(t/(j.door ? .42 : 1),0,1))**3;
      yaw=wrap(j.from+wrap(j.to-j.from)*aim);pitch=j.p+(j.targetPitch-j.p)*aim;
      if(j.door){
        const slide=clamp((t-.28)/.68,0,1);
        openness=slide*slide*(3-2*slide);
        model?.setDoor(openness);
      }
      if(t===1){journey=null;j.done?.()}
    }else if(trail && onReadyToMove()){
      advanceTrail(dt);
    }else if(keys.size&&onReadyToMove()){
      yaw=wrap(yaw+(+keys.has('arrowright')-+keys.has('arrowleft'))*1.4*dt);
      pitch=clamp(pitch+(+keys.has('arrowup')-+keys.has('arrowdown'))*dt,-1.1,1.1);
      move((+keys.has('w')-+keys.has('s'))*dt*2.2,(+keys.has('d')-+keys.has('a'))*dt*2.2);
    }
    const animating=model.animate?.(dt,reducedMotion.matches);
    draw();if(journey||trail||keys.size||animating)queue();
  }
  function look(target,door=false,done){
    trail=null;
    const reduced=reducedMotion.matches;
    journey={from:yaw,p:pitch,to:heading(target),targetPitch:tilt(target),door,done,start:performance.now(),duration:reduced?1:door?1200:280};
    queue();
  }
  function turn(direction){
    if(!onReadyToMove()||journey?.door)return;
    const from=journey?journey.to:yaw;
    const ordered=stopPoints.map(target=>({target,angle:((heading(target)-from)*direction+Math.PI*2)%(Math.PI*2)}))
      .filter(stop=>stop.angle>.07).sort((a,b)=>a.angle-b.angle);
    if(ordered.length)look(ordered[0].target);
  }
  const clearKeys=()=>{keys.clear();drag=null;trail=null};
  function startPointer(e,objectId=null){
    if(!e.isPrimary||e.button!==0||!onReadyToMove()||journey?.door)return;
    journey=null;trail=null;
    drag={x:e.clientX,y:e.clientY,distance:0,objectId,pointerId:e.pointerId};
    canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
  }
  canvas.onpointerdown=e=>startPointer(e);
  canvas.onpointermove=e=>{
    if(!drag||drag.pointerId!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y,speed=1.9/Math.max(300,Math.min(width,height));
    yaw=wrap(yaw-dx*speed);pitch=clamp(pitch+dy*speed,-1.1,1.1);
    drag={...drag,x:e.clientX,y:e.clientY,distance:drag.distance+Math.hypot(dx,dy)};queue();
  };
  canvas.onpointerup=e=>{
    if(!drag||drag.pointerId!==e.pointerId)return;
    const {objectId}=drag,tapped=drag.distance<7;drag=null;
    if(!tapped||!onReadyToMove())return;
    if(objectId){inspectTarget(objectId);return}
    const rect=canvas.getBoundingClientRect();
    for(const t of targets)if(!t.button.hidden&&Math.hypot(e.clientX-rect.left-t.px,e.clientY-rect.top-t.py)<26){inspectTarget(t.id);return}
    walkToPixel(e.clientX-rect.left,e.clientY-rect.top);
  };
  canvas.onpointercancel=canvas.onlostpointercapture=()=>{drag=null};
  document.addEventListener('keydown',e=>{
    if(!onReadyToMove()||journey?.door||e.metaKey||e.ctrlKey||e.altKey)return;
    const k=e.key.toLowerCase();
    if(['w','s','a','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k)){e.preventDefault();journey=null;trail=null;keys.add(k);queue()}
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',clearKeys);
  function movementButton(id,activate){
    const button=document.getElementById(id);
    button.onpointerup=e=>{if(e.isPrimary&&e.button===0)activate()};
    button.onclick=e=>{if(e.detail===0)activate()};
  }
  movementButton('left',()=>turn(-1));
  movementButton('right',()=>turn(1));
  function step(distance){
    if(!onReadyToMove()||journey?.door)return;
    trail=null;move(distance,0);queue();
  }
  movementButton('walk',()=>step(1.2));
  movementButton('stepBack',()=>step(-1.2));
  new ResizeObserver(resize).observe(canvas);resize();
  return {
    clearKeys,walkTo,commandAt,lookAtPiano(){inspectTarget('paper')},
    setDigits(digits,level){model.setDigits(digits,level);queue()},
    facingDoor(done){clearKeys();look(room.door,true,done)},
    showFinale(view,done){
      clearKeys();journey=null;
      finale={...view,done,start:performance.now(),duration:reducedMotion.matches?1:1320};
      queue();
    },
    reset(open=false,digits=[0,0]){
      clearKeys();journey=null;finale=null;
      eye.fromArray(room.start);openness=open?1:0;
      const initial=open?room.door:(width/height<.85?room.portraitView:room.firstView);
      yaw=heading(initial);pitch=tilt(initial);
      model?.setDoor(openness);model.setDigits(digits);
      model.resetFurniture?.();
      canvas.dataset.ready='true';
      queue();
    }
  };
}
