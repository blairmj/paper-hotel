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

function buildMusicStudio(scene,images) {
  const room = group(scene), front = group(room,0,0,-4.6);
  const finish=makeStudioFinishes(images,scene);
  const {plaster,steel,wood:oak,darkMetal:charcoal}=finish;
  function wall(parent,x,w) {
    box(parent,x,1.625,0,w,3.25,.12,plaster);
    box(parent,x,.064,.075,w,.128,.043,finish.trim);
    box(parent,x,3.19,.067,w,.06,.029,0xdad1bd);
  }
  wall(front,-1.62,8.36); wall(front,4.85,1.90);
  box(front,3.25,2.775,0,1.38,.95,.12,plaster);
  box(front,1.105,1.64,.065,2.90,3.10,.022,finish.sage);
  [{x:-5.8,z:0,angle:Math.PI/2,w:9.2},{x:5.8,z:0,angle:-Math.PI/2,w:9.2},{x:0,z:4.6,angle:Math.PI,w:11.6}].forEach(side=>{
    const face=group(room,side.x,0,side.z); face.rotation.y=side.angle; wall(face,0,side.w);
    box(face,0,.48,.067,side.w,.74,.019,finish.sage);
    box(face,0,.865,.081,side.w,.032,.036,finish.trim);
  });
  box(room,0,-.065,0,11.7,.13,9.3,finish.floor);
  studioContactShadows(room);
  box(room,0,3.30,0,11.7,.10,9.3,studioCeiling());
  for(let x=-5.4;x<5.8;x+=1.2)box(room,x,3.241,0,.011,.01,9.2,0xd0d4d7);
  for(let z=-4.1;z<4.6;z+=1.2)box(room,0,3.24,z,11.6,.01,.012,0xd0d4d7);
  const diffuser=new THREE.MeshBasicMaterial({color:0xfffefa});
  for(const x of [-3.3,0,3.3])for(const z of [-2.5,1.7]){
    box(room,x,3.215,z,1.65,.05,.36,0xb3ac9c);
    box(room,x,3.181,z,1.57,.02,.30,diffuser);
    const lamp=new THREE.PointLight(0xfff1d9,7.0,9,2);
    lamp.position.set(x,2.96,z);scene.add(lamp);
  }
  // The corridor is behind a real opening in the front wall.
  box(front,3.26,-.06,-1.6,2.7,.11,3.2,0xb5bfc6);
  box(front,3.26,1.38,-3.14,3.0,2.9,.12,0xeceeed);
  box(front,3.26,.54,-3.06,3.0,1.08,.07,0xb1c1c3);
  for(const x of [2.57,3.95])box(front,x,1.18,0,.10,2.36,.22,finish.trim);
  box(front,3.26,2.34,0,1.48,.11,.22,finish.trim);
  const hinge=group(front,3.90,0,.02);
  box(hinge,-.64,1.145,0,1.28,2.29,.10,0x97692c);
  box(hinge,-.64,1.145,.057,1.235,2.235,.02,finish.door);
  for(const y of [.22,1.13,2.05])studioRod(hinge,[-.006,y-.045,.072],[-.006,y+.045,.072],.014,steel);
  frontDisc(hinge,-1.08,1.06,.093,.054,.032,steel);
  studioRod(hinge,[-1.08,1.06,.102],[-1.08,1.06,.18],.018,steel);
  studioRod(hinge,[-1.08,1.06,.175],[-.94,1.06,.175],.017,steel);
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
  box(front,-2.9,1.58,.065,5.12,3.10,.037,0x9b7853);
  for(let i=0;i<64;i++)
    box(front,-5.42+i*.080,1.58,.094,.052,3.10,.030,finish.wood);
  box(front,-2.9,1.98,.15,3.55,1.14,.084,finish.trim);
  // The two wall speakers flank the teaching board.
  for(const x of [-5.08,-.72]){
    box(front,x,2.45,.15,.24,.38,.16,charcoal);
    frontDisc(front,x,2.40,.24,.077,.02,0x56616a);
    frontDisc(front,x,2.54,.24,.036,.02,0x82909b);
  }
  print(front,-2.9,1.98,.198,3.44,1.03,(c,w,h)=>{
    c.fillStyle='#f3f5f3';c.fillRect(0,0,w,h);c.strokeStyle='#819399';c.lineWidth=1.3;
    for(const y of [.19,.61])for(let i=0;i<5;i++){const top=(y+i*.044)*h;c.beginPath();c.moveTo(w*.06,top);c.lineTo(w*.94,top);c.stroke()}
    c.fillStyle='#394751';
    [2,1,0,1,2,2,2].forEach((n,i)=>{const x=w*(.13+i*.10),y=h*(.32+n*.021);c.beginPath();c.ellipse(x,y,4,2.9,-.35,0,Math.PI*2);c.fill();c.fillRect(x+3,y-15,1.3,15)});
  },3.4);
  const upright=group(room,-2.92,0,-3.65);
  const lacquer=finish.piano;
  box(upright,0,.66,-.05,1.70,1.30,.55,lacquer);
  box(upright,0,1.34,-.05,1.76,.07,.61,finish.trim);
  box(upright,0,.41,.235,1.43,.53,.028,finish.trim);
  box(upright,0,.41,.254,1.38,.49,.017,lacquer);
  box(upright,0,1.10,.234,1.53,.35,.024,finish.wood);
  for(const x of [-.80,.80]){
    box(upright,x,.87,.34,.085,.19,.52,lacquer);
    frontDisc(upright,x,.064,.45,.041,.045,finish.brass);
  }
  box(upright,0,.78,.36,1.70,.12,.46,lacquer);
  for(let i=0;i<52;i++){
    const x=(i-25.5)*.0287;box(upright,x,.855,.37,.028,.040,.32,0xf7f4e9);
    if(![1,4].includes(i%7)&&i<51)box(upright,x+.014,.889,.30,.018,.044,.19,0x171a1b);
  }
  for(const x of [-.78,.78])box(upright,x,.39,.48,.09,.77,.09,lacquer);
  for(const x of [-.09,0,.09])box(upright,x,.075,.29,.045,.045,.17,0xab9266);
  box(upright,0,1.16,.27,.72,.37,.045,lacquer);
  box(upright,0,.991,.33,.76,.022,.087,finish.trim);
  studioScore(upright,0,1.19,.31,.61,.34);
  box(upright,0,.48,.97,.86,.105,.36,finish.felt);
  for(const x of [-.32,.32])for(const z of [.85,1.09])box(upright,x,.23,z,.05,.46,.05,charcoal);
  function chairAndStand(x,z,angle,hasStand){
    const seat=group(room,x,0,z);seat.rotation.y=angle;
    studioPly(seat,false,finish.wood);studioPly(seat,true,finish.wood);
    for(const side of [-1,1]){
      for(const direction of [-1,1]){
        const foot=[side*.210,.031,direction*.198],top=[side*.177,.422,direction*.147];
        studioRod(seat,foot,top,.0135,steel);
        sphere(seat,foot[0],.023,foot[2],.016,.024,.016,charcoal);
      }
      studioRod(seat,[side*.177,.408,.147],[side*.177,.724,.228],.014,steel);
      frontDisc(seat,side*.177,.697,.244,.011,.013,steel,12);
    }
    studioRod(seat,[-.176,.388,-.142],[.176,.388,-.142],.010,steel);
    if(!hasStand)return;
    const stand=group(seat,-.04,0,-.49);
    cone(stand,0,.57,0,.014,.021,1.05,charcoal,10);
    for(let i=0;i<3;i++){const foot=group(stand);foot.rotation.y=i*2.094;const leg=box(foot,0,.074,.10,.021,.022,.253,charcoal);leg.rotation.x=.45}
    const tray=group(stand,0,1.02,0);tray.rotation.x=-.29;
    studioStandTray(tray,charcoal);box(tray,0,-.14,.028,.455,.018,.075,charcoal);
    if(x<0)studioScore(tray,0,.012,.023,.36,.24);
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
    mesh(g,geometry('studioRosette',()=>new THREE.TorusGeometry(.079,.004,6,40)),finish.brass,0,.14,.111);
    for(let k=0;k<11;k++)box(g,0,.33+k*.039,.110,.081,.003,.003,steel);
    for(const s of [-1,1])for(const y of [.86,.91,.96])
      studioRod(g,[s*.057,y,.057],[s*.086,y,.057],.009,steel);
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
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5,x=.47*Math.cos(a),y=.63+.47*Math.sin(a);
    studioRod(drum,[x,y,-.25],[x,y,.272],.011,steel);
  }
  for(const x of [-.40,.40])box(drum,x,.23,0,.055,.46,.51,charcoal);
  for(const side of [-1,1])for(const z of [-2.7,-1.5,2.9]){
    box(room,side*5.71,1.86,z,.10,1.17,.90,finish.felt);
  }
  scene.add(new THREE.HemisphereLight(0xfffaf2,0xd5c4ac,.67));
  const key=new THREE.DirectionalLight(0xfff2d8,.93);key.position.set(-2.0,9.4,1.7);scene.add(key);
  key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-8,right:8,bottom:-8,top:8,near:.5,far:24});
  key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.011;key.shadow.bias=-.00025;
  // The roof does not block the diffuse ceiling lighting.
  room.traverse(o=>{if(o.isMesh&&o.position.y>3.15)o.castShadow=false});
  batchStudio(room,hinge);
  return {hinge,setDigits};
}

