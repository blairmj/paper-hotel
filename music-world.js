'use strict';

function wallPanelClearance(wall,target){
  const {x,z}=target.point,half=wall.width/2,span=target.surface.width/2+.40;
  // The strip is local to the panel so the rest of a narrow aisle stays walkable.
  if(z-wall.z<.35)return [x-span,x+span,wall.z-.02,z+.85];
  if(wall.back-z<.35)return [x-span,x+span,z-.85,wall.back+.02];
  if(half-x<.35)return [x-.85,half+.02,z-span,z+span];
  if(x+half<.35)return [-half-.02,x+.85,z-span,z+span];
  return null;
}

async function createMusicWorld({onInspect,onReadyToMove,deviceInstructions,room=paintedRoom,buildRoom=buildPaintedRoom}){
  // Each interior supplies the same metre-based limits as its geometry.
  const roomLimits = room.bounds ?? {left:-9.06, right:9.06, front:-7.54, back:4.94};
  const obstacles = [...(room.obstacles ?? [[-3.96,-1.10,-4.96,-1.96],[1.10,3.96,-4.96,-1.96]])];
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
  function targetOccluded(target,from=eye) {
    if(!occluders.length)return false;
    sight.origin.copy(from);
    sight.direction.subVectors(target.point,from);
    const distance = sight.direction.length();
    sight.direction.divideScalar(distance);
    return occluders.some(block => sight.intersectBox(block,hit) && hit.distanceToSquared(from)<(distance-.01)**2);
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
  const devices=targets.filter(target=>target.id===puzzleTarget||target.id==='doorGuide');
  // Leave room to stand at wall-mounted controls, including when approaching by floor click or keyboard.
  const wallTargets=[];
  if(room.interior){
    for(const target of targets){
      const area=wallPanelClearance(room.wall,target);
      if(area){
        obstacles.push(area);
        wallTargets.push({target,area});
      }
    }
  }
  let deviceGuide;
  if(deviceInstructions){
    deviceGuide=document.createElement('p');
    deviceGuide.className='device-guide';
    deviceGuide.id='roomProblem';
    deviceGuide.hidden=true;
    deviceGuide.setAttribute('role','status');
    deviceGuide.textContent=deviceInstructions;
    document.getElementById('spots').append(deviceGuide);
    for(const {button} of devices){
      button.setAttribute('aria-describedby',deviceGuide.id);
      for(const type of ['pointerenter','pointerleave','focus','blur'])button.addEventListener(type,queue);
    }
  }
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
  function nearDevice(target){
    const dx=target.point.x-eye.x,dz=target.point.z-eye.z;
    const distance=Math.hypot(dx,dz);
    return distance<2.35&&(distance<1||dx*Math.sin(yaw)-dz*Math.cos(yaw)>0)&&
      model.canInspect?.(target.id)!==false&&!targetOccluded(target);
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
      const behindSurface=!target.inspectFromAnySide&&viewNormal.dot(new THREE.Vector3().subVectors(eye,target.point))<.025;
      b.hidden=behindSurface||v.z<0||v.z>=1||px<20||px>width-20||py<55||py>height-56||!!journey||
        (openness===1&&devices.includes(target))||model.canInspect?.(target.id)===false||targetOccluded(target);
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
    if(deviceGuide){
      const show=devices.some(target=>nearDevice(target)||(!target.button.hidden&&
        (target.button.matches(':hover')||target.button===document.activeElement)));
      deviceGuide.hidden=openness>0||!!journey?.door||!!trail?.automatic||!show;
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
  function walkTo(goal, face=null, done=null, automatic=false) {
    if(!onOpenFloor(goal.x,goal.z)) return false;
    const path=floorRoute(eye,goal);
    if(!path.length) return false;
    journey=null;keys.clear();
    if (reducedMotion.matches) {
      for(const point of path)moveEye(point.x,point.z);
      if(face){yaw=heading(face);pitch=tilt(face)}
      queue();done?.();return true;
    }
    trail={path,face,done,automatic};previousTime=performance.now();queue();
    return true;
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
  function standingPlace(object,approach,nearDoor){
    if(!room.interior)return approach;
    // Start on the authored side of the object so a desk, shelf or adjacent locker aisle is never crossed.
    const [x,,z]=object.inspectionView?.compact??object.xyz;
    const authoredDistance=Math.hypot(approach.x-x,approach.z-z);
    const straight=Math.atan2(approach.x-x,approach.z-z);
    // In a tight aisle, favour the side that keeps the door beyond the panel in view.
    const doorToRight=nearDoor&&(room.door[0]-x)*Math.cos(straight)>(room.door[2]-z)*Math.sin(straight);
    const firstSide=doorToRight?-1:1;
    const halfView=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;
    const frontDistance=Math.max(1.85,authoredDistance);
    const fit=object.surface.width/(2*halfView*.78)+(object.surface.depth??0)*.25;
    const desired=Math.max(frontDistance,Math.min(2.6,fit));
    const from=new THREE.Vector3(0,eye.y,0);
    for(const distance of new Set([desired,(desired+frontDistance)/2,frontDistance])){
      for(const degrees of [0,15,-15,30,-30,45,-45,60,-60,75,-75]){
        const angle=straight+firstSide*THREE.MathUtils.degToRad(degrees);
        if(!object.inspectFromAnySide&&Math.cos(angle-(object.rotationY??0))<.15)continue;
        const spot={x:x+Math.sin(angle)*distance,z:z+Math.cos(angle)*distance};
        if(!onOpenFloor(spot.x,spot.z)||!clearSegment(approach,spot))continue;
        from.set(spot.x,eye.y,spot.z);
        if(!targetOccluded(object,from))return spot;
      }
    }
    return approach;
  }
  function approachObject(object,inspect){
    if(model.canInspect?.(object.id)===false)return;
    const [x,,z]=object.xyz;
    const approachX=object.id==='paper'?x+.65:x;
    const authored=object.approach??{x:clamp(approachX,-5.3,5.3),z:clamp(z+2.35,-6.2,-5.16)};
    const sideBySide=width>=800&&width/height>=1.25;
    let face=(sideBySide?object.inspectionView?.wide:object.inspectionView?.compact)??object.xyz;
    const doorDistance=Math.hypot(x-room.door[0],z-room.door[2]);
    const nearDoor=room.interior&&devices.includes(object)&&doorDistance<1.75;
    const stand=standingPlace(object,authored,nearDoor);
    if(nearDoor&&doorDistance>0){
      const distance=Math.hypot(stand.x-x,stand.z-z);
      const halfWidth=distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect;
      const spareWidth=Math.max(0,halfWidth*.70-object.surface.width/2);
      const towardDoor=Math.min(.40,spareWidth/doorDistance);
      face=object.xyz.map((v,i)=>v+(room.door[i]-v)*towardDoor);
    }
    const visit=inspect?()=>{model.onInspect?.(object.id);onInspect(object.id)}:null;
    walkTo(stand,face,visit);
  }
  function inspectTarget(id){
    const object=targets.find(t=>t.id===id);
    if(object)approachObject(object,true);
  }
  const raycaster=new THREE.Raycaster(),mousePoint=new THREE.Vector2(),destination=new THREE.Vector3();
  const surfaceNormal=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
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
    // A click on a table, chair or door should stop at the surface the student actually saw.
    const meshes=[];
    scene.traverseVisible(obj=>{if(obj.isMesh)meshes.push(obj)});
    const first=raycaster.intersectObjects(meshes,false)[0];
    const surface=first&&first.distance<=eye.distanceTo(destination)+.005?first:null;
    if(surface)destination.copy(surface.point);
    if(destination.y>=(room.ceilingMinimum??room.wall.height)-.02)return;
    const {x:hitX,y:hitY,z:hitZ}=destination;
    for(const {target,area:[left,right,front,back]} of wallTargets){
      if(hitX>=left&&hitX<=right&&hitZ>=front&&hitZ<=back&&openness===0){
        approachObject(target,false);return;
      }
    }
    const floor=hitY<.08;
    const goal={x:clamp(hitX,roomLimits.left,roomLimits.right),z:clamp(hitZ,roomLimits.front,roomLimits.back)};
    if(floor&&onOpenFloor(goal.x,goal.z)){walkTo(goal);return}
    const dx=eye.x-hitX,dz=eye.z-hitZ,distance=Math.hypot(dx,dz);
    const face=floor?null:[hitX,hitY,hitZ];
    const standBack=1.55;
    if(face&&surface?.face){
      surfaceNormal.copy(surface.face.normal).applyNormalMatrix(normalMatrix.getNormalMatrix(surface.object.matrixWorld));
      // A sideways click on a wall or cabinet should still land in front of its face.
      if(Math.abs(surfaceNormal.y)<.2){
        surfaceNormal.y=0;
        if(surfaceNormal.x*dx+surfaceNormal.z*dz<0)surfaceNormal.negate();
        surfaceNormal.normalize();
        const spot={x:hitX+surfaceNormal.x*standBack,z:hitZ+surfaceNormal.z*standBack};
        if(walkTo(spot,face))return;
      }
    }
    for(let offset=standBack;offset<distance;offset+=.20){
      const spot={x:hitX+dx*offset/distance,z:hitZ+dz*offset/distance};
      if(walkTo(spot,face))return;
    }
    if(face)look(face);
  }
  function commandAt(clientX,clientY){
    if(!model.commandPads)return null;
    const rect=canvas.getBoundingClientRect();
    aimRay(clientX-rect.left,clientY-rect.top);
    return raycaster.intersectObjects(model.commandPads.filter(pad=>pad.visible),false)[0]?.object.userData.command??null;
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
    }else if(trail && (trail.automatic||onReadyToMove())){
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
  const clearKeys=()=>{keys.clear();drag=null;if(!trail?.automatic)trail=null};
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
    setBalance(places){model.setBalance(places);queue()},
    facingDoor(done){
      clearKeys();
      const open=()=>look(room.door,true,done);
      if(room.doorReveal&&walkTo(room.doorReveal,room.door,open,true))return;
      open();
    },
    showFinale(view,done){
      clearKeys();journey=null;
      finale={...view,done,start:performance.now(),duration:reducedMotion.matches?1:1320};
      queue();
    },
    reset(open=false,digits=[0,0]){
      clearKeys();journey=null;trail=null;finale=null;
      eye.fromArray(room.start);openness=open?1:0;
      if(open&&room.doorReveal){eye.x=room.doorReveal.x;eye.z=room.doorReveal.z}
      const initial=open?room.door:(width/height<.85?room.portraitView:room.firstView);
      yaw=heading(initial);pitch=tilt(initial);
      model?.setDoor(openness);model.setDigits(digits);
      model.resetFurniture?.();
      canvas.dataset.ready='true';
      queue();
    }
  };
}
