'use strict';

const ClassroomInterior=(()=>{
  const {enclosure,entrance,box,rounded,patchPlane,flat,standard,rod,groundShadow}=SchoolInterior;
  const width=10.4,depth=7.65,height=2.96;
  const doorway={x:3.34,width:1.30,height:2.27,moldingColor:'#647e7b',recessColor:'#405553'};
  const rows=[2.40,3.99,5.58], columns=[-3.17,-1.92,1.30,2.55];
  const boardNote={id:'resetOrder',name:'칠판의 점검 순서',xyz:[-.76,1.84,.098],
    surface:{width:1.43,height:.83},approach:{x:-.78,z:1.42}};
  const lock={center:[2.14,1.30,.10],width:.66,height:.39};

  function definition(){
    const obstacles=rows.flatMap(z=>[
      [-3.68,-1.41,z-.46,z+.98],[.79,3.06,z-.46,z+.98]
    ]);
    obstacles.push([-4.79,-2.97,.27,1.17],[3.47,5.01,4.62,6.83],[-4.87,-2.34,6.91,7.37]);
    return {
      ...RECOVERY_ROOMS[0], interior:true, wall:{width,height,z:0,back:depth},
      depth,ceilingMinimum:height,entrance:doorway,door:[doorway.x,doorway.height/2,.05],
      bounds:{left:-width/2+.27,right:width/2-.27,front:.29,back:depth-.27},
      lock,clues:[boardNote],targets:[
        {id:'lock',name:'교실 복구 단말기',xyz:lock.center,surface:lock,approach:{x:2.14,z:1.37}},boardNote
      ],
      obstacles,start:[0,1.55,7.30],firstView:[-.15,1.35,0],portraitView:[.35,1.39,0],
      stops:[boardNote.xyz,lock.center,[width/2,1.38,depth/2],[0,1.38,depth],[-width/2,1.38,depth/2]]
    };
  }

  function finish(artwork){
    return {
      sample:()=>artwork.sample('wood'),
      surface(name,w,d,side){
        if(name!=='wall')return artwork.surface(name,w,d,side);
        return InteriorArtwork.canvasMap(Math.ceil(w*104),Math.ceil(d*104),(g,w,h)=>{
          const shade=g.createLinearGradient(0,0,0,h);
          shade.addColorStop(0,'#d4dad6');
          shade.addColorStop(.16,'#e5e8e3');
          shade.addColorStop(.65,'#e6e7df');
          shade.addColorStop(1,'#b9c7c0');
          g.fillStyle=shade;g.fillRect(0,0,w,h);
          g.fillStyle='#5b6a6010';
          for(let i=0;i<6700;i++)g.fillRect(i*71.83%w,i*52.76%h,1,1);
        });
      }
    };
  }

  function buildDesks(scene,artwork,shadow){
    const maple=standard('#caaa7f',.67), edge=standard('#b4936d',.73);
    const legs=standard('#687d7c',.54,.20), seat=standard('#718a87',.82);
    const rubber=standard('#394947',.87);
    const top=artwork.sample('wood');
    for(const z of rows)for(const x of columns){
      shadow(.86,1.29,x,z+.20,.005,.76);
      rounded(scene,.72,.048,.509,x,.721,z,maple,.013);
      flat(scene,.682,.472,x,.747,z,top);
      box(scene,.584,.099,.342,x,.652,z-.038,edge);
      for(const dx of [-.267,.267])for(const dz of [-.167,.167]){
        rod(scene,[x+dx,.698,z+dz],[x+dx*1.09,.026,z+dz*1.13],.016,legs);
        box(scene,.045,.024,.042,x+dx*1.09,.014,z+dz*1.13,rubber);
      }
      const cz=z+.55;
      rounded(scene,.413,.062,.377,x,.426,cz,seat,.022);
      rounded(scene,.426,.248,.047,x,.674,cz+.166,seat,.019).rotation.x=.13;
      for(const dx of [-.157,.157]){
        for(const dz of [-.127,.124]){
          rod(scene,[x+dx,.408,cz+dz],[x+dx*1.18,.017,cz+dz*1.29],.0125,legs);
        }
        rod(scene,[x+dx,.411,cz+.127],[x+dx,.65,cz+.165],.013,legs);
      }
    }
    const paper=standard('#e7e5d9'), book=standard('#4c7186',.73);
    for(const [x,z] of [[columns[1],rows[0]],[columns[2],rows[2]]]){
      rounded(scene,.245,.023,.171,x-.09,.764,z-.04,book,.005).rotation.y=.13;
      rounded(scene,.225,.012,.152,x-.093,.764,z-.026,paper,.004).rotation.y=.13;
    }
  }

  async function build(scene,room){
    const [artwork,note]=await Promise.all([InteriorArtwork.load('art'),clueBoardArt(boardNote)]);
    scene.add(new THREE.HemisphereLight('#f8fbff','#adb8af',2.22));
    const sun=new THREE.DirectionalLight('#fcf6eb',1.02);
    sun.position.set(-2.7,4.4,5.2);scene.add(sun);
    enclosure(scene,room,finish(artwork),'#71827c');
    const setDoor=entrance(scene,room,finish(artwork));
    const trim=standard('#8c9693',.50,.24), board=standard('#3e665d',.89);
    const lead=standard('#68737b',.70), pale=standard('#b3c7c3',.84);
    const lamp=new THREE.MeshBasicMaterial({color:'#fcfcf4'});
    for(const x of [-2.65,1.98])for(const z of [2.12,5.10]){
      box(scene,.238,.057,1.76,x,height-.035,z,trim);
      box(scene,.185,.010,1.69,x,height-.066,z,lamp);
    }
    for(const x of [-width/2+.015,width/2-.015]){
      box(scene,.034,.79,depth,x,.42,depth/2,pale);
      box(scene,.059,.035,depth,x,.822,depth/2,trim);
    }
    box(scene,width,.79,.031,0,.42,depth-.024,pale);
    box(scene,4.66,1.48,.065,-.87,1.79,.045,trim);
    box(scene,4.56,1.38,.012,-.87,1.79,.083,board);
    box(scene,4.63,.047,.130,-.87,1.059,.095,trim);
    box(scene,.108,.031,.041,.17,1.101,.122,standard('#506564'));
    patchPlane(scene,boardNote.surface.width,boardNote.surface.height,...boardNote.xyz,imageMap(note));

    const teacher=standard('#aa9374',.65), doorCabinet=standard('#6f8a83',.81);
    const shadow=groundShadow(scene);
    shadow(1.95,1.17,-3.87,.70,.005,.82);
    rounded(scene,1.52,.066,.67,-3.87,.825,.65,teacher,.015);
    flat(scene,1.48,.64,-3.87,.861,.65,artwork.sample('wood'));
    for(const x of [-4.533,-3.212])box(scene,.052,.78,.50,x,.41,.65,doorCabinet);
    box(scene,1.28,.38,.045,-3.87,.578,.365,doorCabinet);
    rounded(scene,.37,.034,.249,-3.64,.887,.61,standard('#586f88'),.008);
    buildDesks(scene,artwork,shadow);

    const storage=standard('#becfc7',.83), interior=standard('#778d84',.88);
    box(scene,1.29,1.27,2.05,4.49,.635,5.73,storage);
    for(const z of [5.06,5.72,6.38]){
      box(scene,.038,1.10,.603,3.82,.685,z,interior);
      for(const y of [.459,.835,1.204])box(scene,.137,.035,.616,3.80,y,z,storage);
    }
    box(scene,2.18,.72,.36,-3.59,.36,7.39,doorCabinet);
    for(const x of [-4.34,-3.78,-3.20,-2.72])box(scene,.225,.018,.03,x,.542,7.19,trim);
    const plaque=InteriorArtwork.canvasMap(270,100,(g,w,h)=>{
      g.fillStyle='#eef0e9';g.fillRect(0,0,w,h);
      g.fillStyle='#395654';g.font='600 53px Arial';g.textAlign='center';g.fillText('5 - 2',w/2,69);
    });
    patchPlane(scene,.54,.20,3.34,2.60,.033,plaque);
    box(scene,lock.width+.025,lock.height+.024,.077,lock.center[0],lock.center[1],.047,lead);
    const plate=patchPlane(scene,lock.width,lock.height,...lock.center,imageMap(schoolLockArt(room,[])));
    document.getElementById('roomView').dataset.interior='classroom';
    return {
      setDoor,
      setDigits(values){
        plate.material.map.image=schoolLockArt(room,values);
        plate.material.map.needsUpdate=true;
      }
    };
  }
  return {definition,build};
})();

