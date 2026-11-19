'use strict';

const SpecialtyInteriors = (() => {
  const {enclosure,entrance,box,rounded,patchPlane,standard,cylinder,rod,tube,groundShadow}=SchoolInterior;
  const quarterTurn = Math.PI / 2;
  const bookArc = {x:-1.07,z:2.60,inner:.85,outer:1.26,from:-.54,to:1.96};
  const counter = {x:3.37,z:3.35,w:1.63,d:2.14};
  const lab = [
    {x:-1.81,z:3.40,w:1.82,d:2.67},
    {x:1.75,z:2.77,w:1.81,d:2.62}
  ];
  const labSeats = [[-.58,4.68],[.46,3.64],[.56,2.31]];
  const tank = {x:-1.59,z:3.67,w:.92,d:.70,h:.59,bottom:.92};
  const anchor = {x:-2.05,z:1.47,w:2.28,d:.80};
  const consoleDesk = {x:3.30,z:3.16,w:1.04,d:4.13};
  const deskReturn = {x:2.54,z:1.24,w:1.48,d:.79};
  const tripod = {x:-2.33,z:2.96};
  const studioSeat = {x:2.32,z:3.20};
  const drawerZ=4.93;

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
      start:[.08,1.55,6.80],view:[.12,1.30,.15],viewAngle:58,
      obstacles:[
        ...arcObstacles,boundsOf(counter),
        [-4.04,-3.57,.22,6.87],[-3.82,2.19,.23,.80]
      ],
      clues:[
        {id:'shelfGuide',name:'책장 옆 찾기 표지',xyz:[bookArc.x+.12,1.127,bookArc.z+1.01],
          surface:{width:.46,height:.28},approach:{x:-1.04,z:bookArc.z+1.88},placement:'stand'},
        {id:'loanSlip',name:'열람대의 대출 메모',xyz:[counter.x-counter.w/2+.14,1.105,counter.z-.04],
          surface:{width:.56,height:.34},rotationY:-quarterTurn,approach:{x:1.95,z:counter.z-.03},placement:'stand'}
      ],
      build:library
    },
    science:{
      size:[9.1,7.9,3.48], trim:'#2c5a9e',
      entrance:{side:'right',x:-1.82,width:1.34,height:2.30,moldingColor:'#2a5187',opensOut:true},
      lock:{center:[4.45,1.29,3.21],width:.57,height:.33,rotationY:-quarterTurn,approach:{x:3.10,z:3.21}},
      start:[-.15,1.55,7.59],view:[-.075,1.26,1.38],viewAngle:58,
      obstacles:[
        ...lab.map(table=>boundsOf(table)),
        ...labSeats.map(([x,z])=>boundsOf({x,z,w:.50,d:.50},.075)),
        [-3.77,3.77,.22,.99]
      ],
      clues:[
        {id:'waterCycle',name:'실험대의 급수 순서',xyz:[.96,1.63,.079],
          surface:{width:.58,height:.48},approach:{x:.64,z:1.24}},
        {id:'waterStart',name:'물통의 시작 눈금',xyz:[tank.x,1.18,tank.z+tank.d/2+.012],
          surface:{width:tank.w,height:tank.h},approach:{x:-.58,z:4.18},placement:'instrument'}
      ],
      build:science
    },
    broadcast:{
      size:[7.8,6.5,2.91], trim:'#476d9f',
      entrance:{x:.00,width:1.31,height:2.22,moldingColor:'#cf9c39',casingColor:'#efb338'},
      lock:{center:[.98,1.27,.099],width:.47,height:.32,approach:{x:.98,z:1.37}},
      start:[.17,1.55,6.21],view:[.45,1.31,.16],viewAngle:60,
      obstacles:[
        boundsOf(anchor),boundsOf({x:-2.04,z:.80,w:.56,d:.47},.09),
        boundsOf(consoleDesk),boundsOf(deskReturn),
        boundsOf({...studioSeat,w:.57,d:.60},.08),boundsOf({...tripod,w:.70,d:.69},.09)
      ],
      clues:[
        {id:'broadcastRules',name:'진행석의 방송 장치 안내표',xyz:[-2.35,1.04,1.68],
          surface:{width:.58,height:.32},approach:{x:-2.22,z:2.44},placement:'stand'},
        {id:'broadcastLog',name:'믹서 옆 방송 시험 기록',xyz:[3.02,1.074,3.92],
          surface:{width:.59,height:.35},rotationY:-quarterTurn,approach:{x:2.03,z:3.92},placement:'stand'}
      ],
      build:broadcast
    }
  };

  function definition(kind){
    const design=designs[kind], {size:[width,depth,height],entrance,lock,clues,obstacles,start,view,viewAngle}=design;
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
      start,viewAngle,firstView:view,portraitView:[view[0]*.5,1.30,view[2]],
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

  const materialBumps = {
    wood:['wood',.017], fabric:['cloth',.015], backdrop:['cloth',.013],
    rug:['cloth',.013], red:['wood',.008], blue:['paint',.003], door:['paint',.003]
  };
  function materialFrom(art,name,roughness=.78){
    const material=new THREE.MeshStandardMaterial({map:art.sample(name),roughness,envMapIntensity:.72});
    const bump=materialBumps[name];
    if(bump){
      material.bumpMap=art.relief(bump[0]);
      material.bumpScale=bump[1];
    }
    return material;
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

  function panelGeometry(shape,width,height,depth,bevel=0){
    const geometry=new THREE.ExtrudeGeometry(shape,{
      depth:depth-2*bevel,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,
      bevelSegments:3,curveSegments:15
    });
    geometry.translate(0,0,bevel);
    const vertex=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
    for(const {start,count,materialIndex} of geometry.groups){
      for(let i=start;i<start+count;i++){
        const x=vertex.getX(i),y=vertex.getY(i);
        if(materialIndex===0)uv.setXY(i,x/width+.5,y/height+.5);
        else uv.setXY(i,(x+y)/(width+height)+.5,vertex.getZ(i)/depth);
      }
    }
    return geometry;
  }

  function shapedPanel(parent,width,height,depth,radius,x,y,z,material,hole,edge=.012){
    const bevel=Math.min(edge,depth*.24,radius*.26);
    const outline=roundedOutline(width-2*bevel,height-2*bevel,radius-bevel);
    if(hole){
      const [w,h,r]=hole;
      outline.holes.push(roundedOutline(w+2*bevel,h+2*bevel,r+bevel,new THREE.Path()));
    }
    const mesh=new THREE.Mesh(panelGeometry(outline,width,height,depth,bevel),material);
    mesh.position.set(x,y,z-depth/2);
    parent.add(mesh);
    return mesh;
  }

  function slab(parent,{x,z,w,d},top,material,thickness=.076,radius=.105){
    const topMesh=shapedPanel(parent,w,d,thickness,radius,x,top-thickness/2,z,material,undefined,.024);
    topMesh.rotation.x=-quarterTurn;
    topMesh.position.set(x,top-thickness,z);
  }

  const bookColors = ['#ca4939','#edb137','#356ca0','#eeebda','#789b96','#2e4c75','#ad7663',
    '#e7ae86','#837997','#e2c998','#91adc9','#4b545b'];
  function bookBinding(){
    const map=InteriorArtwork.canvasMap(48,160,(g,w,h)=>{
      const spine=g.createLinearGradient(0,0,w,0);
      spine.addColorStop(0,'#a3a3a3');spine.addColorStop(.11,'#fefefe');
      spine.addColorStop(.64,'#eeeeee');spine.addColorStop(1,'#b6b6b6');
      g.fillStyle=spine;g.fillRect(0,0,w,h);
      g.fillStyle='#1a1a1a38';g.fillRect(5,11,w-10,3);g.fillRect(5,h-16,w-10,3);
      g.fillStyle='#ffffff93';g.fillRect(w*.43,h*.22,w*.14,h*.33);
      g.fillStyle='#3333334c';g.fillRect(w*.71,h*.26,w*.07,h*.22);
    });
    return new THREE.MeshStandardMaterial({map,roughness:.82});
  }

  function packedBooks(parent,books,cover){
    const geometry=new THREE.BoxGeometry(1,1,1);
    const spines=new THREE.InstancedMesh(geometry,cover,books.length);
    const labels=new THREE.InstancedMesh(geometry,standard('#f0e9dd',.91),books.length);
    const pose=new THREE.Object3D();
    for(const [i,{x,y,z,w,h,d,angle,color}] of books.entries()){
      pose.position.set(x,y+h/2,z);pose.rotation.set(0,angle,0);pose.scale.set(w,h,d);pose.updateMatrix();
      spines.setMatrixAt(i,pose.matrix);spines.setColorAt(i,new THREE.Color(color));
      pose.position.set(x+Math.sin(angle)*(d/2+.002),y+.044,z+Math.cos(angle)*(d/2+.002));
      pose.scale.set(w*.65,.026+(i%4)*.004,.004);pose.updateMatrix();labels.setMatrixAt(i,pose.matrix);
    }
    parent.add(spines,labels);
  }

  function shelves(scene,x,z,width,angle,wood,gold,cover){
    const unit=positionGroup(scene,x,0,z,angle),height=2.88,depth=.48;
    const bays=Math.max(1,Math.round(width/.99)),bayWidth=width/bays;
    const books=[];
    const light=new THREE.MeshBasicMaterial({color:'#ffebbd'});
    box(unit,width,height,.030,0,height/2,-depth/2,gold);
    for(let bay=0;bay<bays;bay++){
      const left=bay*bayWidth-width/2,center=left+bayWidth/2;
      box(unit,.050,height,depth,left+.025,height/2,0,wood);
      box(unit,bayWidth-.066,.37,.41,center,.215,.020,wood);
      for(const [row,y] of [.408,.995,1.582,2.169].entries()){
        const count=Math.floor((bayWidth-.13)/.067);
        for(let i=0;i<count;i++){
          const mix=i*11+row*7+bay*19;
          if(mix%17===8)continue;
          books.push({x:left+.085+i*.067,y:y+.027,z:.060+(mix%4)*.013,w:.041+(mix%8)*.003,
            h:.248+(mix%18)*.011,d:.237,angle:0,color:bookColors[mix%bookColors.length]});
        }
      }
      box(unit,bayWidth-.13,.014,.029,center,height-.166,.195,light);
    }
    box(unit,.050,height,depth,width/2-.025,height/2,0,wood);
    for(const y of [.408,.995,1.582,2.169])box(unit,width,.056,depth,0,y,0,wood);
    box(unit,width,.16,depth+.027,0,height-.080,0,wood);
    packedBooks(unit,books,cover);
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
    const mesh=new THREE.Mesh(panelGeometry(shape,outer*2,outer*2,thickness,.005),material);
    mesh.rotation.x=-quarterTurn;mesh.position.set(bookArc.x,y,bookArc.z);scene.add(mesh);
  }

  function curvedShelves(scene,wood,gold,cover){
    for(const y of [.10,.514,.915])arcBoard(scene,bookArc.inner,bookArc.outer,y,y>.9?.071:.054,wood);
    arcBoard(scene,bookArc.inner,bookArc.inner+.045,.14,.79,gold);
    for(let i=0;i<5;i++){
      const angle=bookArc.from+(bookArc.to-bookArc.from)*i/4;
      const point=arcPoint((bookArc.inner+bookArc.outer)/2,angle);
      shapedPanel(scene,.455,.884,.058,.028,point.x,.531,point.z,wood).rotation.y=Math.PI-angle;
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
    packedBooks(scene,books,cover);
  }

  function library(scene,room,art,shadow){
    const wood=materialFrom(art,'wood',.64), fabric=materialFrom(art,'fabric',.92);
    const gold=new THREE.MeshStandardMaterial({color:'#dbaf56',roughness:.83,emissive:'#d39931',emissiveIntensity:.12});
    const blue=standard('#284b83',.86), red=standard('#c84735',.75);
    const cushion=standard('#eeb938',.90);
    cushion.bumpMap=art.relief('cloth');cushion.bumpScale=.016;
    const cover=bookBinding();
    shelves(scene,-3.985,3.60,6.72,quarterTurn,wood,gold,cover);
    shelves(scene,-2.91,.285,1.87,0,wood,gold,cover);
    shelves(scene,1.69,.285,.99,0,wood,gold,cover);
    curvedShelves(scene,wood,gold,cover);
    shadow(1.94,3.14,bookArc.x+.31,bookArc.z+.38,.005,.61);
    shadow(.99,6.78,-3.77,3.62,.005,.48);

    const alcoveX=-.40;
    box(scene,3.11,2.88,.17,alcoveX,1.44,.107,wood);
    shapedPanel(scene,3.10,2.09,.38,.43,alcoveX,1.37,.311,wood,[2.95,1.93,.39]);
    const alcoveBack=fabric.clone(),cloth=art.sample('fabric').image;
    alcoveBack.map=InteriorArtwork.canvasMap(560,384,(g,w,h)=>{
      for(let row=0;row<3;row++)for(let col=0;col<4;col++){
        g.save();g.translate((col+col%2)*w/4,(row+row%2)*h/3);
        g.scale(col%2?-1:1,row%2?-1:1);g.drawImage(cloth,0,0,w/4,h/3);g.restore();
      }
      const pool=g.createLinearGradient(0,h*.059,0,h*.39);
      pool.addColorStop(0,'#ffe1aeb8');
      pool.addColorStop(.15,'#ffe2ac7b');
      pool.addColorStop(.47,'#ffdeb136');
      pool.addColorStop(1,'#fde7c100');
      g.fillStyle=pool;g.fillRect(0,0,w,h);
    });
    alcoveBack.emissiveMap=alcoveBack.map;
    alcoveBack.emissive.set('#ffffff');alcoveBack.emissiveIntensity=.16;
    shapedPanel(scene,2.94,1.92,.055,.38,alcoveX,1.37,.228,alcoveBack);
    shapedPanel(scene,2.94,1.92,.32,.39,alcoveX,1.37,.394,fabric,[2.68,1.66,.29],.027);
    box(scene,3.08,.32,.50,alcoveX,.174,.300,wood);
    shapedPanel(scene,2.70,.176,.55,.078,alcoveX,.54,.38,fabric,undefined,.038);
    const thread=standard('#345784',.90);
    for(const x of [alcoveX-.44,alcoveX+.44]){
      rod(scene,[x,.63,.272],[x,2.147,.272],.003,thread);
    }
    for(const [side,angle] of [[-1,-.19],[1,.17]]){
      shapedPanel(scene,.41,.37,.144,.086,alcoveX+side*1.00,.765,.398,cushion,undefined,.034).rotation.z=angle;
    }
    box(scene,2.18,.015,.034,alcoveX,2.174,.381,new THREE.MeshBasicMaterial({color:'#ffedc5'}));
    const shelfLight=new THREE.PointLight('#ffdfad',2.7,4.5,2);
    shelfLight.position.set(-3.39,2.63,3.81);
    scene.add(shelfLight);
    const rug=new THREE.Mesh(new THREE.CircleGeometry(1,64),materialFrom(art,'rug',.95));
    rug.rotation.x=-quarterTurn;rug.scale.set(1.80,.75,1);rug.position.set(alcoveX,.005,1.11);
    scene.add(rug);

    const {x,z,w,d}=counter;
    slab(scene,{x,z,w:w-.075,d:d-.098},.85,blue,.76,.16);
    shapedPanel(scene,1.09,.735,.039,.12,x-w/2+.035,.461,z+.552,red).rotation.y=-quarterTurn;
    slab(scene,{x,z,w:w-.12,d:d-.12},.094,wood,.076,.16);
    slab(scene,counter,.94,wood,.105,.18);
    shadow(w+.46,d+.44,x,z,.004,.64);
  }

  function stool(parent,x,z,seat,frame){
    cylinder(parent,.242,.222,.073,x,.466,z,seat,48);
    for(let i=0;i<4;i++){
      const angle=(i+.5)*quarterTurn;
      const dx=Math.cos(angle),dz=Math.sin(angle);
      rod(parent,[x+dx*.152,.441,z+dz*.152],[x+dx*.213,.031,z+dz*.213],.023,frame);
      cylinder(parent,.029,.029,.048,x+dx*.213,.028,z+dz*.213,seat,12);
    }
    const brace=new THREE.Mesh(new THREE.TorusGeometry(.182,.013,8,40),frame);
    brace.rotation.x=-quarterTurn;brace.position.set(x,.216,z);parent.add(brace);
  }

  function labCabinet(parent,table,blue,top,steel,base){
    const {x,z,w,d}=table;
    slab(parent,{x,z,w:w-.17,d:d-.17},.080,base,.078);
    slab(parent,{x,z,w:w-.09,d:d-.09},.839,blue,.762);
    slab(parent,table,.917,top,.084,.156);
    const front=z+d/2-.032;
    for(const side of [-1,1]){
      shapedPanel(parent,w*.455,.681,.035,.026,x+side*w*.24,.457,front,blue);
      rounded(parent,.026,.153,.034,x+side*.110,.602,front+.024,steel,.011);
    }
    const inner=x-Math.sign(x)*(w/2-.037);
    for(const dz of [-d*.317,0,d*.317]){
      const door=shapedPanel(parent,d*.303,.679,.036,.023,inner,.456,z+dz,blue);
      door.rotation.y=-Math.sign(x)*quarterTurn;
      rounded(parent,.043,.143,.024,inner-Math.sign(x)*.029,.60,z+dz+.23,steel,.009);
    }
  }

  function waterTank(scene){
    const {x,z,w,d,h,bottom}=tank;
    const glass=new THREE.MeshPhysicalMaterial({
      color:'#c9e1ec',transparent:true,opacity:.13,roughness:.11,clearcoat:.57,
      clearcoatRoughness:.13,depthWrite:false
    });
    const edge=standard('#b8d6df',.22,.18),ticks=standard('#283d46',.63);
    const liquid=new THREE.MeshPhysicalMaterial({
      color:'#139ac5',roughness:.18,clearcoat:.46,transparent:true,opacity:.69
    });
    const meniscus=new THREE.MeshPhysicalMaterial({
      color:'#66c9e2',roughness:.13,clearcoat:.89,transparent:true,opacity:.83
    });
    const level=(h-.082)*(WATER_CYCLE.initial/WATER_CYCLE.drain),base=bottom+.023;
    box(scene,w,.019,d,x,bottom+.009,z,edge);
    box(scene,w-.030,level,d-.032,x,base+level/2,z,[liquid,liquid,meniscus,liquid,liquid,liquid]);
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
    const top=materialFrom(art,'worktop',.40),blue=materialFrom(art,'blue',.48);
    const enamel=materialFrom(art,'ivory',.51),steel=standard('#d5d9dc',.24,.57);
    const stoolYellow=standard('#efbd36',.53),legs=standard('#e7e5de',.53),dark=standard('#273442',.65);
    const plinth=standard('#19468b',.71);
    for(const table of lab){
      labCabinet(scene,table,blue,top,steel,plinth);
      shadow(table.w+.49,table.d+.46,table.x,table.z,.005,.66);
    }
    for(const [x,z] of labSeats){
      stool(scene,x,z,stoolYellow,legs);
      shadow(.63,.63,x,z,.006,.57);
    }
    waterTank(scene);
    microscope(scene,2.11,lab[1].z+.18,enamel,dark,steel);
    const measureGlass=new THREE.MeshPhysicalMaterial({
      color:'#c6e7f2',roughness:.13,clearcoat:.58,transparent:true,opacity:.29,depthWrite:false
    });
    const measureZ=lab[1].z-.35;
    cylinder(scene,.087,.087,.029,1.25,.938,measureZ,steel);
    cylinder(scene,.046,.046,.435,1.25,1.163,measureZ,measureGlass,32);
    for(let i=0;i<7;i++)box(scene,.025,.007,.006,1.222,1.021+i*.044,measureZ+.043,dark);

    const sinkZ=.48,counterDepth=.78,sinkWidth=1.16,sinkDepth=.48,counterWidth=7.14;
    const cabinetSpan=(counterWidth-sinkWidth)/2,cabinetOffset=(counterWidth+sinkWidth)/4;
    box(scene,sinkWidth,.665,.72,0,.338,.455,blue);
    for(let i=0;i<8;i++){
      const x=(i-3.5)*(counterWidth/8);
      shapedPanel(scene,.86,.636,.036,.024,x,.465,.824,blue);
      rounded(scene,.023,.145,.038,x+(i%2===0?.27:-.27),.61,.851,steel,.010);
      shapedPanel(scene,.86,.61,.038,.025,x,2.57,.414,enamel);
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
    box(scene,sinkWidth,.023,sinkDepth,0,.754,sinkZ,standard('#9ba8ad',.28,.51));
    cylinder(scene,.055,.061,.044,0,.896,.161,steel);
    tube(scene,[[0,.884,.161],[0,1.204,.161],[0,1.301,.268],[0,1.266,.395],[0,1.174,.420]],.024,steel);
    cylinder(scene,.03,.029,.025,0,1.177,.42,steel);
    rounded(scene,.116,.021,.030,.085,.938,.162,steel,.008);
    const tiles=new THREE.Mesh(new THREE.PlaneGeometry(7.14,1.40),
      new THREE.MeshStandardMaterial({map:art.surface('tile',7.14,1.40),roughness:.48,envMapIntensity:.55}));
    tiles.position.set(0,1.570,.013);scene.add(tiles);
  }

  function acousticPanels(scene,room,art){
    const fabric=materialFrom(art,'fabric',.94),backdrop=materialFrom(art,'backdrop',.92);
    const alternate=fabric.clone();alternate.color.set('#eaf0f9');
    const timber=art.sample('wood').image;
    const punched=InteriorArtwork.canvasMap(76,736,(g,w,h)=>{
      g.drawImage(timber,0,0,w,h);
      for(let y=13;y<h-7;y+=14)for(let x=11;x<w-5;x+=14){
        g.fillStyle='#6c563c';g.beginPath();g.arc(x,y,2.55,0,Math.PI*2);g.fill();
        g.fillStyle='#34281ab5';g.beginPath();g.arc(x,y-.54,1.98,0,Math.PI*2);g.fill();
        g.fillStyle='#f8da9baf';g.fillRect(x-1,y+1.87,2.2,.85);
      }
    });
    const perforated=new THREE.MeshStandardMaterial({map:punched,roughness:.74});
    const {width,back}=room.wall;
    for(const side of [-1,1]){
      const wall=positionGroup(scene,side*(width/2-.052),0,back/2,-side*quarterTurn);
      for(const [i,x] of [-2.28,-1.12,.03,1.18,2.33].entries()){
        shapedPanel(wall,1.132,2.49,.075,.021,x,1.599,0,i%2===0?fabric:alternate);
      }
      for(const x of [-2.87,2.92])shapedPanel(wall,.29,2.72,.078,.013,x,1.437,.030,perforated);
    }
    for(const [i,x] of [-3.36,-2.24,-1.12,0,1.12,2.24,3.36].entries()){
      shapedPanel(scene,1.096,2.43,.064,.021,x,1.574,back-.045,i%2===0?fabric:alternate);
    }
    for(const x of [-3.68,-.83,3.61])shapedPanel(scene,.283,2.65,.083,.014,x,1.457,.072,perforated);
    shapedPanel(scene,2.49,1.82,.092,.37,-2.13,1.474,.071,backdrop,undefined,.023);
    shapedPanel(scene,.45,1.78,.075,.022,-1.03,1.545,.056,alternate);
    for(const [i,x] of [1.873,2.955].entries()){
      shapedPanel(scene,1.058,1.82,.073,.025,x,1.565,.056,i===0?fabric:alternate);
    }

    const bezel=standard('#8a372b',.52);
    rounded(scene,.385,.144,.074,-2.13,2.560,.08,bezel,.024);
    rounded(scene,.314,.078,.065,-2.13,2.560,.126,
      new THREE.MeshStandardMaterial({color:'#ffc1a4',emissive:'#ff5733',emissiveIntensity:1.05}),.023);
    const indicatorGlow=new THREE.PointLight('#ff6a48',.41,.90,2);
    indicatorGlow.position.set(-2.13,2.56,.186);scene.add(indicatorGlow);
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
    const shell=standard('#323840',.54),rubber=standard('#1f272e',.79),metal=standard('#565e66',.34,.28);
    const unit=positionGroup(scene,tripod.x,0,tripod.z,-.31);
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3,dx=Math.cos(a),dz=Math.sin(a);
      rod(unit,[dx*.096,1.035,dz*.096],[dx*.207,.539,dz*.207],.025,metal);
      rod(unit,[dx*.207,.549,dz*.207],[dx*.328,.042,dz*.328],.020,metal);
      rod(unit,[0,.596,0],[dx*.213,.552,dz*.213],.010,shell);
      box(unit,.061,.11,.056,dx*.205,.552,dz*.205,rubber);
      cylinder(unit,.036,.034,.044,dx*.328,.027,dz*.328,rubber,15);
    }
    cylinder(unit,.037,.046,.575,0,.885,0,shell,20);
    cylinder(unit,.093,.071,.076,0,1.125,0,metal,20);
    rod(unit,[.058,1.106,.046],[.188,.971,.345],.018,shell);
    rod(unit,[.158,1.004,.270],[.211,.950,.383],.030,rubber);
    rounded(unit,.270,.178,.222,0,1.296,0,shell,.026);
    cylinder(unit,.074,.068,.107,0,1.304,-.14,rubber,36).rotation.x=quarterTurn;
    cylinder(unit,.054,.060,.013,0,1.304,-.199,standard('#5b8192',.21,.36),32).rotation.x=quarterTurn;
    rounded(unit,.177,.109,.049,-.183,1.317,.023,rubber,.013);
    patchPlane(unit,.134,.077,-.183,1.317,.051,target);
  }

  function studioMonitor(parent,x,y,z,map,shell){
    const unit=positionGroup(parent,x,y,z,-1.16);
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
    const unit=positionGroup(scene,x,.933,z,-1.34);
    const panel=positionGroup(unit,0,.086,0);
    panel.rotation.x=.22;
    rounded(panel,.68,.095,.44,0,0,0,shell,.018);
    const knob=standard('#aeb9c7',.64), yellow=standard('#e9b83c',.62),red=standard('#e65b52',.66);
    for(let i=0;i<7;i++){
      const x=-.263+i*.087;
      box(panel,.012,.006,.151,x,.052,.069,light);
      rounded(panel,.048,.021,.030,x,.070,.021+(i%3)*.033,i%3===0?yellow:knob,.006);
      cylinder(panel,.018,.020,.021,x,.064,-.141,knob,16);
      cylinder(panel,.015,.017,.019,x,.064,-.077,i%2===0?red:yellow,16);
    }
    box(panel,.058,.019,.040,.268,.065,.176,red);
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
    const wood=materialFrom(art,'wood',.62),red=materialFrom(art,'red',.66);
    const shell=standard('#313a46',.56),ivory=standard('#e7dfcd',.68);
    const gold=standard('#efb936',.73),blue=standard('#325d96',.74);
    blue.bumpMap=art.relief('cloth');blue.bumpScale=.011;
    slab(scene,anchor,.897,wood,.078,.193);
    slab(scene,{...anchor,w:anchor.w-.092,d:anchor.d-.107},.835,red,.756,.178);
    slab(scene,{...anchor,w:anchor.w-.11,d:anchor.d-.13},.087,wood,.075,.171);
    studioChair(scene,-2.01,.77,Math.PI,gold,ivory);
    const mic=positionGroup(scene,-1.54,.899,1.34);
    cylinder(mic,.064,.071,.022,0,.014,0,shell);
    tube(mic,[[0,.025,0],[0,.156,0],[.023,.240,-.018],[.043,.293,-.071]],.013,shell);
    rounded(mic,.064,.117,.063,.052,.323,-.091,shell,.025).rotation.x=.55;
    shadow(anchor.w+.6,anchor.d+.60,anchor.x,anchor.z,.006,.65);

    slab(scene,consoleDesk,.927,wood,.082,.116);
    slab(scene,deskReturn,.927,wood,.082,.108);
    for(const z of [1.40,drawerZ])box(scene,.98,.824,.58,3.31,.416,z,wood);
    box(scene,.51,.818,.734,2.046,.424,1.24,wood);
    shapedPanel(scene,.392,.63,.044,.028,2.046,.435,1.604,blue);
    rounded(scene,.028,.122,.031,2.146,.62,1.638,shell,.010);
    for(const y of [.19,.385,.587,.761]){
      shapedPanel(scene,.53,.164,.054,.021,2.80,y,drawerZ,blue).rotation.y=-quarterTurn;
      rounded(scene,.025,.029,.156,2.761,y+.016,drawerZ,shell,.009);
    }
    const preview=art.sample('preview');
    studioMonitor(scene,3.35,.929,1.61,waveform(),shell);
    studioMonitor(scene,3.35,.929,2.27,preview,shell);
    studioChair(scene,studioSeat.x,studioSeat.z,-quarterTurn,blue,ivory);
    mixingBoard(scene,3.05,2.93,shell,ivory);
    headphones(scene,3.40,3.46,shell,wood);
    tripodCamera(scene,preview);
    shadow(.78,.83,tripod.x,tripod.z,.005,.49);
    shadow(.79,.79,studioSeat.x,studioSeat.z,.005,.55);
    shadow(1.91,4.63,3.01,consoleDesk.z,.005,.57);
  }

  function ceilingLights(scene,room){
    const {width,back,height}=room.wall;
    const circular=room.kind==='library';
    const shade=standard(circular?'#daa869':'#d8d7d3',.57);
    const emitter=new THREE.MeshBasicMaterial({color:circular?'#fff6df':'#fffdf7'});
    for(const x of [-width*.255,width*.255]){
      for(const part of [.20,.49,.79]){
        const z=back*part;
        if(circular){
          cylinder(scene,.349,.332,.056,x,height-.026,z,shade,56);
          cylinder(scene,.319,.319,.015,x,height-.057,z,emitter,56);
        }else{
          rounded(scene,1.54,.053,.67,x,height-.026,z,shade,.017);
          rounded(scene,1.462,.016,.601,x,height-.057,z,emitter,.006);
        }
      }
    }
  }

  function lightRoom(scene,room){
    const {width,back,height}=room.wall;
    const warm=room.kind==='library';
    scene.environment=InteriorArtwork.canvasMap(256,128,(g,w,h)=>{
      const indirect=g.createLinearGradient(0,0,0,h);
      indirect.addColorStop(0,warm?'#9b8874':'#838b92');
      indirect.addColorStop(.44,warm?'#685a4e':'#596474');
      indirect.addColorStop(1,warm?'#625342':'#535656');
      g.fillStyle=indirect;g.fillRect(0,0,w,h);
      g.fillStyle=warm?'#fff1d6':'#fffcf6';
      for(const [x,y] of [[31,27],[86,35],[142,26],[209,36]])g.fillRect(x,y,27,8);
    });
    scene.environment.mapping=THREE.EquirectangularReflectionMapping;

    const fill=new THREE.HemisphereLight(warm?'#fff4df':'#fcfdff',warm?'#c6a787':'#bdc4ce',1.48);
    const lampColor=warm?'#fff2d7':'#fff9ef';
    const key=new THREE.DirectionalLight(lampColor,.98);
    key.position.set(width*.38,height+1.65,back*.81);
    key.target.position.set(-.25,.52,back*.33);
    key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);
    key.shadow.bias=-.00014;
    key.shadow.normalBias=.027;
    const span=Math.hypot(width,back)*.56;
    Object.assign(key.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:.15,far:span*2.8});
    key.shadow.camera.updateProjectionMatrix();
    // Furniture is static. The opening door is outside this cached shadow pass.
    key.shadow.autoUpdate=false;
    key.shadow.needsUpdate=true;
    const overhead=new THREE.DirectionalLight(lampColor,1.21);
    overhead.position.set(width*.28,height+2.65,back*.75);
    overhead.target=key.target;
    const bounce=new THREE.DirectionalLight(warm?'#f9e9d9':'#e6efff',.76);
    bounce.position.set(-width*.38,height*.64,back*.43);
    scene.add(fill,key,key.target,overhead,bounce);
  }

  function architectureMaterial(art,room,map,surface){
    const floor=surface==='floor',ceiling=surface==='ceiling';
    const material=new THREE.MeshStandardMaterial({
      map,side:THREE.DoubleSide,envMapIntensity:.6,
      roughness:floor&&room.kind==='science'?.61:.90,
      emissiveMap:map,emissive:'#ffffff',emissiveIntensity:ceiling?.56:.11
    });
    if(floor){
      const pattern={library:'wood',science:'paint',broadcast:'cloth'}[room.kind];
      const relief=art.relief(pattern).clone();
      relief.wrapS=relief.wrapT=THREE.RepeatWrapping;
      relief.repeat.set(room.wall.width/2,room.depth/2);
      material.bumpMap=relief;
      material.bumpScale=room.kind==='science'?.003:.013;
    }
    return material;
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
    lightRoom(scene,room);
    enclosure(scene,room,art,design.trim,(map,surface)=>architectureMaterial(art,room,map,surface));
    const doorParent=room.entrance.side==='right'?positionGroup(scene,room.wall.width/2,0,room.depth/2,-quarterTurn):scene;
    const setDoor=entrance(doorParent,room,art,materialFrom(art,'door',.54));
    ceilingLights(scene,room);
    if(room.kind==='broadcast')acousticPanels(scene,room,art);
    const furniture=positionGroup(scene,0,0,0);
    design.build(furniture,room,art,groundShadow(scene));
    for(const [i,clue] of cards.entries())addCard(furniture,clue,cardImages[i]);
    furniture.traverse(mesh=>{
      if(mesh.isMesh && mesh.material.isMeshStandardMaterial && !mesh.material.transparent)mesh.castShadow=true;
    });
    scene.traverse(mesh=>{
      if(mesh.isMesh && mesh.material.isMeshStandardMaterial)mesh.receiveShadow=true;
    });
    const [x,y,z]=room.lock.center;
    const lock=patchPlane(scene,room.lock.width,room.lock.height,x,y,z,imageMap(schoolLockArt(room,[])));
    lock.rotation.y=room.lock.rotationY??0;
    Object.assign(document.getElementById('roomView').dataset,{interior:room.kind,artwork:'approved-v31'});
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
