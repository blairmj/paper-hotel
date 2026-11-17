// A rectangular classroom in metres. The camera and the clue labels share these coordinates.
const studio = {
  width: 11.6, depth: 9.2, height: 3.25,
  start: [1.52, 1.62, 3.65],
  door: [3.26, 1.22, -4.50],
  seats: [[-3.6,-.55],[-2.38,-.27],[-1.23,-.20],[1.22,-.20],[2.4,-.27],[3.6,-.55],[-3.60,1.20],[-2.37,1.48],[-1.22,1.55],[1.22,1.55],[2.37,1.48],[3.6,1.20]],
  objects: [
    {id:'lock', name:'문 다이얼', xyz:[2.18, 1.39, -4.48]},
    {id:'clock', name:'벽시계', xyz:[.62, 2.17, -4.47]},
    {id:'paper', name:'피아노 악보', xyz:[-2.92, 1.23, -3.22]}
  ]
};

function buildMusicStudio(scene) {
  const room = group(scene), front = group(room,0,0,-4.6);
  const plaster=new THREE.MeshStandardMaterial({color:0xf1f2f2,roughness:.98});
  const steel=0x929ca4, charcoal=0x2b3138, oak=0xcab28a;
  function wall(parent,x,w) {
    box(parent,x,1.625,0,w,3.25,.12,plaster);
    box(parent,x,.055,.075,w,.11,.04,0x92989b);
  }
  wall(front,-1.62,8.36); wall(front,4.85,1.90);
  box(front,3.25,2.775,0,1.38,.95,.12,plaster);
  [{x:-5.8,z:0,angle:Math.PI/2,w:9.2},{x:5.8,z:0,angle:-Math.PI/2,w:9.2},{x:0,z:4.6,angle:Math.PI,w:11.6}].forEach(side=>{
    const face=group(room,side.x,0,side.z); face.rotation.y=side.angle; wall(face,0,side.w);
  });
  const timber=studioFloor();
  box(room,0,-.065,0,11.7,.13,9.3,timber);
  box(room,0,3.30,0,11.7,.10,9.3,plaster);
  for(let x=-5.4;x<5.8;x+=1.2)box(room,x,3.241,0,.011,.01,9.2,0xd0d4d7);
  for(let z=-4.1;z<4.6;z+=1.2)box(room,0,3.24,z,11.6,.01,.012,0xd0d4d7);
  const diffuser=new THREE.MeshBasicMaterial({color:0xfffefa});
  for(const x of [-3.3,0,3.3])for(const z of [-2.5,1.7]){
    box(room,x,3.215,z,1.65,.05,.36,steel);
    box(room,x,3.181,z,1.57,.02,.30,diffuser);
  }
  // The corridor is behind a real opening in the front wall.
  box(front,3.26,-.06,-1.6,2.7,.11,3.2,0xb5bfc6);
  box(front,3.26,1.38,-3.14,3.0,2.9,.12,0xeceeed);
  box(front,3.26,.54,-3.06,3.0,1.08,.07,0xb1c1c3);
  for(const x of [2.57,3.95])box(front,x,1.18,0,.10,2.36,.22,0x88959b);
  box(front,3.26,2.34,0,1.48,.11,.22,0x88959b);
  const hinge=group(front,3.90,0,.02);
  box(hinge,-.64,1.145,0,1.28,2.29,.10,0x58778b);
  box(hinge,-.64,1.145,.057,1.17,2.18,.02,0x6b889a);
  box(hinge,-1.10,1.03,.10,.14,.25,.044,steel);
  box(hinge,-1.01,1.07,.153,.25,.038,.05,charcoal);
  textPlate(hinge,-.64,1.79,.075,.42,.17,'203','#eff2f3','#35434d');
  const lock=group(front,2.18,1.39,.085);
  box(lock,0,0,0,.39,.31,.08,charcoal);
  const digits=document.createElement('canvas');digits.width=192;digits.height=100;
  const dialTexture=new THREE.CanvasTexture(digits);dialTexture.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.Mesh(new THREE.PlaneGeometry(.32,.20),new THREE.MeshBasicMaterial({map:dialTexture}));
  face.position.z=.05;lock.add(face);
  function setDigits(values){
    const ctx=digits.getContext('2d');ctx.fillStyle='#26313a';ctx.fillRect(0,0,192,100);
    ctx.font='bold 70px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    values.forEach((value,i)=>{ctx.fillStyle='#f1f3f1';ctx.fillRect(9+i*92,6,80,88);ctx.fillStyle='#202a31';ctx.fillText(value,49+i*92,54)});
    dialTexture.needsUpdate=true;
  }
  setDigits([0,0]);
  frontDisc(front,.62,2.17,.10,.27,.08,charcoal);
  print(front,.62,2.17,.148,.51,.51,(c,w,h)=>{
    const m=w/2;c.translate(m,h/2);c.fillStyle='#f6f7f6';c.beginPath();c.arc(0,0,m,0,2*Math.PI);c.fill();
    c.textAlign='center';c.textBaseline='middle';c.fillStyle='#222a31';c.font='500 38px sans-serif';
    for(let n=1;n<=12;n++){const a=n*Math.PI/6;c.fillText(n,Math.sin(a)*m*.79,-Math.cos(a)*m*.79)}
    c.strokeStyle='#202931';c.lineCap='round';
    for(const [end,width] of [[-m*.62,8],[m*.48,13]]){c.lineWidth=width;c.beginPath();c.moveTo(0,0);c.lineTo(0,end);c.stroke()}
    c.beginPath();c.arc(0,0,10,0,2*Math.PI);c.fill();
  });
  // A teaching board above the piano. The staves are part of the room, not another puzzle.
  box(front,-2.9,1.98,.11,3.55,1.14,.10,0xbac3c9);
  // The two wall speakers flank the teaching board.
  for(const x of [-5.08,-.72]){
    box(front,x,2.45,.15,.24,.38,.16,charcoal);
    frontDisc(front,x,2.40,.24,.077,.02,0x56616a);
    frontDisc(front,x,2.54,.24,.036,.02,0x82909b);
  }
  print(front,-2.9,1.98,.167,3.44,1.03,(c,w,h)=>{
    c.fillStyle='#f3f5f3';c.fillRect(0,0,w,h);c.strokeStyle='#819399';c.lineWidth=1.3;
    for(const y of [.19,.61])for(let i=0;i<5;i++){const top=(y+i*.044)*h;c.beginPath();c.moveTo(w*.06,top);c.lineTo(w*.94,top);c.stroke()}
    c.fillStyle='#394751';
    [2,1,0,1,2,2,2].forEach((n,i)=>{const x=w*(.13+i*.10),y=h*(.32+n*.021);c.beginPath();c.ellipse(x,y,4,2.9,-.35,0,Math.PI*2);c.fill();c.fillRect(x+3,y-15,1.3,15)});
  },3.4);
  const upright=group(room,-2.92,0,-3.65);
  const lacquer=0x232930;
  box(upright,0,.66,-.05,1.70,1.30,.55,lacquer);
  box(upright,0,1.34,-.05,1.76,.07,.61,0x30363c);
  box(upright,0,.78,.36,1.70,.12,.46,lacquer);
  for(let i=0;i<35;i++){
    const x=(i-17)*.045;box(upright,x,.855,.37,.043,.04,.32,0xf9f8f2);
    if(![2,6].includes(i%7)&&i<34)box(upright,x+.022,.891,.30,.027,.045,.19,0x20242a);
  }
  for(const x of [-.78,.78])box(upright,x,.39,.48,.09,.77,.09,lacquer);
  for(const x of [-.09,0,.09])box(upright,x,.075,.29,.045,.045,.17,0xab9266);
  box(upright,0,1.16,.27,.72,.37,.045,0x171e24);
  musicScore(upright,0,1.19,.31,.61,.34);
  box(upright,0,.48,.97,.86,.105,.36,0x323940);
  for(const x of [-.32,.32])for(const z of [.85,1.09])box(upright,x,.23,z,.05,.46,.05,charcoal);
  function chairAndStand(x,z,angle,hasStand){
    const seat=group(room,x,0,z);seat.rotation.y=angle;
    box(seat,0,.445,0,.48,.055,.44,0xc3a882);
    const back=box(seat,0,.72,.214,.48,.29,.046,0xd0b690);back.rotation.x=.11;
    for(const dx of [-.191,.191])for(const dz of [-.167,.167])
      box(seat,dx,dz>0 ? .36 : .22,dz,.032,dz>0 ? .72 : .44,.032,0x64747b);
    if(!hasStand)return;
    const stand=group(seat,-.04,0,-.49);
    cone(stand,0,.57,0,.014,.021,1.05,charcoal,10);
    for(let i=0;i<3;i++){const foot=group(stand);foot.rotation.y=i*2.094;const leg=box(foot,0,.074,.10,.021,.022,.253,charcoal);leg.rotation.x=.45}
    const tray=group(stand,0,1.02,0);tray.rotation.x=-.29;
    box(tray,0,0,0,.45,.29,.021,0x34424b);box(tray,0,-.14,.028,.455,.023,.075,charcoal);
    if(x<0)musicScore(tray,0,.012,.016,.36,.24);
  }
  for(const [x,z] of studio.seats)
    chairAndStand(x,z,x*.075,z<0);
  // Storage wall for rhythm instruments and strings.
  const rear=group(room,0,0,4.40);rear.rotation.y=Math.PI;
  for(let j=0;j<3;j++){
    const x=-3.35+j*1.20;
    box(rear,x,.64,0,1.16,1.27,.48,oak);
    box(rear,x,.83,.248,1.06,.64,.018,0x75858a);
    box(rear,x,.80,.33,1.06,.05,.26,0xcebaa0);
    box(rear,x,.275,.252,1.08,.43,.03,0xaaaba6);
    box(rear,x,.40,.285,.16,.025,.04,steel);
    for(let i=0;i<3;i++)box(rear,x-.33+i*.28,.95,.34,.20,.21,.17,[0x647e8c,0xc4aa80,0xb26d5e][(i+j)%3]);
  }
  const strings=group(room,5.60,0,.60);strings.rotation.y=-Math.PI/2;
  box(strings,0,1.72,-.01,2.14,.102,.10,oak);
  function guitar(x,color) {
    const g=group(strings,x,.74,.10);const outline=new THREE.Shape();
    outline.moveTo(0,-.31);outline.bezierCurveTo(-.27,-.32,-.32,-.09,-.19,.065);
    outline.bezierCurveTo(-.13,.15,-.26,.23,-.16,.32);outline.bezierCurveTo(-.07,.39,.07,.39,.16,.32);
    outline.bezierCurveTo(.26,.23,.13,.15,.19,.065);outline.bezierCurveTo(.32,-.09,.27,-.32,0,-.31);
    const body=new THREE.ExtrudeGeometry(outline,{depth:.09,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.014,bevelThickness:.01});
    mesh(g,body,color,0,0,0);frontDisc(g,0,.14,.106,.072,.012,charcoal);
    box(g,0,.58,.07,.085,.53,.06,0x534437);box(g,0,.9,.057,.128,.19,.07,color);
    box(g,0,-.13,.109,.17,.045,.02,0x554338);
    for(let i=0;i<6;i++)box(g,(i-2.5)*.010,.34,.126,.002,.95,.002,steel);
  }
  guitar(-.61,0xc59150);guitar(0,0xb97f4b);guitar(.61,0xd5a765);
  const percussion=group(room,-5.05,0,.60);percussion.rotation.y=Math.PI/2;
  box(percussion,0,.75,0,1.45,.095,.63,0x5c666c);
  for(const x of [-.58,.58])for(const z of [-.22,.22])box(percussion,x,.37,z,.045,.74,.045,steel);
  for(let i=0;i<13;i++){
    const x=(i-6)*.10;box(percussion,x,.83,0,.09,.052,.58-i*.018,0x9c5b42);
    cone(percussion,x,.55,0,.03,.03,.43-i*.014,0xb4a276,12);
  }
  const drum=group(room,-4.7,0,2.55);drum.rotation.z=-.12;
  frontDisc(drum,0,.63,0,.49,.51,0x865a47);
  frontDisc(drum,0,.63,.265,.49,.025,steel);frontDisc(drum,0,.63,.282,.455,.018,0xe5e6df);
  for(const x of [-.40,.40])box(drum,x,.23,0,.055,.46,.51,charcoal);
  for(const side of [-1,1])for(const z of [-2.7,-1.5,2.9]){
    const panel=box(room,side*5.71,1.86,z,.10,1.17,.90,0xaebdbd);panel.receiveShadow=true;
  }
  scene.add(new THREE.HemisphereLight(0xf7faff,0xe0d9d2,1.83));
  const key=new THREE.DirectionalLight(0xf9fbff,1.67);key.position.set(-2.0,9.4,1.7);scene.add(key);
  key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-8,right:8,bottom:-8,top:8,near:.5,far:24});
  key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.023;key.shadow.bias=-.00025;
  // The roof does not block the diffuse ceiling lighting.
  room.traverse(o=>{if(o.isMesh&&o.position.y>3.15)o.castShadow=false});
  batchStudio(room,hinge);
  return {hinge,setDigits};
}

