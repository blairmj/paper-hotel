'use strict';

// Pixel locations on the hand-finished front illustration. Keep the scene art and
// its interactive objects registered even when the player walks or changes lens.
const musicDesignPreview = new URLSearchParams(location.search).get('preview') === 'music-room';
document.body.classList.add('design-preview');
const paintedRoom = (() => {
  const eyeHeight = 1.55;
  const focal = 1774 / (2 * Math.tan(53 * Math.PI / 180));
  function point(x, y, depth = 8.08) {
    return [(x - 887) * depth / focal, eyeHeight - (y - 360) * depth / focal, -depth];
  }
  function surface(x, y, width, height, depth) {
    return {center: point(x, y, depth), width: width * depth / focal, height: height * depth / focal};
  }
  const leaf = surface(1239.3, 397.7, 117.9, 183.8, 8.075);
  const clock = surface(930, 339, 58, 58, 8.11);
  const lock = surface(1147, 397, 40, 29, 8.11);
  const paper = point(592, 406, 8.105);
  return {
    start: [0, eyeHeight, 1.1], leaf, clock, lock, door: leaf.center,
    targets: [
      {id: 'lock', name: '문 다이얼', xyz: lock.center},
      {id: 'clock', name: '벽시계', xyz: clock.center},
      {id: 'paper', name: '피아노 악보', xyz: paper}
    ],
    stops: [point(1042,375), [5,1.55,0], [0,1.5,4], [-6,1.35,-1], paper],
    firstView: point(895,428), portraitView: point(1045,380)
  };
})();

async function studioImage(name) {
  const image=new Image();
  image.src='rooms/music-art/studio/'+name+'.webp';
  await image.decode();
  return image;
}

function clockArtwork() {
  const image = document.createElement('canvas');
  image.width=image.height=320;
  const g=image.getContext('2d'),r=143;
  g.translate(159,155);
  g.shadowColor='rgba(48,39,27,.38)';g.shadowBlur=7;g.shadowOffsetY=4;
  let light=g.createLinearGradient(-110,-135,85,145);
  light.addColorStop(0,'#979d87');light.addColorStop(.35,'#596757');light.addColorStop(1,'#37483c');
  g.fillStyle=light;g.beginPath();g.arc(0,0,r,0,2*Math.PI);g.fill();g.strokeStyle='#d6b77a';g.lineWidth=5;g.stroke();
  g.shadowColor='transparent';
  light=g.createRadialGradient(-45,-80,8,0,0,138);
  light.addColorStop(0,'#fffcf2');light.addColorStop(.92,'#eee9d7');light.addColorStop(1,'#cdc6ae');
  g.fillStyle=light;g.beginPath();g.arc(0,0,134,0,2*Math.PI);g.fill();
  g.fillStyle='#3a4036';g.textAlign='center';g.textBaseline='middle';g.font='20px Arial,sans-serif';
  for(let i=0;i<60;i++){
    const a=i*Math.PI/30;
    g.save();g.rotate(a);g.fillRect(-.8,-127,i%5===0?2.4:1.4,i%5===0?7:3);g.restore();
    if(i%5===0)g.fillText(i===0?12:i/5,104*Math.sin(a),-104*Math.cos(a)+1);
  }
  g.strokeStyle='#363a34';g.lineCap='round';
  for(const [length,weight] of [[-91,5],[71,7]]){
    g.lineWidth=weight;g.beginPath();g.moveTo(0,0);g.lineTo(0,length);g.stroke();
  }
  g.fillStyle='#74634e';g.beginPath();g.arc(0,0,5.5,0,2*Math.PI);g.fill();
  {
    g.save();g.beginPath();g.arc(0,0,132,0,2*Math.PI);g.clip();
    const glass=g.createLinearGradient(-82,-115,93,84);
    glass.addColorStop(0,'#ffffff00');glass.addColorStop(.30,'#ffffff38');
    glass.addColorStop(.32,'#ffffff07');glass.addColorStop(1,'#ffffff00');
    g.fillStyle=glass;g.fillRect(-135,-135,270,270);g.restore();
  }
  return image;
}