function buildSchoolFinale(){
  const {box,rounded,flat,patchPlane,standard}=SchoolInterior;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#bdd7e4');
  scene.add(new THREE.HemisphereLight('#f8fcff','#a8b2a5',2.1));
  const light=new THREE.DirectionalLight('#fff4d9',1.42);
  light.position.set(-1.5,5.8,-6.7);scene.add(light);
  const wall=standard('#d5dad5',.86), rail=standard('#8ca4a0',.83);
  const trim=standard('#536661',.54,.19), ceiling=standard('#dde0d8',.92);
  const floor=standard('#b1b6b0',.89), leafMaterial=standard('#5e7e78',.58);
  const metal=standard('#b4c1ba',.34,.47);
  const outdoor=standard('#cbc8ad',.91), grass=standard('#8ca071',.88);
  const camera=new THREE.PerspectiveCamera(56,1,.04,38);
  camera.position.set(0,1.55,5.3);
  camera.lookAt(0,1.30,0);

  box(scene,5.56,.085,6.46,0,-.042,3.22,floor);
  const hallFloor=InteriorArtwork.canvasMap(800,910,(g,w,h)=>{
    const light=g.createLinearGradient(0,0,0,h);
    light.addColorStop(0,'#a8afab');light.addColorStop(.53,'#c2c6bd');light.addColorStop(1,'#b3b7ad');
    g.fillStyle=light;g.fillRect(0,0,w,h);
    g.fillStyle='#6970692b';
    for(let i=0;i<17500;i++)g.fillRect(i*117.73%w,i*173.39%h,1.2,1.2);
    g.strokeStyle='#818c8259';g.lineWidth=1.6;g.beginPath();
    for(let y=0;y<h;y+=120){g.moveTo(0,y);g.lineTo(w,y)}
    for(let x=0;x<w;x+=120){g.moveTo(x,0);g.lineTo(x,h)}
    g.stroke();
  });
  flat(scene,5.55,6.45,0,.002,3.22,hallFloor);
  box(scene,5.56,.082,6.46,0,2.96,3.22,ceiling);
  for(const side of [-1,1]){
    box(scene,.13,2.93,6.43,side*2.72,1.46,3.22,wall);
    box(scene,.031,1.01,6.42,side*2.646,.50,3.22,rail);
    box(scene,.064,.049,6.42,side*2.623,1.011,3.22,trim);
    box(scene,.051,.078,6.41,side*2.617,.039,3.22,trim);
    box(scene,1.45,2.93,.17,side*2.01,1.46,0,wall);
    box(scene,1.45,.99,.032,side*2.01,.498,.10,rail);
    box(scene,.124,2.392,.26,side*1.282,1.196,.003,trim);
  }
  box(scene,2.65,.515,.19,0,2.677,0,wall);
  box(scene,2.665,.115,.25,0,2.388,.003,trim);
  box(scene,2.59,.014,.24,0,.004,.014,metal);
  const glow=new THREE.MeshBasicMaterial({color:'#f9fcf7'});
  for(const z of [1.47,3.89]){
    box(scene,.206,.048,1.30,0,2.895,z,trim);
    box(scene,.160,.007,1.24,0,2.868,z,glow);
  }
  const sign=InteriorArtwork.canvasMap(330,92,(g,w,h)=>{
    g.fillStyle='#36695d';g.fillRect(0,0,w,h);
    g.fillStyle='#f3f5ee';g.font='600 45px Malgun Gothic,Arial';g.textAlign='center';g.fillText('현관',w/2,62);
  });
  patchPlane(scene,.66,.184,0,2.63,.10,sign);
  const leaves=[];
  for(const side of [-1,1]){
    const hinge=new THREE.Group();
    hinge.position.set(side*1.206,.018,.055);
    scene.add(hinge);
    const offset=-side*.597;
    rounded(hinge,1.195,2.298,.054,offset,1.149,0,leafMaterial,.011);
    box(hinge,1.15,.122,.014,offset,.227,.032,trim);
    rounded(hinge,.264,.056,.045,-side*1.016,1.028,.061,metal,.013);
    leaves.push({hinge,side});
  }

  box(scene,24,.10,20,0,-.085,-10,grass);
  box(scene,3.84,.058,13.9,0,-.035,-7.0,outdoor);
  const border=standard('#d1cfb7',.84);
  for(const side of [-1,1])box(scene,.105,.045,12.1,side*1.98,-.010,-6.1,border);
  for(let z=-1.22;z>-11;z-=1.22)box(scene,3.83,.003,.015,0,-.004,z,border);
  box(scene,13,.54,.21,0,.23,-13.80,standard('#c2b9a3',.85));
  box(scene,13.05,.062,.27,0,.531,-13.8,border);
  const plants=[standard('#789978',.96),standard('#95ac80',.87),standard('#5d8169',.92)];
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.51,2),plants[i%3]);
    shrub.position.set(side*(2.38+(i%3)*.37),.39+(i%2)*.12,-2.25-i*1.18);
    shrub.scale.set(1.10+(i%2)*.33,1.15,1.14);
    scene.add(shrub);
  }
  const slab=InteriorArtwork.canvasMap(176,176,(g,w,h)=>{
    const light=g.createRadialGradient(w/2,h/2,5,w/2,h/2,w/2);
    light.addColorStop(0,'#fff2bb75');light.addColorStop(1,'#fff2bb00');
    g.fillStyle=light;g.fillRect(0,0,w,h);
  });
  const sunlight=flat(scene,4.22,5.18,0,.011,1.58,slab);
  sunlight.material.transparent=true;
  sunlight.material.depthWrite=false;
  return {
    scene,camera,
    setDoor(amount){
      for(const {hinge,side} of leaves)hinge.rotation.y=-side*1.50*amount;
      sunlight.material.opacity=amount;
      camera.position.z=5.3-.40*amount;
      camera.lookAt(0,1.30,0);
    }
  };
}