function studioFloor(){
  const c=document.createElement('canvas');c.width=1024;c.height=512;
  const g=c.getContext('2d');let seed=247;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  for(let row=0;row<12;row++){
    const y=row*512/12,shift=row%2*128;
    for(let i=-1;i<5;i++){
      const x=i*256+shift,light=73+random()*6;
      g.fillStyle='hsl(35 23% '+light+'%)';g.fillRect(x,y,256,44);
      for(let k=0;k<36;k++){g.fillStyle='rgba(91,77,58,.045)';g.fillRect(x+random()*200,y+random()*42,12+random()*46,.7)}
      g.strokeStyle='rgba(101,94,82,.16)';g.strokeRect(x,y,256,512/12);
    }
  }
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(2.4,3.1);map.anisotropy=4;
  return new THREE.MeshStandardMaterial({map,roughness:.78});
}

function batchStudio(root,movingDoor){
  root.updateWorldMatrix(true,true);
  const batches=new Map();
  function gather(node){
    if(node===movingDoor)return;
    if(node.isMesh&&!node.material.transparent){
      const key=[node.geometry.uuid,node.material.uuid,node.castShadow].join('/');
      if(!batches.has(key))batches.set(key,[]);
      batches.get(key).push(node);
    }
    node.children.forEach(gather);
  }
  gather(root);
  for(const nodes of batches.values()){
    if(nodes.length<3)continue;
    const first=nodes[0],batch=new THREE.InstancedMesh(first.geometry,first.material,nodes.length);
    nodes.forEach((n,i)=>{batch.setMatrixAt(i,n.matrixWorld);n.removeFromParent()});
    batch.castShadow=first.castShadow;batch.receiveShadow=true;
    root.add(batch);
  }
}
