'use strict';

// Pixel locations on the hand-finished front illustration. Keep the scene art and
// its interactive objects registered even when the player walks or changes lens.
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
  const clock = surface(930, 339, 49, 49, 8.00);
  const lock = surface(1150, 397, 30, 22, 8.00);
  const paper = point(592, 406, 7.05);
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
async function artImage(name) {
  const img = new Image();
  img.src = artFolder + name + '.webp';
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
  return image;
}

function dialArtwork(values) {
  const img=document.createElement('canvas');img.width=240;img.height=176;
  const g=img.getContext('2d');
  const body=g.createLinearGradient(0,0,196,165);
  body.addColorStop(0,'#637364');body.addColorStop(.52,'#516356');body.addColorStop(1,'#38473a');
  g.shadowColor='#40382a66';g.shadowOffsetY=4;g.shadowBlur=5;g.fillStyle=body;
  g.beginPath();g.roundRect(5,4,230,164,13);g.fill();g.shadowColor='transparent';
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

async function buildPaintedRoom(scene) {
  const gridSize=161;
  const data=fetch(artFolder+'geometry.bin').then(async response=>{
    if(!response.ok)throw new Error('room depth');
    const mm=new Uint16Array(await response.arrayBuffer());
    if(mm.length!==6*gridSize*gridSize)throw new Error('room depth size');
    return mm;
  });
  const [images,mm,doorImage]=await Promise.all([Promise.all(artFaces.map(artImage)),data,artImage('door')]);
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
      const scale=distance/Math.hypot(x,y,z);
      vertices.push(x*scale,paintedRoom.start[1]+y*scale,z*scale);uv.push(u,1-v);
    }
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geom.setIndex(indices);
    const material=new THREE.MeshBasicMaterial({map:imageMap(images[k]),side:THREE.DoubleSide,toneMapped:false});
    scene.add(new THREE.Mesh(geom,material));
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
  const leaf=paintedRoom.leaf,hinge=new THREE.Group();
  hinge.position.fromArray(leaf.center);hinge.position.x+=leaf.width/2;scene.add(hinge);
  const panel=placard(leaf,doorImage);hinge.add(panel);panel.position.set(-leaf.width/2,0,0);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(.038,leaf.height,.04),new THREE.MeshBasicMaterial({color:0xa98352}));
  edge.position.set(-leaf.width+.019,0,-.023);hinge.add(edge);
  return {
    setDoor(amount){hinge.rotation.y=1.48*amount},
    setDigits(values){dial.material.map.image=dialArtwork(values);dial.material.map.needsUpdate=true}
  };
}

async function paintedPhotoView(canvas){
  const viewport=document.createElement('div'),cube=document.createElement('div');
  viewport.className='flat-viewport';cube.className='flat-cube';viewport.append(cube);
  const [images,leafImage]=await Promise.all([Promise.all(artFaces.map(artImage)),artImage('door')]);
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
  function repaint(amount){
    g.drawImage(images[0],0,0,size,size);
    flat(paintedRoom.clock,clock);flat(paintedRoom.lock,dial);
    const {center:[x,y,z],width:w,height:h}=paintedRoom.leaf,hinge=x+w/2;
    const angle=1.48*amount,slices=56;
    for(let i=0;i<slices;i++){
      const a=(1-i/slices)*w,b=(1-(i+1)/slices)*w;
      const az=z+Math.sin(angle)*a,bz=z+Math.sin(angle)*b;
      const [left,top]=project(hinge-Math.cos(angle)*a,y+h/2,az);
      const [right,bottom]=project(hinge-Math.cos(angle)*b,y-h/2,bz);
      g.drawImage(leafImage,leafImage.width*i/slices,0,leafImage.width/slices,leafImage.height,left,top,right-left+.35,bottom-top);
    }
  }
  return {
    draw(focal,yaw,pitch,amount){
      viewport.style.perspective=focal+'px';cube.style.transform='translateZ('+focal+'px) rotateX('+pitch+'rad) rotateY('+yaw+'rad)';
      if(last!==amount){last=amount;repaint(amount)}
    },
    setDigits(values){dial=dialArtwork(values);last=-1}
  };
}
