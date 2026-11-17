'use strict';
// Approved v7 interiors: true rectangular geometry, shared by the walking
// camera and the object targets. Coordinates are metres, front wall z = 0.
const SchoolInterior = (()=>{
 const WIDTH=19/Math.sqrt(2),DEPTH=13.54/Math.sqrt(2);
 const materialCache=new Map();
const assetCache=new Map(),views=[];
async function imageAsset(url){
 if(assetCache.has(url))return assetCache.get(url);
 const task=(async()=>{
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const data=ctx.getImageData(0,0,image.width,image.height).data;
  let left=image.width,top=image.height,right=0,bottom=0;
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
   if(data[(y*image.width+x)*4+3]<150)continue;
   left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
  }
  const texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  texture.repeat.set((right-left+1)/image.width,(bottom-top+1)/image.height);
  texture.offset.set(left/image.width,(image.height-bottom-1)/image.height);texture.needsUpdate=true;
  return {texture,ratio:(right-left+1)/(bottom-top+1)};
 })();
 assetCache.set(url,task);return task;
}
function textureFrom(draw,w=512,h=512){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture}
function basic(color,map=null,transparent=false){return new THREE.MeshBasicMaterial({color,map,transparent,alphaTest:transparent?.07:0,side:THREE.DoubleSide,toneMapped:false})}
function box(scene,w,h,d,x,y,z,color,roughness=.9){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),finishMaterial(color,roughness));mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh}
function panel(scene,w,h,x,y,z,map,color='#ffffff'){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),basic(color,map,true));mesh.position.set(x,y,z);scene.add(mesh);return mesh}
function lineRod(scene,a,b,r,color){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),vector=to.clone().sub(from);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,vector.length(),8),new THREE.MeshStandardMaterial({color,roughness:.85}));mesh.position.copy(from.add(to).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vector.normalize());scene.add(mesh);return mesh}
function guitar(scene,x,z){
 const wood='#b88b50';
 for(const [dy,rx,ry]of[[0,.20,.24],[.27,.15,.19]]){const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,18),new THREE.MeshStandardMaterial({color:wood,roughness:.7}));m.scale.set(rx,ry,.07);m.position.set(x,1.35+dy,z);scene.add(m)}
 box(scene,.055,.61,.045,x,1.99,z,'#745037');box(scene,.09,.17,.055,x,2.36,z,'#946b3c');
 const hole=new THREE.Mesh(new THREE.CircleGeometry(.065,24),basic('#362a22'));hole.position.set(x,1.57,z+.074);scene.add(hole);
 for(const dx of [-.018,-.006,.006,.018])lineRod(scene,[x+dx,1.23,z+.077],[x+dx,2.39,z+.033],.0015,'#e5d7b0');
}
function stool(scene,x,z,color='#c39764'){
 const seat=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.045,28),new THREE.MeshStandardMaterial({color,roughness:.8}));seat.position.set(x,.59,z);scene.add(seat);
 for(const dx of [-.17,.17])for(const dz of [-.13,.13])lineRod(scene,[x+dx,.57,z+dz],[x+dx*1.25,.02,z+dz*1.25],.016,'#777d7f');
}
function quad(scene,points,material){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
 geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function lightFixture(scene,x,y,z,w,d,housing='#70787b'){
 box(scene,w+.06,.045,d+.04,x,y,z,housing);
 const light=new THREE.Mesh(new THREE.BoxGeometry(w,.012,d),new THREE.MeshBasicMaterial({color:'#fffef5'}));
 light.position.set(x,y-.028,z);scene.add(light);
}
function surfacePlane(scene,w,d,x,y,z,map,color='#ffffff'){
 const p=panel(scene,w,d,x,y,z,map,color);p.rotation.x=-Math.PI/2;return p;
}
function studioScreenTexture(){
 return textureFrom((g,w,h)=>{
  g.fillStyle='#202b35';g.fillRect(0,0,w,h);g.fillStyle='#2c3b48';g.fillRect(0,0,95,h);
  for(let row=0;row<7;row++){
   const y=20+row*30;g.fillStyle=['#64a48d','#6997ba','#b99571'][row%3];g.fillRect(112,y,w-140,22);
   g.strokeStyle='#d0e0d0';g.lineWidth=1.3;g.beginPath();
   for(let x=115;x<w-20;x++){const amp=4+5*Math.sin(x*.017+row);const yy=y+11+amp*Math.sin(x*.36+row);x===115?g.moveTo(x,yy):g.lineTo(x,yy)}g.stroke();
  }
  g.fillStyle='#b4c4ce';g.fillRect(15,12,58,4);
 },640,240)
}
function keyboardTexture(){
 return textureFrom((g,w,h)=>{
  g.fillStyle='#31383d';g.fillRect(0,0,w,h);g.fillStyle='#a7adb0';g.fillRect(15,12,w-30,14);
  for(let i=0;i<28;i++){const x=20+i*(w-40)/28;g.fillStyle='#f4f3ec';g.fillRect(x,38,(w-40)/28-1,h-48);if(![2,6].includes(i%7)){g.fillStyle='#272e34';g.fillRect(x+(w-40)/28*.6,38,(w-40)/28*.55,(h-48)*.58)}}
 },700,180)
}
function roundFace(scene,x,y,z,r,color){
 const m=new THREE.Mesh(new THREE.CircleGeometry(r,36),basic(color));m.position.set(x,y,z);scene.add(m);return m;
}
async function populateMusicStudio(scene,room){
 const piano=await imageAsset('rooms/interiors/piano.png');
 panel(scene,2.4,1.62,-3.75,.81,.62,piano.texture);
 panel(scene,.46,.29,-3.75,1.17,.65,imageMap(tracingPaper()));
 panel(scene,.67,.67,-.1,2.24,.13,imageMap(clockArtwork()));

 guitar(scene,-5.40,.14);
 // A single, compact recording workstation replaces the ensemble seating.
 surfacePlane(scene,3.75,2.6,0,.010,5.10,null,'#55595d');
 box(scene,3.1,.085,1.05,0,.805,4.85,'#41474a');
 for(const x of [-1.35,1.35])box(scene,.18,.76,.86,x,.38,4.80,'#9b7954');
 box(scene,2.60,.30,.10,0,.44,4.36,'#5b5246');
 box(scene,.25,.54,.42,1.02,.27,4.75,'#2d353a');
 box(scene,.98,.43,.042,0,1.22,4.52,'#272f34');
 panel(scene,.924,.374,0,1.22,4.548,studioScreenTexture());
 lineRod(scene,[0,.87,4.50],[0,1.02,4.50],.025,'#455158');
 box(scene,.30,.014,.17,0,.868,4.50,'#465159');
 surfacePlane(scene,1.28,.32,0,.856,5.05,keyboardTexture());
 // Nearfield monitor speakers, one on either side of the screen.
 for(const x of [-1.15,1.15]){
  box(scene,.38,.58,.31,x,1.13,4.56,'#30383e');
  roundFace(scene,x,1.05,4.725,.125,'#19242b');roundFace(scene,x,1.05,4.728,.091,'#65717a');
  roundFace(scene,x,1.30,4.728,.045,'#adb3af');
 }
 const controller=textureFrom((g,w,h)=>{
  g.fillStyle='#515b62';g.fillRect(0,0,w,h);
  for(let i=0;i<8;i++){const x=18+i*37;g.fillStyle='#1c2932';g.fillRect(x,26,6,100);g.fillStyle='#bac4c8';g.fillRect(x-4,55+i%3*11,14,9);g.fillStyle='#a9baa3';g.beginPath();g.arc(x+3,11,4,0,Math.PI*2);g.fill()}
 },320,150);
 surfacePlane(scene,.66,.29,-.99,.858,5.08,controller);
 const headset=new THREE.Mesh(new THREE.TorusGeometry(.078,.014,8,24,Math.PI),new THREE.MeshStandardMaterial({color:'#343b40'}));headset.position.set(.93,.95,5.05);scene.add(headset);
 for(const x of [.85,1.01])box(scene,.035,.075,.06,x,.89,5.05,'#343b40');
 // One working swivel chair.
 rounded(scene,.58,.12,.54,0,.55,5.85,'#727b81',.04);
 rounded(scene,.58,.55,.14,0,.90,6.05,'#727b81',.04);
 lineRod(scene,[0,.14,5.85],[0,.50,5.85],.035,'#67737a');
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;lineRod(scene,[0,.18,5.85],[.32*Math.cos(a),.045,5.85+.32*Math.sin(a)],.018,'#59666d')}
 for(const x of [-.31,.31]){lineRod(scene,[x,.55,5.85],[x,.75,5.85],.014,'#4f5e65');box(scene,.045,.035,.32,x,.77,5.85,'#4b565d')}
 // The recording area has one microphone, pop filter and movable acoustic gobo.
 box(scene,1.1,1.64,.08,4.75,.95,2.40,'#42494e');
 for(const x of [4.25,5.25])lineRod(scene,[x,.12,2.40],[x,1.78,2.40],.023,'#847a69');
 for(const dx of [-.22,.22])lineRod(scene,[3.40,.30,3.60],[3.40+dx,.03,3.75],.016,'#3d464b');
 lineRod(scene,[3.40,.30,3.60],[3.40,.03,3.32],.016,'#3d464b');
 lineRod(scene,[3.40,.10,3.60],[3.40,1.42,3.60],.016,'#3d464b');
 const mic=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.18,24),new THREE.MeshStandardMaterial({color:'#afb7b6',metalness:.5,roughness:.45}));mic.position.set(3.40,1.50,3.60);scene.add(mic);
 const pop=roundFace(scene,3.40,1.47,3.77,.085,'#2f383f');lineRod(scene,[3.40,1.31,3.60],[3.40,1.39,3.77],.006,'#3d464b');
 return {studioWorkstations:1,studioSpeakers:2,midiKeyboards:1,recordingMicrophones:1,ensembleChairs:0};
}
function artTable(scene,x,z){
 box(scene,2.75,.075,1.25,x,.88,z,'#cfc9b9');
 for(const dx of [-1.20,1.20])for(const dz of [-.47,.47])box(scene,.065,.84,.065,x+dx,.42,z+dz,'#b2916e');
 surfacePlane(scene,.58,.40,x-.55,.923,z-.05,null,'#748d81');
 box(scene,.40,.035,.31,x+.30,.935,z+.09,'#f2ede1');
 const cup=new THREE.Mesh(new THREE.CylinderGeometry(.045,.04,.12,20),new THREE.MeshStandardMaterial({color:'#d9d3c2'}));cup.position.set(x+.82,.98,z+.1);scene.add(cup);
 for(let i=0;i<3;i++)lineRod(scene,[x+.80+i*.018,1.0,z+.1],[x+.77+i*.037,1.18,z+.08],.004,'#8e6d47');
 let seats=0;
 for(const dx of [-.87,.87])for(const dz of [-1.03,1.03]){stool(scene,x+dx,z+dz,'#b99565');seats++}
 return seats;
}
async function populateReferenceArtRoom(scene,room){
 const bench=await imageAsset('rooms/interiors/artbench.png');
 panel(scene,3.40,1.10,-3.75,.55,.75,bench.texture);
 panel(scene,1.05,.63,-3.50,2.13,.065,artOrderMap());

 let seats=0;for(const x of [-2.25,2.25])seats+=artTable(scene,x,4.80);
 // Longo-inspired deep cleaning station, with storage below.
 box(scene,2.40,.86,.68,-.20,.43,.39,'#c0a17b');
 box(scene,2.48,.065,.75,-.20,.90,.40,'#5e6c70');
 for(const x of [-.92,-.20,.52]){
  box(scene,.69,.77,.018,x,.43,.744,'#c9ad86');
  box(scene,.20,.022,.035,x,.68,.770,'#727b7b');
 }
 for(const x of [-.73,.33]){
  surfacePlane(scene,.72,.46,x,.938,.42,null,'#4e5e63');
  for(const dz of [-.25,.25])box(scene,.77,.018,.025,x,.949,.42+dz,'#c0c9c6');
  for(const dx of [-.38,.38])box(scene,.025,.018,.50,x+dx,.949,.42,'#c0c9c6');
  lineRod(scene,[x,1.0,.18],[x,1.18,.18],.012,'#b8c4c4');lineRod(scene,[x,1.18,.18],[x,1.18,.36],.012,'#b8c4c4');lineRod(scene,[x,1.18,.36],[x,1.12,.36],.012,'#b8c4c4');
 }
 // Small drying rack, visible as a single useful piece of equipment.
 const rx=1.90,rz=.46;
 for(const dx of [-.42,.42])for(const dz of [-.24,.24])lineRod(scene,[rx+dx,.06,rz+dz],[rx+dx,1.72,rz+dz],.016,'#69777d');
 for(let tier=0;tier<11;tier++){
  const y=.16+tier*.14;
  for(const dz of [-.24,.24])lineRod(scene,[rx-.42,y,rz+dz],[rx+.42,y,rz+dz],.006,'#879497');
  for(const dx of [-.42,0,.42])lineRod(scene,[rx+dx,y,rz-.24],[rx+dx,y,rz+.24],.006,'#879497');
  if([2,5,8].includes(tier))box(scene,.74,.007,.40,rx,y+.008,rz,['#e9e3cc','#d7c9b9','#c4d2c3'][tier%3]);
 }
 // Paper, portfolios and paint materials stored together at the far right.
 box(scene,1.30,.80,.56,5.82,.40,.32,'#bea17a');
 for(const x of [5.51,6.13])box(scene,.61,.72,.015,x,.40,.611,'#ccb38b');
 box(scene,1.30,.045,.56,5.82,.82,.32,'#9c815e');
 for(const x of [5.19,6.45])box(scene,.045,1.25,.56,x,1.45,.32,'#b89a71');
 for(const y of [1.22,1.63,2.04])box(scene,1.30,.035,.56,5.82,y,.32,'#b89a71');
 for(const [x,color]of [[5.49,'#8eaaa0'],[5.91,'#c2a57a'],[6.21,'#b28a7c']])box(scene,.28,.25,.31,x,1.38,.42,color);
 for(let i=0;i<4;i++){box(scene,.83,.042,.40,5.75,1.70+i*.05,.40,'#ded8c7');box(scene,.14,.012,.035,5.75,1.70+i*.05,.62,'#8b999d')}
 // One easel at the workbench end, leaving the middle circulation clear.
 const ex=-5.92,ez=1.3;
 for(const [dx,zz]of[[-.45,.12],[.45,.12],[0,-.40]])lineRod(scene,[ex+dx,.02,ez+zz],[ex+dx*.62,1.78,ez],.028,'#b89161');
 for(const yy of [.65,1.22])box(scene,1.04,.055,.065,ex,yy,ez+.04,'#b89161');
 return {artWorktables:2,artStools:seats,washStations:1,dryingRacks:1,materialCabinets:1};
}


