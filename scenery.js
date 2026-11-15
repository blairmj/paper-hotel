/* All objects, including the wall-mounted puzzles, are meshes inside the room.
   Room thumbnails are used in the directory only. */
const PI=Math.PI, unitBox=new THREE.BoxGeometry(1,1,1);
const sharedGeometry=new Map(), materials=new Map(), printed=[];
const earth={cream:0xffe9bd,ink:0x432c31,gold:0xdaac62,edge:0x765043,leaf:0x858654,teal:0x365e61,red:0xa4524c,blue:0x586e88};
const grain=(()=>{
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),d=ctx.createImageData(256,256);let seed=1567;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let k=0;k<d.data.length;k+=4){const g=236+rand()*19;d.data[k]=g;d.data[k+1]=g;d.data[k+2]=g;d.data[k+3]=255}ctx.putImageData(d,0,0);
 for(let i=0;i<3500;i++){const x=rand()*256,y=rand()*256;ctx.strokeStyle=rand()>.5?'rgba(63,40,23,.13)':'rgba(255,255,255,.5)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+rand()*3-1,y+rand()*3);ctx.stroke()}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
})();
function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,map:grain,roughness:.94,metalness:0}));return materials.get(color)}
function geometry(id,make){if(!sharedGeometry.has(id))sharedGeometry.set(id,make());return sharedGeometry.get(id)}
function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g}
function mesh(p,geom,col,x,y,z){const m=new THREE.Mesh(geom,typeof col==='object'?col:mat(col));m.position.set(x,y,z);p.add(m);m.castShadow=true;m.receiveShadow=true;return m}
function box(p,x,y,z,w,h,d,col){const m=mesh(p,unitBox,col,x,y,z);m.scale.set(w,h,d);return m}
function cone(p,x,y,z,top,bot,height,col,sides=24){return mesh(p,geometry('c'+[top,bot,height,sides],()=>new THREE.CylinderGeometry(top,bot,height,sides)),col,x,y,z)}
function frontDisc(p,x,y,z,r,depth,col,sides=32){const m=cone(p,x,y,z,r,r,depth,col,sides);m.rotation.x=PI/2;return m}
function sphere(p,x,y,z,a,b,d,col){const m=mesh(p,geometry('sphere',()=>new THREE.SphereGeometry(1,18,12)),col,x,y,z);m.scale.set(a,b,d);return m}
function print(p,x,y,z,w,h,draw,ratio=1){const c=document.createElement('canvas');c.width=512;c.height=Math.max(48,Math.round(512/ratio));draw(c.getContext('2d'),c.width,c.height);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;const m=new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false});printed.push(t,m);const v=mesh(p,geometry('plane',()=>new THREE.PlaneGeometry(1,1)),m,x,y,z);v.scale.set(w,h,1);v.castShadow=false;return v}
function textPlate(p,x,y,z,w,h,text,bg='#dcb576',fg='#4b322c'){
 return print(p,x,y,z,w,h,(c,W,H)=>{c.fillStyle=bg;c.fillRect(0,0,W,H);c.strokeStyle=fg;c.lineWidth=Math.max(2,H*.015);c.strokeRect(6,6,W-12,H-12);c.fillStyle=fg;c.font='bold '+Math.floor(Math.min(H*.70,W/(text.length*.75)))+'px Georgia, Malgun Gothic, serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H*.53)},w/h)}
function table(p,x,w=2.15,d=.93,h=.96,col=earth.edge){const g=group(p,x,0,.62);box(g,0,h,0,w,.12,d,col);box(g,0,h-.14,0,w-.12,.20,d-.1,col);for(const s of [-1,1])for(const j of [-1,1])box(g,s*(w/2-.13),h*.48,j*(d/2-.13),.12,h,.12,col);return g}
function cabinet(p,x,w,h,col,drawers=3){const g=group(p,x,0,.69);box(g,0,h/2,0,w,h,.95,col);box(g,0,h+.035,0,w+.09,.085,1.02,col);
 for(let i=0;i<drawers;i++){const cy=(i+.5)*h/drawers;box(g,0,cy,.50,w-.1,h/drawers-.045,.065,col);box(g,0,cy,.565,.25,.045,.075,earth.gold)}return g}
function paper(p,x,y,z,s=.48){const g=group(p,x,y,z);g.rotation.x=-1.22;box(g,0,0,0,s,s*.72,.02,earth.cream);
 print(g,0,0,.013,s*.84,s*.60,(c,w,h)=>{c.strokeStyle='#84634d';c.lineWidth=5;for(let i=1;i<=3;i++){c.beginPath();c.moveTo(35,h*i/4);c.lineTo(w*(.9-i*.06),h*i/4);c.stroke()}});return g}
function books(p,x,y,z,num=4){for(let i=0;i<num;i++){const h=.40+(i%3)*.075;box(p,x+i*.13,y+h/2,z,.115,h,.29,[earth.teal,earth.red,earth.ink,earth.leaf][i%4]);box(p,x+i*.13,y+h*.26,z+.152,.078,.018,.015,earth.gold)}}
function piano(wall) {
 const g = group(wall, -.35, 0, .62);
 const casing = 0x4e3433;
 box(g, 0, .82, -.07, 2.06, 1.55, .65, casing);
 box(g, 0, 1.62, -.07, 2.17, .09, .72, earth.edge);
 box(g, 0, .91, .40, 2.03, .15, .43, casing);
 for (let i = 0; i < 21; i++) {
   const x = (i - 10) * .089;
   box(g, x, 1.01, .41, .086, .045, .36, earth.cream);
   if (![2, 6].includes(i % 7)) box(g, x + .044, 1.05, .34, .053, .05, .23, earth.ink);
 }
 musicScore(g, 0, 1.31, .28, .72, .42);
 const bench = group(g, 0, 0, 1.02);
 box(bench, 0, .47, 0, .95, .12, .4, casing);
 for (const x of [-.36, .36]) box(bench, x, .22, 0, .09, .44, .28, earth.edge);
}
function musicScore(parent,x,y,z,w,h) {
 return print(parent,x,y,z,w,h,(ctx,W,H)=>{
   ctx.fillStyle='#fff1d2';ctx.fillRect(0,0,W,H);
   ctx.fillStyle='#493733';
   for(let line=0;line<5;line++) ctx.fillRect(W*.09,H*(.35+line*.08),W*.82,2);
   [2,0,1,3,2,4].forEach((note,i)=>{
     const nx=W*(.16+i*.13),ny=H*(.67-note*.04);
     ctx.beginPath();ctx.ellipse(nx,ny,W*.024,H*.029,-.3,0,2*PI);ctx.fill();
     ctx.fillRect(nx+W*.021,ny-H*.22,3,H*.22);
   });
 },w/h);
}
function schoolBoard(wall, room) {
 const board = group(wall, -2.61, 1.87, .10);
 box(board, 0, 0, 0, 2.1, 1.15, .085, earth.edge);
 textPlate(board, 0, .13, .05, 1.98, .77, room.place, '#355d51', '#fff3ce');
 textPlate(board, 0, -.36, .05, 1.98, .21, '2층   ·   '+room.n+'호', '#355d51', '#dfddbc');
 box(board, 0, -.59, .07, 2.18, .07, .16, earth.edge);
 box(board, .56, -.53, .09, .17, .035, .035, earth.cream);
}
function observationDesk(wall) {
 const desk = table(wall, .1, 1.65, .85, .82, earth.edge);
 cone(desk, -.39, 1.12, 0, .045, .08, .5, earth.gold);
 const scope = cone(desk, -.39, 1.46, 0, .13, .09, .64, earth.teal);
 scope.rotation.z = -.94;
 paper(desk, .28, .94, .19, .48);
}
function sconce(p,x,y){const g=group(p,x,y,.13);frontDisc(g,0,0,0,.19,.1,earth.gold);box(g,0,-.02,.17,.06,.11,.32,earth.gold);cone(g,0,.13,.35,.17,.30,.40,0xffdda2,14);cone(g,0,-.07,.35,.30,.30,.018,earth.gold,14);const lamp=new THREE.PointLight(0xffd7a0,6,7,2);lamp.position.set(x,y+.07,.9);p.add(lamp)}
const doorway = {x:2.50, width:1.51, height:2.70, angle:-Math.PI*.49};
function door(p,n,wood){
 const frame=group(p,doorway.x,0,.06);
 for(const side of [-1,1]) box(frame,side*.81,1.36,0,.12,2.72,.21,earth.edge);
 box(frame,0,2.77,0,1.74,.14,.21,earth.edge);
 const hinge=group(frame,doorway.width/2,0,.04);
 hinge.name='doorHinge';
 const g=group(hinge,-doorway.width/2);
 box(g,0,1.35,.015,doorway.width,doorway.height,.13,wood);
 for(const y of [.78,1.92]){box(g,0,y,.176,1.20,.88,.028,0x684838);box(g,0,y,.202,1.12,.80,.048,wood)}
 box(g,0,2.15,.238,.64,.24,.052,earth.gold);textPlate(g,0,2.15,.269,.60,.205,String(n));
 box(g,-.545,1.08,.09,.13,.28,.07,earth.gold);box(g,-.46,1.13,.15,.28,.055,.065,earth.gold);
 return g;
}
function corridor(front,w,h) {
 const g=group(front,0,0,-2);
 box(g,0,-.08,0,w,.16,4,0xdab987);
 box(g,0,h+.06,0,w,.12,4,0xe9d3ad);
 box(g,0,1.99,-1.02,w,4,.12,0xe2c999);
 box(g,0,.53,-.94,w,1.06,.08,0x85a89a);
 box(g,0,1.08,-.89,w,.07,.08,0x456c64);
 for(const side of [-1,1]) box(g,side*(w/2+.14),h/2,0,.28,h,4,0xc8af85);
 for(let i=0;i<4;i++){
   const x=1.50+i*.53;
   box(g,x,.78,-.73,.51,1.52,.30,0x789897);
   for(let j=0;j<3;j++) box(g,x,1.33-j*.068,-.568,.27,.019,.018,earth.teal);
   box(g,x+.16,.80,-.554,.037,.14,.035,earth.gold);
 }
 textPlate(g,2.45,2.03,-.93,1.30,.40,'2층 복도','#387268','#fff1cf');
 const light=new THREE.PointLight(0xffedca,15,7,2);
 light.position.set(2.45,2.65,.42);g.add(light);
}
function lock(p,x,y,z,digits=3,letters=false){const w=Math.max(.58,digits*.121+.18);box(p,x,y,z,w,.25,.10,earth.ink);textPlate(p,x,y,z+.06,w-.05,.17,(letters?'A':'0').repeat(digits),'#e6c48b','#372b2c')}
function clock(p){
 const g=group(p,0,0,.17);box(g,0,1.51,0,.86,1.32,.23,0x6c414b);box(g,0,1.50,.14,.68,1.05,.09,0x4e3541);box(g,0,1.58,.24,.045,.78,.025,earth.gold);frontDisc(g,0,1.21,.27,.178,.05,earth.gold);
 frontDisc(g,0,2.47,.04,.86,.27,0x794853,8).rotation.y=PI/8;frontDisc(g,0,2.47,.22,.765,.08,earth.cream,48);
 print(g,0,2.47,.27,1.48,1.48,(c,w,h)=>{c.translate(w/2,h/2);c.fillStyle='#49303a';c.font='bold 47px Georgia';c.textAlign='center';c.textBaseline='middle';for(let i=1;i<=12;i++){const a=i*PI/6;c.fillText(i,Math.sin(a)*207,-Math.cos(a)*207)}c.strokeStyle='#593142';c.lineCap='round';c.lineWidth=12;c.beginPath();c.moveTo(0,-154);c.lineTo(0,97);c.stroke();c.beginPath();c.arc(0,0,13,0,PI*2);c.fill()});lock(g,0,.89,.18,2);return g;
}
function computer(parent,x,display){
 const g=group(parent,x,0,0);
 box(g,0,1.04,-.06,.51,.04,.34,earth.ink);
 box(g,0,1.17,-.08,.11,.25,.09,earth.ink);
 box(g,0,1.60,-.09,1.17,.79,.13,earth.ink);
 box(g,0,1.62,-.015,1.06,.65,.035,0x31575a);
 if(display==='pixels'){
   for(let row=0;row<3;row++)for(let col=0;col<3;col++){
     box(g,(col-1)*.19,1.62+(row-1)*.18,.013,.16,.15,.025,earth.cream);
   }
 }else textPlate(g,0,1.62,.012,.86,.36,display,'#31575a','#c6e4cf');
 box(g,0,1.04,.31,.72,.045,.27,earth.ink);
 for(let row=0;row<3;row++)for(let col=0;col<9;col++)
   box(g,(col-4)*.071,1.068,.24+row*.067,.057,.018,.048,0xa6b9b0);
 sphere(g,.49,1.06,.32,.07,.05,.10,earth.ink);
}
function trayGrid(p,x,y,z,cols,rows){for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){box(p,x+i*.19,y+j*.17,z,.168,.143,.075,0xb19069);textPlate(p,x+i*.19,y+j*.17,z+.045,.14,.11,['ㄱ','ㅅ','ㅁ','ㅍ','ㅇ','ㅏ','ㄹ','ㅣ'][(i+j*3)%8],'#c8a982','#573d38')}}
function ball(p,x,y,z,r,col,kind){sphere(p,x,y,z,r*(kind===1?1.55:1),r,r,col);const ring=mesh(p,geometry('ring',()=>new THREE.TorusGeometry(1,.026,5,40)),earth.cream,x,y,z);ring.scale.set(r*(kind===1?1.55:1),r,r);ring.rotation.y=.34;return ring}
function furniture(walls,r,mark){
 const [f,rt,b,l]=walls,C=earth;const set=(parent,x,y,z,id)=>mark(parent,x,y,z,id);const main=(x,y,z)=>set(f,x,y,z,'station');schoolBoard(f,r);const d=door(f,r.n,r.wood);
 if(r.n===203){clock(f);main(0,1.92,.53);table(f,0,1.92,.69,.67,r.wood);piano(b);set(b,-.35,1.35,.98,'record');musicScore(f,-2.60,1.16,.18,1.45,.31);const t=table(rt,.30,1.75);box(t,0,1.15,0,1.24,.27,.54,C.teal);frontDisc(t,-.3,1.17,.31,.116,.10,C.gold);box(t,.37,1.42,0,.065,.36,.075,C.gold).rotation.z=-.38;sphere(t,.44,1.59,0,.074,.074,.074,C.red);paper(t,-.29,1.31,-.01,.43);set(rt,.3,1.61,.85,'test')}
 if(r.n===204){const t=cabinet(f,0,1.6,1.05,r.wood);box(t,0,1.45,0,1.20,.72,.24,C.ink);lock(t,0,1.45,.2,3);main(0,1.62,1.02);const a=cabinet(l,.40,1.55,.96,r.wood);box(a,0,1.52,0,1.31,1.08,.12,C.edge);trayGrid(a,-.49,1.10,.10,6,6);set(l,.4,1.68,.91,'type');const t2=table(b,-.35,2.2);for(const sx of [-.73,.73])box(t2,sx,1.28,0,.13,.59,.42,C.ink);cone(t2,0,1.36,.02,.20,.20,1.48,0xa05d45).rotation.z=PI/2;paper(t2,.05,1.03,.31,.65);set(b,-.35,1.47,1.0,'proof')}
 if(r.n===205){const g=group(f,-.32,1.95,.11);box(g,0,0,0,2.07,1.46,.045,C.edge);print(g,0,0,.03,1.99,1.38,(c,w,h)=>{c.fillStyle='#ecd4a6';c.fillRect(0,0,w,h);c.strokeStyle='#785941';c.lineWidth=5;for(let i=0;i<40;i++){const x=20+((i*113)%440),y=16+((i*47)%300);c.beginPath();c.moveTo(x,y);c.lineTo(x+45,y);c.lineTo(x+45,y+35);c.stroke()}c.fillStyle='#976e54';c.beginPath();c.moveTo(w,h*.55);c.lineTo(w,h);c.lineTo(w*.7,h);c.fill()});cabinet(f,-.32,1.95,.77,r.wood);main(-.32,1.89,.25);const t=table(rt,0);const tube=cone(t,0,1.16,0,.17,.17,1.19,C.teal);tube.rotation.z=1.42;paper(t,.60,1.06,.13,.36);set(rt,0,1.42,1,'tube');const a=cabinet(b,-.1,1.56,1.0,C.edge,2);frontDisc(a,0,1.29,0,.30,.09,C.gold);textPlate(a,0,1.29,.06,.40,.30,'▲ ●','#c9a16c');set(b,-.1,1.48,.85,'compass')}
 if(r.n===206){const g=cabinet(f,-.22,1.80,1.18,0x4d515b,1);lock(g,0,.7,.60,2);lock(g,0,.47,.60,2);lock(g,0,.94,.60,2);main(-.22,1.23,1.25);const s=cabinet(l,.20,1.85,.71,C.ink);for(let j=0;j<3;j++){box(s,0,.85+j*.37,0,1.86,.065,.57,C.edge);for(let k=0;k<4;k++){const v=box(s,(k-1.5)*.36,1.0+j*.37,0,.28,.20,.32,0x7e8897);frontDisc(v.parent,(k-1.5)*.36,1.0+j*.37,.17,.045,.015,C.gold)}}set(l,.2,1.63,.95,'shelf');const t=table(b,0,1.62);for(let k=-1;k<=1;k++)box(t,k*.44,1.08,0,.4,.17,.52,C.cream);paper(t,0,.89,.37,.36);set(b,0,1.30,.97,'sort')}
 if(r.n===207){lock(d,0,1.57,.28,6,true);set(d,0,1.68,.38,'station');for(const [p,x,size,ch,id] of [[l,-.3,.37,'I','letterI'],[b,.54,.77,'P','letterP'],[rt,-.25,1.50,'E','letterE']]){const g=size<1?table(p,x,1.46):group(p,x,0,.50);const cy=(size<1?1.02:.01)+size/2;textPlate(g,0,cy,0,size*.79,size,ch,'#dec69e','#66433d');set(p,x,cy+.13,.90,id)}}
 if(r.n===208){const trunk=cabinet(f,-.3,1.95,1.13,0x526643,1);for(const sx of [-.63,.63])box(trunk,sx,.58,.56,.112,1.10,.025,C.edge);lock(trunk,0,.76,.61,4);main(-.3,1.18,1.30);const t=table(l,.1,2.15,.76,.57);box(t,0,.7,0,.73,.12,.4,C.teal);paper(t,.16,.65,.18,.49);set(l,.1,.97,.90,'photo');const g=group(b,.1,1.92,.12);print(g,0,0,.02,1.50,.72,(c,w,h)=>{c.fillStyle='#d9974d';c.beginPath();c.moveTo(0,0);c.lineTo(w,h/2);c.lineTo(0,h);c.fill();c.fillStyle='#f4d89e';c.font='bold 110px serif';c.fillText('★',40,h*.69)});set(b,.1,1.92,.22,'flag');for(let k=0;k<4;k++)ball(rt,-1.25+k*.53,.30,.80,.22,[0xc9763f,C.edge,C.blue,C.leaf][k],k)}
 if(r.n===209){
   computer(table(f,-.2,1.94),0,'pixels'); main(-.2,1.61,.72);
   const desks=table(l,.1,3.30);
   computer(desks,-.75,'01');computer(desks,.75,'10');
   paper(desks,.03,1.08,.31,.44);set(l,.13,1.17,1.0,'bag');
   const board=group(b,.25,1.70,.13);
   box(board,0,0,0,1.48,.95,.08,C.edge);
   textPlate(board,0,0,.06,1.38,.83,'픽셀 출력 기록','#e5d4ae','#4c635d');
   set(b,.25,1.60,.26,'apron');
 }
 if(r.n===210){const p=cabinet(f,-.32,1.46,.87,0x564a6e,1);const star=mesh(p,geometry('ico',()=>new THREE.IcosahedronGeometry(.54,1)),0x504a6c,0,1.51,0);for(let j=0;j<7;j++){const a=PI*2*j/7;frontDisc(star,.38*Math.sin(a),.34*Math.cos(a),.37,.038,.01,C.gold,5)}for(let k=0;k<4;k++)box(p,(k-1.5)*.23,.66,.58,.17,.09,.07,C.gold);main(-.32,1.6,1.12);observationDesk(rt);set(rt,.38,1.05,.88,'stencil');const shelf=cabinet(b,0,1.36,.97,C.edge);paper(shelf,0,1.07,.04,.58);set(b,0,1.3,.85,'trace')}
 // Non-interactive furnishing on a quiet wall makes the reverse view recognisable.
 const spare=r.n===203?l:(r.n===207?null:([204,206,209].includes(r.n)?rt:l));
 if(spare && ![205,208].includes(r.n)){const a=cabinet(spare,-1.48,1.12,.73,r.wood,2);books(a,-.31,.77,0)}
}
function buildRoom(scene,r,mark){
 const root=group(scene),w=8.8,h=4.12;const walls=[];
 for(let i=0;i<4;i++){
   const a=i*PI/2,g=group(root,Math.sin(a)*w/2,0,-Math.cos(a)*w/2);
   g.rotation.y=-a;walls.push(g);
   const half=(w+.2)/2,left=doorway.x-doorway.width/2,right=doorway.x+doorway.width/2;
   const spans=i===0?[[-half,left],[right,half]]:[[-half,half]];
   for(const [start,end] of spans){
     const x=(start+end)/2,width=end-start;
     box(g,x,h/2,-.10,width,h,.20,r.wall);
     box(g,x,.48,.008,width,.96,.033,r.trim);box(g,x,.97,.052,width,.067,.088,earth.edge);
     box(g,x,.115,.065,width,.20,.12,r.wood);
   }
   if(i===0){
     box(g,doorway.x,(h+doorway.height)/2,-.10,doorway.width,h-doorway.height,.20,r.wall);
     corridor(g,w,h);
   }
   box(g,0,h-.12,.04,w,.11,.11,r.trim);
   for(let j=-3;j<=3;j++)if(i!==0||Math.abs(j*1.08-doorway.x)>doorway.width/2)box(g,j*1.08,.47,.038,.023,.70,.026,r.trim);
   if(i!==0)sconce(g,1.64,2.45);else sconce(g,1.26,2.65);
 }
 box(root,0,-.105,0,w+.20,.20,w+.20,r.floor);box(root,0,h+.09,0,w+.20,.20,w+.20,r.wall);
 const rug=box(root,0,.01,.20,3.36,.025,2.55,r.trim);box(root,0,.027,.2,3.18,.012,2.37,earth.gold);box(root,0,.036,.2,3.12,.012,2.31,r.trim);
 const amb=new THREE.HemisphereLight(0xffecd1,0xe6beb3,1.55);root.add(amb);
 const key=new THREE.PointLight(0xffdfae,28,14,2);key.position.set(-1.65,3.40,.55);root.add(key);
 key.castShadow=true;key.shadow.mapSize.set(512,512);key.shadow.camera.near=.3;key.shadow.camera.far=13;key.shadow.bias=-.003;
 furniture(walls,r,mark);root.updateMatrixWorld(true);return root;
}
function discardRoom(scene,root){if(!root)return;root.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.dispose()});scene.remove(root);for(const v of printed.splice(0))v.dispose()}
