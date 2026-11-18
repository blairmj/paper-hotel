'use strict';

const SchoolInterior = (() => {
  const WIDTH = 19 / Math.sqrt(2);
  const DEPTH = 13.54 / Math.sqrt(2);
  const DOOR = {x: 4.20, width: 1.64, height: 2.48};
  const PIANO_X = -3.89;
  const SCORE = {width: .91, height: .444, tilt: -Math.PI / 18, restY: 1.095, restZ: .670};
  const SCORE_CENTER = [
    PIANO_X + .02,
    SCORE.restY - .006 + Math.cos(SCORE.tilt) * SCORE.height / 2,
    SCORE.restZ + Math.sin(SCORE.tilt) * SCORE.height / 2
  ];
  const REHEARSAL_SEATS = [{x: -4.81, z: 3.24}, {x: -3.82, z: 3.40}];
  const STAND_DISTANCE = .72;
  const STAND_OFFSET = .10;
  const MUSIC_SAMPLE = {width:.42,height:.245,offset:.028};
  const PRINT_SHEET = {center:[2.25,1.144,5.16],width:.92,height:.53,tilt:-Math.PI/4};

  function definition(kind) {
    const music = kind === 'music';
    const height = music ? 3.4 : 3.8;
    const wall = {width: WIDTH, height, z: 0, back: DEPTH};
    const bounds = {left: -WIDTH / 2 + .28, right: WIDTH / 2 - .28, front: .29, back: DEPTH - .28};
    const lock = {center: [music ? 2.96 : 2.82, 1.26, .14], width: music ? .61 : .91, height: .40};
    const target = (id, name, xyz, width, height, x, z) => ({
      id, name, xyz, surface: {width, height}, approach: {x, z}
    });
    const clues = music ? [
      target('paper', '피아노 악보', SCORE_CENTER, SCORE.width, SCORE.height, -3.07, 2.35),
      target('musicSample', '보면대 변환 기록',
        [REHEARSAL_SEATS[0].x+STAND_OFFSET,1.172,REHEARSAL_SEATS[0].z-STAND_DISTANCE+.026],
        MUSIC_SAMPLE.width,MUSIC_SAMPLE.height,-3.55,4.03)
    ] : [
      target('printSamples', '작업대의 판화 도안', PRINT_SHEET.center, PRINT_SHEET.width, PRINT_SHEET.height, 2.25, 6.82),
      target('printRule', '게시판의 인쇄 기록', [-3.71, 2.13, .086], 1.20, .70, -3.10, 2.15)
    ];
    const entry = RECOVERY_ROOMS.find(item => item.kind === kind);
    return {
      ...entry, interior: true, kind, wall, bounds, depth: DEPTH, ceilingMinimum: music ? 3.4 : 3.2,
      start: [0, 1.55, 9.24], firstView: [0, 1.10, 0],
      portraitView: music ? [1.5, 1.45, 0] : [0, 1.4, 0],
      door: [DOOR.x, DOOR.height / 2, .05], lock, clues,
      targets: [target('lock', music ? '문 다이얼' : '문 인쇄판', lock.center, lock.width, lock.height, lock.center[0], 1.85), ...clues],
      obstacles: music ? [
        [-1.82, 1.82, 4.06, 6.48], [-5.19, -2.55, .05, 1.42],
        [3.07, 3.73, 3.27, 3.97], [4.45, 5.75, 2.16, 2.67],
        ...REHEARSAL_SEATS.map(({x, z}) => [x - .40, x + .40, z - STAND_DISTANCE - .32, z + .36])
      ] : [
        [-3.91, -.59, 3.45, 6.15], [.59, 3.91, 3.45, 6.15],
        [-5.65, -1.85, .05, 1.35], [-1.68, 1.28, .05, 1.02], [1.20, 2.60, .05, 1],
        [4.95, 6.60, .05, .90], [-6.60, -5.18, .8, 1.78]
      ],
      stops: [
        ...clues.map(clue => clue.xyz), lock.center,
        [WIDTH / 2, 1.55, DEPTH / 2], [0, 1.55, DEPTH], [-WIDTH / 2, 1.55, DEPTH / 2]
      ],
      finishes: music
        ? {front: 'black-acoustic', back: 'black-acoustic', left: 'black-acoustic', right: 'black-acoustic'}
        : {walls: 'celadon-plaster', floor: 'cool-gray-matte'}
    };
  }

  const standard = (color, roughness = .7, metalness = 0) =>
    new THREE.MeshStandardMaterial({color, roughness, metalness});

  function painted(map, intensity = 1) {
    return new THREE.MeshBasicMaterial({map, color: new THREE.Color().setScalar(intensity), side: THREE.DoubleSide});
  }

  function faces(map, top = 1.05, side = .75) {
    return [painted(map, side), painted(map, side * .9), painted(map, top),
      painted(map, .57), painted(map), painted(map, side)];
  }

  function box(parent, width, height, depth, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function rounded(parent, width, height, depth, x, y, z, material, radius) {
    const shape = new THREE.Shape();
    const halfW = width / 2 - radius;
    const halfH = height / 2 - radius;
    const r = Math.min(.035, halfW * .5, halfH * .5);
    shape.moveTo(-halfW + r, -halfH);
    shape.lineTo(halfW - r, -halfH);
    shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r);
    shape.lineTo(halfW, halfH - r);
    shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
    shape.lineTo(-halfW + r, halfH);
    shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
    shape.lineTo(-halfW, -halfH + r);
    shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH);
    const inset = depth - 2 * radius;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: inset, bevelEnabled: true, bevelThickness: radius, bevelSize: radius, bevelSegments: 3, curveSegments: 5
    });
    geometry.translate(0, 0, -inset / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function patchPlane(parent, width, height, x, y, z, map, transparent = false) {
    const material = painted(map);
    material.transparent = transparent;
    material.alphaTest = transparent ? .03 : 0;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function flat(parent, width, depth, x, y, z, map) {
    const mesh = patchPlane(parent, width, depth, x, y, z, map);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  function quad(parent, points, material, uv = [0, 0, 1, 0, 1, 1, 0, 1]) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, top, bottom, height, x, y, z, material, sides = 28) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function rod(parent, from, to, radius, material) {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a);
    const midpoint = a.add(b).multiplyScalar(.5);
    const mesh = cylinder(parent, radius, radius, direction.length(), ...midpoint, material, 12);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return mesh;
  }

  function tube(parent, points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 10, false), material);
    parent.add(mesh);
    return mesh;
  }

  function torus(parent, radius, thickness, x, y, z, material, arc = Math.PI * 2) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 10, 40, arc), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function enclosure(scene, room, artwork, trimColor, rightWallMap) {
    const {width: w, back: d, height: h} = room.wall;
    const low = room.ceilingMinimum;
    const door = room.entrance ?? DOOR;
    const left = door.x - door.width / 2, right = door.x + door.width / 2;
    const roofAt = x => low + (x + w / 2) * (h - low) / w;
    const front = painted(artwork.surface('wall', w, h, 'front'));
    const frontSection = points => quad(scene, points.map(([x, y]) => [x, y, 0]), front,
      points.flatMap(([x, y]) => [(x + w / 2) / w, y / h]));
    frontSection([[-w / 2, 0], [left, 0], [left, roofAt(left)], [-w / 2, low]]);
    frontSection([[right, 0], [w / 2, 0], [w / 2, h], [right, roofAt(right)]]);
    frontSection([[left, door.height], [right, door.height], [right, roofAt(right)], [left, roofAt(left)]]);

    const wall = (side, width, height) => painted(artwork.surface('wall', width, height, side));
    quad(scene, [[w/2, 0, d], [-w/2, 0, d], [-w/2, low, d], [w/2, h, d]], wall('back', w, h));
    quad(scene, [[-w/2, 0, d], [-w/2, 0, 0], [-w/2, low, 0], [-w/2, low, d]], wall('left', d, low));
    quad(scene, [[w/2, 0, 0], [w/2, 0, d], [w/2, h, d], [w/2, h, 0]],
      rightWallMap ? painted(rightWallMap) : wall('right', d, h));
    quad(scene, [[-w/2, low, d], [w/2, h, d], [w/2, h, 0], [-w/2, low, 0]],
      painted(artwork.surface('ceiling', w, d)));
    flat(scene, w, d, 0, 0, d/2, artwork.surface('floor', w, d));

    const trim = standard(trimColor);
    for (const x of [-w/2, w/2]) box(scene, .024, .075, d, x, .0375, d/2, trim);
    box(scene, w, .075, .024, 0, .0375, d, trim);
    box(scene, left + w/2, .075, .024, (left - w/2)/2, .0375, .013, trim);
    box(scene, w/2 - right, .075, .024, (right + w/2)/2, .0375, .013, trim);
  }

  function architecture(scene, room, artwork, mural) {
    const {width: w, back: d, height: h} = room.wall;
    const low = room.ceilingMinimum;
    const music = room.kind === 'music';
    const roofAt = x => low + (x + w / 2) * (h - low) / w;
    enclosure(scene, room, artwork, music ? '#5c5552' : '#8b8175', mural);
    if (music) {
      const cornerTrim = standard('#625d5b', .8);
      for (const x of [-w/2 + .012, w/2 - .012]) {
        for (const z of [.012, d - .012]) box(scene, .036, h, .036, x, h/2, z, cornerTrim);
      }
      const slat = standard('#302a28', .88);
      for (let x = -5.15; x <= -2.52; x += .097) {
        rounded(scene, .044, 3.02, .036, x, 1.71, .039, slat, .007);
      }
      const cloudSurface = artwork.surface('cloud', 2.52, 1.24);
      const cloud = faces(cloudSurface, .9, .8);
      cloud[3] = painted(cloudSurface);
      const wire = standard('#6a605b', .52, .26);
      for (const x of [-3.41, 0, 3.41]) {
        for (const z of [1.87, 4.62, 7.52]) {
          box(scene, 2.52, .125, 1.24, x, h - .295, z, cloud);
          for (const dx of [-1.04, 1.04]) rod(scene, [x+dx,h-.23,z], [x+dx,h-.01,z], .004, wire);
        }
      }
      const lampFrame = standard('#6b5a51', .42, .1);
      const emitter = new THREE.MeshBasicMaterial({color:'#fff5e8'});
      for (const x of [-1.78, 1.78]) {
        for (const z of [2.67, 6.46]) {
          box(scene,.126,.061,3.12,x,h-.083,z,lampFrame);
          box(scene,.092,.015,3.06,x,h-.119,z,emitter);
        }
      }
    } else {
      const slope = Math.atan2(h - low, w);
      const beam = standard('#f3f1ec', .88);
      for (const z of [1.10, 3.45, 5.80, 8.15]) {
        box(scene, Math.hypot(w, h - low), .164, .19, 0, (low + h)/2 - .08, z, beam).rotation.z = slope;
      }
      const rail = standard('#3a3b38', .44, .18);
      const emitter = new THREE.MeshBasicMaterial({color:'#fffff8'});
      for (const x of [-3.2, 2.7]) {
        const y = roofAt(x) - .195;
        box(scene, .054, .042, d - .9, x, y, d/2, rail);
        for (const z of [1.5, 4.1, 6.7]) {
          cylinder(scene, .052, .052, .071, x, y-.026, z, rail);
          cylinder(scene, .064, .095, .14, x, y-.120, z, rail);
          cylinder(scene, .075, .075, .007, x, y-.192, z, emitter);
        }
      }

      const board = artwork.patch([181, 293, 489, 125], path => {
        path.moveTo(0, 0);
        path.lineTo(489, 0);
        path.lineTo(489, 125);
        path.lineTo(30, 125);
        path.lineTo(30, 81);
        path.lineTo(0, 81);
        path.closePath();
      });
      const corkEdge = standard('#907048');
      box(scene, 4.52, 1.16, .032, -3.91, 2.08, .022, corkEdge);
      patchPlane(scene, 4.87, 1.23, -4.06, 2.10, .061, board, true);
    }
  }

  function entrance(scene, room, artwork) {
    const {x, width, height, moldingColor, recessColor} = room.entrance ?? DOOR;
    const trim = .083;
    const music = room.kind === 'music';
    const finish = artwork.sample('door');
    const casing = faces(finish, .91, .78);
    const leafMaterial = faces(finish, .94, .79);
    const molding = standard(moldingColor ?? (music ? '#514747' : '#506b6e'), .5);
    const recess = standard(recessColor ?? (music ? '#262122' : '#283e40'), .72);
    const metal = standard(music ? '#d2b9a0' : '#d0d3ce', .31, .45);
    for (const edge of [x-width/2, x+width/2]) {
      box(scene, trim+.038, height, .34, edge, height/2, -.044, casing);
      box(scene, .018, height-.03, .015, edge+Math.sign(x-edge)*.046, (height-.03)/2, .131, molding);
    }
    box(scene, width+trim+.038, trim+.024, .34, x, height-.011, -.044, casing);
    const leafW = width-trim-.017, leafH = height-trim/2-.009;
    const hinge = new THREE.Group();
    hinge.position.set(x+width/2-.048, .009, .06);
    scene.add(hinge);
    box(hinge, leafW, leafH, .073, -leafW/2, leafH/2, 0, leafMaterial);
    for (const j of [-.023,-leafW+.023]) box(hinge,.021,leafH-.045,.012,j,leafH/2,.04,recess);
    box(hinge,leafW-.025,.021,.013,-leafW/2,leafH-.020,.04,recess);
    cylinder(hinge,.056,.058,.024,-leafW+.24,1.04,.053,metal).rotation.x = Math.PI/2;
    rounded(hinge,.26,.044,.065,-leafW+.335,1.04,.085,metal,.012);
    for (const y of [.44,1.24,2.02]) box(hinge,.036,.105,.044,-.018,y,.065,metal);

    // The door swings on a real hinge into the room. The recess is a small hall.
    const hall = standard('#c5c9c4');
    box(scene, width+.03, .06, 3.07, x, -.029, -1.51, standard('#aeb2ac'));
    for (const side of [-1, 1]) {
      const edge = x + side*(width/2+.028);
      box(scene,.067,height,2.96,edge,height/2,-1.60,hall);
      box(scene,.024,.14,2.93,edge-side*.04,1.02,-1.55,standard('#708d83'));
    }
    box(scene,width+.12,.06,2.96,x,height+.019,-1.60,standard('#d9ddda'));
    box(scene,width+.11,height+.12,.10,x,height/2,-3.06,standard('#99aaa1'));
    box(scene,.42,.022,.88,x,height-.036,-1.39,new THREE.MeshBasicMaterial({color:'#fbfcf7'}));
    return amount => { hinge.rotation.y = 1.48 * amount; };
  }

  function musicScoreMap() {
    return InteriorArtwork.canvasMap(600, 350, (g, w, h) => {
      const page = g.createLinearGradient(12, 0, w-12, 0);
      for (const [u, color] of [[0,'#ce9d71'],[.09,'#ead5ad'],[.43,'#ffedcb'],[.5,'#b19574'],[.56,'#fff0d5'],[.94,'#ead3b0'],[1,'#cda680']]) {
        page.addColorStop(u, color);
      }
      g.fillStyle = '#7d523e';
      g.beginPath();
      g.roundRect(7,11,w-14,h-18,17);
      g.fill();
      g.fillStyle = page;
      g.beginPath();
      g.moveTo(29,19);
      g.quadraticCurveTo(182,-1,300,34);
      g.quadraticCurveTo(410,2,570,19);
      g.lineTo(588,321);
      g.quadraticCurveTo(430,297,300,333);
      g.quadraticCurveTo(173,296,12,322);
      g.closePath();
      g.fill();
      g.strokeStyle='#776650';
      g.lineWidth=1.5;
      for(const left of [54,327])for(let y=137;y<=189;y+=13){
        g.beginPath();
        g.moveTo(left,y);g.lineTo(left+215,y);g.stroke();
      }
      g.fillStyle = '#392e29';
      g.font='600 36px Arial,sans-serif';
      g.textAlign='center';
      for (const [i,number] of MUSIC_KEYS.entries()) {
        const x=(i<4?78:351)+(i%4)*54, y=number==='1'?175:149;
        g.beginPath();
        g.ellipse(x,y,11,7,-.28,0,Math.PI*2);
        g.fill();
        g.fillRect(x+8,y-43,3,43);
        g.fillText(number,x,247);
      }
    });
  }

  function musicPiano(scene, artwork) {
    const x = PIANO_X;
    const wood = faces(artwork.sample('walnut'), 1.12, .79);
    const edge = standard('#a46941', .57);
    const shadowedWood = standard('#775037', .75);
    box(scene,2.47,1.46,.47,x,.79,.30,wood);
    box(scene,2.57,.059,.53,x,1.55,.315,wood);
    box(scene,2.31,.062,.054,x,1.18,.565,edge);
    box(scene,2.58,.211,.29,x,.81,.60,wood);
    box(scene,2.53,.051,.31,x,.704,.60,shadowedWood);
    box(scene,2.59,.040,.287,x,.913,.615,wood);
    const ivory = standard('#e9deca', .44);
    const ebony = standard('#2f2724', .48);
    for (let i=0; i<52; i++) {
      const kx=x-1.124+(i+.5)*2.248/52;
      box(scene,.042,.013,.215,kx,.944,.638,ivory);
      if (i !== 51 && ![0,3].includes(i%7)) box(scene,.025,.022,.134,kx+.021,.96,.594,ebony);
    }
    for (const dx of [-1.17,1.17]) {
      box(scene,.111,.70,.24,x+dx,.39,.60,wood);
      box(scene,.15,.069,.284,x+dx,.075,.61,edge);
    }
    const brass = standard('#c19445', .32, .45);
    for (const dx of [-.08,0,.08]) rounded(scene,.046,.029,.102,x+dx,.067,.566,brass,.007);

    // The music rack is fixed to the piano's upper panel, clear of the keys.
    const [scoreX, scoreY, scoreZ] = SCORE_CENTER;
    const rack = box(scene,1.00,.417,.028,scoreX,
      scoreY + .019 * Math.sin(SCORE.tilt), scoreZ - .019 * Math.cos(SCORE.tilt),wood);
    rack.rotation.x = SCORE.tilt;
    box(scene,.87,.10,.10,scoreX,1.21,.584,shadowedWood);
    box(scene,1.00,.036,.17,scoreX,SCORE.restY-.018,.612,wood);
    rounded(scene,1.00,.029,.028,scoreX,SCORE.restY+.005,.689,edge,.007);
    patchPlane(scene,SCORE.width,SCORE.height,...SCORE_CENTER,musicScoreMap(),true).rotation.x = SCORE.tilt;

    const benchWood = faces(artwork.sample('walnut'), .91, .78);
    box(scene,1.36,.106,.38,x,.477,1.00,benchWood);
    rounded(scene,1.39,.095,.436,x,.558,1.00,standard('#614332',.48),.032);
    patchPlane(scene,1.31,.066,x,.560,1.221,artwork.sample('bench'));
    for (const dx of [-.62,.62]) {
      for (const dz of [-.143,.143]) box(scene,.079,.47,.075,x+dx,.235,1+dz,benchWood);
    }

    const guitar = artwork.patch([249,316,55,155], g => {
      g.moveTo(23,1); g.lineTo(37,1); g.lineTo(37,22); g.lineTo(34,28);
      g.lineTo(34,79);
      g.bezierCurveTo(61,81,41,106,51,119);
      g.bezierCurveTo(66,154,5,165,2,135);
      g.bezierCurveTo(0,126,12,110,9,103);
      g.bezierCurveTo(3,91,10,80,23,79);
      g.lineTo(23,24); g.lineTo(18,23); g.lineTo(18,9); g.closePath();
    });
    patchPlane(scene,.49,1.47,-5.61,1.77,.097,guitar,true);

    const clock = artwork.patch([780,309,78,79], (g,w,h) => g.ellipse(w/2,h/2,w/2-1,h/2-1,0,0,Math.PI*2));
    cylinder(scene,.345,.345,.047,-.17,2.25,.104,brass).rotation.x = Math.PI/2;
    patchPlane(scene,.71,.71,-.17,2.25,.131,clock,true);
  }

  function rehearsalFurniture(scene, artwork, sampleMap) {
    const fabric = standard('#80716c', .91);
    const chairFrame = standard('#585856', .49, .23);
    const standFrame = standard('#2e2d2c', .51, .20);
    const foot = standard('#292827', .87);
    const cloth = artwork.patch('chair', (path, w, h) => path.roundRect(0, 0, w, h, 10));

    const trayShape = new THREE.Shape();
    trayShape.moveTo(-.244, -.143);
    trayShape.lineTo(.244, -.143);
    trayShape.lineTo(.244, .127);
    trayShape.quadraticCurveTo(.244, .143, .228, .143);
    trayShape.lineTo(-.228, .143);
    trayShape.quadraticCurveTo(-.244, .143, -.244, .127);
    trayShape.closePath();
    for (const y of [-.075, 0, .075]) {
      for (const x of [-.17, -.102, -.034, .034, .102, .17]) {
        const hole = new THREE.Path();
        hole.absarc(x, y, .013, 0, Math.PI * 2, true);
        trayShape.holes.push(hole);
      }
    }
    const trayGeometry = new THREE.ExtrudeGeometry(trayShape, {
      depth: .007, bevelEnabled: false, curveSegments: 10
    });

    for (const {x, z} of REHEARSAL_SEATS) {
      const chair = new THREE.Group();
      chair.position.set(x, 0, z);
      scene.add(chair);
      rounded(chair,.51,.076,.445,0,.465,0,fabric,.023);
      flat(chair,.462,.394,0,.505,0,artwork.sample('chair'));
      const back = new THREE.Group();
      back.position.set(0,.737,.176);
      back.rotation.x = .12;
      chair.add(back);
      rounded(back,.49,.322,.068,0,0,0,fabric,.024);
      for (const faceZ of [-.035,.035]) patchPlane(back,.436,.270,0,0,faceZ,cloth,true);
      for (const dx of [-.195,.195]) {
        for (const dz of [-.16,.16]) {
          rod(chair,[dx,.439,dz],[dx*1.18,.023,dz*1.34],.015,chairFrame);
          cylinder(chair,.017,.019,.022,dx*1.18,.012,dz*1.34,foot,16);
        }
        rod(chair,[dx,.441,.159],[dx,.717,.202],.016,chairFrame);
      }

      const standX = x + STAND_OFFSET, standZ = z - STAND_DISTANCE;
      rod(scene,[standX,.058,standZ],[standX,1.095,standZ],.013,standFrame);
      cylinder(scene,.024,.024,.034,standX,.307,standZ,standFrame,20);
      for (const [dx,dz] of [[-.221,.14],[.221,.14],[0,-.248]]) {
        rod(scene,[standX,.234,standZ],[standX+dx,.028,standZ+dz],.012,standFrame);
        cylinder(scene,.014,.017,.021,standX+dx,.014,standZ+dz,foot,16);
      }
      const tray = new THREE.Group();
      tray.position.set(standX,1.163,standZ);
      tray.rotation.x = -.32;
      scene.add(tray);
      tray.add(new THREE.Mesh(trayGeometry, standFrame));
      rounded(tray,.493,.026,.067,0,-.140,.025,standFrame,.008);
      if(x===REHEARSAL_SEATS[0].x){
        patchPlane(tray,MUSIC_SAMPLE.width,MUSIC_SAMPLE.height,0,0,MUSIC_SAMPLE.offset,sampleMap);
      }
    }
  }

  function musicWorkstation(scene, artwork) {
    const wood = faces(artwork.sample('deskWood'), .97, .66);
    const slab = standard('#4b4240', .52);
    const equipment = standard('#272421', .49);
    const steel = standard('#53504b', .42, .28);
    const fabric = faces(artwork.sample('chair'), 1.05, .85);

    flat(scene,3.63,2.45,0,.006,5.10,artwork.surface('rug',3.63,2.45));
    const rugEdge = standard('#4e4240', .88);
    for (const x of [-1.82,1.82]) box(scene,.029,.011,2.47,x,.006,5.10,rugEdge);
    for (const z of [3.875,6.325]) box(scene,3.66,.011,.029,0,.006,z,rugEdge);

    rounded(scene,3.15,.088,1.06,0,.817,4.85,slab,.012);
    flat(scene,3.125,1.04,0,.864,4.85,artwork.sample('deskTop'));
    patchPlane(scene,3.111,.069,0,.817,5.381,artwork.patch([492,596,208,18]));
    for (const x of [-1.35,1.35]) box(scene,.25,.78,.88,x,.392,4.83,wood);
    box(scene,2.54,.283,.084,0,.655,4.426,wood);
    rounded(scene,.274,.522,.432,1.016,.268,4.755,equipment,.018);
    box(scene,.038,.008,.012,1.05,.454,4.977,steel);

    rounded(scene,1.237,.529,.073,-.003,1.280,4.566,equipment,.017);
    patchPlane(scene,1.218,.527,-.003,1.28,4.609,artwork.patch([713,425,241,105], (path,w,h) => {
      path.roundRect(1,1,w-2,h-2,5);
    }),true);
    box(scene,.079,.242,.081,0,.979,4.536,equipment);
    rounded(scene,.347,.030,.237,0,.883,4.546,equipment,.008);

    const speakerFace = artwork.patch([578,433,79,110], (path,w,h) => path.roundRect(1,1,w-2,h-2,8));
    for (const x of [-1.13,1.13]) {
      rounded(scene,.410,.617,.337,x,1.211,4.59,equipment,.028);
      patchPlane(scene,.403,.608,x,1.211,4.762,speakerFace,true);
      rounded(scene,.417,.061,.343,x,.879,4.588,steel,.012);
      cylinder(scene,.037,.037,.012,x,1.125,4.417,steel).rotation.x = Math.PI/2;
    }

    const deck = (x, z, w, d, imageCorners) => {
      rounded(scene,w,.045,d,x,.891,z,equipment,.011);
      scene.add(artwork.facePixels([
        [x-w/2+.013,.916,z-d/2+.01], [x+w/2-.013,.916,z-d/2+.01],
        [x+w/2-.013,.916,z+d/2-.01], [x-w/2+.013,.916,z+d/2-.01]
      ], imageCorners));
    };
    deck(0,5.119,1.37,.306,[[709,550],[963,550],[974,580],[696,580]]);
    deck(-.993,5.132,.635,.28,[[565,550],[672,550],[659,581],[541,581]]);

    const phones = new THREE.Group();
    phones.position.set(.945, .978, 5.12);
    phones.rotation.y = -.32;
    scene.add(phones);
    torus(phones,.113,.018,0,.031,0,equipment,Math.PI);
    torus(phones,.097,.010,0,.029,0,steel,Math.PI);
    for (const x of [-.112,.112]) {
      rounded(phones,.048,.132,.081,x,-.025,0,equipment,.019);
      cylinder(phones,.048,.045,.017,x*1.24,-.019,0,steel).rotation.z = Math.PI/2;
    }

    const chair = standard('#82736f', .91);
    rounded(scene,.628,.132,.548,0,.475,5.82,chair,.04);
    box(scene,.57,.065,.456,0,.467,5.825,fabric);
    rounded(scene,.638,.495,.123,0,.728,6.001,chair,.036);
    const back = artwork.patch([748,580,177,142], (path,w,h) => path.roundRect(2,2,w-4,h-4,20));
    patchPlane(scene,.627,.492,0,.730,6.066,back,true);
    patchPlane(scene,.583,.073,0,.465,6.101,artwork.patch([765,716,141,26], (path,w,h) => {
      path.roundRect(1,1,w-2,h-2,7);
    }),true);
    cylinder(scene,.041,.04,.29,0,.26,5.82,steel);
    for (let i=0; i<5; i++) {
      const a = i*Math.PI*2/5;
      const x = .322*Math.cos(a), z = 5.82+.322*Math.sin(a);
      rod(scene,[0,.155,5.82],[x,.058,z],.022,steel);
      const wheel = cylinder(scene,.032,.032,.035,x,.032,z,equipment);
      wheel.rotation.z = Math.PI/2;
    }
    for (const x of [-.338,.338]) {
      rod(scene,[x*.9,.456,5.94],[x,.68,5.94],.022,steel);
      rounded(scene,.068,.052,.300,x,.683,5.82,chair,.016);
    }

    const gobo = artwork.patch([1440,367,148,243], (path,w,h) => path.roundRect(2,2,w-4,h-4,14));
    rounded(scene,1.12,1.80,.118,5.1,1.020,2.40,standard('#6b5e56',.68),.036);
    patchPlane(scene,1.107,1.791,5.1,1.020,2.469,gobo,true);
    patchPlane(scene,1.044,1.724,5.1,1.020,2.337,artwork.sample('gobo'));
    for (const x of [4.655,5.545]) {
      rod(scene,[x,.113,2.21],[x,.113,2.60],.02,steel);
      for (const z of [2.24,2.56]) {
        rod(scene,[x,.127,z],[x,.054,z],.011,steel);
        cylinder(scene,.042,.042,.026,x,.041,z,equipment).rotation.z = Math.PI/2;
      }
    }

    const mic = new THREE.Group();
    mic.position.set(3.40,0,3.60);
    scene.add(mic);
    for (const [dx,dz] of [[-.28,.16],[.28,.16],[.025,-.265]]) {
      rod(mic,[0,.265,0],[dx,.034,dz],.015,steel);
      cylinder(mic,.019,.020,.041,dx,.026,dz,equipment);
    }
    rod(mic,[0,.085,0],[0,1.345,0],.014,steel);
    cylinder(mic,.028,.028,.072,0,1.29,0,equipment);
    const grille = standard('#8e8274', .48, .32);
    const silver = standard('#c8b9a6', .36, .46);
    cylinder(mic,.035,.034,.171,0,1.495,0,silver);
    rounded(mic,.067,.117,.060,0,1.585,0,grille,.019);
    for (let i=0;i<9;i++) {
      torus(mic,.033,.0018,0,1.551+i*.008,0,silver).rotation.x = Math.PI/2;
    }
    for (const y of [1.399,1.500]) torus(mic,.082,.0048,0,y,0,silver).rotation.x = Math.PI/2;
    for (let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      const b=a+.44;
      rod(mic,[.082*Math.cos(a),1.399,.082*Math.sin(a)],[.082*Math.cos(b),1.500,.082*Math.sin(b)],.0038,steel);
    }
    torus(mic,.091,.006,.129,1.640,.068,equipment);
    cylinder(mic,.087,.087,.006,.129,1.64,.068,standard('#3b3531',.98)).rotation.x = Math.PI/2;
    tube(mic,[[0,1.30,.045],[.140,1.42,.10],[.140,1.54,.074]],.0045,steel);
  }

  function artWorkshop(scene, artwork) {
    const wood = faces(artwork.sample('wood'), 1.11, .79);
    const woodFace = standard('#bf8b58', .58);
    const leg = standard('#6d706e', .43, .22);
    const steel = standard('#bfc5c2', .31, .18);
    const cream = standard('#ded5c4', .57);
    const laminate = faces(artwork.sample('laminate'), 1, .89);
    const paper = standard('#f5efe2', .92);
    const stoolTop = artwork.sample('stool');
    const mat = artwork.sample('cuttingMat');
    const brush = standard('#806341', .72);
    const bristles = standard('#393327', .7);

    for (const x of [-2.25,2.25]) {
      box(scene,2.77,.094,1.27,x,.900,4.80,laminate);
      flat(scene,2.759,1.253,x,.948,4.80,artwork.sample('laminate'));
      const rim = standard('#d8cebd', .60);
      for (const dz of [-.634,.634]) box(scene,2.76,.009,.008,x,.946,4.80+dz,rim);
      for (const dx of [-1.213,1.213]) {
        for (const dz of [-.488,.488]) box(scene,.085,.859,.085,x+dx,.435,4.80+dz,wood);
      }
      const m = x-.62, z = 4.79;
      flat(scene,.650,.42,m,.951,z,mat);
      const grid = standard('#5d8078',.82);
      for (const dx of [-.24,-.12,0,.12,.24]) box(scene,.0017,.001,.411,m+dx,.9517,z,grid);
      for (const dz of [-.14,-.07,0,.07,.14]) box(scene,.641,.001,.0017,m,.9517,z+dz,grid);
      for (let i=0;i<5;i++) box(scene,.434-i*.003,.007,.320-i*.002,x+.27,.952+i*.006,4.88,paper);
      cylinder(scene,.056,.047,.125,x+.88,1.015,4.86,cream);
      for (let i=0;i<5;i++) {
        const dx=(i-2)*.015;
        rod(scene,[x+.88+dx*.6,1.021,4.86],[x+.88+dx*1.8,1.235,4.84+i*.013],.005,brush);
        rod(scene,[x+.88+dx*1.8,1.22,4.84+i*.013],[x+.88+dx*1.95,1.267,4.835+i*.014],.007,bristles);
      }
      for (const dx of [-.87,.87]) {
        for (const dz of [-1.03,1.03]) {
          const sx=x+dx,sz=4.80+dz;
          cylinder(scene,.251,.249,.065,sx,.557,sz,woodFace,44);
          const seat = new THREE.Mesh(new THREE.CircleGeometry(.248,48),painted(stoolTop,1.10));
          seat.position.set(sx,.590,sz);
          seat.rotation.x = -Math.PI/2;
          scene.add(seat);
          for (const lx of [-.166,.166]) {
            for (const lz of [-.141,.141]) {
              rod(scene,[sx+lx,.537,sz+lz],[sx+lx*1.39,.026,sz+lz*1.37],.017,leg);
              cylinder(scene,.021,.021,.022,sx+lx*1.39,.017,sz+lz*1.37,bristles);
            }
          }
        }
      }
    }

    const benchX=-4.09, benchZ=.6;
    box(scene,3.59,.108,.77,benchX,.796,benchZ,wood);
    box(scene,3.63,.047,.8,benchX,.873,benchZ,wood);
    for (const x of [benchX-1.625,benchX+1.625]) {
      for (const z of [benchZ-.264,benchZ+.264]) box(scene,.13,.803,.13,x,.402,z,wood);
    }
    for (let i=0;i<4;i++) box(scene,.792,.009,.405,benchX-.31,.902+i*.009,benchZ,paper);
    const [sheetX,,sheetZ]=PRINT_SHEET.center;
    box(scene,.95,.018,.41,sheetX,.958,sheetZ,wood);
    box(scene,.87,.031,.033,sheetX,.974,sheetZ+.190,woodFace);

    // Beveled tile, two recessed basins and a cabinet photographed in the concept.
    const counter = standard('#535451', .5);
    const inside = standard('#58696a', .44, .28);
    const tile = faces(artwork.sample('tile'), 1, .91);
    for (let col=0;col<8;col++) {
      for (let row=0;row<2;row++) box(scene,.295,.236,.025,-1.25+.3*col,1.175+row*.240,.027,tile);
    }
    const cabinetX=-.2;
    box(scene,2.475,.980,.68,cabinetX,.490,.399,wood);
    patchPlane(scene,2.46,.970,cabinetX,.500,.744,artwork.patch([667,487,264,98]));
    const basinZ=.454, rimY=1.056;
    const basins=[-.77,.37];
    box(scene,2.53,.064,.119,cabinetX,1.010,.16,counter);
    box(scene,2.53,.064,.12,cabinetX,1.010,.75,counter);
    for (const x of [-1.34,-.20,.94]) box(scene,.247,.064,.515,x,1.010,basinZ,counter);
    for (const x of basins) {
      box(scene,.86,.060,.495,x,.958,basinZ,inside);
      box(scene,.807,.010,.426,x,.990,basinZ,steel);
      for (const dz of [-.233,.233]) box(scene,.927,.025,.035,x,rimY,basinZ+dz,steel);
      for (const dx of [-.454,.454]) box(scene,.037,.025,.464,x+dx,rimY,basinZ,steel);
      cylinder(scene,.04,.04,.007,x,.996,basinZ,inside,24);
      tube(scene,[[x,1.043,.185],[x,1.275,.185],[x-.039,1.366,.232],[x-.089,1.333,.324],[x-.105,1.284,.337]],.018,steel);
      cylinder(scene,.029,.03,.026,x,1.053,.184,steel);
      rod(scene,[x+.062,1.040,.187],[x+.062,1.118,.187],.014,steel);
    }

    const rackX=1.76,rackZ=.50,cage=standard('#7c8580',.46,.34);
    for (const dx of [-.405,.405]) {
      for (const dz of [-.23,.23]) {
        rod(scene,[rackX+dx,.045,rackZ+dz],[rackX+dx,1.88,rackZ+dz],.017,cage);
        cylinder(scene,.032,.032,.029,rackX+dx,.035,rackZ+dz,leg).rotation.z=Math.PI/2;
      }
    }
    const studentSheets=[[534,316,52,50],[333,345,53,52],[604,341,45,58]];
    for (let tier=0;tier<11;tier++) {
      const y=.145+tier*.158;
      for (const dz of [-.23,.0,.23]) rod(scene,[rackX-.405,y,rackZ+dz],[rackX+.405,y,rackZ+dz],.0065,cage);
      for (const dx of [-.398,-.20,0,.20,.398]) rod(scene,[rackX+dx,y,rackZ-.23],[rackX+dx,y,rackZ+.23],.005,cage);
      if ([2,5,8].includes(tier)) flat(scene,.693,.417,rackX,y+.009,rackZ,artwork.patch(studentSheets[(tier-2)/3]));
    }

    const cabinet=5.64, shelvesZ=.381;
    box(scene,1.38,2.12,.044,cabinet,1.06,.136,wood);
    box(scene,1.38,.810,.575,cabinet,.405,shelvesZ,wood);
    for (const dx of [-.666,.666]) box(scene,.05,2.145,.63,cabinet+dx,1.076,shelvesZ,wood);
    for (const y of [.828,1.212,1.58,2.146]) box(scene,1.38,.049,.615,cabinet,y,shelvesZ,wood);
    for (const dx of [-.331,.331]) {
      box(scene,.648,.728,.048,cabinet+dx,.441,.692,wood);
      box(scene,.169,.017,.041,cabinet+dx,.709,.732,steel);
    }
    for (const [i,color] of ['#829b91','#c3a474','#b58079'].entries()) {
      const x=cabinet-.405+i*.395, bin=standard(color,.81);
      rounded(scene,.346,.259,.433,x,1.356,.469,bin,.015);
      box(scene,.361,.036,.453,x,1.493,.47,bin);
      box(scene,.124,.048,.003,x,1.363,.690,paper);
    }
    box(scene,1.123,.474,.447,cabinet-.005,1.841,.43,cream);
    patchPlane(scene,1.18,.512,cabinet-.017,1.821,.656,artwork.patch([1366,353,124,57]));

    const easelX=-5.87,easelZ=1.16;
    for (const [dx,dz] of [[-.51,.14],[.44,.10],[.02,-.42]]) {
      rod(scene,[easelX+dx,.021,easelZ+dz],[easelX+dx*.52,1.87,easelZ-.053],.028,woodFace);
    }
    box(scene,1.04,.066,.109,easelX,1.227,easelZ+.069,wood);
    box(scene,.830,.046,.094,easelX,.688,easelZ+.076,wood);
  }

  function groundShadow(scene) {
    const falloff = InteriorArtwork.canvasMap(256,256,(g,w,h) => {
      const gradient = g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
      gradient.addColorStop(0,'#1d171681');
      gradient.addColorStop(.36,'#1d17164e');
      gradient.addColorStop(.70,'#1d171624');
      gradient.addColorStop(1,'#1d171600');
      g.fillStyle=gradient;
      g.fillRect(0,0,w,h);
    });
    return (width,depth,x,z,y=.005,opacity=1) => {
      const plane=patchPlane(scene,width,depth,x,y,z,falloff,true);
      plane.rotation.x=-Math.PI/2;
      plane.material.depthWrite=false;
      plane.material.opacity=opacity;
      plane.material.alphaTest=.001;
      plane.renderOrder=2;
    };
  }

  function addShadows(scene, music) {
    const shadow = groundShadow(scene);
    if (music) {
      shadow(3.98,2.72,0,4.88,.010,.9);
      shadow(1.16,1.06,0,5.87,.011,1);
      shadow(3.10,1.37,-3.86,.84,.011,.82);
      shadow(1.61,.91,5.10,2.43,.010,.85);
      shadow(1.09,.90,3.40,3.61,.010,.76);
      for (const x of [-1.35,1.35]) shadow(.58,1.15,x,4.86,.014,.83);
      for (const {x,z} of REHEARSAL_SEATS) {
        shadow(.88,.80,x,z,.008,.79);
        shadow(.67,.61,x+STAND_OFFSET,z-STAND_DISTANCE,.008,.58);
      }
    } else {
      shadow(2.94,.99,-.19,.52,.006,.66);
      shadow(1.63,.94,5.65,.49,.006,.64);
      shadow(4.03,1.26,-4.08,.61,.006,.65);
      for (const x of [-2.25,2.25]) {
        shadow(3.51,2.15,x,4.95,.005,.86);
        for (const dx of [-1.213,1.213]) for (const dz of [-.488,.488]) {
          shadow(.51,.66,x+dx,4.80+dz,.007,.56);
        }
        for (const dx of [-.87,.87]) for (const dz of [-1.03,1.03]) {
          shadow(.81,.84,x+dx,4.80+dz,.008,.59);
        }
      }
    }
  }

  async function loadArtMural(width, height){
    const image=new Image();
    image.src='rooms/interiors/art-wall-mural.png';
    await image.decode();
    const wallAspect=width/height, imageAspect=image.naturalWidth/image.naturalHeight;
    const map=imageMap(image);
    // Cover the entire right wall, cropping the art to its aspect ratio.
    map.repeat.set(Math.min(1,wallAspect/imageAspect),Math.min(1,imageAspect/wallAspect));
    map.offset.set((1-map.repeat.x)/2,(1-map.repeat.y)/2);
    map.anisotropy=8;
    return map;
  }

  async function build(scene, room) {
    const music = room.kind === 'music';
    const cards=music?[room.clues[1]]:room.clues;
    const [artwork,clueArt,mural]=await Promise.all([
      InteriorArtwork.load(room.kind),Promise.all(cards.map(clueBoardArt)),
      music?null:loadArtMural(room.depth,room.wall.height).catch(()=>null)
    ]);
    scene.add(new THREE.HemisphereLight(music ? '#fff1e3' : '#fbffff', music ? '#a18c80' : '#aebdbc', 2.72));
    const fill = new THREE.DirectionalLight(music ? '#ffe8d4' : '#fff9ee', 1.19);
    fill.position.set(-3.4,3.25,5.1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight('#edf2f3', .81);
    rim.position.set(3.6,2.75,-1.8);
    scene.add(rim);

    architecture(scene,room,artwork,mural);
    const setDoor = entrance(scene,room,artwork);
    if (music) {
      musicPiano(scene,artwork);
      musicWorkstation(scene,artwork);
      rehearsalFurniture(scene,artwork,imageMap(clueArt[0]));
    } else {
      artWorkshop(scene,artwork);
      for(const [i,clue] of cards.entries()){
        const sheet=patchPlane(scene,clue.surface.width,clue.surface.height,...clue.xyz,imageMap(clueArt[i]));
        if(clue.id==='printSamples')sheet.rotation.x=PRINT_SHEET.tilt;
      }
    }
    addShadows(scene,music);
    const lock = patchPlane(scene,room.lock.width,room.lock.height,...room.lock.center,imageMap(schoolLockArt(room,[])));
    const canvas = document.getElementById('roomView');
    Object.assign(canvas.dataset,{
      interior:'v7', artwork:'approved', width:WIDTH, depth:DEPTH, area:WIDTH*DEPTH,
      wallFinish:music?'four-black-acoustic-walls':mural?'right-wall-mural':'celadon-plaster'
    });
    return {
      setDoor,
      setDigits(values) {
        lock.material.map.image=schoolLockArt(room,values);
        lock.material.map.needsUpdate=true;
      }
    };
  }

  const size = Object.freeze({width: WIDTH, depth: DEPTH});
  return Object.freeze({definition,build,size,enclosure,entrance,box,rounded,patchPlane,flat,standard,rod,cylinder,groundShadow});
})();
