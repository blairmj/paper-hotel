'use strict';

// Pixel locations on the hand-finished front illustration. Keep the scene art and
// its interactive objects registered even when the player walks or changes lens.
const musicDesignPreview = new URLSearchParams(location.search).get('preview') === 'music-room';
if (musicDesignPreview) document.body.classList.add('design-preview');
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
  const clock = surface(930, 339, 49, 49, 8.11);
  const lock = surface(1150, 397, 30, 22, 8.11);
  const paper = point(592, 406, 8.105);
  return {
    start: [0, eyeHeight, 0], leaf, clock, lock, door: leaf.center,
    targets: [
      {id: 'lock', name: '문 다이얼', xyz: lock.center},
      {id: 'clock', name: '벽시계', xyz: clock.center},
      {id: 'paper', name: '피아노 악보', xyz: paper}
    ],
    stops: [point(1042,375), [5,1.55,0], [0,1.5,4], [-6,1.35,-1], paper],
    firstView: point(895,428), portraitView: point(1045,380)
  };
})();

const artFaces = ['front', 'right', 'back', 'left', 'up', 'down'];
const artFolder = 'rooms/music-art/';
async function artImage(name, empty=false) {
  const img = new Image();
  const separateFurniture=empty && ['front','left','right'].includes(name);
  const folder = musicDesignPreview && artFaces.includes(name) ? artFolder + (separateFurniture?'empty/':'preview/') : artFolder;
  img.src = folder + name + '.webp';
  await img.decode();
  return img;
}

