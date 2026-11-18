'use strict';

const SportsComputerInteriors = (() => {
  const {size: {width, depth}, enclosure, entrance, box, rounded, patchPlane, flat,
    standard, rod, cylinder, groundShadow} = SchoolInterior;
  const LOCKER = {width: 1.08, height: 1.90, front: 1.46, column: .60, columns: 8, base: .11, cap: .05};
  const LOCKER_LENGTH = LOCKER.column * LOCKER.columns;
  const TIER_HEIGHT = (LOCKER.height - LOCKER.base - LOCKER.cap) / 2;
  const DESK = {width: 1.23, depth: .72};
  const SCREEN = {width: .525, height: .304, y: 1.056, z: -.103};

  function lockerPosition(bank, column, tier) {
    return [bank.x + LOCKER.width / 2, LOCKER.base + (tier + .5) * TIER_HEIGHT,
      LOCKER.front + (column + .5) * LOCKER.column];
  }

  function sportsLayout() {
    const banks = [
      {x: -3.3, finish: 'orange', color: '#c47b36'},
      {x: 0, finish: 'blue', color: '#5386a5'},
      {x: 3.3, finish: 'orange', color: '#c47b36'}
    ];
    const compartments = [
      {bank: 0, column: 5, tier: 1, id: 'photo', name: '운동회 사진'},
      {bank: 1, column: 2, tier: 1, id: 'ballOrder', name: '공 반납 순서'}
    ];
    const clues = compartments.map(({bank, column, tier, id, name}) => {
      const [x, y, z] = lockerPosition(banks[bank], column, tier);
      return {id, name, xyz: [x + .035, y, z], rotationY: Math.PI / 2,
        surface: {width: .54, height: .69}, approach: {x: banks[bank].x + 1.65, z: z+.25}};
    });
    const obstacles = banks.map(({x}, i) => [
      x - LOCKER.width/2 - .16,
      x + LOCKER.width/2 + (compartments.some(cell => cell.bank===i) ? .55 : .16),
      LOCKER.front - .18, LOCKER.front + LOCKER_LENGTH + .18
    ]);
    const occluders = banks.map(({x}) => [
      x - LOCKER.width/2, x + LOCKER.width/2, 0, LOCKER.height, LOCKER.front, LOCKER.front + LOCKER_LENGTH
    ]);
    obstacles.push([5.55,6.28,5.05,7.55]);
    return {banks, compartments, clues, obstacles, occluders};
  }

  function computerLayout() {
    const columns = [-3.91, -2.63, -1.35, 1.35, 2.63, 3.91];
    const rows = [1.62, 3.37, 5.12, 6.87].map(z => columns.map(x => ({x,z})));
    const rearStation = rows[3][3];
    const clues = [
      {id:'recordA', name:'모니터 출력 기록', xyz:[-.16,1.94,.057],
        surface:{width:1.28,height:.75}, approach:{x:0,z:1.02}},
      {id:'recordB', name:'뒤쪽 화면 점검 기록',
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
    const lock = {center:[doorway.x-doorway.width/2-.52,1.28,.073],
      width:sports?.75:.53,height:sports?.35:.53};
    const startX = sports ? -1.54 : 0;
    return {
      ...REVIEW_ROOMS.find(item => item.kind === kind),
      interior:true, kind, wall:{width,height,z:0,back:depth}, depth, ceilingMinimum:height,
      bounds:{left:-width/2+.27,right:width/2-.27,front:.29,back:depth-.27},
      entrance:doorway, door:[doorway.x,doorway.height/2,.05], lock, layout,
      obstacles, occluders, clues,
      targets:[{id:'lock',name:'문 잠금장치',xyz:lock.center,surface:lock,approach:{x:lock.center[0],z:.99}}, ...clues],
      start:[startX,1.55,depth-.32], firstView:[sports?-1.03:0,1.27,0],
      portraitView:[startX,1.31,0],
      stops:[...clues.map(clue => clue.xyz),lock.center,[width/2,1.42,depth/2],
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

  function lockerDoorArt(context, x, y, w, h, number, enamel) {
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

  async function lockers(scene, room, artwork, shadow) {
    const {banks,compartments} = room.layout;
    const {width:w,height:h,front,column,columns,base,cap} = LOCKER;
    const mid = front + LOCKER_LENGTH/2;
    const skirt = standard('#555c61',.69,.13), aluminum = standard('#a4adb2',.48,.35);
    const inside = standard('#777972',.82);
    const cards = new Map(await Promise.all(room.clues.map(async clue => [clue.id,imageMap(await clueBoardArt(clue))])));
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
              if (open?.column===col && open.tier===tier) g.clearRect(x+4,y+4,142,220);
            }
          }
        });
        patchPlane(scene,LOCKER_LENGTH,2*TIER_HEIGHT,x+side*w/2,(h+base-cap)/2,mid,face,!!open)
          .rotation.y = side*Math.PI/2;
        if (!open) continue;
        const [faceX,y,z] = lockerPosition(bank,open.column,open.tier);
        const compartment = new THREE.Group();
        compartment.position.set(faceX,y,z);
        compartment.rotation.y = Math.PI/2;
        scene.add(compartment);
        box(compartment,.568,.846,.34,0,0,-.36,inside);
        for (const yy of [-.418,.418]) box(compartment,.58,.019,.45,0,yy,-.231,aluminum);
        for (const xx of [-.283,.283]) box(compartment,.016,.852,.46,xx,0,-.238,metal);
        patchPlane(compartment,.474,.316,.028,-.028,-.072,cards.get(open.id));
        const flap = new THREE.Group();
        flap.position.set(.281,0,.008);
        flap.rotation.y = Math.PI/3.25;
        compartment.add(flap);
        const doorMap = InteriorArtwork.canvasMap(150,228,g => {
          lockerDoorArt(g,0,0,150,228,numberAt(open.column,open.tier),enamel.image);
        });
        box(flap,.551,.838,.022,-.2755,0,0,metal);
        patchPlane(flap,.550,.837,-.2755,0,.012,doorMap);
        patchPlane(flap,.525,.811,-.2755,0,-.012,enamel).rotation.y = Math.PI;
        box(compartment,.024,.094,.024,.285,.267,.009,aluminum);
        box(compartment,.024,.094,.024,.285,-.258,.009,aluminum);
      }
    }
    const slat = standard('#a08b6f',.75), frame = standard('#5a6266',.52,.32);
    const x = 5.91, z = 6.30;
    shadow(.79,2.73,x,z,.006,.83);
    for (const dx of [-.137,0,.137]) rounded(scene,.118,.044,2.18,x+dx,.467,z,slat,.009);
    for (const dz of [-.91,.91]) {
      box(scene,.357,.039,.041,x,.426,z+dz,frame);
      for (const dx of [-.153,.153]) box(scene,.038,.411,.041,x+dx,.215,z+dz,frame);
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
    const setDoor = entrance(scene,room,artwork);
    const shadow = groundShadow(scene);
    await (sports ? lockers(scene,room,artwork,shadow) : computers(scene,room,shadow));
    box(scene,room.lock.width+.025,room.lock.height+.021,.052,room.lock.center[0],room.lock.center[1],.043,standard('#434c55',.47));
    const plate = patchPlane(scene,room.lock.width,room.lock.height,...room.lock.center,imageMap(schoolLockArt(room,[])));
    const canvas = document.getElementById('roomView');
    Object.assign(canvas.dataset,{interior:room.kind,width,depth,area:width*depth});
    return {
      setDoor,
      setDigits(values) {
        plate.material.map.image = schoolLockArt(room,values);
        plate.material.map.needsUpdate = true;
      }
    };
  }

  return Object.freeze({definition,build});
})();