function dialArtwork(values) {
  const img=document.createElement('canvas');img.width=240;img.height=176;
  const g=img.getContext('2d');
  const body=g.createLinearGradient(0,0,196,165);
  body.addColorStop(0,'#637364');body.addColorStop(.52,'#516356');body.addColorStop(1,'#38473a');
  g.shadowColor='#40382a66';g.shadowOffsetY=4;g.shadowBlur=5;g.fillStyle=body;
  g.beginPath();g.roundRect(5,4,230,164,13);g.fill();g.shadowColor='transparent';g.strokeStyle='#ceac6d';g.lineWidth=6;g.stroke();
  {
    g.save();g.clip();g.lineWidth=.7;
    for(let y=9;y<162;y+=2){
      g.strokeStyle=y%5===0?'#eef1dc30':'#202c261c';g.beginPath();g.moveTo(8,y);g.lineTo(231,y);g.stroke();
    }
    g.restore();
  }
  g.textAlign='center';g.textBaseline='middle';g.font='600 68px Georgia,serif';
  for(let i=0;i<2;i++){
    const x=37+i*92,roll=g.createLinearGradient(0,35,0,136);
    roll.addColorStop(0,'#b4ab96');roll.addColorStop(.35,'#f3eedc');roll.addColorStop(.67,'#f0ead8');roll.addColorStop(1,'#aaa18b');
    g.fillStyle=roll;g.fillRect(x,35,73,99);g.fillStyle='#363a34';g.fillText(values[i],x+36,87);
  }
  for(const x of [16,223])for(const y of [15,156]){
    g.fillStyle='#a5a48d';g.beginPath();g.arc(x,y,3.5,0,2*Math.PI);g.fill();
  }
  return img;
}

function imageMap(img){
  const texture=new THREE.Texture(img);
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true;
  return texture;
}

function tracingPaper() {
  const paper=document.createElement('canvas');
  paper.width=270;paper.height=165;
  const g=paper.getContext('2d');
  g.shadowColor='#453a2866';g.shadowOffsetY=4;g.shadowBlur=5;
  g.fillStyle='rgba(253,255,241,.95)';
  g.beginPath();g.moveTo(12,21);g.lineTo(238,10);g.lineTo(256,111);
  g.lineTo(229,144);g.lineTo(17,152);g.closePath();g.fill();
  g.shadowColor='transparent';g.strokeStyle='rgba(101,115,103,.36)';g.lineWidth=2;
  for(let i=0;i<5;i++){g.beginPath();g.moveTo(30,55+i*11);g.lineTo(233,45+i*11);g.stroke()}
  g.strokeStyle='#455856';g.lineWidth=3;
  for(const [x,y,dx,dy] of [[80,65,-18,15],[145,63,17,-13],[85,112,17,12],[149,111,-16,-13]]){
    g.beginPath();g.moveTo(x+dx,y);g.lineTo(x,y);g.lineTo(x,y+dy);g.stroke();
  }
  g.fillStyle='#397e71';g.beginPath();g.moveTo(23,14);g.lineTo(59,12);g.lineTo(61,53);g.lineTo(46,45);g.lineTo(28,54);g.closePath();g.fill();
  g.fillStyle='#fffef2';g.beginPath();g.moveTo(256,111);g.quadraticCurveTo(237,127,225,124);
  g.quadraticCurveTo(230,136,229,144);g.closePath();g.fill();
  return paper;
}

function studioCeiling() {
  const img=document.createElement('canvas');img.width=1500;img.height=1050;
  const g=img.getContext('2d');
  g.fillStyle='#d3bfa7';g.fillRect(0,0,img.width,img.height);
  for(let y=0;y<1050;y+=105) for(let x=0;x<1500;x+=150){
    g.strokeStyle='#b7a795';g.lineWidth=1.5;g.strokeRect(x+.75,y+.75,150,105);
    g.fillStyle='rgba(255,255,255,.03)';if((x/150+y/105)%3===0)g.fillRect(x+2,y+2,148,103);
  }
  for(const y of [165,500,838])for(const x of [240,750,1250]){
    g.shadowColor='#fff5d7';g.shadowBlur=14;g.fillStyle='#fffcf4';g.fillRect(x-72,y-5,144,10);
  }
  return img;
}

function studioFloor() {
  const tile=document.createElement('canvas');tile.width=768;tile.height=512;
  const g=tile.getContext('2d');
  g.fillStyle='#c7c0b7';g.fillRect(0,0,768,512);
  // A single matte sheet with only the soft shadow at each skirting board.
  for(const [x0,y0,x1,y1] of [[0,0,20,0],[768,0,748,0],[0,0,0,17],[0,512,0,495]]){
    const shadow=g.createLinearGradient(x0,y0,x1,y1);
    shadow.addColorStop(0,'rgba(57,48,39,.14)');shadow.addColorStop(1,'rgba(57,48,39,0)');
    g.fillStyle=shadow;g.fillRect(0,0,768,512);
  }
  return tile;
}

