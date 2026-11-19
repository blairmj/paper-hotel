'use strict';

const SpecialtyInteriors = (() => {
  const {enclosure,entrance,box,rounded,patchPlane,standard,faces,cylinder,rod,tube,groundShadow}=SchoolInterior;
  const quarterTurn = Math.PI / 2;
  const bookArc = {x:-1.45,z:4.10,inner:1.04,outer:1.49,from:.28,to:2.48};
  const counter = {x:3.52,z:4.68,w:1.42,d:2.38};
  const lab = [
    {x:-1.91,z:4.79,w:1.89,d:2.92},
    {x:1.73,z:3.30,w:1.87,d:2.84}
  ];
  const labSeats = [[-.59,5.88],[.43,4.22],[.55,2.61]];
  const tank = {x:-1.66,z:4.74,w:.92,d:.70,h:.59,bottom:.92};
  const anchor = {x:-2.05,z:1.47,w:2.28,d:.80};
  const consoleDesk = {x:3.30,z:3.57,w:1.04,d:4.85};
  const deskReturn = {x:2.54,z:1.24,w:1.48,d:.79};
  const tripod = {x:-2.23,z:3.31};

  function boundsOf({x,z,w,d},margin=.12){
    return [x-w/2-margin,x+w/2+margin,z-d/2-margin,z+d/2+margin];
  }
  function arcPoint(radius,angle){
    return {
      x:bookArc.x+radius*Math.cos(angle),
      z:bookArc.z+radius*Math.sin(angle)
    };
  }
  const arcObstacles = Array.from({length:8},(_,i)=>{
    const point=arcPoint((bookArc.inner+bookArc.outer)/2,bookArc.from+(bookArc.to-bookArc.from)*i/7);
    return boundsOf({...point,w:.51,d:.51},.11);
  });

  const designs = {
    library:{
      size:[8.6,7.2,3.14], trim:'#b59365',
      entrance:{x:3.34,width:1.30,height:2.22,moldingColor:'#d6a333'},
      lock:{center:[2.43,1.27,.10],width:.43,height:.31,approach:{x:2.36,z:1.30}},
      start:[.08,1.55,6.80],view:[1.20,1.35,.15],
      obstacles:[
        ...arcObstacles,boundsOf(counter),
        [-4.04,-3.59,.22,6.87],[-3.70,2.19,.23,.80],
        [3.64,4.12,.89,3.29]
      ],
      clues:[
        {id:'shelfGuide',name:'책장 옆 찾기 표지',xyz:[-1.01,1.134,5.31],
          surface:{width:.52,height:.31},approach:{x:-.92,z:6.20},placement:'stand'},
        {id:'loanSlip',name:'열람대의 대출 메모',xyz:[2.91,1.105,4.61],
          surface:{width:.56,height:.34},rotationY:-quarterTurn,approach:{x:2.07,z:4.65},placement:'stand'}
      ],
      build:library
    },
    science:{
      size:[9.1,7.9,3.48], trim:'#2c5a9e',
      entrance:{side:'right',x:-1.82,width:1.34,height:2.30,moldingColor:'#2a5187',opensOut:true},
      lock:{center:[4.45,1.29,3.21],width:.57,height:.33,rotationY:-quarterTurn,approach:{x:3.10,z:3.21}},
      start:[.02,1.55,7.54],view:[.02,1.32,1.38],
      obstacles:[
        ...lab.map(table=>boundsOf(table)),
        ...labSeats.map(([x,z])=>boundsOf({x,z,w:.50,d:.50},.075)),
        [-3.77,3.77,.22,.99]
      ],
      clues:[
        {id:'waterCycle',name:'실험대의 급수 순서',xyz:[.96,1.63,.079],
          surface:{width:.58,height:.48},approach:{x:.96,z:1.36}},
        {id:'waterStart',name:'물통의 시작 눈금',xyz:[tank.x,1.18,tank.z+tank.d/2+.012],
          surface:{width:tank.w,height:tank.h},approach:{x:-.67,z:5.42},placement:'instrument'}
      ],
      build:science
    },
    broadcast:{
      size:[7.8,6.5,2.91], trim:'#476d9f',
      entrance:{x:.00,width:1.31,height:2.22,moldingColor:'#cf9c39',casingColor:'#efb338'},
      lock:{center:[.98,1.27,.099],width:.47,height:.32,approach:{x:.98,z:1.37}},
      start:[.0,1.55,6.18],view:[.29,1.33,.16],
      obstacles:[
        boundsOf(anchor),boundsOf({x:-2.04,z:.80,w:.56,d:.47},.09),
        boundsOf(consoleDesk),boundsOf(deskReturn),
        boundsOf({x:2.40,z:3.60,w:.57,d:.60},.08),boundsOf({...tripod,w:.70,d:.69},.09)
      ],
      clues:[
        {id:'broadcastRules',name:'진행석의 방송 장치 안내표',xyz:[-2.35,1.04,1.68],
          surface:{width:.58,height:.32},approach:{x:-2.22,z:2.44},placement:'stand'},
        {id:'broadcastLog',name:'믹서 옆 방송 시험 기록',xyz:[3.02,1.074,4.24],
          surface:{width:.59,height:.35},rotationY:-quarterTurn,approach:{x:2.13,z:4.24},placement:'stand'}
      ],
      build:broadcast
    }
  };

  function definition(kind){
    const design=designs[kind], {size:[width,depth,height],entrance,lock,clues,obstacles,start,view}=design;
    const door=entrance.side==='right'?[width/2-.05,1.30,depth/2+entrance.x]:[entrance.x,1.30,.05];
    const targets=[
      {id:'lock',name:SCHOOL_PUZZLES[kind].title,xyz:lock.center,surface:lock,
        rotationY:lock.rotationY,approach:lock.approach},
      ...clues
    ];
    return {
      ...RECOVERY_ROOMS.find(room=>room.kind===kind),depth,interior:true,
      wall:{width,height,z:0,back:depth},ceilingMinimum:height,entrance,door,lock,clues,targets,obstacles,
      bounds:{left:-width/2+.27,right:width/2-.27,front:.27,back:depth-.27},
      start,firstView:view,portraitView:[view[0]*.5,1.30,view[2]],
      stops:[...targets.map(target=>target.xyz),[width/2,1.38,depth/2],[0,1.38,depth],[-width/2,1.38,depth/2]]
    };
  }

  function positionGroup(parent,x,y,z,angle=0){
    const group=new THREE.Group();
    group.position.set(x,y,z);
    group.rotation.y=angle;
    parent.add(group);
    return group;
  }

  function materialFrom(art,name,roughness=.78){
    return new THREE.MeshStandardMaterial({map:art.sample(name),roughness});
  }

  function roundedOutline(width,height,radius,shape=new THREE.Shape()){
    const l=-width/2,r=width/2,b=-height/2,t=height/2;
    shape.moveTo(l+radius,b);
    shape.lineTo(r-radius,b);shape.quadraticCurveTo(r,b,r,b+radius);
    shape.lineTo(r,t-radius);shape.quadraticCurveTo(r,t,r-radius,t);
    shape.lineTo(l+radius,t);shape.quadraticCurveTo(l,t,l,t-radius);
    shape.lineTo(l,b+radius);shape.quadraticCurveTo(l,b,l+radius,b);
    return shape;
  }

  function panelGeometry(shape,width,height,depth){
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:12});
    const vertex=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
    for(let i=0;i<vertex.count;i++)uv.setXY(i,vertex.getX(i)/width+.5,vertex.getY(i)/height+.5);
    return geometry;
  }

  function shapedPanel(parent,width,height,depth,radius,x,y,z,material,hole){
    const outline=roundedOutline(width,height,radius);
    if(hole){
      const [w,h,r]=hole;
      outline.holes.push(roundedOutline(w,h,r,new THREE.Path()));
    }
    const mesh=new THREE.Mesh(panelGeometry(outline,width,height,depth),material);
    mesh.position.set(x,y,z-depth/2);
    parent.add(mesh);
    return mesh;
  }

  function slab(parent,{x,z,w,d},top,material,thickness=.076){
    const topMesh=shapedPanel(parent,w,d,thickness,.105,x,top-thickness/2,z,material);
    topMesh.rotation.x=-quarterTurn;
    topMesh.position.set(x,top-thickness,z);
  }

  const bookColors = ['#e16952','#eeba37','#3e70ba','#efe6d3','#699894','#bf695e','#7698ba','#e2c68f'];
  function packedBooks(parent,books){
    const geometry=new THREE.BoxGeometry(1,1,1);
    const spines=new THREE.InstancedMesh(geometry,standard('#ffffff',.81),books.length);
    const labels=new THREE.InstancedMesh(geometry,standard('#f0e9dd',.91),books.length);
    const pose=new THREE.Object3D();
    for(const [i,{x,y,z,w,h,d,angle,color}] of books.entries()){
      pose.position.set(x,y+h/2,z);pose.rotation.set(0,angle,0);pose.scale.set(w,h,d);pose.updateMatrix();
      spines.setMatrixAt(i,pose.matrix);spines.setColorAt(i,new THREE.Color(color));
      pose.position.set(x+Math.sin(angle)*(d/2+.002),y+.044,z+Math.cos(angle)*(d/2+.002));
      pose.scale.set(w*.68,.039,.004);pose.updateMatrix();labels.setMatrixAt(i,pose.matrix);
    }
    parent.add(spines,labels);
  }

  function shelves(scene,x,z,width,angle,wood,gold){
    const unit=positionGroup(scene,x,0,z,angle),height=2.79,depth=.48;
    box(unit,width,height,.030,0,height/2,-depth/2,gold);
    for(const edge of [-width/2+.033,width/2-.033]){
      box(unit,.066,height,depth,edge,height/2,0,wood);
    }
    box(unit,width-.12,.37,.41,0,.185,.011,wood);
    const books=[];
    for(const [row,y] of [.39,.91,1.43,1.95,2.47].entries()){
      box(unit,width,.048,depth,0,y,0,wood);
      const count=Math.floor((width-.14)/.074);
      for(let i=0;i<count;i++){
        if((i+row*4)%13===8)continue;
        books.push({x:-width/2+.090+i*.074,y:y+.024,z:.076+(i%3)*.013,w:.047+(i*5%8)*.003,
          h:.214+(i*7%13)*.012,d:.24,angle:0,color:bookColors[(i+row*3)%bookColors.length]});
      }
    }
    packedBooks(unit,books);
    box(unit,width,.059,depth,0,height,0,wood);
    const light=new THREE.MeshBasicMaterial({color:'#fff0cf'});
    for(const y of [.876,1.396,1.916,2.436,2.754]){
      box(unit,width-.16,.014,.023,0,y,.19,light);
    }
  }

  function arcBoard(scene,inner,outer,y,thickness,material){
    const shape=new THREE.Shape(),steps=32;
    for(const [r,clockwise] of [[outer,true],[inner,false]]){
      for(let i=0;i<=steps;i++){
        const portion=clockwise?i/steps:1-i/steps;
        const angle=bookArc.from+(bookArc.to-bookArc.from)*portion;
        const x=r*Math.cos(angle),v=-r*Math.sin(angle);
        if(clockwise&&i===0)shape.moveTo(x,v);
        else shape.lineTo(x,v);
      }
    }
    shape.closePath();
    const mesh=new THREE.Mesh(panelGeometry(shape,outer*2,outer*2,thickness),material);
    mesh.rotation.x=-quarterTurn;mesh.position.set(bookArc.x,y,bookArc.z);scene.add(mesh);
  }

  function curvedShelves(scene,wood,gold){
    for(const y of [.10,.514,.927])arcBoard(scene,bookArc.inner,bookArc.outer,y,.054,wood);
    arcBoard(scene,bookArc.inner,bookArc.inner+.045,.14,.79,gold);
    for(let i=0;i<5;i++){
      const angle=bookArc.from+(bookArc.to-bookArc.from)*i/4;
      const point=arcPoint((bookArc.inner+bookArc.outer)/2,angle);
      box(scene,.064,.776,.43,point.x,.540,point.z,wood).rotation.y=quarterTurn-angle;
    }
    const books=[];
    for(const [row,y] of [.154,.568].entries()){
      for(let i=0;i<37;i++){
        if((i+row*4)%9===7)continue;
        const angle=bookArc.from+.058+(bookArc.to-bookArc.from-.116)*i/36;
        const point=arcPoint(bookArc.outer-.162-(i%3)*.014,angle);
        books.push({...point,y,w:.054+(i%4)*.005,h:.22+(i*5%9)*.011,d:.235,
          angle:quarterTurn-angle,color:bookColors[(i+3*row)%bookColors.length]});
      }
    }
    packedBooks(scene,books);
  }

  function library(scene,room,art,shadow){
    const wood=materialFrom(art,'wood'), fabric=materialFrom(art,'fabric',.96);
    const gold=standard('#eab336',.82), blue=standard('#27528e',.88), red=standard('#ce4937',.84);
    const cushion=standard('#f3c244',.92);
    shelves(scene,-3.985,3.60,6.72,quarterTurn,wood,gold);
    shelves(scene,-2.84,.285,1.65,0,wood,gold);
    shelves(scene,1.61,.285,1.12,0,wood,gold);
    shelves(scene,3.985,2.05,2.18,-quarterTurn,wood,gold);
    curvedShelves(scene,wood,gold);
    shadow(3.35,2.08,-1.55,4.90,.005,.52);

    const alcoveX=-.46;
    shapedPanel(scene,2.96,1.99,.055,.33,alcoveX,1.48,.075,fabric);
    shapedPanel(scene,3.00,2.02,.43,.35,alcoveX,1.48,.30,fabric,[2.71,1.73,.25]);
    box(scene,3.02,.36,.58,alcoveX,.18,.32,faces(art.sample('wood'),1.12,.80));
    rounded(scene,2.70,.165,.58,alcoveX,.52,.35,fabric,.071);
    for(const [side,angle] of [[-1,-.19],[1,.17]]){
      rounded(scene,.40,.39,.115,alcoveX+side*.94,.761,.245,cushion,.052).rotation.z=angle;
    }
    box(scene,2.19,.028,.12,alcoveX,2.323,.21,new THREE.MeshBasicMaterial({color:'#ffe6b3'}));
    const rug=new THREE.Mesh(new THREE.CircleGeometry(1,64),
      new THREE.MeshBasicMaterial({map:art.sample('rug')}));
    rug.rotation.x=-quarterTurn;rug.scale.set(1.80,.75,1);rug.position.set(alcoveX,.005,1.11);
    scene.add(rug);

    const {x,z,w,d}=counter;
    slab(scene,{x,z,w:w-.05,d:d-.11},.85,blue,.74);
    box(scene,.033,.60,1.13,x-w/2+.020,.48,z+.53,red);
    slab(scene,counter,.94,wood,.09);
    shadow(w+.46,d+.44,x,z,.004,.53);
  }

  function stool(parent,x,z,seat,frame){
    cylinder(parent,.245,.229,.069,x,.466,z,seat,36);
    for(let i=0;i<3;i++){
      const angle=(i/3)*Math.PI*2;
      const dx=Math.cos(angle),dz=Math.sin(angle);
      rod(parent,[x+dx*.152,.441,z+dz*.152],[x+dx*.213,.031,z+dz*.213],.023,frame);
      cylinder(parent,.029,.029,.048,x+dx*.213,.028,z+dz*.213,seat,12);
    }
  }

  function labCabinet(parent,table,blue,top,steel){
    const {x,z,w,d}=table;
    slab(parent,{x,z,w:w-.09,d:d-.09},.839,blue,.795);
    slab(parent,table,.917,top,.084);
    const front=z+d/2-.032;
    for(const side of [-1,1]){
      rounded(parent,w*.46,.685,.032,x+side*w*.24,.465,front,blue,.012);
      rounded(parent,.026,.153,.034,x+side*.110,.602,front+.024,steel,.011);
    }
    const inner=x-Math.sign(x)*(w/2-.037);
    for(const dz of [-d*.317,0,d*.317]){
      const door=rounded(parent,d*.303,.69,.031,inner,.465,z+dz,blue,.012);
      door.rotation.y=-Math.sign(x)*quarterTurn;
      rounded(parent,.043,.143,.024,inner-Math.sign(x)*.029,.60,z+dz+.23,steel,.009);
    }
  }

  function waterTank(scene){
    const {x,z,w,d,h,bottom}=tank;
    const glass=new THREE.MeshPhysicalMaterial({
      color:'#b5dbe9',transparent:true,opacity:.16,roughness:.15,metalness:.06,depthWrite:false
    });
    const edge=standard('#bcdee6',.28,.16), ticks=standard('#263943',.63);
    const liquid=new THREE.MeshPhysicalMaterial({color:'#329cda',roughness:.23,transparent:true,opacity:.82});
    const level=(h-.082)*(WATER_CYCLE.initial/WATER_CYCLE.drain),base=bottom+.023;
    box(scene,w,.019,d,x,bottom+.009,z,edge);
    box(scene,w-.030,level,d-.032,x,base+level/2,z,liquid);
    for(const side of [-1,1]){
      const outerZ=z+side*d/2;
      box(scene,w,h,.009,x,bottom+h/2,outerZ,glass);
      box(scene,.009,h,d,x+side*w/2,bottom+h/2,z,glass);
      rod(scene,[x-w/2,bottom+h,outerZ],[x+w/2,bottom+h,outerZ],.008,edge);
      rod(scene,[x+side*w/2,bottom+h,z-d/2],[x+side*w/2,bottom+h,z+d/2],.008,edge);
      for(const dz of [-d/2,d/2]){
        rod(scene,[x+side*w/2,bottom,z+dz],[x+side*w/2,bottom+h,z+dz],.007,edge);
      }
    }
    for(let i=1;i<=WATER_CYCLE.drain;i++){
      box(scene,.103,.012,.008,x-w*.32,base+i*(h-.082)/WATER_CYCLE.drain,z+d/2+.004,ticks);
    }
  }

  function microscope(parent,x,z,cream,dark,steel){
    const unit=positionGroup(parent,x,.925,z,-.28);
    rounded(unit,.32,.051,.28,0,.028,0,dark,.019);
    rounded(unit,.251,.045,.22,0,.071,0,cream,.016);
    tube(unit,[[-.10,.083,.035],[-.13,.212,.048],[-.095,.325,.032],[-.009,.389,.02]],.043,cream);
    box(unit,.136,.023,.116,.045,.213,.015,dark);
    const scope=cylinder(unit,.031,.051,.185,.026,.372,.020,steel,22);
    scope.rotation.z=.27;
    const eye=cylinder(unit,.031,.029,.070,.054,.474,.02,dark,20);
    eye.rotation.z=.27;
    cylinder(unit,.023,.019,.045,.008,.270,.020,dark,18);
    cylinder(unit,.033,.033,.016,-.114,.242,.085,dark,18).rotation.x=quarterTurn;
  }

  function science(scene,room,art,shadow){
    const top=materialFrom(art,'worktop',.51), blue=materialFrom(art,'blue',.68);
    const enamel=materialFrom(art,'ivory',.76),steel=standard('#bac5c9',.34,.40);
    const stoolYellow=standard('#f3c038',.58), legs=standard('#e7e5de',.68),dark=standard('#2d3842',.71);
    for(const table of lab){
      labCabinet(scene,table,blue,top,steel);
      shadow(table.w+.49,table.d+.43,table.x,table.z,.005,.60);
    }
    for(const [x,z] of labSeats)stool(scene,x,z,stoolYellow,legs);
    waterTank(scene);
    microscope(scene,2.08,3.58,enamel,dark,steel);
    const measureGlass=new THREE.MeshPhysicalMaterial({
      color:'#c0e8f2',roughness:.19,transparent:true,opacity:.29,depthWrite:false
    });
    cylinder(scene,.087,.087,.029,1.25,.938,2.97,steel);
    cylinder(scene,.046,.046,.435,1.25,1.163,2.97,measureGlass,32);
    for(let i=0;i<7;i++)box(scene,.025,.007,.006,1.222,1.021+i*.044,3.013,dark);

    const sinkZ=.48,counterDepth=.78,sinkWidth=1.16,sinkDepth=.48,counterWidth=7.14;
    const cabinetSpan=(counterWidth-sinkWidth)/2,cabinetOffset=(counterWidth+sinkWidth)/4;
    box(scene,sinkWidth,.665,.72,0,.338,.455,blue);
    for(let i=0;i<8;i++){
      const x=(i-3.5)*(counterWidth/8);
      rounded(scene,.86,.636,.036,x,.465,.824,blue,.015);
      rounded(scene,.023,.145,.038,x+(i%2===0?.27:-.27),.61,.851,steel,.010);
      rounded(scene,.86,.61,.032,x,2.57,.414,enamel,.013);
      rounded(scene,.023,.142,.043,x+(i%2===0?.27:-.27),2.37,.443,steel,.010);
    }
    box(scene,counterWidth,.68,.38,0,2.57,.213,enamel);
    for(const side of [-1,1]){
      box(scene,cabinetSpan,.797,.72,side*cabinetOffset,.407,.455,blue);
      box(scene,cabinetSpan,.057,counterDepth,side*cabinetOffset,.855,sinkZ,steel);
      box(scene,sinkWidth,.057,(counterDepth-sinkDepth)/2,0,.855,sinkZ+side*(counterDepth+sinkDepth)/4,steel);
      box(scene,sinkWidth,.133,.024,0,.802,sinkZ+side*sinkDepth/2,steel);
      box(scene,.024,.133,sinkDepth,side*sinkWidth/2,.802,sinkZ,steel);
    }
    box(scene,sinkWidth,.023,sinkDepth,0,.754,sinkZ,standard('#718491',.43,.27));
    tube(scene,[[0,.884,.161],[0,1.204,.161],[0,1.301,.268],[0,1.266,.395],[0,1.174,.420]],.023,steel);
    patchPlane(scene,7.14,1.40,0,1.570,.013,art.surface('tile',7.14,1.40));
  }

  function acousticPanels(scene,room,art){
    const fabric=materialFrom(art,'fabric',.97), backdrop=materialFrom(art,'backdrop',.94);
    const timber=art.sample('wood').image;
    const punched=InteriorArtwork.canvasMap(126,448,(g,w,h)=>{
      g.drawImage(timber,0,0,w,h);
      for(let y=13;y<h;y+=14)for(let x=12;x<w;x+=15){
        g.fillStyle='#6954319c';g.beginPath();g.arc(x,y,2.4,0,Math.PI*2);g.fill();
        g.fillStyle='#f9dc9e69';g.fillRect(x-1,y+1.75,2,1);
      }
    });
    const {width,back}=room.wall;
    for(const side of [-1,1]){
      const wall=positionGroup(scene,side*(width/2-.052),0,back/2,-side*quarterTurn);
      for(const x of [-2.28,-1.12,.03,1.18,2.33]){
        shapedPanel(wall,1.10,2.03,.068,.032,x,1.53,0,fabric);
      }
      const strips=positionGroup(scene,side*(width/2-.08),0,back/2,-side*quarterTurn);
      for(const x of [-2.87,2.92])patchPlane(strips,.28,2.70,x,1.455,.053,punched);
    }
    for(const x of [-3.30,-2.18,-1.06,.06,1.18,2.30,3.40]){
      shapedPanel(scene,1.075,1.98,.064,.033,x,1.455,back-.045,fabric);
    }
    for(const x of [-3.63,-.84,3.49])patchPlane(scene,.32,2.63,x,1.435,.062,punched);
    shapedPanel(scene,2.52,1.68,.076,.27,-2.08,1.546,.078,backdrop);
    shapedPanel(scene,1.69,1.73,.067,.038,2.18,1.53,.067,fabric);

    const bezel=standard('#a13c36',.56);
    rounded(scene,.39,.144,.074,-2.08,2.550,.080,bezel,.024);
    rounded(scene,.322,.083,.065,-2.08,2.550,.126,
      new THREE.MeshStandardMaterial({color:'#fc7666',emissive:'#e03627',emissiveIntensity:.55}),.023);
  }

  function studioChair(scene,x,z,rotation,seat,frame){
    const unit=positionGroup(scene,x,0,z,rotation), dark=standard('#3e4349',.74);
    rounded(unit,.56,.105,.51,0,.50,0,seat,.042);
    rounded(unit,.52,.36,.107,0,.839,.222,seat,.049).rotation.x=.13;
    for(const dx of [-.193,.193]){
      rod(unit,[dx,.480,.154],[dx,.891,.197],.024,frame);
    }
    cylinder(unit,.034,.036,.383,0,.239,0,frame,18);
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5,dx=.30*Math.cos(a),dz=.30*Math.sin(a);
      rod(unit,[0,.086,0],[dx,.043,dz],.022,frame);
      cylinder(unit,.029,.030,.041,dx,.030,dz,dark,14).rotation.z=quarterTurn;
    }
  }

  function tripodCamera(scene,target){
    const shell=standard('#3d434b',.66),rubber=standard('#242b34',.76),metal=standard('#626b73',.44,.22);
    const unit=positionGroup(scene,tripod.x,0,tripod.z,-.18);
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3,dx=Math.cos(a),dz=Math.sin(a);
      rod(unit,[dx*.096,1.035,dz*.096],[dx*.328,.042,dz*.328],.024,metal);
      rod(unit,[0,.586,0],[dx*.207,.656,dz*.207],.010,shell);
      cylinder(unit,.036,.034,.044,dx*.328,.027,dz*.328,rubber,15);
    }
    cylinder(unit,.061,.062,1.134,0,.567,0,shell,16);
    rounded(unit,.250,.189,.202,0,1.296,0,shell,.027);
    cylinder(unit,.061,.066,.095,0,1.304,-.13,rubber,28).rotation.x=quarterTurn;
    cylinder(unit,.045,.050,.011,0,1.304,-.182,standard('#607e9b',.23,.27),26).rotation.x=quarterTurn;
    rounded(unit,.167,.105,.039,-.16,1.318,.011,rubber,.014);
    patchPlane(unit,.123,.077,-.16,1.318,.033,target);
  }

  function studioMonitor(parent,x,y,z,map,shell){
    const unit=positionGroup(parent,x,y,z,-quarterTurn);
    rounded(unit,.67,.405,.054,0,.38,0,shell,.019);
    patchPlane(unit,.61,.343,0,.386,.029,map);
    box(unit,.065,.158,.071,0,.147,-.016,shell);
    rounded(unit,.282,.026,.190,0,.025,0,shell,.010);
  }

  function waveform(){
    return InteriorArtwork.canvasMap(500,294,(g,w,h)=>{
      g.fillStyle='#223247';g.fillRect(0,0,w,h);
      g.strokeStyle='#a5cbe02b';g.lineWidth=1;
      for(let x=24;x<w;x+=36){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}
      for(let y=22;y<h;y+=38){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
      g.fillStyle='#62dabe';
      for(let x=17;x<w-12;x+=3){
        const pulse=5+(Math.abs(Math.sin(x*.133)*Math.sin(x*.071))*74)*(.42+.58*Math.sin(x/w*Math.PI));
        g.fillRect(x,h*.51-pulse,2,2*pulse);
      }
    });
  }

  function mixingBoard(scene,x,z,shell,light){
    const unit=positionGroup(scene,x,.933,z,-quarterTurn);
    const body=rounded(unit,.68,.111,.44,0,.067,0,shell,.024);body.rotation.x=-.105;
    const knob=standard('#aeb9c7',.64), yellow=standard('#e9b83c',.62),red=standard('#e65b52',.66);
    for(let i=0;i<7;i++){
      const x=-.263+i*.087;
      box(unit,.016,.008,.148,x,.128,.054,light);
      rounded(unit,.048,.024,.037,x,.140,.003+(i%3)*.037,i%3===0?yellow:knob,.007);
      cylinder(unit,.021,.023,.020,x,.131,-.127,knob,16);
    }
    box(unit,.058,.019,.040,.268,.142,.174,red);
  }

  function headphones(scene,x,z,shell,wood){
    const unit=positionGroup(scene,x,.946,z,-.37);
    cylinder(unit,.102,.111,.029,0,.019,0,wood,36);
    rod(unit,[0,.031,0],[0,.264,0],.016,shell);
    tube(unit,[[-.122,.191,0],[-.122,.307,0],[-.062,.385,0],[.040,.396,0],
      [.114,.327,0],[.127,.191,0]],.021,shell);
    for(const side of [-1,1])rounded(unit,.065,.136,.093,side*.123,.215,0,shell,.027);
  }

  function broadcast(scene,room,art,shadow){
    const wood=materialFrom(art,'wood',.68), red=materialFrom(art,'red',.77);
    const shell=standard('#38424f',.66), ivory=standard('#e6e0d4',.71);
    const gold=standard('#edb840',.73),blue=standard('#3c6195',.85);
    acousticPanels(scene,room,art);
    slab(scene,anchor,.897,wood,.071);
    slab(scene,{...anchor,w:anchor.w-.086,d:anchor.d-.102},.835,red,.756);
    slab(scene,{...anchor,w:anchor.w-.11,d:anchor.d-.13},.084,wood,.061);
    studioChair(scene,-2.01,.77,Math.PI,gold,ivory);
    const mic=positionGroup(scene,-1.54,.899,1.34);
    cylinder(mic,.064,.071,.022,0,.014,0,shell);
    tube(mic,[[0,.025,0],[0,.156,0],[.023,.240,-.018],[.043,.293,-.071]],.013,shell);
    rounded(mic,.064,.117,.063,.052,.323,-.091,shell,.025).rotation.x=.55;
    shadow(anchor.w+.6,anchor.d+.60,anchor.x,anchor.z,.006,.65);

    slab(scene,consoleDesk,.927,wood);
    slab(scene,deskReturn,.927,wood);
    for(const z of [1.40,5.75])box(scene,.98,.824,.58,3.31,.416,z,wood);
    box(scene,.14,.846,.77,1.85,.423,1.24,wood);
    for(const y of [.19,.385,.587,.761]){
      rounded(scene,.691,.164,.054,2.80,y,5.75,blue,.018).rotation.y=-quarterTurn;
      rounded(scene,.025,.029,.156,2.761,y+.016,5.75,shell,.009);
    }
    const preview=art.sample('preview');
    studioMonitor(scene,3.35,.929,1.71,waveform(),shell);
    studioMonitor(scene,3.35,.929,2.46,preview,shell);
    studioChair(scene,2.40,3.60,-quarterTurn,blue,ivory);
    mixingBoard(scene,3.08,3.42,shell,ivory);
    headphones(scene,3.36,4.16,shell,wood);
    tripodCamera(scene,preview);
    shadow(1.91,5.28,3.01,3.56,.005,.53);
  }

  function lights(scene,room){
    const height=room.wall.height, circular=room.kind==='library';
    const shade=standard(circular?'#e6c99c':'#d8d5cc',.63);
    const emitter=new THREE.MeshBasicMaterial({color:circular?'#fff7e4':'#fffdf5'});
    const {width,back}=room.wall;
    for(const x of [-width*.255,width*.255]){
      for(const part of [.24,.57,.84]){
        const z=back*part;
        if(circular){
          cylinder(scene,.298,.298,.066,x,height-.027,z,shade,40);
          cylinder(scene,.276,.276,.014,x,height-.069,z,emitter,40);
        }else{
          rounded(scene,1.08,.059,.66,x,height-.035,z,shade,.020);
          rounded(scene,1.027,.019,.607,x,height-.069,z,emitter,.007);
        }
      }
    }
  }

  function addCard(scene,clue,card){
    if(clue.placement==='instrument')return;
    const {width,height}=clue.surface,group=positionGroup(scene,...clue.xyz,clue.rotationY??0);
    const frame=standard(clue.id==='waterCycle'?'#d7b14f':'#d7c498',.82);
    rounded(group,width+.037,height+.035,.037,0,0,-.022,frame,.012);
    if(clue.placement==='stand'){
      box(group,width+.05,.026,.132,0,-height/2+.001,-.041,frame);
      rod(group,[0,-height*.19,-.028],[0,-height*.50,-.123],.010,frame);
    }
    patchPlane(group,width,height,0,0,0,imageMap(card));
  }

  async function build(scene,room){
    const design=designs[room.kind];
    const cards=room.clues.filter(clue=>clue.placement!=='instrument');
    const [art,cardImages]=await Promise.all([InteriorArtwork.load(room.kind),Promise.all(cards.map(clueBoardArt))]);
    const warm=room.kind==='library';
    const fill=new THREE.HemisphereLight(warm?'#fff6e8':'#f8fcff',warm?'#d2b99b':'#aeb6c6',2.08);
    const key=new THREE.DirectionalLight(warm?'#fff2de':'#fff9ee',1.19);key.position.set(-2.5,4.05,5.3);
    const bounce=new THREE.DirectionalLight('#fffcf6',.49);bounce.position.set(3.7,2.9,-1.5);
    scene.add(fill,key,bounce);
    enclosure(scene,room,art,design.trim);
    const doorParent=room.entrance.side==='right'?positionGroup(scene,room.wall.width/2,0,room.depth/2,-quarterTurn):scene;
    const setDoor=entrance(doorParent,room,art);
    lights(scene,room);
    design.build(scene,room,art,groundShadow(scene));
    for(const [i,clue] of cards.entries())addCard(scene,clue,cardImages[i]);
    const [x,y,z]=room.lock.center;
    const lock=patchPlane(scene,room.lock.width,room.lock.height,x,y,z,imageMap(schoolLockArt(room,[])));
    lock.rotation.y=room.lock.rotationY??0;
    Object.assign(document.getElementById('roomView').dataset,{interior:room.kind,artwork:'approved-v30'});
    return {
      setDoor,
      setDigits(values){
        lock.material.map.image=schoolLockArt(room,values);
        lock.material.map.needsUpdate=true;
      }
    };
  }

  return {definition,build};
})();
