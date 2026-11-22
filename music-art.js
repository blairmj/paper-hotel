'use strict';

// Interactive objects are registered to the front elevation in world space.
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
  const wall={width:19,height:3.12,z:-8.14};
  // Outer casing in the 1856 x 320 front elevation, measured from the top left.
  const portal={left:1263,right:1424,top:66};
  const door=[((portal.left+portal.right)/2/1856-.5)*wall.width,(1-portal.top/320)*wall.height/2,wall.z];
  const clock = surface(930, 339, 58, 58, 8.11);
  const lock = surface(1147, 397, 40, 29, 8.11);
  const paper = point(592, 406, 8.105);
  return {
    start: [0, eyeHeight, 1.1], wall, portal, clock, lock, door,
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

function clockPoint(mark,length,center=0){
  const angle=(mark%12)*Math.PI/6;
  return [center+length*Math.sin(angle),center-length*Math.cos(angle)];
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
  for(const [mark,length,weight] of [[MUSIC_CLOCK.minuteMark,91,5],[MUSIC_CLOCK.hour,71,7]]){
    const [x,y]=clockPoint(mark,length);
    g.lineWidth=weight;g.beginPath();g.moveTo(0,0);g.lineTo(x,y);g.stroke();
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
  const texture=new School3D.Texture(img);
  texture.colorSpace=School3D.SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true;
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
  g.font='600 13px Georgia,serif';g.fillStyle='#374c4a';
  MUSIC_SCORE.forEach(({a,b,value},i)=>{
    const x=70+(i%2)*82,y=57+Math.floor(i/2)*48;
    const [ax,ay]=clockPoint(a,13),[bx,by]=clockPoint(b,13*.74);
    g.lineCap='round';g.lineWidth=1.8;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+ax,y+ay);g.stroke();
    g.lineWidth=2.8;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+bx,y+by);g.stroke();
    g.beginPath();g.arc(x,y,2,0,2*Math.PI);g.fill();
    g.fillText('= '+value,x+19,y+4);
  });
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

function buildEntrance(scene,panel,elevation,doorArt,room=paintedRoom,corridor=elevation){
  const {wall,portal}=room;
  const xAt=pixel=>(pixel/elevation.width-.5)*wall.width;
  const yAt=pixel=>(1-pixel/elevation.height)*wall.height;
  function crop(source,x,y,w,h){
    const image=document.createElement('canvas');image.width=w;image.height=h;
    image.getContext('2d').drawImage(source,x,y,w,h,0,0,w,h);
    return image;
  }
  function wallSection(x,y,w,h,z=wall.z){
    panel(imageMap(crop(elevation,x,y,w,h)),w*wall.width/elevation.width,h*wall.height/elevation.height,
      [xAt(x+w/2),yAt(y+h/2),z]);
  }
  // Cut out the entire painted portal, including its curved frame. The
  // remaining wall ends at the same coordinates as the new straight casing.
  wallSection(0,0,portal.left,elevation.height);
  wallSection(portal.right,0,elevation.width-portal.right,elevation.height);
  // Overlap behind adjacent pieces to avoid subpixel seams in CSS 3D.
  wallSection(portal.left-2,0,portal.right-portal.left+4,portal.top+1,wall.z-.001);
  const left=xAt(portal.left),right=xAt(portal.right),top=yAt(portal.top);
  const center=(left+right)/2,trim=.092,opening=right-left-2*trim,head=top-trim;
  const jambLeft=left+trim,jambRight=right-trim,recess=.20;
  // The original illustration supplies the view beyond the threshold. All
  // four reveals reach this plane, including the underside of the header.
  const hall=imageMap(crop(corridor,1282,95,130,225));
  panel(hall,right-left,top,[center,top/2,wall.z-recess]);
  for(const x of [jambLeft,jambRight]){
    panel(null,recess,head,[x,head/2,wall.z-recess/2],false,0xa77543).rotation.y=Math.PI/2;
  }
  panel(null,opening,recess,[center,head,wall.z-recess/2],false,0x956b44).rotation.x=Math.PI/2;
  panel(null,opening,recess+.04,[center,.006,wall.z-recess/2+.02],false,0x927e65).rotation.x=-Math.PI/2;

  function moulding(horizontal){
    const art=document.createElement('canvas');
    art.width=horizontal?384:24;art.height=horizontal?24:384;
    const g=art.getContext('2d');
    if(horizontal){g.translate(art.width,0);g.rotate(Math.PI/2)}
    g.drawImage(doorArt,150,40,80,800,0,0,24,384);
    const bevel=g.createLinearGradient(0,0,24,0);
    for(const [at,color] of [[0,'#603d2488'],[.12,'#ffdf9844'],[.32,'#e5ae6c22'],[.78,'#b0763b33'],[1,'#734829bb']])bevel.addColorStop(at,color);
    g.fillStyle=bevel;g.fillRect(0,0,24,384);
    return imageMap(art);
  }
  const rail=moulding(false);
  const lip=.012,casingZ=wall.z+.002;
  panel(rail,trim+lip,top+lip,[left+(trim-lip)/2,(top+lip)/2,casingZ]);
  panel(rail,trim+lip,top+lip,[right-(trim-lip)/2,(top+lip)/2,casingZ]).rotation.z=Math.PI;
  panel(moulding(true),opening+2*lip,trim+lip,[center,head+(trim+lip)/2,wall.z]);

  // A solid leaf sits in the jamb rebate. Its faces share a single hinge,
  // and the small overlap behind the trim seals the closed door at any angle.
  const overlap=.012,leafWidth=opening+2*overlap,leafHeight=head+overlap,thickness=.044;
  const hinge=new School3D.Group();hinge.position.set(jambRight+overlap,0,wall.z-.018);scene.add(hinge);
  function face(texture,w,h,xyz,color){
    const mesh=panel(texture,w,h,[0,0,0],false,color);
    hinge.add(mesh);mesh.position.fromArray(xyz);return mesh;
  }
  const wood=imageMap(doorArt);
  face(wood,leafWidth,leafHeight,[-leafWidth/2,leafHeight/2,0]);
  face(wood,leafWidth,leafHeight,[-leafWidth/2,leafHeight/2,-thickness]);
  for(const x of [-leafWidth,0]){
    face(null,thickness,leafHeight,[x,leafHeight/2,-thickness/2],0xb3844f).rotation.y=Math.PI/2;
  }
  for(const y of [0,leafHeight]){
    face(null,leafWidth,thickness,[-leafWidth/2,y,-thickness/2],0xa77b4a).rotation.x=Math.PI/2;
  }
  return amount=>{hinge.rotation.y=1.48*amount};
}

function placeRoomPanel(scene,map,w,h,xyz,transparent=false,color=0xffffff){
  const material=new School3D.MeshBasicMaterial({map,color,transparent,side:School3D.DoubleSide,toneMapped:false,alphaTest:transparent ? .03 : 0});
  const mesh=new School3D.Mesh(new School3D.PlaneGeometry(w,h),material);
  mesh.position.fromArray(xyz);scene.add(mesh);return mesh;
}

async function buildPaintedRoom(scene) {
  const wallNames=['front','back','left','right'];
  const [walls,door]=await Promise.all([Promise.all(wallNames.map(studioImage)),(async()=>{
    const image=new Image();image.src='rooms/music-art/door.webp';await image.decode();return image;
  })()]);
  const {width,height,z:front}=paintedRoom.wall;
  const back=5.4,depth=back-front,mid=(back+front)/2;
  const panel=(...args)=>placeRoomPanel(scene,...args);
  // Every entire wall is a rigid plane with its own straight-on elevation.
  // No cabinet or drum texture straddles a wall/floor projection seam.
  const setDoor=buildEntrance(scene,panel,walls[0],door);
  panel(imageMap(walls[1]),width,height,[0,height/2,back]).rotation.y=Math.PI;
  panel(imageMap(walls[2]),depth,height,[-width/2,height/2,mid]).rotation.y=Math.PI/2;
  panel(imageMap(walls[3]),depth,height,[width/2,height/2,mid]).rotation.y=-Math.PI/2;
  panel(imageMap(studioFloor()),width+.02,depth+.01,[0,0,mid]).rotation.x=-Math.PI/2;
  panel(imageMap(studioCeiling()),width,depth,[0,height,mid]).rotation.x=Math.PI/2;

  const updateViews=await studioSeats(scene,panel);
  function place(surface,art){
    return panel(imageMap(art),surface.width,surface.height,surface.center,true);
  }
  place(paintedRoom.clock,clockArtwork());
  const dial=place(paintedRoom.lock,dialArtwork([0,0]));
  place({center:paintedRoom.targets[2].xyz,width:.75,height:.44},tracingPaper());

  return {
    updateViews,setDoor,
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
