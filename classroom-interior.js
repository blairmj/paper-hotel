'use strict';

const ClassroomInterior=(()=>{
  const {enclosure,entrance,box,rounded,patchPlane,flat,standard,faces,
    cylinder,rod,tube,groundShadow}=SchoolInterior;
  const width=9.4,depth=7.65,height=3.04;
  const doorway={x:3.10,width:1.26,height:2.34,casingColor:'#d76d58',
    moldingColor:'#bd5946',recessColor:'#943e31',opensOut:true};
  const groups=[{x:-.48,z:2.24},{x:-1.02,z:4.11},{x:-1.56,z:5.98}];
  const deskSurfaceY=.773;
  const boardNote={id:'resetOrder',name:'칠판',xyz:[.36,1.94,.110],lines:['출입 패드에서 각 가로줄과 세로줄에','켜진 불이 짝수 개여야 합니다.'],
    surface:{width:1.12,height:.65},approach:{x:.36,z:1.22}};
  const deskNote={id:'powerNote',name:'모둠 책상의 점검 쪽지',xyz:[-1.06,deskSurfaceY+.002,6.05],
    surface:{width:.42,height:.28,tilt:-Math.PI/2},approach:{x:-.81,z:7.22},inspectFromAnySide:true};
  const lock={center:[1.94,1.42,.131],width:.70,height:.36};

  function definition(){
    const obstacles=groups.map(({x,z})=>[x-1.09,x+1.09,z-.94,z+.94]);
    obstacles.push([-width/2,-width/2+.82,.57,6.88]);
    return {
      ...RECOVERY_ROOMS[0],interior:true,wall:{width,height,z:0,back:depth},
      depth,ceilingMinimum:height,entrance:doorway,door:[doorway.x,1.21,.05],
      doorReveal:{x:doorway.x-.68,z:2.94},
      bounds:{left:-width/2+.27,right:width/2-.27,front:.29,back:depth-.27},
      lock,clues:[boardNote,deskNote],targets:[
        {id:'lock',name:SCHOOL_PUZZLES.classroom.title,xyz:lock.center,surface:lock,approach:{x:1.94,z:1.39}},boardNote,deskNote
      ],
      obstacles,start:[.53,1.55,7.27],firstView:[-1.08,1.42,0],portraitView:[.94,1.56,0],
      stops:[boardNote.xyz,lock.center,deskNote.xyz,[width/2,1.38,depth/2],[0,1.38,depth],[-width/2,1.38,depth/2]]
    };
  }

  function finish(artwork){
    return {
      sample:artwork.sample,
      surface(name,span,measure,side){
        const map=artwork.sample(name==='wall'&&side==='left'?'lavender':name);
        return InteriorArtwork.canvasMap(Math.ceil(span*115),Math.ceil(measure*115),(g,w,h)=>{
          g.drawImage(map.image,0,0,w,h);
          if(name==='ceiling'){
            g.fillStyle='#f5f2f0a6';g.fillRect(0,0,w,h);
            const tile=72;
            g.lineWidth=1;
            g.strokeStyle='#75687832';
            g.beginPath();
            for(let x=tile/2;x<w;x+=tile){g.moveTo(x,0);g.lineTo(x,h)}
            for(let y=tile/2;y<h;y+=tile){g.moveTo(0,y);g.lineTo(w,y)}
            g.stroke();
          }else if(name==='floor'){
            g.fillStyle='#d1d4de65';g.fillRect(0,0,w,h);
          }else if(name==='wall'&&side!=='left'){
            g.fillStyle='#f7f4f630';g.fillRect(0,0,w,h);
          }
        });
      }
    };
  }

  function buildWalls(scene,artwork){
    const panel=faces(artwork.sample('panel'),1.04,.91);
    const lip=standard('#a98eb4',.8), seam=standard('#84708e',.9);
    const h=1.04;
    const left=doorway.x-doorway.width/2-.06,right=doorway.x+doorway.width/2+.06;
    for(const [length,x,z,rotation] of [
      [left+width/2,(left-width/2)/2,.016,0],
      [width/2-right,(width/2+right)/2,.016,0],
      [depth,width/2-.016,depth/2,-Math.PI/2],
      [width,0,depth-.016,Math.PI],
      [depth,-width/2+.016,depth/2,Math.PI/2]
    ]){
      const section=new School3D.Group();section.position.set(x,0,z);section.rotation.y=rotation;scene.add(section);
      box(section,length,h,.035,0,h/2,0,panel);
      box(section,length,.029,.052,0,h,.008,lip);
      for(let x=-length/2+.87;x<length/2-.12;x+=.87)box(section,.006,h-.075,.002,x,h/2,.0185,seam);
    }
    const trim=standard('#d4ced0',.58,.11), lamp=new School3D.MeshBasicMaterial({color:'#fffdfb'});
    for(const x of [-2.32,2.04])for(const z of [1.58,4.92]){
      box(scene,1.90,.037,.82,x,height-.023,z,trim);
      box(scene,1.80,.011,.72,x,height-.045,z,lamp);
    }
  }

  function chairBack(){
    const s=new School3D.Shape();
    s.moveTo(-.142,-.164);s.quadraticCurveTo(-.214,-.052,-.220,.109);
    s.quadraticCurveTo(-.221,.165,-.169,.170);
    s.quadraticCurveTo(0,.193,.169,.170);
    s.quadraticCurveTo(.221,.165,.220,.109);
    s.quadraticCurveTo(.214,-.052,.142,-.164);
    s.quadraticCurveTo(0,-.188,-.142,-.164);
    const slot=new School3D.Path();
    slot.moveTo(-.064,.102);slot.lineTo(.064,.102);
    slot.quadraticCurveTo(.077,.102,.077,.115);
    slot.quadraticCurveTo(.077,.128,.064,.128);slot.lineTo(-.064,.128);
    slot.quadraticCurveTo(-.077,.128,-.077,.115);slot.quadraticCurveTo(-.077,.102,-.064,.102);
    s.holes.push(slot);
    return new School3D.ExtrudeGeometry(s,{depth:.026,bevelEnabled:true,bevelSize:.009,
      bevelThickness:.008,bevelSegments:2,curveSegments:9}).translate(0,0,-.013);
  }

  function buildDesks(scene,artwork,shadow,frame){
    const top=artwork.sample('wood'), edge=standard('#d4ad86',.62);
    const tray=standard('#9e9da6',.68), foot=standard('#625d68',.82);
    const plastic=standard('#3277b8',.49);
    plastic.bumpMap=artwork.relief('cloth');plastic.bumpScale=.0008;
    const back=chairBack();
    for(const {x,z} of groups){
      shadow(2.52,1.94,x,z,.006,.72);
      for(const cx of [x-.497,x+.497]){
        rounded(scene,.98,.047,.81,cx,.748,z,edge,.014);
        flat(scene,.952,.784,cx,deskSurfaceY,z,top);
        box(scene,.80,.074,.50,cx,.686,z,tray);
        for(const dx of [-.382,.382])for(const dz of [-.292,.292]){
          rod(scene,[cx+dx,.725,z+dz],[cx+dx*1.062,.026,z+dz*1.075],.018,frame);
          cylinder(scene,.020,.022,.028,cx+dx*1.062,.018,z+dz*1.075,foot,12);
        }
        for(const side of [-1,1]){
          const chair=new School3D.Group();
          chair.position.set(cx,0,z+side*.61);chair.rotation.y=side<0?Math.PI:0;scene.add(chair);
          rounded(chair,.416,.053,.396,0,.435,0,plastic,.018);
          const shell=new School3D.Mesh(back,plastic);
          shell.position.set(0,.669,.168);shell.rotation.x=.12;chair.add(shell);
          for(const dx of [-.158,.158]){
            for(const dz of [-.133,.135])rod(chair,[dx,.420,dz],[dx*1.18,.025,dz*1.30],.013,frame);
            rod(chair,[dx,.432,.139],[dx,.63,.173],.012,frame);
          }
        }
      }
    }
  }

  function readingCorner(scene,artwork,shadow,metal){
    const wood=faces(artwork.sample('millwork'),1.03,.92);
    const fronts=standard('#e2d5d2',.83), cubby=standard('#b9957c',.85);
    const cabinet=new School3D.Group();
    cabinet.position.set(-width/2+.36,0,1.49);cabinet.rotation.y=Math.PI/2;scene.add(cabinet);
    box(cabinet,1.56,2.86,.035,0,1.46,-.328,wood);
    for(const x of [-.759,.759])box(cabinet,.046,2.88,.70,x,1.46,0,wood);
    for(const y of [.09,.67,1.31,1.91,2.89])box(cabinet,1.47,.041,.694,0,y,0,wood);
    box(cabinet,.033,1.19,.66,0,1.289,0,wood);
    for(const x of [-.374,.374]){
      box(cabinet,.731,.53,.037,x,.36,.341,fronts);
      box(cabinet,.731,.946,.037,x,2.401,.341,fronts);
      box(cabinet,.155,.026,.032,x,.52,.373,metal);
      box(cabinet,.155,.026,.032,x,1.99,.373,metal);
    }
    for(const [i,color] of ['#d9bd70','#e9c78c','#76a2c4','#7f91b7','#6a9aa2'].entries()){
      const h=.23+(i%3)*.047;
      box(cabinet,.047,h,.131,-.621+i*.054,1.331+h/2,.160,standard(color,.83));
    }
    for(const [x,color] of [[-.36,'#aa8bc1'],[.37,'#456098']]){
      const fabric=standard(color,.91);
      fabric.bumpMap=artwork.relief('cloth');fabric.bumpScale=.002;
      rounded(cabinet,.36,.423,.186,x,.904,.185,fabric,.047);
      const pocket=standard(color,.83);
      rounded(cabinet,.292,.169,.059,x,.810,.295,pocket,.022);
      tube(cabinet,[[x-.067,1.100,.181],[x-.044,1.170,.170],
        [x+.042,1.170,.168],[x+.065,1.100,.181]],.012,fabric);
      box(cabinet,.132,.014,.006,x,.863,.331,cubby);
    }

    const bench=new School3D.Group();
    bench.position.set(-width/2+.343,0,4.54);bench.rotation.y=Math.PI/2;scene.add(bench);
    shadow(.96,4.60,-width/2+.42,4.54,.006,.69);
    box(bench,4.42,.405,.672,0,.214,0,wood);
    const cushion=standard('#b095c7',.91);
    cushion.bumpMap=artwork.relief('cloth');cushion.bumpScale=.002;
    for(const x of [-1.470,0,1.470]){
      rounded(bench,1.456,.113,.64,x,.474,.008,cushion,.028);
      box(bench,.006,.32,.002,x+.709,.224,.337,cubby);
    }
    for(const [x,color,angle] of [[1.41,'#f0e6db',-.11],[.85,'#c1aad2',.10]]){
      const cushion=standard(color,.92);
      cushion.bumpMap=artwork.relief('cloth');cushion.bumpScale=.002;
      const pillow=rounded(bench,.43,.392,.146,x,.694,-.145,cushion,.061);
      pillow.rotation.x=-.24;pillow.rotation.z=angle;
    }
  }

  function recoveryPanel(scene,metal){
    const [x,y,z]=lock.center;
    const body=standard('#42434c',.56,.13), rims=standard('#272a36',.56,.20);
    rounded(scene,lock.width,lock.height,.092,x,y,z-.038,body,.026);
    for(const dx of [-.292,.292])for(const dy of [-.134,.134]){
      cylinder(scene,.012,.012,.005,x+dx,y+dy,z+.012,metal,14).rotation.x=Math.PI/2;
    }
    const bulbs=Array.from({length:16},(_,i)=>{
      const cx=x+(i%4-1.5)*.11,cy=y+(1.5-Math.floor(i/4))*.068;
      cylinder(scene,.029,.030,.012,cx,cy,z+.014,rims,20).rotation.x=Math.PI/2;
      const lamp=new School3D.MeshBasicMaterial({color:'#475358'});
      cylinder(scene,.022,.022,.016,cx,cy,z+.024,lamp,20).rotation.x=Math.PI/2;
      return lamp;
    });
    return state=>bulbs.forEach((lamp,i)=>{
      const on=CT.lights.join('')[i]==='1';
      const fixed=state?.cell===i&&CT.parity(i);
      lamp.color.set(on!==fixed?'#ffe38a':'#46555a');
    });
  }

  async function build(scene,room){
    const [artwork,note,deskCard]=await Promise.all([
      InteriorArtwork.load('classroom'),clueBoardArt(boardNote),clueBoardArt(deskNote)
    ]);
    scene.add(new School3D.HemisphereLight('#fffaf7','#b9afc6',2.08));
    const light=new School3D.DirectionalLight('#fff6ee',1.04);
    light.position.set(1.9,4.4,3.1);scene.add(light);
    const surface=finish(artwork);
    enclosure(scene,room,surface,'#95809e');
    buildWalls(scene,artwork);
    const setDoor=entrance(scene,room,surface,faces(artwork.sample('door'),1.03,.89));
    const frame=standard('#a7a4ab',.46,.24), silver=standard('#b9b6be',.5,.26);
    rounded(scene,4.69,1.51,.073,-.89,1.882,.051,frame,.023);
    const board=InteriorArtwork.canvasMap(768,300,(g,w,h)=>{
      const sheen=g.createLinearGradient(0,0,0,h);
      sheen.addColorStop(0,'#e8e5e9');sheen.addColorStop(.5,'#f4f1f4');sheen.addColorStop(1,'#ebe7eb');
      g.fillStyle=sheen;g.fillRect(0,0,w,h);
    });
    patchPlane(scene,4.54,1.37,-.89,1.882,.090,board);
    rounded(scene,4.54,.035,.126,-.89,1.154,.102,frame,.010);
    patchPlane(scene,boardNote.surface.width,boardNote.surface.height,...boardNote.xyz,imageMap(note));
    const magnet=standard('#edba45',.51);
    for(const x of [boardNote.xyz[0]-.52,boardNote.xyz[0]+.52])for(const y of [1.652,2.228]){
      cylinder(scene,.038,.038,.017,x,y,.123,magnet,18).rotation.x=Math.PI/2;
    }
    const shadow=groundShadow(scene);
    buildDesks(scene,artwork,shadow,silver);
    flat(scene,deskNote.surface.width,deskNote.surface.height,...deskNote.xyz,imageMap(deskCard));
    readingCorner(scene,artwork,shadow,silver);
    const plaque=InteriorArtwork.canvasMap(460,115,(g,w,h)=>{
      g.fillStyle='#c6a483';g.fillRect(0,0,w,h);
      g.fillStyle='#fcf5ed';g.beginPath();g.roundRect(6,6,w-12,h-12,10);g.fill();
      g.fillStyle='#303039';g.font='700 56px Malgun Gothic, sans-serif';
      g.textAlign='center';g.textBaseline='middle';g.fillText(room.place,w/2,h/2+1);
    });
    rounded(scene,1.105,.283,.025,doorway.x,2.624,.018,standard('#bc9b7b',.74),.010);
    patchPlane(scene,1.07,.265,doorway.x,2.624,.032,plaque);
    const setDigits=recoveryPanel(scene,silver);
    document.getElementById('roomView').dataset.interior='classroom';
    return {setDoor,setDigits};
  }
  return {definition,build};
})();

function buildSchoolFinale(){
  const {box,rounded,flat,patchPlane,standard}=SchoolInterior;
  const scene=new School3D.Scene();
  scene.background=new School3D.Color('#bdd7e4');
  scene.add(new School3D.HemisphereLight('#f8fcff','#a8b2a5',2.1));
  const light=new School3D.DirectionalLight('#fff4d9',1.42);
  light.position.set(-1.5,5.8,-6.7);scene.add(light);
  const wall=standard('#d5dad5',.86), rail=standard('#8ca4a0',.83);
  const trim=standard('#536661',.54,.19), ceiling=standard('#dde0d8',.92);
  const floor=standard('#b1b6b0',.89), leafMaterial=standard('#5e7e78',.58);
  const metal=standard('#b4c1ba',.34,.47);
  const outdoor=standard('#cbc8ad',.91), grass=standard('#8ca071',.88);
  const camera=new School3D.PerspectiveCamera(56,1,.04,38);
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
  const glow=new School3D.MeshBasicMaterial({color:'#f9fcf7'});
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
    const hinge=new School3D.Group();
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
    const shrub=new School3D.Mesh(new School3D.IcosahedronGeometry(.51,2),plants[i%3]);
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
