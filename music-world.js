// Panorama coordinates in pixels on the original 360-degree room photograph.
const musicObjects = [
  {id:'paper', name:'피아노 위 악보', x:375, y:488},
  {id:'clock', name:'멈춘 벽시계', x:885, y:373},
  {id:'lock', name:'문 옆 다이얼', x:1235, y:457}
];

async function createMusicWorld({onInspect,onReadyToMove,onError}){
  const W=1774,H=887,TAU=Math.PI*2;
  const clamp=(v,min,max)=>Math.max(min,Math.min(v,max));
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const picture=new Image();
  picture.src='rooms/music-panorama.webp';
  await picture.decode();
  const plate=document.createElement('canvas');plate.width=W;plate.height=H;
  const ink=plate.getContext('2d');
  function clockFace(){
    const x=885,y=373,r=54;
    ink.save();ink.shadowColor='#3c372d77';ink.shadowBlur=6;ink.shadowOffsetY=4;
    ink.fillStyle='#40584d';ink.beginPath();ink.arc(x,y,r,0,TAU);ink.fill();ink.restore();
    ink.beginPath();ink.arc(x,y,r-4,0,TAU);ink.fillStyle='#fff2d5';ink.fill();
    ink.fillStyle='#3d3c33';ink.font='bold 11px Georgia';ink.textAlign='center';ink.textBaseline='middle';
    for(let i=1;i<=12;i++){const a=i*TAU/12;ink.fillText(i,x+39*Math.sin(a),y-39*Math.cos(a))}
    ink.strokeStyle='#453a30';ink.lineWidth=3;ink.lineCap='round';
    ink.beginPath();ink.moveTo(x,y-31);ink.lineTo(x,y+23);ink.stroke();
    ink.fillStyle='#925f3d';ink.beginPath();ink.arc(x,y,3.5,0,TAU);ink.fill();
  }
  const door=document.createElement('canvas');door.width=169;door.height=297;
  const wood=door.getContext('2d');
  const stain=wood.createLinearGradient(0,0,169,297);
  stain.addColorStop(0,'#c99035');stain.addColorStop(1,'#ad7328');
  wood.fillStyle=stain;wood.fillRect(0,0,169,297);
  wood.strokeStyle='#805523';wood.lineWidth=3;wood.strokeRect(1,1,167,295);
  wood.fillStyle='#e1d4ae';wood.fillRect(56,61,56,19);wood.fillStyle='#45483b';
  wood.font='bold 10px sans-serif';wood.textAlign='center';wood.fillText('음악실',84,74);
  wood.fillStyle='#5f655d';wood.fillRect(14,165,6,18);wood.fillStyle='#cecbb9';wood.fillRect(15,167,20,4);
  let dialDigits=[0,0];
  function paint(open){
    ink.drawImage(picture,0,0,W,H);clockFace();
    // Project strips of the hinged leaf over the photographed corridor. Its right edge stays on the jamb.
    const angle=open*1.49;
    for(let i=0;i<60;i++){
      const t=i/60,u=(i+1)/60,depth=(1-t)*Math.sin(angle);
      const x=1428-(1-t)*155*Math.cos(angle),next=1428-(1-u)*155*Math.cos(angle);
      ink.drawImage(door,t*169,0,169/60,297,x,333-depth*9,next-x+.42,274+depth*28);
    }
    ink.fillStyle='#575b4b';ink.fillRect(1214,440,42,36);ink.fillStyle='#e8d9b4';
    ink.fillRect(1219,448,14,17);ink.fillRect(1236,448,14,17);
    ink.fillStyle='#34372e';ink.font='bold 12px monospace';ink.textAlign='center';ink.textBaseline='middle';
    ink.fillText(dialDigits[0],1226,457);ink.fillText(dialDigits[1],1243,457);
  }
  paint(0);
  let canvas=document.getElementById('roomView');
  let renderer,camera,scene,texture,flat;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
    const half=new THREE.Vector3(2.75,1.66,3.2);
    texture=new THREE.CanvasTexture(plate);texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
    const material=new THREE.ShaderMaterial({
      side:THREE.BackSide,uniforms:{map:{value:texture}},
      vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D map;varying vec3 p;void main(){vec3 n=normalize(p);vec2 uv=vec2(.5+atan(n.x,-n.z)/6.283185307,.5+asin(clamp(n.y,-1.,1.))/3.141592654);gl_FragColor=texture2D(map,uv);}'
    });
    scene=new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(half.x*2,half.y*2,half.z*2),material));
    camera=new THREE.PerspectiveCamera(69,1,.02,15);
    for(const o of musicObjects){
      const a=(o.x/W-.5)*TAU,b=(.5-o.y/H)*Math.PI;
      const v=new THREE.Vector3(Math.sin(a)*Math.cos(b),Math.sin(b),-Math.cos(a)*Math.cos(b));
      o.world=v.clone().multiplyScalar(Math.min(half.x/Math.abs(v.x),half.y/Math.abs(v.y),half.z/Math.abs(v.z)));
    }
  }catch{
    if(renderer)renderer.dispose();renderer=null;
    const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;flat=canvas.getContext('2d');
    if(!flat){onError();return}
  }
  let yaw=(410/W-.5)*TAU,pitch=-.06,x=0,z=0,flatZoom=1,doorOpen=0;
  let width=1,height=1,request=0,last=0,journey=null,drag=null;
  const keys=new Set(),markers=document.getElementById('spots'),position=new Map(),hitAreas=new Map();
  for(const o of musicObjects){
    const b=document.createElement('button');b.type='button';b.className='spot';b.textContent=o.name;
    b.dataset.object=o.id;b.setAttribute('aria-label',o.name+' 살펴보기');b.onclick=()=>{if(!journey)onInspect(o.id)};
    markers.append(b);position.set(o.id,b);
  }
  function draw(){
    const scale=Math.max(width/840,height/610)*flatZoom;
    let originX,originY;
    if(renderer){
      camera.position.set(x,0,z);camera.rotation.set(pitch,-yaw,0,'YXZ');
      camera.updateMatrixWorld();renderer.render(scene,camera);
    }else{
      originX=width/2-(W*(yaw/TAU+.5))*scale;originY=height/2-H*(.5-pitch/Math.PI)*scale;
      for(const k of [-1,0,1])flat.drawImage(plate,originX+k*W*scale,originY,W*scale,H*scale);
    }
    for(const o of musicObjects){
      let px,py,ahead=true;
      if(renderer){const v=o.world.clone().project(camera);px=(v.x+1)*width/2;py=(1-v.y)*height/2;ahead=v.z>0&&v.z<1}
      else{px=width/2+wrap((o.x/W-.5)*TAU-yaw)*W/TAU*scale;py=originY+o.y*scale}
      const b=position.get(o.id);b.hidden=!ahead||px<47||px>width-47||py<65||py>height-82||!!journey||doorOpen===1;
      if(b.hidden)hitAreas.delete(o.id);
      else hitAreas.set(o.id,{px,py,r:Math.max(22,Math.min(width,height)*(o.id==='paper' ? .09 : o.id==='clock' ? .105 : .046))});
      if(!b.hidden){b.style.left=px+'px';b.style.top=(py+Math.min(32,height*.04))+'px'}
    }
    const i=((Math.round(yaw/(Math.PI/2))%4)+4)%4;
    document.getElementById('bearing').textContent=['벽시계 쪽','출입문 쪽','악기 보관대 쪽','피아노 쪽'][i];
  }
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(time){
    request=0;
    const dt=Math.min(.06,(time-last)/1000);last=time;
    if(journey){
      const j=journey,t=clamp((time-j.start)/j.duration,0,1);
      const aimDuration=j.exit ? .43 : 1;
      const f=1-(1-Math.min(1,t/aimDuration))**3;
      yaw=wrap(j.y+wrap(j.target-j.y)*f);pitch=j.p+(j.targetPitch-j.p)*f;
      if(j.exit){
        const d=clamp((t-.24)/.7,0,1);
        const amount=d*d*(3-2*d);
        if(amount!==doorOpen){doorOpen=amount;paint(amount);if(texture)texture.needsUpdate=true}
      }
      if(t===1){journey=null;j.done?.()}
    }else if(keys.size&&onReadyToMove()){
      const h=+keys.has('arrowright')-+keys.has('arrowleft');
      yaw=wrap(yaw+h*dt*1.7);pitch=clamp(pitch+(+keys.has('arrowup')-+keys.has('arrowdown'))*dt,-.8,.8);
      move((+keys.has('w')-+keys.has('s'))*dt*1.15,(+keys.has('d')-+keys.has('a'))*dt*1.15);
    }
    draw();if(journey||keys.size)queue();
  }
  function queue(){if(!request)request=requestAnimationFrame(frame)}
  function move(front,side){
    if(!renderer){flatZoom=clamp(flatZoom+front*.22,.92,1.35);yaw=wrap(yaw+side*.22);return}
    x=clamp(x+Math.sin(yaw)*front+Math.cos(yaw)*side,-.95,.95);
    z=clamp(z-Math.cos(yaw)*front+Math.sin(yaw)*side,-.95,.95);
  }
  function turn(angle){
    if(!onReadyToMove()||journey?.exit)return;
    const from=journey?journey.target:yaw;
    journey={y:yaw,p:pitch,target:from+angle,targetPitch:-.05,start:performance.now(),duration:reduced()?1:340};queue();
  }
  function facingDoor(done){
    keys.clear();drag=null;
    const a=(1350/W-.5)*TAU;
    const distance=2.75/Math.sin(a);
    const target=Math.atan2(distance*Math.sin(a)-x,distance*Math.cos(a)+z);
    journey={exit:true,y:yaw,p:pitch,target,targetPitch:-.05,start:performance.now(),duration:reduced()?1:1550,done};queue();
  }
  function resize(){
    width=canvas.clientWidth;height=canvas.clientHeight;
    if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()}
    else{canvas.width=width;canvas.height=height}
    queue();
  }
  new ResizeObserver(resize).observe(canvas);resize();
  canvas.onpointerdown=e=>{if(e.button!==0||!onReadyToMove()||journey?.exit)return;journey=null;drag={x:e.clientX,y:e.clientY,distance:0};canvas.setPointerCapture(e.pointerId);canvas.focus()};
  canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y,speed=2.45/Math.max(300,Math.min(width,height));yaw=wrap(yaw-dx*speed);pitch=clamp(pitch+dy*speed,-.8,.8);drag={x:e.clientX,y:e.clientY,distance:drag.distance+Math.hypot(dx,dy)};queue()};
  canvas.onpointerup=e=>{
    const tap=drag&&drag.distance<7;drag=null;
    if(!tap||!onReadyToMove())return;
    const box=canvas.getBoundingClientRect();
    for(const [id,h] of hitAreas)if(Math.hypot(e.clientX-box.left-h.px,e.clientY-box.top-h.py)<=h.r){onInspect(id);break}
  };
  canvas.onlostpointercapture=canvas.onpointercancel=()=>{drag=null};
  document.addEventListener('keydown',e=>{
    if(!onReadyToMove()||journey?.exit||e.metaKey||e.ctrlKey||e.altKey)return;
    const k=e.key.toLowerCase();
    if(['w','s','a','d','arrowleft','arrowright','arrowup','arrowdown'].includes(k)){e.preventDefault();journey=null;keys.add(k);queue()}
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();drag=null});
  document.getElementById('left').onclick=()=>turn(-Math.PI/2);
  document.getElementById('right').onclick=()=>turn(Math.PI/2);
  document.getElementById('walk').onclick=()=>{if(onReadyToMove()&&!journey?.exit){move(.50,0);queue()}};
  return {
    facingDoor,
    clearKeys(){keys.clear();drag=null},
    setDigits(digits){dialDigits=digits.slice();paint(doorOpen);if(texture)texture.needsUpdate=true;queue()},
    reset(open=false,digits=[0,0]){
      journey=null;keys.clear();x=z=0;flatZoom=1;pitch=-.06;
      yaw=((open?1350:410)/W-.5)*TAU;doorOpen=open?1:0;
      dialDigits=digits.slice();
      paint(doorOpen);if(texture)texture.needsUpdate=true;queue();
    }
  };
}