function clockArtwork() {
  const image = document.createElement('canvas');
  image.width=image.height=320;
  const g=image.getContext('2d'),r=143;
  g.translate(159,155);
  g.shadowColor='rgba(48,39,27,.38)';g.shadowBlur=7;g.shadowOffsetY=4;
  let light=g.createLinearGradient(-110,-135,85,145);
  light.addColorStop(0,'#979d87');light.addColorStop(.35,'#596757');light.addColorStop(1,'#37483c');
  g.fillStyle=light;g.beginPath();g.arc(0,0,r,0,2*Math.PI);g.fill();
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
  if (musicDesignPreview) {
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
  g.beginPath();g.roundRect(5,4,230,164,13);g.fill();g.shadowColor='transparent';
  if (musicDesignPreview) {
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

function roomRay(face,u,v) {
  if(face==='front')return [u,-v,-1];
  if(face==='right')return [1,-v,u];
  if(face==='back')return [-u,-v,1];
  if(face==='left')return [-1,-v,-u];
  if(face==='up')return [u,1,-v];
  return [u,-1,v];
}

function imageMap(img){
  const texture=new THREE.Texture(img);
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true;
  return texture;
}

// Paint the moving leaf into the same registered view as the jamb. This avoids
// depth-test cuts where the old foreground mesh intersected a separate door plane.
function doorView(background, leafImage) {
  const canvas = document.createElement('canvas');
  const size = canvas.width = canvas.height = background.width;
  const ctx = canvas.getContext('2d');
  const focal = 1774 / (2 * Math.tan(53 * Math.PI / 180));
  const unit = size / (2 * focal);
  const x0 = size / 2 - 887 * unit, y0 = size / 2 - 360 * unit;
  const foreground = document.createElement('canvas');
  foreground.width = Math.ceil(133 * unit); foreground.height = Math.ceil(46 * unit);
  const fx = Math.round(x0 + 1224 * unit), fy = Math.round(y0 + 474 * unit);
  const fg = foreground.getContext('2d');
  fg.drawImage(background, -fx, -fy);
  const pixels = fg.getImageData(0, 0, foreground.width, foreground.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const [red, green, blue] = pixels.data.subarray(i, i + 3);
    // The perforated charcoal stand is darker than the oak jamb or linoleum.
    const coverage = Math.min((166 - (.35*red + .55*green + .1*blue)) / 26,
                              (83 - (red-blue)) / 18);
    pixels.data[i+3] = 255 * Math.max(0, Math.min(1, coverage));
  }
  fg.putImageData(pixels, 0, 0);
  function column(u, angle) {
    const pivot = 1296.45, width = 114.15, reach = (1-u)*width;
    const perspective = 1 / (1 - Math.sin(angle)*reach/focal);
    const x = 887 + (pivot-887-reach*Math.cos(angle))*perspective;
    const bend = Math.sin(Math.PI*u);
    const top = 311.7 - 4.25*u - 2.05*bend;
    const bottom = 487.65 + 6.55*u + 1.4*bend;
    return {x:x0+x*unit, top:y0+(360+(top-360)*perspective)*unit,
            bottom:y0+(360+(bottom-360)*perspective)*unit};
  }
  function draw(amount) {
    ctx.drawImage(background, 0, 0);
    const slices = 96, angle = amount * 1.46;
    let a = column(0, angle);
    for (let i=0; i<slices; i++) {
      const b = column((i+1)/slices, angle), dw = b.x-a.x;
      const sourceX = leafImage.width*i/slices;
      ctx.save();
      ctx.transform(dw < 0 ? -1 : 1, 0, 0, 1, a.x, 0);
      ctx.drawImage(leafImage, sourceX, 0, leafImage.width/slices+.25, leafImage.height,
                    0, (a.top+b.top)/2, Math.abs(dw)+.72, (a.bottom+b.bottom-a.top-b.top)/2);
      ctx.restore();
      a = b;
    }
    ctx.drawImage(foreground, fx, fy);
  }
  draw(0);
  return {canvas, draw, foreground};
}

function tracingPaper() {
  const paper=document.createElement('canvas');
  paper.width=270;paper.height=165;
  const g=paper.getContext('2d');
  g.shadowColor='#453a2866';g.shadowOffsetY=4;g.shadowBlur=5;
  g.fillStyle='rgba(249,252,242,.82)';
  g.beginPath();g.moveTo(12,21);g.lineTo(238,10);g.lineTo(256,111);
  g.lineTo(229,144);g.lineTo(17,152);g.closePath();g.fill();
  g.shadowColor='transparent';g.strokeStyle='rgba(101,115,103,.36)';g.lineWidth=2;
  for(let i=0;i<5;i++){g.beginPath();g.moveTo(30,55+i*11);g.lineTo(233,45+i*11);g.stroke()}
  g.fillStyle='#fffef2';g.beginPath();g.moveTo(256,111);g.quadraticCurveTo(237,127,225,124);
  g.quadraticCurveTo(230,136,229,144);g.closePath();g.fill();
  return paper;
}

async function buildPaintedRoom(scene) {
  const gridSize=161;
  const data=fetch(artFolder+'geometry.bin').then(async response=>{
    if(!response.ok)throw new Error('room depth');
    const mm=new Uint16Array(await response.arrayBuffer());
    if(mm.length!==6*gridSize*gridSize)throw new Error('room depth size');
    return mm;
  });
  const [images,mm,doorImage]=await Promise.all([Promise.all(artFaces.map(name=>artImage(name,true))),data,artImage('door')]);
  if (musicDesignPreview) addSchoolEnsemble(scene);
  const focal = 1774 / (2 * Math.tan(53 * Math.PI / 180));
  const step=matchMedia('(max-width: 650px)').matches?2:1;
  const count=(gridSize-1)/step+1;
  const indices=[];
  for(let j=0;j<count-1;j++)for(let i=0;i<count-1;i++){
    const a=j*count+i;
    indices.push(a,a+1,a+count,a+1,a+count+1,a+count);
  }
  artFaces.forEach((face,k)=>{
    const vertices=[],uv=[];
    for(let j=0;j<gridSize;j+=step)for(let i=0;i<gridSize;i+=step){
      const u=i/(gridSize-1),v=j/(gridSize-1);
      const [x,y,z]=roomRay(face,2*u-1,2*v-1);
      const distance=mm[k*gridSize*gridSize+j*gridSize+i]*.001;
      // The illustrated front elevation includes low furniture and contact
      // shadows. Keep that entire elevation planar down to the neutral floor.
      const lower=z<0?2.34:1.55;
      const shell=Math.min((x<0?8.7:8.5)/Math.max(Math.abs(x),.0001),
        (y<0?lower:1.35)/Math.max(Math.abs(y),.0001),
        (z<0?8.14:4.35)/Math.max(Math.abs(z),.0001));
      // Flat architecture keeps the threshold, keys and skirting straight
      // as the observer crosses the room. Use estimated relief at the rear.
      const relief=z<0?0:Math.min(.12,z*.12);
      const scale=shell*(1-relief)+Math.min(shell,distance/Math.hypot(x,y,z))*relief;
      vertices.push(x*scale,paintedRoom.start[1]+y*scale,z*scale);uv.push(u,1-v);
    }
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geom.setIndex(indices);
    const material=new THREE.MeshBasicMaterial({map:imageMap(images[k]),side:THREE.DoubleSide,toneMapped:false});
    const roomSurface=new THREE.Mesh(geom,material);roomSurface.renderOrder=-3;scene.add(roomSurface);
  });

  function placard(surface,img,alpha=false) {
    const map=imageMap(img);
    const mat=new THREE.MeshBasicMaterial({map,transparent:alpha,alphaTest:alpha ? .06 : 0,side:THREE.DoubleSide,toneMapped:false});
    const object=new THREE.Mesh(new THREE.PlaneGeometry(surface.width,surface.height),mat);
    object.position.fromArray(surface.center);scene.add(object);
    return object;
  }
  placard(paintedRoom.clock,clockArtwork(),true);
  const dial=placard(paintedRoom.lock,dialArtwork([0,0]),true);
  // Model the leaf on the four inner edges of the jamb, including its slight
  // perspective. The hinge remains fixed in the room throughout the swing.
  const depth=8.095, width=114.15*depth/focal, pivot=1296.45;
  const hinge=new THREE.Group();
  hinge.position.set((pivot-887)*depth/focal,paintedRoom.start[1],-depth);
  scene.add(hinge);
  const facePositions=[],faceUV=[],faceIndices=[];
  for(let i=0;i<=24;i++){
    const u=i/24,bend=Math.sin(Math.PI*u);
    const top=311.7-4.25*u-2.05*bend;
    const bottom=(musicDesignPreview?490:488)+5*u+bend;
    facePositions.push((u-1)*width,(360-bottom)*depth/focal,0,(u-1)*width,(360-top)*depth/focal,0);
    faceUV.push(u,0,u,1);
    if(i){const a=2*i-2;faceIndices.push(a,a+2,a+1,a+2,a+3,a+1)}
  }
  const leafGeometry=new THREE.BufferGeometry();
  leafGeometry.setAttribute('position',new THREE.Float32BufferAttribute(facePositions,3));
  leafGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(faceUV,2));leafGeometry.setIndex(faceIndices);
  const panel=new THREE.Mesh(leafGeometry,new THREE.MeshBasicMaterial({map:imageMap(doorImage),side:THREE.DoubleSide,depthTest:false,toneMapped:false}));
  panel.renderOrder=-1;
  hinge.add(panel);
  const thickness=new THREE.Mesh(new THREE.BoxGeometry(.032,(490-312)*depth/focal,.032),new THREE.MeshBasicMaterial({color:0xa87a41}));
  thickness.position.set(-width+.016,(360-401)*depth/focal,-.016);hinge.add(thickness);
  if(!musicDesignPreview){
    const mask=doorView(images[0],doorImage).foreground;
    const dist=8.075, x=1224+133/2, y=474+46/2;
    const stand=placard({center:[(x-887)*dist/focal,1.55-(y-360)*dist/focal,-dist],
      width:133*dist/focal,height:46*dist/focal},mask,true);
    stand.material.depthWrite=false;
  }
  if(musicDesignPreview) {
    const paper=paintedRoom.targets.find(target=>target.id==='paper').xyz;
    placard({center:[paper[0],paper[1],paper[2]+.045],width:.47,height:.29},tracingPaper(),true);
  }
  return {
    setDoor(amount){hinge.rotation.y=1.46*amount},
    setDigits(values){dial.material.map.image=dialArtwork(values);dial.material.map.needsUpdate=true}
  };
}

async function paintedPhotoView(canvas){
  const viewport=document.createElement('div'),cube=document.createElement('div');
  viewport.className='flat-viewport';cube.className='flat-cube';viewport.append(cube);
  const [images,leafImage]=await Promise.all([Promise.all(artFaces.map(name=>artImage(name))),artImage('door')]);
  const rotations=['','rotateY(-90deg)','rotateY(180deg)','rotateY(90deg)','rotateX(-90deg)','rotateX(90deg)'];
  const face=document.createElement('canvas');face.width=face.height=1536;
  artFaces.forEach((name,i)=>{
    const item=i===0?face:images[i];
    item.className='painted-face';item.style.transform=rotations[i]+' translateZ(-512px)';
    if(i){item.alt='';item.draggable=false}cube.append(item);
  });
  canvas.before(viewport);
  const g=face.getContext('2d'),clock=clockArtwork(),size=face.width;
  let dial=dialArtwork([0,0]),last=-1;
  function project(x,y,z){return [(1+x/-z)*size/2,(1-(y-paintedRoom.start[1])/-z)*size/2]}
  function flat(surface,img){
    const [x,y,z]=surface.center,w=surface.width,h=surface.height;
    const [left,top]=project(x-w/2,y+h/2,z),[right,bottom]=project(x+w/2,y-h/2,z);
    g.drawImage(img,left,top,right-left,bottom-top);
  }
  const registeredDoor=doorView(images[0],leafImage);
  const paper=tracingPaper();
  function repaint(amount){
    registeredDoor.draw(amount);
    g.drawImage(registeredDoor.canvas,0,0,size,size);
    flat(paintedRoom.clock,clock);flat(paintedRoom.lock,dial);
    if(musicDesignPreview) flat({center:paintedRoom.targets[2].xyz,width:.47,height:.29},paper);
  }
  return {
    draw(focal,yaw,pitch,amount,eye){
      viewport.style.perspective=focal+'px';cube.style.transform='translateZ('+focal+'px) rotateX('+pitch+'rad) rotateY('+yaw+'rad) translate3d('+(-eye.x*512/8.14)+'px,0,'+(-eye.z*512/8.14)+'px)';
      if(last!==amount){last=amount;repaint(amount)}
    },
    setDigits(values){dial=dialArtwork(values);last=-1}
  };
}