async function buildPaintedRoom(scene) {
  const wallNames=['front','back','left','right'];
  const [walls,door]=await Promise.all([Promise.all(wallNames.map(studioImage)),(async()=>{
    const image=new Image();image.src='rooms/music-art/door.webp';await image.decode();return image;
  })()]);
  const width=19,height=3.12,front=-8.14,back=5.4,depth=back-front,mid=(back+front)/2;
  function panel(map,w,h,xyz,transparent=false,color=0xffffff){
    const material=new THREE.MeshBasicMaterial({map,color,transparent,side:THREE.DoubleSide,toneMapped:false,alphaTest:transparent ? .03 : 0});
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
    mesh.position.fromArray(xyz);scene.add(mesh);return mesh;
  }
  // Every entire wall is a rigid plane with its own straight-on elevation.
  // No cabinet or drum texture straddles a wall/floor projection seam.
  panel(imageMap(walls[0]),width,height,[0,height/2,front]);
  panel(imageMap(walls[1]),width,height,[0,height/2,back]).rotation.y=Math.PI;
  panel(imageMap(walls[2]),depth,height,[-width/2,height/2,mid]).rotation.y=Math.PI/2;
  panel(imageMap(walls[3]),depth,height,[width/2,height/2,mid]).rotation.y=-Math.PI/2;
  panel(imageMap(studioFloor()),width,depth,[0,-.004,mid]).rotation.x=-Math.PI/2;
  panel(imageMap(studioCeiling()),width,depth,[0,height,mid]).rotation.x=Math.PI/2;

  const updateViews=await studioSeats(scene,panel);
  function place(surface,art){
    return panel(imageMap(art),surface.width,surface.height,surface.center,true);
  }
  place(paintedRoom.clock,clockArtwork());
  const dial=place(paintedRoom.lock,dialArtwork([0,0]));
  const paper=place({center:paintedRoom.targets[2].xyz,width:.75,height:.44},tracingPaper());

  // The skirting in the front elevation is rectified to floor level. Match
  // the photographed inner lintel with the alpha edge of the hinged leaf.
  const focal=1774/(2*Math.tan(53*Math.PI/180)),d=8.122;
  const pivot=1296.45,leafWidth=114.25*d/focal,topWorld=1.55-(307.10-360)*d/focal;
  const wood=document.createElement('canvas');wood.width=512;wood.height=800;
  const brush=wood.getContext('2d');
  for(let x=0;x<wood.width;x++){
    const u=x/(wood.width-1),top=311.65-4.5*u-2.05*Math.sin(Math.PI*u);
    const inset=Math.max(0,(top-307.10)*d/focal/topWorld*wood.height);
    brush.drawImage(door,u*(door.width-1),0,Math.max(1,door.width/512),door.height,x,inset,1.01,wood.height-inset);
  }
  const hinge=new THREE.Group();hinge.position.set((pivot-887)*d/focal,0,-d);scene.add(hinge);
  const leaf=panel(imageMap(wood),leafWidth,topWorld,[0,0,0],true);
  hinge.add(leaf);leaf.position.set(-leafWidth/2,topWorld/2,0);
  const edge=panel(null,.032,topWorld-.055,[0,0,0],false,0xa77943);
  hinge.add(edge);edge.position.set(-leafWidth+.001,(topWorld-.055)/2,-.016);edge.rotation.y=Math.PI/2;
  return {
    updateViews,
    setPaperCollected(value){paper.visible=!value},
    setDoor(amount){hinge.rotation.y=1.46*amount},
    setDigits(values){dial.material.map.image=dialArtwork(values);dial.material.map.needsUpdate=true}
  };
}

// Use the same room transforms and artwork on devices without WebGL.
function paintedPhotoView(canvas,scene){
  const scale=96,viewport=document.createElement('div'),world=document.createElement('div');
  viewport.className='flat-viewport';world.className='flat-cube';viewport.append(world);canvas.before(viewport);
  const planes=[];
  scene.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const el=document.createElement('div'),{width,height}=mesh.geometry.parameters;
    el.className='room-plane';el.style.cssText='position:absolute;backface-visibility:visible;pointer-events:none;';
    el.style.width=width*scale+'px';el.style.height=height*scale+'px';
    el.style.left=-width*scale/2+'px';el.style.top=-height*scale/2+'px';
    if(!mesh.material.map)el.style.background='#'+mesh.material.color.getHexString();
    world.append(el);planes.push({el,mesh,last:null});
  });
  const cssAxis=[1,-1,1,1];
  return {draw(focal,yaw,pitch,eye){
    viewport.style.perspective=focal+'px';
    world.style.transform='translateZ('+focal+'px) rotateX('+pitch+'rad) rotateY('+yaw+'rad) translate3d('+(-eye.x*scale)+'px,'+(eye.y*scale)+'px,'+(-eye.z*scale)+'px)';
    scene.updateMatrixWorld();
    for(const plane of planes){
      const {mesh,el}=plane,source=mesh.material.map?.image;
      el.hidden=!mesh.visible;
      if(source && source!==plane.last){
        const img=document.createElement('img');img.alt='';img.draggable=false;
        img.src=source instanceof HTMLCanvasElement?source.toDataURL():source.src;
        img.style.cssText='width:100%;height:100%;display:block';el.replaceChildren(img);plane.last=source;
      }
      const m=mesh.matrixWorld.elements.map((n,i)=>n*cssAxis[i%4]*cssAxis[Math.floor(i/4)]*(i>=12&&i<=14?scale:1));
      el.style.transform='matrix3d('+m.join(',')+')';
    }
  }};
}
