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
  const REHEARSAL_SEATS = [
    [-2.75,4.35],[-1.08,5.10],[1.08,5.10],[2.75,4.35],
    [-3.92,5.78],[-1.86,6.93],[1.86,6.93],[3.92,5.78]
  ].map(([x,z])=>({x,z,yaw:Math.atan2(x,z-1.72)}));
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
    const target = (id, name, xyz, width, height, x, z, tilt=0) => ({
      id, name, xyz, surface: {width, height, tilt}, approach: {x, z}
    });
    const clues = music ? [
      target('paper', '피아노 악보', SCORE_CENTER, SCORE.width, SCORE.height, -3.07, 2.35, SCORE.tilt),
      target('clock','멈춘 벽시계',[-.17,2.25,.135],.71,.71,-.17,1.58)
    ] : [
      target('printSamples', '작업대의 벽화 밑그림', PRINT_SHEET.center, PRINT_SHEET.width, PRINT_SHEET.height, 2.25, 6.82, PRINT_SHEET.tilt),
      target('printRule', '게시판의 물감 번짐 견본', [-3.71, 2.13, .086], 1.20, .70, -3.10, 2.15)
    ];
    const entry = RECOVERY_ROOMS.find(item => item.kind === kind);
    return {
      ...entry, interior: true, kind, wall, bounds, depth: DEPTH, ceilingMinimum: music ? 3.4 : 3.2,
      start: [0, 1.55, 9.24], firstView: [0, 1.10, 0],
      portraitView: music ? [1.5, 1.45, 0] : [0, 1.4, 0],
      door: [DOOR.x, DOOR.height / 2, .05], doorReveal:{x:DOOR.x-.18,z:2.62}, lock, clues,
      targets: [target('lock', SCHOOL_PUZZLES[kind].title, lock.center, lock.width, lock.height, lock.center[0], 1.85), ...clues],
      obstacles: music ? [
        [-5.24,-2.49,.05,1.47],[-.72,.72,1.83,2.56],[4.86,6.23,3.33,4.82],
        [-6.25,-5.18,3.60,5.18],
        ...REHEARSAL_SEATS.map(({x,z,yaw})=>{
          const standX=x-.72*Math.sin(yaw),standZ=z-.72*Math.cos(yaw);
          return [Math.min(x,standX)-.38,Math.max(x,standX)+.38,standZ-.28,z+.38];
        })
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
        ? {front:'maple-acoustic',back:'maple-acoustic',left:'maple-acoustic',right:'maple-acoustic'}
        : {front:'chaekgeori', right:'chaekgeori', back:'chaekgeori', left:'chaekgeori', floor:'light-birch'}
    };
  }

  const standard = (color, roughness = .7, metalness = 0) =>
    new School3D.MeshStandardMaterial({color, roughness, metalness});

  function painted(map, intensity = 1) {
    return new School3D.MeshBasicMaterial({map, color: new School3D.Color().setScalar(intensity), side: School3D.DoubleSide});
  }

  function faces(map, top = 1.05, side = .75) {
    return [painted(map, side), painted(map, side * .9), painted(map, top),
      painted(map, .57), painted(map), painted(map, side)];
  }

  function box(parent, width, height, depth, x, y, z, material) {
    const mesh = new School3D.Mesh(new School3D.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function rounded(parent, width, height, depth, x, y, z, material, radius) {
    const shape = new School3D.Shape();
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
    const geometry = new School3D.ExtrudeGeometry(shape, {
      depth: inset, bevelEnabled: true, bevelThickness: radius, bevelSize: radius, bevelSegments: 3, curveSegments: 5
    });
    geometry.translate(0, 0, -inset / 2);
    const mesh = new School3D.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function patchPlane(parent, width, height, x, y, z, map, transparent = false) {
    const material = painted(map);
    material.transparent = transparent;
    material.alphaTest = transparent ? .03 : 0;
    const mesh = new School3D.Mesh(new School3D.PlaneGeometry(width, height), material);
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
    const geometry = new School3D.BufferGeometry();
    geometry.setAttribute('position', new School3D.Float32BufferAttribute(points.flat(), 3));
    geometry.setAttribute('uv', new School3D.Float32BufferAttribute(uv, 2));
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    const mesh = new School3D.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  }

  function cylinder(parent, top, bottom, height, x, y, z, material, sides = 28) {
    const mesh = new School3D.Mesh(new School3D.CylinderGeometry(top, bottom, height, sides), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function rod(parent, from, to, radius, material) {
    const a = new School3D.Vector3(...from);
    const b = new School3D.Vector3(...to);
    const direction = b.clone().sub(a);
    const midpoint = a.add(b).multiplyScalar(.5);
    const mesh = cylinder(parent, radius, radius, direction.length(), ...midpoint, material, 12);
    mesh.alignY(direction.normalize());
    return mesh;
  }

  function tube(parent, points, radius, material) {
    const curve = new School3D.CatmullRomCurve3(points.map(p => new School3D.Vector3(...p)));
    const mesh = new School3D.Mesh(new School3D.TubeGeometry(curve, 24, radius, 10, false), material);
    parent.add(mesh);
    return mesh;
  }

  function torus(parent, radius, thickness, x, y, z, material, arc = Math.PI * 2) {
    const mesh = new School3D.Mesh(new School3D.TorusGeometry(radius, thickness, 10, 40, arc), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function enclosure(scene, room, artwork, trimColor, surfaceMaterial = map => painted(map)) {
    const {width: w, back: d, height: h} = room.wall;
    const low = room.ceilingMinimum;
    const door = room.entrance ?? DOOR;
    const left = door.x - door.width / 2, right = door.x + door.width / 2;
    const sideDoor = door.side === 'right';
    const roofAt = x => low + (x + w / 2) * (h - low) / w;
    const surface = (name,width,height,side) => surfaceMaterial(artwork.surface(name,width,height,side),name);
    function openingWall(side, span, heightAt, position, hasDoor) {
      const material = surface('wall',span,h,side);
      const half = span / 2;
      const section = (start, end, bottom) => {
        const points = [[start,bottom],[end,bottom],[end,heightAt(end)],[start,heightAt(start)]];
        quad(scene, points.map(([x,y]) => position(x,y)), material,
          points.flatMap(([x,y]) => [(x+half)/span,y/h]));
      };
      if (!hasDoor) { section(-half,half,0); return; }
      section(-half,left,0);
      section(right,half,0);
      section(left,right,door.height);
    }
    openingWall('front',w,roofAt,(x,y)=>[x,y,0],!sideDoor);

    function wall(side, width, height, points) {
      const material = surface('wall',width,height,side);
      // A wrapped mural uses the same real height on both sides of each corner.
      const uv = artwork.wrapWalls ? [0,0,1,0,1,points[2][1]/h,0,points[3][1]/h] : undefined;
      quad(scene, points, material, uv);
    }
    wall('back', w, h, [[w/2, 0, d], [-w/2, 0, d], [-w/2, low, d], [w/2, h, d]]);
    wall('left', d, low, [[-w/2, 0, d], [-w/2, 0, 0], [-w/2, low, 0], [-w/2, low, d]]);
    openingWall('right',d,()=>h,(x,y)=>[w/2,y,x+d/2],sideDoor);
    quad(scene, [[-w/2, low, d], [w/2, h, d], [w/2, h, 0], [-w/2, low, 0]],
      surface('ceiling',w,d));
    quad(scene,[[-w/2,0,d],[w/2,0,d],[w/2,0,0],[-w/2,0,0]],surface('floor',w,d));

    const trim = standard(trimColor);
    box(scene, .024, .075, d, -w/2, .0375, d/2, trim);
    box(scene, w, .075, .024, 0, .0375, d, trim);
    if (sideDoor) {
      box(scene,w,.075,.024,0,.0375,.013,trim);
      box(scene,.024,.075,left+d/2,w/2,.0375,(left+d/2)/2,trim);
      box(scene,.024,.075,d/2-right,w/2,.0375,(right+1.5*d)/2,trim);
    } else {
      box(scene,.024,.075,d,w/2,.0375,d/2,trim);
      box(scene,left+w/2,.075,.024,(left-w/2)/2,.0375,.013,trim);
      box(scene,w/2-right,.075,.024,(right+w/2)/2,.0375,.013,trim);
    }
  }

  function architecture(scene, room, artwork) {
    const {width: w, back: d, height: h} = room.wall;
    const low = room.ceilingMinimum;
    const music = room.kind === 'music';
    const roofAt = x => low + (x + w / 2) * (h - low) / w;
    enclosure(scene, room, music?OrchestraRoom.finishes(artwork):artwork, music ? '#a8835d' : '#bba17b');
    if (music) {
      const cornerTrim = standard('#625d5b', .8);
      for (const x of [-w/2 + .012, w/2 - .012]) {
        for (const z of [.012, d - .012]) box(scene, .036, h, .036, x, h/2, z, cornerTrim);
      }
      const slat = standard('#bd955f', .88);
      for (let x = -5.15; x <= -2.52; x += .097) {
        rounded(scene, .044, 3.02, .036, x, 1.71, .039, slat, .007);
      }
      const cloudSurface = OrchestraRoom.reflector();
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
      const emitter = new School3D.MeshBasicMaterial({color:'#fff5e8'});
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
      const emitter = new School3D.MeshBasicMaterial({color:'#fffff8'});
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

  function doorGuide(xyz, rotationY=0) {
    return {id:'doorGuide',name:'문 옆 표시등',xyz,rotationY,surface:{width:.16,height:.19},
      approach:{x:xyz[0]+1.18*Math.sin(rotationY),z:xyz[2]+1.18*Math.cos(rotationY)}};
  }

  function entrance(scene, room, artwork, doorFinish) {
    const {x, width, height, moldingColor, recessColor, casingColor, opensOut = false} = room.entrance ?? DOOR;
    const trim = .083;
    const music = room.kind === 'music';
    const finish = artwork.sample('door');
    const casing = casingColor ? standard(casingColor,.73) : doorFinish ?? faces(finish, .91, .78);
    const leafMaterial = doorFinish ?? faces(finish, .94, .79);
    const molding = standard(moldingColor ?? (music ? '#514747' : '#506b6e'), .5);
    const recess = standard(recessColor ?? (music ? '#262122' : '#283e40'), .72);
    const metal = standard(music ? '#d2b9a0' : '#d0d3ce', .31, .45);
    for (const edge of [x-width/2, x+width/2]) {
      box(scene, trim+.038, height, .34, edge, height/2, -.044, casing);
      box(scene, .018, height-.03, .015, edge+Math.sign(x-edge)*.046, (height-.03)/2, .131, molding);
    }
    box(scene, width+trim+.038, trim+.024, .34, x, height-.011, -.044, casing);
    const leafW = width-trim-.017, leafH = height-trim/2-.009;
    const hinge = new School3D.Group();
    hinge.position.set(x+width/2-.048, .009, .06);
    scene.add(hinge);
    box(hinge, leafW, leafH, .073, -leafW/2, leafH/2, 0, leafMaterial);
    for (const j of [-.023,-leafW+.023]) box(hinge,.021,leafH-.045,.012,j,leafH/2,.04,recess);
    box(hinge,leafW-.025,.021,.013,-leafW/2,leafH-.020,.04,recess);
    cylinder(hinge,.056,.058,.024,-leafW+.24,1.04,.053,metal).rotation.x = Math.PI/2;
    rounded(hinge,.26,.044,.065,-leafW+.335,1.04,.085,metal,.012);
    for (const y of [.44,1.24,2.02]) box(hinge,.036,.105,.044,-.018,y,.065,metal);

    const showCorridor=buildSchoolCorridor(scene,x,hinge,leafW);
    return amount => {
      hinge.rotation.y=(opensOut ? -1.48 : 1.48)*amount;
      showCorridor(amount);
    };
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
      g.lineCap='round';g.fillStyle='#354450';g.textAlign='left';g.font='600 30px Georgia,serif';
      MUSIC_SCORE.forEach(({a,b,value},i)=>{
        const x=90+(i%2)*270,y=105+Math.floor(i/2)*134;
        for(const [mark,r,weight] of [[a,41,4],[b,30,7]]){
          const [dx,dy]=clockPoint(mark,r);
          g.strokeStyle='#324350';g.lineWidth=weight;g.beginPath();g.moveTo(x,y);g.lineTo(x+dx,y+dy);g.stroke();
        }
        g.beginPath();g.arc(x,y,5,0,Math.PI*2);g.fill();g.fillText('= '+value,x+48,y+10);
      });
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

    const clock=imageMap(clockArtwork());
    cylinder(scene,.345,.345,.047,-.17,2.25,.104,brass).rotation.x = Math.PI/2;
    patchPlane(scene,.71,.71,-.17,2.25,.131,clock,true);
  }

  function rehearsalFurniture(scene, artwork) {
    const fabric = standard('#80716c', .91);
    const chairFrame = standard('#585856', .49, .23);
    const standFrame = standard('#2e2d2c', .51, .20);
    const foot = standard('#292827', .87);
    const cloth = artwork.patch('chair', (path, w, h) => path.roundRect(0, 0, w, h, 10));

    const trayShape = new School3D.Shape();
    trayShape.moveTo(-.244, -.143);
    trayShape.lineTo(.244, -.143);
    trayShape.lineTo(.244, .127);
    trayShape.quadraticCurveTo(.244, .143, .228, .143);
    trayShape.lineTo(-.228, .143);
    trayShape.quadraticCurveTo(-.244, .143, -.244, .127);
    trayShape.closePath();
    for (const y of [-.075, 0, .075]) {
      for (const x of [-.17, -.102, -.034, .034, .102, .17]) {
        const hole = new School3D.Path();
        hole.absarc(x, y, .013, 0, Math.PI * 2, true);
        trayShape.holes.push(hole);
      }
    }
    const trayGeometry = new School3D.ExtrudeGeometry(trayShape, {
      depth: .007, bevelEnabled: false, curveSegments: 10
    });

    for (const {x,z,yaw} of REHEARSAL_SEATS) {
      const group=new School3D.Group();group.position.set(x,0,z);group.rotation.y=yaw;scene.add(group);
      const chair = new School3D.Group();
      group.add(chair);
      rounded(chair,.51,.076,.445,0,.465,0,fabric,.023);
      flat(chair,.462,.394,0,.505,0,artwork.sample('chair'));
      const back = new School3D.Group();
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

      const standX = STAND_OFFSET, standZ = -STAND_DISTANCE;
      rod(group,[standX,.058,standZ],[standX,1.095,standZ],.013,standFrame);
      cylinder(group,.024,.024,.034,standX,.307,standZ,standFrame,20);
      for (const [dx,dz] of [[-.221,.14],[.221,.14],[0,-.248]]) {
        rod(group,[standX,.234,standZ],[standX+dx,.028,standZ+dz],.012,standFrame);
        cylinder(group,.014,.017,.021,standX+dx,.014,standZ+dz,foot,16);
      }
      const tray = new School3D.Group();
      tray.position.set(standX,1.163,standZ);
      tray.rotation.x = -.32;
      group.add(tray);
      tray.add(new School3D.Mesh(trayGeometry, standFrame));
      rounded(tray,.493,.026,.067,0,-.140,.025,standFrame,.008);
      if(x<0)OrchestraRoom.standScore(tray);
    }
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
          const seat = new School3D.Mesh(new School3D.CircleGeometry(.248,48),painted(stoolTop,1.10));
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
    const [sheetX,sheetY,sheetZ]=PRINT_SHEET.center;
    box(scene,.95,.018,.41,sheetX,.958,sheetZ,wood);
    box(scene,.87,.031,.033,sheetX,.974,sheetZ+.190,woodFace);
    const tilt=PRINT_SHEET.tilt;
    const drawingBoard=box(scene,.94,.54,.018,sheetX,sheetY+.011*Math.sin(tilt),sheetZ-.011*Math.cos(tilt),wood);
    drawingBoard.rotation.x=tilt;
    for(const dx of [-.33,.33]){
      rod(scene,[sheetX+dx,.965,sheetZ-.17],[sheetX+dx,sheetY+.12,sheetZ-.15],.013,woodFace);
    }

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
      shadow(3.1,1.37,-3.86,.84,.008,.75);
      for (const {x,z,yaw} of REHEARSAL_SEATS){
        shadow(.88,.80,x,z,.008,.65);
        shadow(.62,.54,x-.72*Math.sin(yaw),z-.72*Math.cos(yaw),.008,.45);
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

  async function build(scene, room) {
    const music = room.kind === 'music';
    const cards=music?[]:room.clues;
    const [artwork,clueArt]=await Promise.all([
      music?InteriorArtwork.load(room.kind):ArtRoomFinish.load(room),Promise.all(cards.map(clueBoardArt))
    ]);
    scene.add(new School3D.HemisphereLight(music ? '#fff1e3' : '#fbffff', music ? '#a18c80' : '#aebdbc', 2.72));
    const fill = new School3D.DirectionalLight(music ? '#ffe8d4' : '#fff9ee', 1.19);
    fill.position.set(-3.4,3.25,5.1);
    scene.add(fill);
    const rim = new School3D.DirectionalLight('#edf2f3', .81);
    rim.position.set(3.6,2.75,-1.8);
    scene.add(rim);

    architecture(scene,room,artwork);
    const setDoor = entrance(scene,room,artwork);
    if (music) {
      musicPiano(scene,artwork);
      rehearsalFurniture(scene,artwork);
      OrchestraRoom.instruments(scene);
    } else {
      artWorkshop(scene,artwork);
      for(const [i,clue] of cards.entries()){
        const sheet=patchPlane(scene,clue.surface.width,clue.surface.height,...clue.xyz,imageMap(clueArt[i]));
        if(clue.id==='printSamples')sheet.rotation.x=PRINT_SHEET.tilt;
      }
    }
    addShadows(scene,music);
    if (!music) {
      const [x,y,z] = room.lock.center;
      rounded(scene, room.lock.width+.17, room.lock.height+.22, .033,
        x-.049, y, z-.029, standard('#f5ebd9', .84), .017);
    }
    const lockMap=values=>music?dialArtwork(values?.digits??[0,0]):schoolLockArt(room,values);
    const lock = patchPlane(scene,room.lock.width,room.lock.height,...room.lock.center,imageMap(lockMap(null)));
    const canvas = document.getElementById('roomView');
    Object.assign(canvas.dataset,{
      interior:'v7', artwork:'approved', width:WIDTH, depth:DEPTH, area:WIDTH*DEPTH,
      wallFinish:music?'orchestra-rehearsal':'four-wall-chaekgeori'
    });
    return {
      setDoor,
      setDigits(values) {
        lock.material.map.image=lockMap(values);
        lock.material.map.needsUpdate=true;
      }
    };
  }

  const size = Object.freeze({width: WIDTH, depth: DEPTH});
  return Object.freeze({definition,build,size,enclosure,entrance,doorGuide,box,rounded,patchPlane,flat,standard,faces,rod,cylinder,tube,groundShadow});
})();