function studioCeiling(){
  const tile=document.createElement('canvas');tile.width=tile.height=192;
  const c=tile.getContext('2d');c.fillStyle='#f2f1e9';c.fillRect(0,0,192,192);
  let seed=79;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  for(let i=0;i<3200;i++){
    c.fillStyle='rgba(85,82,71,'+(.04+random()*.22)+')';
    c.fillRect(random()*192,random()*192,.5+random()*1.6,.5+random()*1.4);
  }
  const t=new THREE.CanvasTexture(tile);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(12,9);t.anisotropy=4;
  return new THREE.MeshStandardMaterial({map:t,roughness:1,emissive:0x322f2a,emissiveIntensity:.5});
}

function studioContactShadows(room){
  const width=studio.width,depth=studio.depth;
  const map=document.createElement('canvas');map.width=1280;map.height=1024;
  const c=map.getContext('2d');c.scale(map.width/width,map.height/depth);c.translate(width/2,depth/2);
  function pool(x,z,rx,rz,opacity){
    c.save();c.translate(x,z);c.scale(rx,rz);
    const shade=c.createRadialGradient(0,0,.06,0,0,1);
    shade.addColorStop(0,'rgba(41,31,18,'+opacity+')');shade.addColorStop(.53,'rgba(41,31,18,'+(opacity*.57)+')');
    shade.addColorStop(1,'rgba(41,31,18,0)');c.fillStyle=shade;c.fillRect(-1,-1,2,2);c.restore();
  }
  for(const [x,z] of studio.seats){
    pool(x,z,.42,.44,.33);
    const angle=x*.075;
    for(const a of [-.21,.21])for(const b of [-.198,.198]){
      pool(x+a*Math.cos(angle)+b*Math.sin(angle),z-a*Math.sin(angle)+b*Math.cos(angle),.067,.067,.50);
    }
    if(z<0)pool(x-.04,z-.49,.24,.24,.24);
  }
  pool(-2.92,-3.65,1.25,.76,.57);pool(-2.92,-2.68,.68,.40,.32);
  pool(-5.05,.60,.7,1,.38);pool(-4.7,2.55,.70,.47,.43);
  for(let i=0;i<3;i++)pool(3.35-i*1.2,4.32,.98,.64,.44);
  for(const [x,z,endX,endZ] of [[-width/2,0,-width/2+.42,0],[width/2,0,width/2-.42,0],[0,-depth/2,0,-depth/2+.35],[0,depth/2,0,depth/2-.35]]){
    const g=c.createLinearGradient(x,z,endX,endZ);g.addColorStop(0,'rgba(50,40,30,.30)');g.addColorStop(.34,'rgba(50,40,30,.11)');g.addColorStop(1,'rgba(50,40,30,0)');
    c.fillStyle=g;c.fillRect(-width/2,-depth/2,width,depth);
  }
  const t=new THREE.CanvasTexture(map);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  const layer=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  layer.rotation.x=-Math.PI/2;layer.position.y=.002;room.add(layer);
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
