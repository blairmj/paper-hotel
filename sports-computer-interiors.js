'use strict';

const SportsComputerInteriors = (() => {
  const {size: {width, depth}, enclosure, entrance, box, rounded, patchPlane, flat,
    standard, rod, cylinder, groundShadow} = SchoolInterior;
  const LOCKER = {width: .90, height: 1.65, front: 1.75, column: .51, columns: 8, base: .09, cap: .044};
  const LOCKER_LENGTH = LOCKER.column * LOCKER.columns;
  const TIER_HEIGHT = (LOCKER.height - LOCKER.base - LOCKER.cap) / 2;
  const BALL_LOCKER_ID = 'ballLocker';
  const BALL_RACK = {x: -1.56, z: .43, width: 2.12, depth: .63, height: 1.45};
  const MATS = {x: -5.96, z: 3.17, width: 1.05, depth: 1.93, height: .55};
  const BENCH = {x: 5.91, z: 6.30, width: .40, depth: 2.18, height: .49};
  const DESK = {width: 1.23, depth: .72};
  const SCREEN = {width: .525, height: .304, y: 1.056, z: -.103};

  function lockerPosition(bank, column, tier, span) {
    return [bank.x + LOCKER.width / 2, LOCKER.base + (tier + .5) * TIER_HEIGHT,
      LOCKER.front + (column + span / 2) * LOCKER.column];
  }

  function sportsLayout() {
    const banks = [
      {x: -3.3, finish: 'orange', color: '#c47b36'},
      {x: 0, finish: 'blue', color: '#5386a5'},
      {x: 3.3, finish: 'orange', color: '#c47b36'}
    ];
    const compartments = [
      {bank: 0, column: 5, span: 2, tier: 1, id: 'ballLine', name: '공 선반 배열'},
      {bank: 1, column: 2, span: 1, tier: 1, id: 'ballOrder', name: '공 회수 순서'}
    ].map(slot => {
      const position = lockerPosition(banks[slot.bank],slot.column,slot.tier,slot.span);
      const [x,,z] = position;
      return {...slot,position,trigger:[x+.04,x+1.97,z-.88,z+.88]};
    });
    const clues = compartments.map(({bank,id,name,span,position:[x,y,z]}) => ({
      id,name,xyz:[x+.044,y,z],rotationY:Math.PI/2,
      surface:{width:LOCKER.column*span-.055,height:TIER_HEIGHT-.074},approach:{x:banks[bank].x+1.65,z:z+.22}
    }));
    const [faceX,faceY,faceZ]=compartments[0].position;
    const lock={id:BALL_LOCKER_ID,center:clues[0].xyz,rotationY:Math.PI/2,
      ...clues[0].surface,approach:{x:faceX+1.53,z:faceZ},
      inspectionView:{wide:[faceX-.10,faceY-.07,faceZ-.46],compact:[faceX-.12,faceY-.53,faceZ]}};
    const obstacles = banks.map(({x}, i) => [
      x - LOCKER.width/2 - .16,
      x + LOCKER.width/2 + (compartments.some(cell => cell.bank===i) ? .55 : .16),
      LOCKER.front - .18, LOCKER.front + LOCKER_LENGTH + .18
    ]);
    const occluders = banks.map(({x}) => [
      x - LOCKER.width/2, x + LOCKER.width/2, 0, LOCKER.height, LOCKER.front, LOCKER.front + LOCKER_LENGTH
    ]);
    for (const {x,z,width:w,depth:d,height:h} of [BALL_RACK,MATS,BENCH]) {
      obstacles.push([x-w/2-.16,x+w/2+.16,z-d/2-.16,z+d/2+.16]);
      occluders.push([x-w/2,x+w/2,0,h,z-d/2,z+d/2]);
    }
    return {banks, compartments, clues, obstacles, occluders, lock};
  }

  function computerLayout() {
    const columns = [-3.91, -2.63, -1.35, 1.35, 2.63, 3.91];
    const rows = [1.62, 3.37, 5.12, 6.87].map(z => columns.map(x => ({x,z})));
    const rearStation = rows[3][3];
    const clues = [
      {id:'recordA', name:'출입 신호 기록', xyz:[-.16,1.94,.057],
        surface:{width:1.28,height:.75}, approach:{x:0,z:1.02}},
      {id:'recordB', name:'신호 분기표',
        xyz:[rearStation.x,SCREEN.y,rearStation.z+SCREEN.z], surface:SCREEN,
        approach:{x:rearStation.x,z:rearStation.z+1.30}}
    ];
    const halfBank = columns[5] + DESK.width/2 + .16;
    const halfAisle = columns[3] - DESK.width/2 - .16;
    const obstacles = rows.flatMap(([{z}]) => [
      [-halfBank,-halfAisle,z-DESK.depth/2-.16,z+1.04],
      [halfAisle,halfBank,z-DESK.depth/2-.16,z+1.04]
    ]);
    const occluders = rows.flat().flatMap(({x,z}) => [
      [x-.29,x+.29,.873,1.24,z-.153,z+SCREEN.z-.001],
      [x-.24,x+.24,.56,.94,z+.76,z+.93]
    ]);
    return {rows, rearStation, clues, obstacles, occluders};
  }

  function definition(kind) {
    const sports = kind === 'sports';
    const {clues,obstacles,occluders,...layout} = sports ? sportsLayout() : computerLayout();
    const height = sports ? 2.70 : 2.90;
    const doorway = sports
      ? {x:4.20,width:1.27,height:2.24,moldingColor:'#747b7d',recessColor:'#363d41'}
      : {x:4.20,width:1.42,height:2.27,moldingColor:'#224875',recessColor:'#152c49'};
    const lock = sports ? layout.lock : {center:[doorway.x-doorway.width/2-.52,1.28,.073],width:.53,height:.53};
    const targets=[{id:lock.id??'lock',name:sports?SCHOOL_PUZZLES.sports.title:'문 잠금장치',
      xyz:lock.center,surface:lock,rotationY:lock.rotationY,inspectionView:lock.inspectionView,
      approach:lock.approach??{x:lock.center[0],z:.99}},...clues.filter(clue=>clue.id!=='ballLine')];
    const startX = sports ? -1.54 : 0;
    return {
      ...RECOVERY_ROOMS.find(item => item.kind === kind),
      interior:true, kind, wall:{width,height,z:0,back:depth}, depth, ceilingMinimum:height,
      bounds:{left:-width/2+.27,right:width/2-.27,front:.29,back:depth-.27},
      entrance:doorway, door:[doorway.x,doorway.height/2,.05], lock, layout,
      doorReveal:sports?{x:4.32,z:2.79}:undefined,
      obstacles, occluders, clues,
      targets,
      start:[startX,1.55,depth-.32], firstView:[sports?-1.03:0,1.27,0],
      portraitView:[startX,1.31,0],
      stops:[...targets.map(target=>target.xyz),[width/2,1.42,depth/2],
        [0,1.42,depth],[-width/2,1.42,depth/2]]
    };
  }

  function fixture(scene, x, z, y, width, length, housing, glow) {
    box(scene,width+.04,.045,length+.04,x,y,z,housing);
    box(scene,width,.009,length,x,y-.023,z,glow);
  }

  function finishes(scene, room, artwork) {
    const sports = room.kind === 'sports', h = room.wall.height;
    enclosure(scene,room,artwork,sports ? '#676b6e' : '#526c88');
    const housing = standard(sports ? '#63676a' : '#b5bec8',.65);
    const glow = new THREE.MeshBasicMaterial({color:sports ? '#fdf6e9' : '#f6fbff'});
    if (sports) {
      const beam = new THREE.MeshBasicMaterial({map:artwork.sample('ceiling'),color:'#e0dfdc'});
      const pipe = standard('#41484c',.52,.22);
      for (const z of [1.03,4.18,7.34]) box(scene,width,.176,.31,0,h-.088,z,beam);
      for (const x of [-4.79,4.79]) {
        rod(scene,[x,h-.222,.01],[x,h-.222,depth-.01],.036,pipe);
        for (const z of [1.9,4.9,8.0]) {
          rod(scene,[x,h-.032,z],[x,h-.218,z],.008,pipe);
          const sleeve = cylinder(scene,.044,.044,.096,x,h-.222,z,pipe,16);
          sleeve.rotation.x = Math.PI/2;
        }
      }
      for (const x of [-1.65,1.65,5.05]) {
        for (const z of [2.65,5.55,8.23]) fixture(scene,x,z,h-.034,.128,1.20,housing,glow);
      }
    } else {
      const accent = standard('#244976',.66);
      const duct = standard('#506a86',.75);
      for (const x of [-5.40,5.34]) {
        for (const z of [.014,depth-.014]) box(scene,.43,h,.031,x,h/2,z,accent);
      }
      for (const x of [-width/2+.021,width/2-.021]) box(scene,.055,.11,depth,x,.17,depth/2,duct);
      box(scene,width,.11,.055,0,.17,depth-.025,duct);
      const left = room.entrance.x-room.entrance.width/2, right = room.entrance.x+room.entrance.width/2;
      box(scene,left+width/2,.11,.055,(left-width/2)/2,.17,.026,duct);
      box(scene,width/2-right,.11,.055,(right+width/2)/2,.17,.026,duct);
      for (const x of [-4.8,-1.8,1.8,4.8]) {
        for (const z of [1.83,4.24,7.85]) fixture(scene,x,z,h-.026,.57,.57,housing,glow);
      }
    }
  }

  function lockerDoorArt(context, x, y, w, h, number, enamel, worn = false) {
    const g = context;
    g.save();
    g.translate(x,y);
    g.scale(w/150,h/228);
    g.fillStyle = '#373b3b';
    g.fillRect(0,0,150,228);
    g.drawImage(enamel,2,2,146,224);
    const sheen = g.createLinearGradient(2,14,145,216);
    sheen.addColorStop(0,'#fff6e42d');
    sheen.addColorStop(.36,'#ffffff00');
    sheen.addColorStop(1,'#25272336');
    g.fillStyle = sheen;
    g.fillRect(2,2,146,224);
    if (worn) {
      const wear = g.createRadialGradient(112,124,4,112,124,55);
      wear.addColorStop(0,'#e5e0c558');
      wear.addColorStop(1,'#e5e0c500');
      g.fillStyle = wear;
      g.fillRect(3,3,144,222);
    }
    g.strokeStyle = '#fffcf04d';
    g.strokeRect(4.5,4.5,141,219);
    g.strokeStyle = '#383c3d51';
    g.strokeRect(8.5,8.5,133,211);
    for (const y of [29,38,47]) {
      g.fillStyle = '#413d337b';
      g.fillRect(32,y,76,2.8);
      g.fillStyle = '#fff7db4d';
      g.fillRect(31,y+2.8,78,1.6);
    }
    g.fillStyle = '#efeddf';
    g.fillRect(56,69,31,24);
    g.fillStyle = '#3d4140';
    g.font = '16px Arial';
    g.textAlign = 'center';
    g.fillText(String(number).padStart(2,'0'),71.5,87);
    const latch = g.createLinearGradient(115,0,132,0);
    latch.addColorStop(0,'#81847f');
    latch.addColorStop(.55,'#eeeae1');
    latch.addColorStop(1,'#aea79b');
    g.fillStyle = latch;
    g.beginPath();
    g.roundRect(117,106,12,43,4);
    g.fill();
    g.fillStyle = '#625f59';
    g.fillRect(121,114,4,22);
    g.beginPath();
    g.arc(123,143,1.7,0,Math.PI*2);
    g.fill();
    g.restore();
  }

  function ballRackDevice(compartment,width) {
    const radius=.066, pitch=.151, y=-.066, z=-.148;
    const tray=standard('#576568',.61,.20);
    box(compartment,width-.065,.026,.30,0,-.145,-.213,tray);
    box(compartment,width-.089,.021,.023,0,-.123,-.071,tray);
    const geometry=new THREE.SphereGeometry(radius,36,24);
    const balls=BALLS.map((label,i)=>{
      const map=InteriorArtwork.canvasMap(512,256,(g,w,h)=>{
        g.fillStyle=BALL_COLORS[i];g.fillRect(0,0,w,h);
        g.strokeStyle='#25242a55';g.lineWidth=3;
        g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();
        for(const x of [.10,.41,.62,.89]){
          g.beginPath();g.moveTo(w*x,0);
          g.bezierCurveTo(w*x-24,h*.42,w*x+24,h*.58,w*x,h);g.stroke();
        }
        g.fillStyle='#f2ecd9';g.beginPath();g.arc(w*.25,h/2,45,0,Math.PI*2);g.fill();
        g.fillStyle='#26303a';g.font='bold 60px sans-serif';g.textAlign='center';g.textBaseline='middle';
        g.fillText(label,w*.25,h/2+3);
      });
      const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map,roughness:.63}));
      mesh.userData.command=label;
      mesh.position.set(0,y,z);
      compartment.add(mesh);
      return {label,mesh,from:0,to:0};
    });
    let progress=1;
    function setDigits(counts,{pending=false,animate=false}={}){
      const row=ballRowAfter(counts.length+Number(pending));
      for(const ball of balls){
        const index=row.indexOf(ball.label);
        ball.mesh.visible=index>=0;
        if(index<0)continue;
        ball.from=ball.mesh.position.x;
        ball.to=(index-(BALLS.length-1)/2)*pitch;
        if(!animate)ball.mesh.position.x=ball.to;
      }
      progress=animate?0:1;
    }
    setDigits([]);
    return {
      commandPads:balls.map(ball=>ball.mesh),setDigits,
      animate(dt,reducedMotion){
        if(progress===1)return false;
        progress=reducedMotion?1:Math.min(1,progress+dt/.46);
        const t=progress*progress*(3-2*progress);
        for(const {mesh,from,to} of balls)if(mesh.visible)mesh.position.x=THREE.MathUtils.lerp(from,to,t);
        return progress<1;
      }
    };
  }

  async function lockers(scene, room, artwork, shadow) {
    const {banks,compartments} = room.layout;
    const {width:w,height:h,front,column,columns,base,cap} = LOCKER;
    const mid = front + LOCKER_LENGTH/2;
    const skirt = standard('#555c61',.69,.13), aluminum = standard('#a4adb2',.48,.35);
    const inside = standard('#777972',.82);
    const leaves = [];
    const orderCard=imageMap(await clueBoardArt(room.clues.find(clue=>clue.id==='ballOrder')));
    let ballDevice;
    for (const [i,bank] of banks.entries()) {
      const {x,finish,color} = bank;
      const slot = compartments.find(cell => cell.bank === i);
      const enamel = artwork.sample(finish);
      const metal = standard(color,.58,.1);
      shadow(w+.67,LOCKER_LENGTH+.88,x,mid,.006,1);
      box(scene,w+.046,base,LOCKER_LENGTH+.045,x,base/2,mid,skirt);
      box(scene,w+.044,cap,LOCKER_LENGTH+.046,x,h-cap/2,mid,aluminum);
      box(scene,.061,h-cap-base,LOCKER_LENGTH,x,(h+base-cap)/2,mid,inside);
      for (const end of [-1,1]) {
        const z = mid + end*LOCKER_LENGTH/2;
        box(scene,w, h-base-cap,.032,x,(h+base-cap)/2,z,metal);
        const endPanel = patchPlane(scene,w-.025,h-base-cap-.018,x,(h+base-cap)/2,z+end*.017,enamel);
        endPanel.rotation.y = end===1 ? 0 : Math.PI;
      }
      for (const side of [-1,1]) {
        const open = side===1 ? slot : null;
        const numberAt = (col,tier) => 1 + i*columns*4 + (side===1?0:2*columns) +
          (1-tier)*columns + (side===1?columns-col-1:col);
        const face = InteriorArtwork.canvasMap(columns*150,456,g => {
          for (let col = 0; col < columns; col++) {
            for (let tier = 0; tier < 2; tier++) {
              const x = (side===1 ? columns-1-col : col)*150, y = (1-tier)*228;
              lockerDoorArt(g,x,y,150,228,numberAt(col,tier),enamel.image);
            }
          }
          if(open)g.clearRect((columns-open.column-open.span)*150+4,(1-open.tier)*228+4,open.span*150-8,220);
        });
        patchPlane(scene,LOCKER_LENGTH,2*TIER_HEIGHT,x+side*w/2,(h+base-cap)/2,mid,face,!!open)
          .rotation.y = side*Math.PI/2;
        if (!open) continue;
        const [faceX,y,z] = open.position;
        const compartment = new THREE.Group();
        compartment.position.set(faceX,y,z);
        compartment.rotation.y = Math.PI/2;
        scene.add(compartment);
        const slotW=column*open.span-.019, slotH=TIER_HEIGHT-.016;
        box(compartment,slotW-.02,slotH,.034,0,0,-.40,inside);
        for (const yy of [-slotH/2,slotH/2]) box(compartment,slotW,.018,.41,0,yy,-.212,aluminum);
        for (const xx of [-slotW/2,slotW/2]) box(compartment,.015,slotH,.41,xx,0,-.212,metal);
        if(open.id==='ballLine')ballDevice=ballRackDevice(compartment,slotW);
        else patchPlane(compartment,.40,.235,.012,-.025,-.115,orderCard);
        const doorW=column-.023, doorH=TIER_HEIGHT-.025;
        const flaps=[];
        for(let offset=0;offset<open.span;offset++){
          const hinge=open.span===2&&offset===0?-1:1;
          const flap=new THREE.Group();
          flap.position.set((offset-(open.span-1)/2)*column+hinge*doorW/2,0,.009);
          compartment.add(flap);
          const panelX=-hinge*doorW/2, doorNumber=numberAt(open.column+open.span-1-offset,open.tier);
          const doorMap=InteriorArtwork.canvasMap(150,228,g=>lockerDoorArt(g,0,0,150,228,doorNumber,enamel.image,true));
          box(flap,doorW,doorH,.018,panelX,0,0,metal);
          patchPlane(flap,doorW,doorH,panelX,0,.010,doorMap);
          patchPlane(flap,doorW-.024,doorH-.024,panelX,0,-.010,enamel).rotation.y=Math.PI;
          for(const hingeY of [-.22,.22])box(compartment,.019,.067,.020,flap.position.x,hingeY,.012,aluminum);
          if(open.id==='ballLine'&&offset===0){
            const tag=InteriorArtwork.canvasMap(192,64,(g,w,h)=>{
              g.fillStyle='#e7dfc7';g.fillRect(0,0,w,h);
              g.fillStyle='#3e4039';g.font='bold 38px sans-serif';g.textAlign='center';g.textBaseline='middle';
              g.fillText('공 라커',w/2,h/2+2);
            });
            patchPlane(flap,.22,.067,panelX,.05,.012,tag);
          }
          flaps.push({flap,hinge});
        }
        leaves.push({id:open.id,trigger:open.trigger,flaps,requested:false,progress:0});
      }
    }
    return {
      commandPads:ballDevice.commandPads,
      setDigits:ballDevice.setDigits,
      onWalk(fromX,fromZ,toX,toZ) {
        for (const leaf of leaves) {
          if (!leaf.requested && passesLocker(leaf.trigger,fromX,fromZ,toX,toZ)) leaf.requested=true;
        }
      },
      onInspect(id){
        if(id===BALL_LOCKER_ID)leaves.find(leaf=>leaf.id==='ballLine').requested=true;
      },
      animate(dt,reducedMotion) {
        let moving=ballDevice.animate(dt,reducedMotion);
        for (const leaf of leaves) {
          if (!leaf.requested || leaf.progress===1) continue;
          leaf.progress=reducedMotion?1:Math.min(1,leaf.progress+dt/.22);
          for(const {flap,hinge} of leaf.flaps)flap.rotation.y=hinge*1.58*(1-(1-leaf.progress)**3);
          moving=moving||leaf.progress<1;
        }
        return moving;
      },
      canInspect(id) {
        return !leaves.some(leaf => leaf.id===id && leaf.progress<1);
      },
      resetFurniture() {
        for (const leaf of leaves) {
          leaf.requested=false;
          leaf.progress=0;
          for(const {flap} of leaf.flaps)flap.rotation.y=0;
        }
      }
    };
  }

  function passesLocker([left,right,front,back],fromX,fromZ,toX,toZ) {
    // Test the route segment so a long click move also counts as walking past.
    let enter=0, leave=1;
    for (const [from,to,min,max] of [[fromX,toX,left,right],[fromZ,toZ,front,back]]) {
      const distance=to-from;
      if (distance===0) {
        if (from<min || from>max) return false;
        continue;
      }
      const first=(min-from)/distance, last=(max-from)/distance;
      enter=Math.max(enter,Math.min(first,last));
      leave=Math.min(leave,Math.max(first,last));
    }
    return enter<=leave;
  }

  function sportsEquipment(scene, shadow) {
    const wood=standard('#ab8960',.70), steel=standard('#606568',.57,.28);
    const {x,z,width:w,depth:d,height:h}=BALL_RACK;
    shadow(w+.43,d+.42,x,z,.005,.91);
    for (const dx of [-w/2+.033,w/2-.033]) {
      for (const dz of [-d/2+.046,d/2-.046]) {
        rounded(scene,.066,h,.064,x+dx,h/2,z+dz,wood,.009);
      }
    }
    const shelves=[.105,.555,1.043];
    for (const y of shelves) {
      rounded(scene,w-.081,.056,d-.05,x,y,z,wood,.009);
      box(scene,w-.12,.031,.027,x,y+.034,z+d/2-.046,wood);
    }
    box(scene,w-.057,.082,.045,x,h-.077,z-d/2+.048,wood);

    const orange=InteriorArtwork.canvasMap(360,180,(g,w,h)=>{
      g.fillStyle='#bc6c3c';
      g.fillRect(0,0,w,h);
      g.fillStyle='#78462670';
      for (let i=0;i<3750;i++) g.fillRect((i*73.819)%w,(i*141.612)%h,1.5,1.3);
      g.lineWidth=3.9;
      g.strokeStyle='#4f3329';
      g.beginPath();
      g.moveTo(0,h*.50);
      g.lineTo(w,h*.50);
      for (const u of [w*.20,w*.70]) {
        g.moveTo(u,0);
        g.bezierCurveTo(u-w*.14,h*.34,u+w*.14,h*.66,u,h);
      }
      g.stroke();
    });
    const volleyball=InteriorArtwork.canvasMap(360,180,(g,w,h)=>{
      g.fillStyle='#e5e1d5';
      g.fillRect(0,0,w,h);
      for (const [i,color] of ['#416c9a','#cca342','#487399','#d6ab45'].entries()) {
        const u=i*w/4;
        g.fillStyle=color;
        g.beginPath();
        g.moveTo(u,0);
        g.quadraticCurveTo(u+w*.17,h*.56,u,h);
        g.lineTo(u+w*.092,h);
        g.quadraticCurveTo(u+w*.25,h*.56,u+w*.092,0);
        g.closePath();
        g.fill();
      }
    });
    const ballMaterials=[orange,volleyball].map(map=>new THREE.MeshStandardMaterial({map,roughness:.83}));
    const sphere=new THREE.SphereGeometry(1,28,18);
    for (const [dx,shelf,r,type,turn] of [
      [-.60,2,.122,0,.40],[-.31,2,.122,0,1.72],[.34,2,.108,1,1.14],[-.43,1,.105,1,2.07],[.45,1,.107,1,3.0]
    ]) {
      const ball=new THREE.Mesh(sphere,ballMaterials[type]);
      ball.scale.setScalar(r);
      ball.position.set(x+dx,shelves[shelf]+.028+r,z+.018);
      ball.rotation.set(.12,turn,.16);
      scene.add(ball);
    }
    const cones=standard('#c96a44',.72), markers=standard('#cbaa55',.79);
    for (const dx of [.24,.54]) {
      rounded(scene,.216,.029,.211,x+dx,.15,z+.05,cones,.008);
      cylinder(scene,.017,.088,.222,x+dx,.272,z+.05,cones,28);
    }
    for (let i=0;i<3;i++) cylinder(scene,.067,.103,.025,x-.53,.148+i*.015,z+.032,markers,28);

    shadow(MATS.width+.34,MATS.depth+.49,MATS.x,MATS.z,.006,.90);
    const pads=['#536c86','#465f7a'].map(color=>standard(color,.82));
    const straps=standard('#39485a',.91);
    for (let i=0;i<4;i++) {
      const y=.072+.132*i, shift=i%2*.016;
      rounded(scene,MATS.width,.127,MATS.depth-.03,MATS.x,y,MATS.z+shift,pads[i%2],.034);
      for (const dz of [-.295,.295]) {
        box(scene,.017,.029,.22,MATS.x+MATS.width/2,y-.005,MATS.z+shift+dz,straps);
      }
    }
    const hoopColors=['#ab604e','#c3a64b','#5e8069'];
    for (const [i,color] of hoopColors.entries()) {
      const z=4.73+i*.69, y=1.59, x=-width/2+.102;
      const hoop=new THREE.Mesh(new THREE.TorusGeometry(.30,.014,10,48),standard(color,.53));
      hoop.position.set(x,y,z);
      hoop.rotation.y=Math.PI/2;
      scene.add(hoop);
      box(scene,.036,.087,.064,x-.032,y+.306,z,steel);
      rod(scene,[x-.05,y+.303,z],[x+.025,y+.303,z],.019,steel);
    }

    shadow(BENCH.width+.39,BENCH.depth+.55,BENCH.x,BENCH.z,.006,.83);
    for (const dx of [-.137,0,.137]) {
      rounded(scene,.118,.044,BENCH.depth,BENCH.x+dx,.467,BENCH.z,wood,.009);
    }
    for (const dz of [-.91,.91]) {
      box(scene,.357,.039,.041,BENCH.x,.426,BENCH.z+dz,steel);
      for (const dx of [-.153,.153]) box(scene,.038,.411,.041,BENCH.x+dx,.215,BENCH.z+dz,steel);
    }
  }

  function chairBack() {
    const shape = new THREE.Shape();
    shape.moveTo(-.19,-.158);
    shape.quadraticCurveTo(-.239,-.11,-.235,.082);
    shape.quadraticCurveTo(-.236,.166,-.168,.174);
    shape.quadraticCurveTo(0,.200,.168,.174);
    shape.quadraticCurveTo(.236,.166,.235,.082);
    shape.quadraticCurveTo(.239,-.11,.19,-.158);
    shape.quadraticCurveTo(0,-.183,-.19,-.158);
    const grip = new THREE.Path();
    grip.absellipse(0,.098,.086,.022,0,Math.PI*2,false);
    shape.holes.push(grip);
    const geo = new THREE.ExtrudeGeometry(shape,{depth:.031,bevelEnabled:true,bevelSegments:3,
      bevelThickness:.010,bevelSize:.010,curveSegments:10});
    geo.translate(0,0,-.0155);
    return geo;
  }

  async function computers(scene, room, shadow) {
    const {rows,rearStation} = room.layout;
    const stations = rows.flat();
    const laminate = standard('#d1d6dc',.57), blue = standard('#3b526e',.54,.18);
    const gray = standard('#a2acb8',.65), steel = standard('#a4adb5',.36,.43);
    const casework = standard('#252d37',.60), bezel = standard('#303946',.56);
    const station = new THREE.Group();
    rounded(station,DESK.width,.053,DESK.depth,0,.749,0,laminate,.012);
    box(station,1.05,.055,.52,0,.70,0,blue);
    for (const x of [-.535,.535]) for (const z of [-.257,.257]) {
      cylinder(station,.022,.019,.697,x,.359,z,blue,14);
      cylinder(station,.021,.022,.022,x,.013,z,casework,14);
    }
    rounded(station,.178,.477,.334,.421,.261,-.042,casework,.009);
    for (const y of [.413,.380,.139,.115]) box(station,.124,.007,.005,.421,y,.126,bezel);
    box(station,.013,.010,.007,.460,.286,.126,new THREE.MeshBasicMaterial({color:'#a9c9df'}));
    rounded(station,.224,.018,.154,0,.788,-.101,casework,.004);
    rounded(station,.047,.150,.035,0,.852,-.131,bezel,.008);
    rounded(station,.573,.348,.048,0,SCREEN.y,SCREEN.z-.026,bezel,.013);
    box(station,.011,.004,.002,.242,.895,SCREEN.z+.002,new THREE.MeshBasicMaterial({color:'#92b6cf'}));
    rounded(station,.433,.021,.147,-.061,.784,.146,casework,.007);
    const keyboard = InteriorArtwork.canvasMap(380,112,(g,w,h) => {
      g.fillStyle = '#2a323b';
      g.fillRect(0,0,w,h);
      g.fillStyle = '#59616a';
      for (let i=0;i<5;i++) for (let j=0;j<18;j++) g.fillRect(9+j*20,7+i*19,15,13);
      g.fillStyle = '#646c74';
      g.fillRect(88,82,129,14);
    });
    flat(station,.415,.132,-.061,.796,.146,keyboard);
    const mouse = new THREE.Mesh(new THREE.SphereGeometry(.5,18,12),casework);
    mouse.position.set(.253,.785,.147);
    mouse.scale.set(.060,.039,.096);
    station.add(mouse);

    const chairZ = .612;
    rounded(station,.456,.068,.419,0,.455,chairZ,gray,.023);
    const back = new THREE.Mesh(chairBack(),gray);
    back.position.set(0,.745,chairZ+.185);
    back.rotation.x = .11;
    station.add(back);
    for (const x of [-.176,.176]) {
      for (const z of [-.14,.15]) rod(station,[x,.446,chairZ+z],[x*1.24,.021,chairZ+z*1.38],.0145,steel);
      rod(station,[x,.435,chairZ+.14],[x,.69,chairZ+.184],.0125,steel);
    }

    // The tables and hardware share geometry, with a separate transform for every seat.
    const transform = new THREE.Matrix4();
    for (const part of station.children) {
      part.updateMatrix();
      const copies = new THREE.InstancedMesh(part.geometry,part.material,stations.length);
      for (const [i,{x,z}] of stations.entries()) {
        copies.setMatrixAt(i,transform.makeTranslation(x,0,z).multiply(part.matrix));
      }
      scene.add(copies);
    }

    const desktop = InteriorArtwork.canvasMap(350,204,(g,w,h) => {
      const light = g.createLinearGradient(0,h,w,0);
      light.addColorStop(0,'#28669e');
      light.addColorStop(.53,'#528ebd');
      light.addColorStop(1,'#87bbdc');
      g.fillStyle = light;
      g.fillRect(0,0,w,h);
      g.fillStyle = '#c8e4f026';
      g.beginPath();
      g.moveTo(28,0);g.lineTo(94,0);g.lineTo(252,h);g.lineTo(172,h);g.closePath();
      g.fill();
    });
    const [frontCard,rearCard] = await Promise.all([
      clueBoardArt(room.clues[0]),clueBoardArt(room.clues[1])
    ]);
    const rearMap = imageMap(rearCard);
    for (const {x,z} of stations) {
      const map = x===rearStation.x && z===rearStation.z ? rearMap : desktop;
      patchPlane(scene,SCREEN.width,SCREEN.height,x,SCREEN.y,z+SCREEN.z,map);
      shadow(1.34,1.38,x,z+.235,.005,.70);
      shadow(.66,.71,x,z+chairZ,.007,.61);
    }
    const [front] = room.clues;
    box(scene,front.surface.width+.032,front.surface.height+.032,.03,...front.xyz.map((n,i)=>i===2?n-.021:n),standard('#9ca6ae',.65));
    patchPlane(scene,front.surface.width,front.surface.height,...front.xyz,imageMap(frontCard));
  }

  async function build(scene, room) {
    const sports = room.kind === 'sports';
    const artwork = await InteriorArtwork.load(room.kind);
    scene.add(new THREE.HemisphereLight('#fcfeff',sports?'#a19b93':'#b8c2cf',2.05));
    const main = new THREE.DirectionalLight('#fffaf1',.91);
    main.position.set(-3.4,4.4,6.1);
    scene.add(main);
    const back = new THREE.DirectionalLight('#d8edff',.46);
    back.position.set(4,3.2,-.4);
    scene.add(back);
    finishes(scene,room,artwork);
    const swingDoor = entrance(scene,room,artwork);
    const shadow = groundShadow(scene);
    const canvas = document.getElementById('roomView');
    Object.assign(canvas.dataset,{interior:room.kind,width,depth,area:width*depth});
    if (sports) {
      sportsEquipment(scene,shadow);
      const furniture=await lockers(scene,room,artwork,shadow);
      const x=room.entrance.x-room.entrance.width/2-.53;
      rounded(scene,.137,.168,.044,x,1.28,.048,standard('#434c55',.52),.009);
      const indicator=new THREE.MeshBasicMaterial({color:'#f38d72'});
      cylinder(scene,.026,.026,.011,x,1.28,.075,indicator,24).rotation.x=Math.PI/2;
      canvas.dataset.artwork='balls-v37';
      return {
        ...furniture,
        setDoor(amount){
          swingDoor(amount);
          indicator.color.set(amount>0?'#74d5a9':'#f38d72');
        }
      };
    }
    await computers(scene,room,shadow);
    box(scene,room.lock.width+.025,room.lock.height+.021,.052,room.lock.center[0],room.lock.center[1],.043,standard('#434c55',.47));
    const plate = patchPlane(scene,room.lock.width,room.lock.height,...room.lock.center,imageMap(schoolLockArt(room,[])));
    return {
      setDoor:swingDoor,
      setDigits(values) {
        plate.material.map.image = schoolLockArt(room,values);
        plate.material.map.needsUpdate = true;
      }
    };
  }

  return Object.freeze({definition,build});
})();