function finishMaterial(color,roughness=.9){
 const wood=new Set(['#9b7954','#5b5246','#b2916e','#c0a17b','#c9ad86','#bea17a','#ccb38b','#9c815e','#b89a71','#b89161']);
 const key=color+':'+roughness;
 if(materialCache.has(key))return materialCache.get(key);
 let map=null;
 if(wood.has(color))map=textureFrom((g,w,h)=>{
  g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
  for(let i=0;i<190;i++){
   g.strokeStyle=i%3?'#6e4d2e10':'#ffffff22';g.lineWidth=.5+i%3*.35;g.beginPath();
   const y=(i*37)%h;g.moveTo(0,y);g.bezierCurveTo(w*.3,y+4,w*.7,y-4,w,y+2);g.stroke();
  }
 },512,256);
 const m=new THREE.MeshStandardMaterial({color,map,roughness});materialCache.set(key,m);return m;
}
function grainMaterial(color,width,height,cloth=false){
 const map=textureFrom((g,w,h)=>{
  g.fillStyle=color;g.fillRect(0,0,w,h);
  for(let i=0;i<14000;i++){
   g.fillStyle=i%2?'#ffffff0a':'#00000009';g.fillRect((i*73.13)%w,(i*59.31)%h,1,cloth?2:1);
  }
  if(cloth){g.strokeStyle='#ffffff05';g.lineWidth=.5;for(let x=0;x<w;x+=3){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}}
 },512,512);
 map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(width/1.4,height/1.4);
 return new THREE.MeshStandardMaterial({map,roughness:1,side:THREE.DoubleSide});
}
function rounded(scene,w,h,d,x,y,z,color,r=.02){
 const s=new THREE.Shape(),l=-w/2+r,b=-h/2+r,rgt=w/2-r,t=h/2-r;
 s.moveTo(l+r,b);s.lineTo(rgt-r,b);s.quadraticCurveTo(rgt,b,rgt,b+r);
 s.lineTo(rgt,t-r);s.quadraticCurveTo(rgt,t,rgt-r,t);s.lineTo(l+r,t);s.quadraticCurveTo(l,t,l,t-r);
 s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);
 const geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.005,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,curveSegments:5});
 geo.translate(0,0,-(d-2*r)/2);
 const mesh=new THREE.Mesh(geo,finishMaterial(color));mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function definition(kind){
 const isMusic=kind==='music',height=isMusic?3.4:3.8;
 const wall={width:WIDTH,height,z:0,back:DEPTH};
 const bounds={left:-WIDTH/2+.28,right:WIDTH/2-.28,front:.29,back:DEPTH-.28};
 const lock={center:[3,1.26,.14],width:isMusic?.61:.91,height:.40};
 const target=(id,name,xyz,width,height,x,z)=>({id,name,xyz,surface:{width,height},approach:{x,z}});
 const clues=isMusic?[
  target('paper','피아노 악보',[-3.75,1.17,.67],.69,.39,-3.05,2.35),
  target('clock','벽시계',[-.1,2.24,.14],.67,.67,-.1,2.05)
 ]:[
  target('stamps','작업대 도장함',[-3.65,1.04,.82],1.10,.55,-3.65,2.15),
  target('printOrder','인쇄 순서 카드',[-3.50,2.13,.072],1.05,.63,-3.10,2.15)
 ];
 const entry=REVIEW_ROOMS.find(item=>item.kind===kind);
 return {...entry,interior:true,kind,wall,bounds,depth:DEPTH,ceilingMinimum:isMusic?3.4:3.2,
  start:[0,1.55,9.24],firstView:[0,1.10,0],portraitView:isMusic?[1.5,1.45,0]:[0,1.4,0],
  door:[4.20,1.24,.05],clock:{center:[-.1,2.24,.14],width:.67,height:.67},lock,clues,
  targets:[target('lock',isMusic?'문 다이얼':'문 인쇄판',lock.center,lock.width,lock.height,3,1.85),...clues],
  obstacles:isMusic?[
   [-1.82,1.82,4.06,6.48],[-5.08,-2.42,.05,1.25],[3.07,3.73,3.27,3.97],[4.10,5.40,2.16,2.67]
  ]:[[-3.91,-.59,3.45,6.15],[.59,3.91,3.45,6.15],[-5.65,-1.85,.05,1.35],[-1.68,1.28,.05,1.02],[1.20,2.60,.05,1.0],[4.95,6.60,.05,.90],[-6.60,-5.18,.8,1.78]],
  stops:[...clues.map(clue=>clue.xyz),lock.center,[0,1.10,0],[WIDTH/2,1.55,DEPTH/2],[0,1.55,DEPTH],[-WIDTH/2,1.55,DEPTH/2]],
  finishes:isMusic?{front:'black-acoustic',back:'black-acoustic',left:'black-acoustic',right:'black-acoustic'}:{walls:'celadon-plaster',floor:'cool-gray-matte'}
 };
}
function artOrderMap(){
 return textureFrom((g,w,h)=>{
  g.fillStyle='#faf8ed';g.fillRect(0,0,w,h);g.strokeStyle='#b89362';g.lineWidth=9;g.strokeRect(4,4,w-8,h-8);
  ['I','P','E'].forEach((letter,i)=>{g.font='bold '+[75,105,137][i]+'px Georgia';g.fillStyle='#78523d';g.textAlign='center';g.fillText(letter,92+i*176,206)});
  g.fillStyle='#64766d';g.font='33px Arial';g.fillText('→',180,192);g.fillText('→',356,192);
 },540,300);
}
function lockMap(kind,values=[]){
 return textureFrom((g,w,h)=>{
  const shade=g.createLinearGradient(0,0,w,h);shade.addColorStop(0,'#899393');shade.addColorStop(.5,'#4a5559');shade.addColorStop(1,'#647071');
  g.fillStyle=shade;g.beginPath();g.roundRect(3,3,w-6,h-6,13);g.fill();g.strokeStyle='#adb5b2';g.lineWidth=5;g.stroke();
  const n=kind==='music'?2:6,step=(w-58)/n;
  for(let i=0;i<n;i++){
   g.fillStyle='#f4f2e9';g.fillRect(31+i*step,35,step-5,h-70);g.fillStyle='#354046';g.font=(kind==='music'?'64px':'45px')+' Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(values[i]??(kind==='music'?'0':''),31+i*step+(step-5)/2,h/2);
  }
  for(const x of [15,w-15])for(const y of [16,h-16]){g.fillStyle='#d3d6cf';g.beginPath();g.arc(x,y,3,0,Math.PI*2);g.fill()}
 },420,236);
}
function architecture(scene,room){
 const w=WIDTH,d=DEPTH,h=room.wall.height,low=room.ceilingMinimum,music=room.kind==='music';
 const wall=(width,height)=>grainMaterial(music?'#25282b':'#b9cecb',width,height,music);
 const face=(points,width,height)=>quad(scene,points,wall(width,height));
 const a=3.38,b=5.02,top=2.48;
 face([[-w/2,0,0],[a,0,0],[a,low+(a+w/2)*(h-low)/w,0],[-w/2,low,0]],a+w/2,h);
 face([[b,0,0],[w/2,0,0],[w/2,h,0],[b,low+(b+w/2)*(h-low)/w,0]],w/2-b,h);
 face([[a,top,0],[b,top,0],[b,low+(b+w/2)*(h-low)/w,0],[a,low+(a+w/2)*(h-low)/w,0]],b-a,h-top);
 face([[w/2,0,d],[-w/2,0,d],[-w/2,low,d],[w/2,h,d]],w,h);
 face([[-w/2,0,d],[-w/2,0,0],[-w/2,low,0],[-w/2,low,d]],d,low);
 face([[w/2,0,0],[w/2,0,d],[w/2,h,d],[w/2,h,0]],d,h);
 const ceil=new THREE.MeshBasicMaterial({color:music?'#e8e7e2':'#eef0ef',side:THREE.DoubleSide});
 quad(scene,[[-w/2,low,0],[w/2,h,0],[w/2,h,d],[-w/2,low,d]],ceil);
 const floor=box(scene,w,.06,d,0,-.035,d/2,music?'#bfc0bd':'#d0d5d4');floor.material=grainMaterial(music?'#bfc0bd':'#d0d5d4',w,d);
 for(const z of [0,d])box(scene,w,.075,.028,0,.0375,z+(z===0?.016:-.016),music?'#333a3f':'#7f9290');
 for(const x of [-w/2,w/2])box(scene,.028,.075,d,x,.0375,d/2,music?'#333a3f':'#7f9290');
 if(music){
  const seam='#171c20';
  for(let x=-w/2+.70;x<w/2;x+=.75){
   if(x<a||x>b)box(scene,.012,h,.014,x,h/2,.012,seam);
   box(scene,.012,h,.014,x,h/2,d-.012,seam);
  }
  for(let z=.7;z<d;z+=.75)for(const x of [-w/2+.012,w/2-.012])box(scene,.014,h,.012,x,h/2,z,seam);
  for(let x=-5.1;x<-2.5;x+=.10)box(scene,.037,3.12,.04,x,1.62,.045,'#171c20');
  for(const x of [-3.15,0,3.15])for(const z of [1.7,4.6,7.5]){
   const cloud=box(scene,2.30,.085,1.12,x,h-.27,z,'#353a3d');cloud.material=grainMaterial('#353a3d',2.3,1.12,true);
   for(const dx of [-.90,.90])lineRod(scene,[x+dx,h-.22,z],[x+dx,h-.01,z],.005,'#949c9e');
  }
  for(const x of [-1.60,1.60])for(const z of [2.55,6.25])lightFixture(scene,x,h-.14,z,.10,3.2,'#555c61');
 }else{
  const cork=box(scene,5.15,1.18,.027,-3.94,2.10,.035,'#ba9664');cork.material=grainMaterial('#ba9664',5.15,1.18);
  box(scene,2.40,.48,.025,-.20,1.14,.030,'#719d99');
  const swatches=textureFrom((g,ww,hh)=>{
   g.fillStyle='#b99060';g.fillRect(0,0,ww,hh);
   ['#91b1a4','#cd967d','#d8bd75'].forEach((c,i)=>{g.save();g.translate(38+i*94,37+i%2*18);g.rotate((i-1)*.05);g.fillStyle='#faf8ec';g.fillRect(0,0,70,92);g.fillStyle=c;g.fillRect(9,10,52,59);g.restore()});
  },340,170);
  panel(scene,1.33,.66,-5.60,2.26,.059,swatches);
  for(const [x,design]of [[-4.60,0],[-2.10,1],[-1.68,2]]){
   const artwork=textureFrom((g,ww,hh)=>{
    g.fillStyle='#f8f6e9';g.fillRect(0,0,ww,hh);g.fillStyle='#e1b25f';g.beginPath();g.arc(ww/2,8,4,0,Math.PI*2);g.fill();
    if(design===0){g.fillStyle='#b7d2aa';g.fillRect(12,hh*.74,ww-24,hh*.17);g.fillStyle='#9b794b';g.fillRect(ww*.46,hh*.45,ww*.08,hh*.35);g.fillStyle='#84b58e';for(const [dx,dy]of [[0,0],[-.17,.1],[.17,.1],[0,.22]]){g.beginPath();g.arc(ww*(.5+dx),hh*(.35+dy),ww*.23,0,Math.PI*2);g.fill()}}
    else if(design===1){g.fillStyle='#c1dce0';g.fillRect(12,20,ww-24,hh-32);g.fillStyle='#e3c771';g.beginPath();g.arc(ww*.3,hh*.35,ww*.12,0,Math.PI*2);g.fill();g.fillStyle='#9fb699';g.beginPath();g.moveTo(12,hh-12);g.lineTo(ww*.43,hh*.5);g.lineTo(ww-12,hh-12);g.fill()}
    else{g.strokeStyle='#88a777';g.lineWidth=6;g.beginPath();g.moveTo(ww*.5,hh*.85);g.lineTo(ww*.5,hh*.35);g.stroke();for(let i=0;i<5;i++){const a=i*Math.PI*2/5;g.fillStyle='#d2a5bb';g.beginPath();g.ellipse(ww*.5+Math.cos(a)*20,hh*.37+Math.sin(a)*20,14,24,a,0,Math.PI*2);g.fill()}g.fillStyle='#e7c76b';g.beginPath();g.arc(ww*.5,hh*.37,11,0,Math.PI*2);g.fill()}
   },160,200);
   panel(scene,.50,.64,x,design===1?2.30:2.05,.069,artwork);
  }
  const slope=Math.atan2(h-low,w),roofAt=x=>low+(x+w/2)*(h-low)/w;
  for(const z of [1.10,3.45,5.80,8.15]){const beam=box(scene,Math.hypot(w,h-low),.17,.14,0,(low+h)/2-.085,z,'#f0f1ef');beam.rotation.z=slope}
  for(const x of [-3.2,2.7]){
   const yy=roofAt(x)-.22;box(scene,.055,.06,d-.9,x,yy,d/2,'#424b4d');
   for(const z of [1.5,4.1,6.7]){
    const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,.16,20),finishMaterial('#434c4e',.7));lamp.position.set(x,yy-.12,z);scene.add(lamp);lightFixture(scene,x,yy-.20,z,.11,.11,'#434c4e');
   }
  }
 }
}
function entrance(scene,room){
 const w=1.64,h=2.48,cx=4.20,trim=.075,color=room.kind==='music'?'#41494e':'#486b70';
 for(const x of [cx-w/2,cx+w/2])box(scene,trim+.025,h,.17,x,h/2,.025,color);
 box(scene,w+trim,trim,.13,cx,h,.025,color);
 const leafW=w-trim,leafH=h-trim/2,hinge=new THREE.Group();hinge.position.set(cx+w/2-trim/2,0,.045);scene.add(hinge);
 const leaf=rounded(scene,leafW,leafH,.06,0,0,0,color,.012);hinge.add(leaf);leaf.position.set(-leafW/2,leafH/2,0);
 const handle=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.025,24),new THREE.MeshStandardMaterial({color:'#bfc7c6',metalness:.65,roughness:.35}));handle.rotation.x=Math.PI/2;hinge.add(handle);handle.position.set(-leafW+.28,1.05,.05);
 const lever=rounded(scene,.23,.035,.065,0,0,0,'#bfc7c6',.01);hinge.add(lever);lever.position.set(-leafW+.38,1.05,.07);
 for(const y of [.44,1.24,2.05]){const fitting=box(scene,.04,.11,.07,0,0,0,'#bac3c2');hinge.add(fitting);fitting.position.set(-.015,y,.05)}
 // The opening is cut through the wall. A real recessed corridor is visible
 // behind the hinged leaf; no painted wall remains behind an open door.
 box(scene,w+.02,.05,3,cx,-.035,-1.48,'#c4cac7');
 box(scene,.07,h,2.88,cx-w/2-.04,h/2,-1.55,'#d4ddda');box(scene,.07,h,2.88,cx+w/2+.04,h/2,-1.55,'#d4ddda');
 box(scene,w,.06,2.88,cx,h+.05,-1.55,'#e9edeb');box(scene,w,h,.06,cx,h/2,-3.0,'#9eafaa');
 for(const x of [cx-w/2+.01,cx+w/2-.01])box(scene,.035,.18,3,x,1.05,-1.48,'#7e9a91');
 return amount=>{hinge.rotation.y=1.48*amount};
}
async function build(scene,room){
 scene.add(new THREE.HemisphereLight('#f6f7f3','#aeb7b7',1.8));
 scene.add(new THREE.AmbientLight('#ffffff',.8));
 const light=new THREE.DirectionalLight('#ffffff',1.25);light.position.set(-3.5,3.10,5.4);light.target.position.set(0,0,2.7);scene.add(light,light.target);
 light.castShadow=false;
 architecture(scene,room);const setDoor=entrance(scene,room);
 const counts=room.kind==='music'?await populateMusicStudio(scene,room):await populateReferenceArtRoom(scene,room);
 // Soft floor contact shadows keep the illustrated look without projecting
 // ceiling baffles as hard stripes across the floor and clue devices.
 const shade=textureFrom((g,w,h)=>{
  const grad=g.createRadialGradient(w/2,h/2,5,w/2,h/2,w/2);grad.addColorStop(0,'#18212440');grad.addColorStop(.55,'#18212420');grad.addColorStop(1,'#18212400');g.fillStyle=grad;g.fillRect(0,0,w,h);
 },256,256);
 const shadow=(w,d,x,z,y=.008)=>{const mesh=surfacePlane(scene,w,d,x,y,z,shade);mesh.material.depthWrite=false;mesh.material.alphaTest=.001};
 if(room.kind==='music'){shadow(3.7,2.7,0,4.95,.014);shadow(1.05,1.05,0,5.85,.015);shadow(2.6,1.2,-3.75,.9)}
 else{for(const x of [-2.25,2.25]){shadow(3.2,2.0,x,4.80);for(const dx of [-.87,.87])for(const dz of [-1.03,1.03])shadow(.7,.7,x+dx,4.8+dz)}shadow(2.6,1.0,-.2,.55)}
 const lock=panel(scene,room.lock.width,room.lock.height,...room.lock.center,lockMap(room.kind));
 const canvas=document.getElementById('roomView');Object.assign(canvas.dataset,{interior:'v7',width:WIDTH,depth:DEPTH,area:WIDTH*DEPTH,wallFinish:room.kind==='music'?'four-black-acoustic-walls':'celadon-plaster',...counts});
 return {setDoor,setDigits(values){lock.material.map.dispose();lock.material.map=lockMap(room.kind,values)}};
}
return Object.freeze({definition,build});
})();
