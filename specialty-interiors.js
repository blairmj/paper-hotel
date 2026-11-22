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
  const anchor = {x:-2.05,z:1.47,w:2.28,d:.80};
  const consoleDesk = {x:3.22,z:3.16,w:1.25,d:4.13};
  const deskReturn = {x:2.54,z:1.24,w:1.48,d:.79};
  const studioMixer = {x:3.07,z:2.88,base:.929,width:1.238,depth:.606,angle:-1.33};
  const tripod = {x:-2.33,z:2.96};
  const studioSeat = {x:2.22,z:3.20};
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
  const numberedBay={left:bookArc.to,right:(bookArc.from+bookArc.to)/2,radius:bookArc.outer-.095};
  const bayAngle=(numberedBay.left+numberedBay.right)/2;
  const numberedFront=arcPoint(bookArc.outer,bayAngle);
  const signPosition=arcPoint((bookArc.outer+bookArc.inner)/2,bayAngle);
  const arcObstacles = Array.from({length:8},(_,i)=>{
    const point=arcPoint((bookArc.inner+bookArc.outer)/2,bookArc.from+(bookArc.to-bookArc.from)*i/7);
    return boundsOf({...point,w:.51,d:.51},.11);
  });

  const designs = {
    library:{
      size:[8.6,7.2,3.14], trim:'#b59365',
      entrance:{x:3.34,width:1.30,height:2.22,moldingColor:'#d6a333'},
      lock:{id:'bookShelf',center:[numberedFront.x,.61,numberedFront.z-.27],width:1.65,height:.73,depth:.80,inspectFromAnySide:true,showGuide:false,
        approach:{x:numberedFront.x,z:5.13},
        inspectionView:{wide:[numberedFront.x+.39,.76,numberedFront.z],compact:[numberedFront.x,.53,numberedFront.z]}},
      statusLamp:{xyz:[2.43,1.27,.10]},doorReveal:{x:3.09,z:1.98},
      start:[.08,1.55,6.80],view:[.78,1.30,.15],portraitView:[numberedFront.x,.98,numberedFront.z],viewAngle:58,
      obstacles:[
        ...arcObstacles,boundsOf(counter),
        [-4.04,-3.57,.22,6.87],[-3.82,2.19,.23,.80]
      ],
      clues:[
        {id:'shelfGuide',name:'서가 안내문',lines:LIBRARY_NOTICES.shelfGuide,
          xyz:[signPosition.x,1.153,signPosition.z],surface:{width:1.02,height:.32},rotationY:quarterTurn-bayAngle,
          approach:{x:numberedFront.x,z:5.20},placement:'stand'},
        {id:'loanSlip',name:'대출 데스크 모니터',lines:LIBRARY_NOTICES.loanSlip,
          xyz:[3.03,1.43,3.18],surface:{width:.89,height:.45},rotationY:-1.10,
          approach:{x:1.68,z:3.88},placement:'monitor'}
      ],
      build:library
    },
    science:{
      size:[9.1,7.9,3.48], trim:'#2c5a9e',
      entrance:{side:'right',x:-1.82,width:1.34,height:2.30,moldingColor:'#2a5187',opensOut:true},
      lock:{id:'lock',center:[4.45,1.34,3.22],width:.43,height:.26,depth:.045,rotationY:-quarterTurn,
        approach:{x:3.32,z:3.48}},
      statusLamp:{xyz:[4.45,1.64,3.22],angle:-quarterTurn},doorReveal:{x:2.12,z:1.17},
      start:[-.15,1.55,7.59],view:[-.075,1.26,1.38],viewAngle:58,
      obstacles:[
        ...lab.map(table=>boundsOf(table)),
        ...labSeats.map(([x,z])=>boundsOf({x,z,w:.50,d:.50},.075)),
        [-3.77,3.77,.22,.99]
      ],
      clues:[
        {id:'balanceBench',name:'실험대의 양팔저울',xyz:[lab[0].x,1.16,3.94],placement:'bench',
          surface:{width:1.63,height:.51,depth:.70},inspectFromAnySide:true,approach:{x:-1.65,z:5.26}}
      ],
      build:science
    },
    broadcast:{
      size:[7.8,6.5,2.91], trim:'#515761',
      entrance:{x:.00,width:1.31,height:2.22,moldingColor:'#7d838b',casingColor:'#666e79',opensOut:true},
      lock:{id:'mixer',center:[studioMixer.x,1.067,studioMixer.z],width:studioMixer.width,height:.245,
        depth:studioMixer.depth,rotationY:studioMixer.angle,approach:{x:1.63,z:2.85},
        inspectionView:{wide:[studioMixer.x,.96,studioMixer.z+.46],compact:[studioMixer.x,.81,studioMixer.z+.22]}},
      statusLamp:{xyz:[.927,1.274,.093]},doorReveal:{x:-.58,z:2.64},
      start:[.17,1.55,6.21],view:[.54,1.31,.16],viewAngle:60,
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
      {id:lock.id??'lock',name:SCHOOL_PUZZLES[kind].title,xyz:lock.center,surface:lock,
        rotationY:lock.rotationY,approach:lock.approach,inspectionView:lock.inspectionView,
        inspectFromAnySide:lock.inspectFromAnySide},
      ...clues.filter(clue=>clue.placement!=='instrument')
    ];
    if(lock.id!=='lock')targets.push(SchoolInterior.doorGuide(design.statusLamp.xyz,design.statusLamp.angle));
    return {
      ...RECOVERY_ROOMS.find(room=>room.kind===kind),depth,interior:true,
      wall:{width,height,z:0,back:depth},ceilingMinimum:height,entrance,door,doorReveal:design.doorReveal,lock,clues,targets,obstacles,
      bounds:{left:-width/2+.27,right:width/2-.27,front:.27,back:depth-.27},
      start,viewAngle,firstView:view,portraitView:design.portraitView??[view[0]*.5,1.30,view[2]],
      stops:[...targets.map(target=>target.xyz),[width/2,1.38,depth/2],[0,1.38,depth],[-width/2,1.38,depth/2]]
    };
  }

  function positionGroup(parent,x,y,z,angle=0){
    const group=new School3D.Group();
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
    const material=new School3D.MeshStandardMaterial({map:art.sample(name),roughness,envMapIntensity:.72});
    const bump=materialBumps[name];
    if(bump){
      material.bumpMap=art.relief(bump[0]);
      material.bumpScale=bump[1];
    }
    return material;
  }

  function roundedOutline(width,height,radius,shape=new School3D.Shape()){
    const l=-width/2,r=width/2,b=-height/2,t=height/2;
    shape.moveTo(l+radius,b);
    shape.lineTo(r-radius,b);shape.quadraticCurveTo(r,b,r,b+radius);
    shape.lineTo(r,t-radius);shape.quadraticCurveTo(r,t,r-radius,t);
    shape.lineTo(l+radius,t);shape.quadraticCurveTo(l,t,l,t-radius);
    shape.lineTo(l,b+radius);shape.quadraticCurveTo(l,b,l+radius,b);
    return shape;
  }

  function panelGeometry(shape,width,height,depth,bevel=0){
    const geometry=new School3D.ExtrudeGeometry(shape,{
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
      outline.holes.push(roundedOutline(w+2*bevel,h+2*bevel,r+bevel,new School3D.Path()));
    }
    const mesh=new School3D.Mesh(panelGeometry(outline,width,height,depth,bevel),material);
    mesh.position.set(x,y,z-depth/2);
    parent.add(mesh);
    return mesh;
  }

  function slab(parent,{x,z,w,d},top,material,thickness=.076,radius=.105){
    const topMesh=shapedPanel(parent,w,d,thickness,radius,x,top-thickness/2,z,material,undefined,.024);
    topMesh.rotation.x=-quarterTurn;
    topMesh.position.set(x,top-thickness,z);
  }

  const backgroundBindings = ['#918179','#ab9f88','#768690','#b9b5a8','#88958e','#707d84',
    '#9c8c80','#afa496','#928b93','#aaa28f','#94a1a5','#7e817c'];
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
    return new School3D.MeshStandardMaterial({map,roughness:.82});
  }

  function packedBooks(parent,books,cover){
    const geometry=new School3D.BoxGeometry(1,1,1);
    const spines=new School3D.InstancedMesh(geometry,cover,books.length);
    const labels=new School3D.InstancedMesh(geometry,standard('#c4bfb1',.91),books.length);
    const pose=new School3D.Object3D();
    for(const [i,{x,y,z,w,h,d,angle,color}] of books.entries()){
      pose.position.set(x,y+h/2,z);pose.rotation.set(0,angle,0);pose.scale.set(w,h,d);pose.updateMatrix();
      spines.setMatrixAt(i,pose.matrix);spines.setColorAt(i,new School3D.Color(color));
      pose.position.set(x+Math.sin(angle)*(d/2+.002),y+.044,z+Math.cos(angle)*(d/2+.002));
      pose.scale.set(w*.65,.026+(i%4)*.004,.004);pose.updateMatrix();labels.setMatrixAt(i,pose.matrix);
    }
    parent.add(spines,labels);
  }

  function shelves(scene,x,z,width,angle,wood,gold,cover){
    const unit=positionGroup(scene,x,0,z,angle),height=2.88,depth=.48;
    const bays=Math.max(1,Math.round(width/.99)),bayWidth=width/bays;
    const books=[];
    const light=new School3D.MeshBasicMaterial({color:'#ffebbd'});
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
            h:.248+(mix%18)*.011,d:.237,angle:0,color:backgroundBindings[mix%backgroundBindings.length]});
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
    const shape=new School3D.Shape(),steps=32;
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
    const mesh=new School3D.Mesh(panelGeometry(shape,outer*2,outer*2,thickness,.005),material);
    mesh.rotation.x=-quarterTurn;mesh.position.set(bookArc.x,y,bookArc.z);scene.add(mesh);
  }

  function curvedShelves(scene,wood,gold,cover){
    for(const y of [.10,.514,.915])arcBoard(scene,bookArc.inner,bookArc.outer,y,y>.9?.071:.054,wood);
    arcBoard(scene,bookArc.inner,bookArc.inner+.045,.14,.79,gold);
    for(let i=0;i<5;i++){
      const angle=bookArc.from+(bookArc.to-bookArc.from)*i/4;
      const point=arcPoint((bookArc.inner+bookArc.outer)/2,angle);
      const lowerOnly=i===3;
      shapedPanel(scene,.455,lowerOnly ? .43 : .884,.058,.028,point.x,lowerOnly ? .31 : .531,point.z,wood).rotation.y=Math.PI-angle;
    }
    const books=[];
    for(const [row,y] of [.154,.568].entries()){
      for(let i=0;i<37;i++){
        if((i+row*4)%9===7)continue;
        const angle=bookArc.from+.058+(bookArc.to-bookArc.from-.116)*i/36;
        if(row===1&&angle>numberedBay.right)continue;
        const point=arcPoint(bookArc.outer-.162-(i%3)*.014,angle);
        books.push({...point,y,w:.054+(i%4)*.005,h:.22+(i*5%9)*.011,d:.235,
          angle:quarterTurn-angle,color:backgroundBindings[(i+3*row)%backgroundBindings.length]});
      }
    }
    packedBooks(scene,books,cover);
    return numberedBooks(scene,cover);
  }

  function numberedBooks(scene,cover){
    const paper=standard('#e7ddc8',.91);
    const foil=standard('#c9ab75',.69);
    const depth=.216,margin=.13;
    const commandPads=[];
    const volumes=SHELF_BINDINGS.map((color,i)=>{
      const angle=numberedBay.left-margin-(numberedBay.left-numberedBay.right-2*margin)*i/(SHELF_BINDINGS.length-1);
      const {x,z}=arcPoint(numberedBay.radius,angle);
      const unit=positionGroup(scene,x,.568,z,quarterTurn-angle);
      const width=.125+(i%3)*.005,height=.291+(i*5%7)*.005;
      const binding=cover.clone();
      binding.color.set(color);
      rounded(unit,width,height,.026,0,height/2,depth/2-.013,binding,.007);
      box(unit,width-.014,height-.017,depth-.025,0,height/2,-.007,paper);
      for(const side of [-.5,.5])box(unit,.006,height,depth,side*(width-.006),height/2,0,binding);
      for(const y of [.20,.80])box(unit,width*.72,.004,.003,0,height*y,depth/2+.002,foil);
      const ticket=patchPlane(unit,width*.91,.069,0,height*.72,depth/2+.006,null);
      ticket.visible=false;
      for(const mesh of unit.children){
        mesh.userData.command='book-'+i;
        commandPads.push(mesh);
      }
      return {ticket,unit,x,z,angle};
    });
    return {
      commandPads,directCommandTarget:'bookShelf',
      setDigits(readings){
        for(const [slot,{ticket,unit,x,z,angle}] of volumes.entries()){
          const number=readings[slot];
          ticket.visible=Number.isInteger(number);
          if(ticket.visible&&ticket.userData.number!==number){
            ticket.material.map?.dispose();
            ticket.material.map=InteriorArtwork.canvasMap(124,108,(g,w,h)=>{
              g.fillStyle='#f8efd9';g.fillRect(0,0,w,h);
              g.strokeStyle='#baa780';g.lineWidth=3;g.strokeRect(4,4,w-8,h-8);
              g.fillStyle='#243b54';g.font='bold 76px sans-serif';
              g.textAlign='center';g.textBaseline='middle';g.fillText(number,w/2,h/2+2);
            });
            ticket.material.needsUpdate=true;
            ticket.userData.number=number;
          }
          const pull=ticket.visible?.10:0;
          unit.position.x=x+Math.cos(angle)*pull;
          unit.position.z=z+Math.sin(angle)*pull;
        }
      }
    };
  }

  function library(scene,room,art,shadow){
    const wood=materialFrom(art,'wood',.64), fabric=materialFrom(art,'fabric',.92);
    const gold=new School3D.MeshStandardMaterial({color:'#dbaf56',roughness:.83,emissive:'#d39931',emissiveIntensity:.12});
    const blue=standard('#324f60',.80);
    const cushion=standard('#eeb938',.90);
    cushion.bumpMap=art.relief('cloth');cushion.bumpScale=.016;
    const cover=bookBinding();
    shelves(scene,-3.985,3.60,6.72,quarterTurn,wood,gold,cover);
    shelves(scene,-2.91,.285,1.87,0,wood,gold,cover);
    shelves(scene,1.69,.285,.99,0,wood,gold,cover);
    const shelfDevice=curvedShelves(scene,wood,gold,cover);
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
    box(scene,2.18,.015,.034,alcoveX,2.174,.381,new School3D.MeshBasicMaterial({color:'#ffedc5'}));
    const shelfLight=new School3D.PointLight('#ffdfad',2.7,4.5,2);
    shelfLight.position.set(-3.39,2.63,3.81);
    scene.add(shelfLight);
    const rug=new School3D.Mesh(new School3D.CircleGeometry(1,64),materialFrom(art,'rug',.95));
    rug.rotation.x=-quarterTurn;rug.scale.set(1.80,.75,1);rug.position.set(alcoveX,.005,1.11);
    scene.add(rug);

    const {x,z,w,d}=counter;
    slab(scene,{x,z,w:w-.075,d:d-.098},.85,blue,.76,.16);
    const front=positionGroup(scene,x-w/2+.015,.46,z,-quarterTurn);
    rounded(front,1.78,.68,.06,0,0,0,wood,.022);
    rounded(front,.61,.085,.016,.35,.17,.032,standard('#39444a',.88),.007);
    box(front,.64,.014,.052,.35,.125,.039,blue);
    slab(scene,{x,z,w:w-.12,d:d-.12},.094,wood,.076,.16);
    slab(scene,counter,.94,wood,.105,.18);
    shadow(w+.46,d+.44,x,z,.004,.64);
    return shelfDevice;
  }

  function stool(parent,x,z,seat,frame){
    cylinder(parent,.242,.222,.073,x,.466,z,seat,48);
    for(let i=0;i<4;i++){
      const angle=(i+.5)*quarterTurn;
      const dx=Math.cos(angle),dz=Math.sin(angle);
      rod(parent,[x+dx*.152,.441,z+dz*.152],[x+dx*.213,.031,z+dz*.213],.023,frame);
      cylinder(parent,.029,.029,.048,x+dx*.213,.028,z+dz*.213,seat,12);
    }
    const brace=new School3D.Mesh(new School3D.TorusGeometry(.182,.013,8,40),frame);
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
    const balances=ScienceBalance.build(scene,room);
    microscope(scene,2.11,lab[1].z+.18,enamel,dark,steel);
    const measureGlass=new School3D.MeshPhysicalMaterial({
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
    const tiles=new School3D.Mesh(new School3D.PlaneGeometry(7.14,1.40),
      new School3D.MeshStandardMaterial({map:art.surface('tile',7.14,1.40),roughness:.48,envMapIntensity:.55}));
    tiles.position.set(0,1.570,.013);scene.add(tiles);
    return balances;
  }

  function studioFinish(art,name,levels,roughness){
    const material=materialFrom(art,name,roughness);
    const source=material.map.image;
    material.map=InteriorArtwork.canvasMap(source.width,source.height,(g,w,h)=>{
      g.drawImage(source,0,0);
      const image=g.getImageData(0,0,w,h), pixels=image.data;
      const grey=new Float32Array(w*h);
      let total=0;
      for(let i=0;i<grey.length;i++){
        const p=i*4;
        grey[i]=.21*pixels[p]+.72*pixels[p+1]+.07*pixels[p+2];
        total+=grey[i];
      }
      const average=total/grey.length;
      for(let i=0;i<grey.length;i++){
        const shade=(grey[i]-average)*.76,p=i*4;
        for(let c=0;c<3;c++)pixels[p+c]=levels[c]+shade;
      }
      g.putImageData(image,0,0);
    });
    return material;
  }

  function acousticPanels(scene,room,art){
    const fabric=studioFinish(art,'fabric',[67,72,79],.93);
    const backdrop=studioFinish(art,'backdrop',[86,90,98],.91);
    const alternate=fabric.clone();alternate.color.set('#dde1e6');
    const trim=studioFinish(art,'wood',[86,89,95],.73);
    const timber=trim.map.image;
    const punched=InteriorArtwork.canvasMap(76,736,(g,w,h)=>{
      g.drawImage(timber,0,0,w,h);
      for(let y=13;y<h-7;y+=14)for(let x=11;x<w-5;x+=14){
        g.fillStyle='#33373c';g.beginPath();g.arc(x,y,2.55,0,Math.PI*2);g.fill();
        g.fillStyle='#181b1ee0';g.beginPath();g.arc(x,y-.54,1.98,0,Math.PI*2);g.fill();
        g.fillStyle='#a0a5ac87';g.fillRect(x-1,y+1.87,2.2,.85);
      }
    });
    const perforated=new School3D.MeshStandardMaterial({map:punched,roughness:.74});
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
    for(const [i,x] of [1.873,2.955].entries()){
      shapedPanel(scene,1.058,1.82,.073,.025,x,1.565,.056,i===0?fabric:alternate);
    }

    const bezel=standard('#25282c',.52);
    rounded(scene,.52,.161,.083,-2.13,2.56,.089,bezel,.023);
    const sign=InteriorArtwork.canvasMap(320,88,(g,w,h)=>{
      const light=g.createLinearGradient(0,0,0,h);
      light.addColorStop(0,'#a4302f');light.addColorStop(.52,'#ce5147');light.addColorStop(1,'#8d2829');
      g.fillStyle=light;g.fillRect(0,0,w,h);
      g.fillStyle='#ffebe0';g.font='bold 47px sans-serif';g.textAlign='center';
      g.fillText('ON AIR',w/2,h*.69);
    });
    patchPlane(scene,.449,.104,-2.13,2.56,.132,sign);
    const indicatorGlow=new School3D.PointLight('#ff6a48',.41,.90,2);
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

  function studioMeter(g,x,y,width,height,level){
    const segments=15,step=height/segments;
    const colors=['#4be1a9','#efcb64','#f07661'];
    for(let i=0;i<segments;i++){
      g.fillStyle=i>=level?'#283538':colors[i<10?0:i<13?1:2];
      g.fillRect(x,y+height-(i+1)*step,width,Math.max(1,step*.75));
    }
  }

  function waveform(){
    return InteriorArtwork.canvasMap(500,294,(g,w,h)=>{
      g.fillStyle='#151b23';g.fillRect(0,0,w,h);
      g.fillStyle='#292f37';g.fillRect(0,0,w,42);g.fillRect(0,h-32,w,32);
      g.font='bold 20px sans-serif';g.fillStyle='#ed8072';g.fillText('REC',17,28);
      g.font='18px monospace';g.fillStyle='#c1ccd6';g.fillText('00:01:42',362,27);
      for(const [row,color] of ['#54d7bc','#78a8d5'].entries()){
        const top=63+row*95,mid=top+35;
        g.fillStyle='#1e2832';g.fillRect(13,top,w-26,68);
        g.fillStyle='#3d4b56';
        for(let x=24;x<w-16;x+=38)g.fillRect(x,top,1,68);
        g.fillStyle=color;
        for(let x=18;x<w-16;x+=3){
          const sample=Math.abs(Math.sin(x*.133+row)*Math.cos(x*.071));
          const pulse=3+sample*31*(.43+.57*Math.sin(x/w*Math.PI));
          g.fillRect(x,mid-pulse,2,2*pulse);
        }
      }
      g.fillStyle='#b9c7d0';g.font='15px sans-serif';g.fillText('MIC 1',15,h-11);
      g.fillText('MIC 2',75,h-11);g.fillText('48 kHz',w-67,h-11);
    });
  }

  function meterDisplay(){
    return InteriorArtwork.canvasMap(500,294,(g,w,h)=>{
      g.fillStyle='#151a20';g.fillRect(0,0,w,h);
      g.fillStyle='#2a3239';g.fillRect(0,0,w,38);
      g.fillStyle='#d2d9de';g.font='bold 19px sans-serif';g.fillText('AUDIO LEVELS',20,26);
      for(const [i,level] of [10,12,8,11,7,9,13,12].entries()){
        const x=27+i*57;
        g.fillStyle='#28323b';g.fillRect(x-7,59,42,185);
        studioMeter(g,x,70,11,155,level);
        studioMeter(g,x+15,70,11,155,Math.max(level-2,2));
        g.fillStyle='#b8c4cc';g.font='16px monospace';
        g.fillText(String(i+1).padStart(2,'0'),x+4,268);
      }
    });
  }

  function hardwareBatch(parent,geometry,material,positions){
    const mesh=new School3D.InstancedMesh(geometry,material,positions.length);
    const matrix=new School3D.Matrix4();
    for(const [index,[x,y,z]] of positions.entries())mesh.setMatrixAt(index,matrix.makeTranslation(x,y,z));
    parent.add(mesh);
  }

  function mixerSurface(channels){
    return InteriorArtwork.canvasMap(1200,580,(g,w,h)=>{
      const xPos=x=>(x/1.18+.5)*w;
      const row=z=>(z/.554+.5)*h;
      const finish=g.createLinearGradient(0,0,0,h);
      finish.addColorStop(0,'#22262e');finish.addColorStop(.45,'#353940');finish.addColorStop(1,'#23262e');
      g.fillStyle=finish;g.fillRect(0,0,w,h);
      for(const [i,x] of channels.entries()){
        const px=xPos(x);
        g.fillStyle=i%2===0?'#b6c4d30d':'#0c10183b';
        g.fillRect(px-37,16,74,h-32);
        g.fillStyle='#aeb9c6';g.textAlign='center';g.font='bold 21px monospace';
        g.fillText(String(i+1).padStart(2,'0'),px,46);
        studioMeter(g,px+20,65,11,93,[11,9,13,7,9,11,8,9,12,6,8,10][i]);
        for(const z of [-.151,-.087,-.023]){
          g.strokeStyle='#7e838c';g.lineWidth=1.1;
          g.beginPath();g.arc(px,row(z),25,Math.PI*.82,Math.PI*2.18);g.stroke();
        }
        g.fillStyle='#0a0d12';g.fillRect(px-5,row(.074),10,row(.224)-row(.074));
        g.fillStyle='#89939f';
        for(let step=0;step<7;step++)g.fillRect(px+13,row(.078)+step*23,step===3?15:10,1.6);
      }
      const master=xPos(.458);
      g.fillStyle='#141a22';g.fillRect(master-88,16,175,h-32);
      g.fillStyle='#b9c5cc';g.font='bold 17px sans-serif';g.textAlign='center';
      g.fillText('MASTER',master,43);
      studioMeter(g,master-39,158,24,191,12);studioMeter(g,master+14,158,24,191,10);
      g.fillStyle='#656e77';g.fillRect(master-58,543,117,1);
    });
  }

  function mixerOrderDisplay(panel){
    const map=InteriorArtwork.canvasMap(420,180,()=>{});
    patchPlane(panel,.162,.093,.458,.049,-.179,map).rotation.x=-quarterTurn;
    const g=map.image.getContext('2d'),{width,height}=map.image;
    function setProgram(program){
      g.fillStyle='#101c20';g.fillRect(0,0,width,height);
      g.fillStyle='#77bdaf';g.font='bold 28px sans-serif';g.textAlign='left';g.fillText('CUE ORDER',15,41);
      g.font='bold 30px monospace';g.textAlign='center';
      for(let i=0;i<4;i++){
        const x=12+i*100, a=BROADCAST_COMMANDS[program[i]];
        g.fillStyle=a?'#20443f':'#263235';g.fillRect(x,65,94,96);
        g.fillStyle=a?'#b9f0de':'#88a8a5';g.fillText(a?.display??'—',x+47,124);
      }
      map.needsUpdate=true;
    }
    setProgram([]);
    return setProgram;
  }

  function mixingBoard(scene,shell,edge){
    const {x,z,base,angle,width,depth}=studioMixer;
    const unit=positionGroup(scene,x,base,z,angle);
    rounded(unit,1.18,.060,.55,0,.057,-.038,shell,.017);
    const panel=positionGroup(unit,0,.121,0);
    panel.rotation.x=.218;
    rounded(panel,width,.089,depth,0,0,0,shell,.021);
    const channels=Array.from({length:12},(_,i)=>-.535+i*.078);
    patchPlane(panel,1.18,.554,0,.047,0,mixerSurface(channels)).rotation.x=-quarterTurn;
    const dials=standard('#14191f',.49),faders=standard('#79838d',.44,.14);
    const dialGeometry=new School3D.CylinderGeometry(.0155,.019,.021,18);
    const markerGeometry=new School3D.BoxGeometry(.004,.002,.015);
    const levels=[.104,.154,.099,.191,.119,.163,.140,.176,.112,.201,.157,.138];
    const lamp=new School3D.MeshBasicMaterial({color:'#64d4ae'});
    for(const [z,color] of [[-.151,'#dadfe3'],[-.087,'#73adc3'],[-.023,'#c2a56e']]){
      hardwareBatch(panel,dialGeometry,dials,channels.map(x=>[x,.058,z]));
      hardwareBatch(panel,markerGeometry,standard(color,.55),channels.map(x=>[x,.069,z-.004]));
    }
    hardwareBatch(panel,new School3D.BoxGeometry(.030,.017,.032),faders,channels.map((x,i)=>[x,.056,levels[i]]));
    hardwareBatch(panel,new School3D.BoxGeometry(.028,.007,.020),lamp,channels.filter((_,i)=>i%3!==2).map(x=>[x,.051,.035]));
    const pilots=['#77c4df','#ed7c70','#bbcad0','#77d8b3'];
    const commandPads=Object.entries(BROADCAST_COMMANDS).map(([command,{display}],i)=>{
      const x=.417+(i%2)*.078,z=.139+Math.floor(i/2)*.068;
      const pad=rounded(panel,.067,.016,.055,x,.054,z,edge,.006);
      pad.userData.command=command;
      const cap=InteriorArtwork.canvasMap(134,110,(g,w,h)=>{
        g.fillStyle='#3c4752';g.fillRect(0,0,w,h);
        g.fillStyle=pilots[i];g.fillRect(31,16,w-62,13);
        g.font='bold 37px sans-serif';g.textAlign='center';g.fillStyle='#e6eff5';
        g.fillText(display,w/2,82);
      });
      patchPlane(panel,.054,.042,x,.063,z,cap).rotation.x=-quarterTurn;
      return pad;
    });
    for(const x of [-.603,.603])box(panel,.014,.059,.535,x,.005,0,edge);
    return {commandPads,setDigits:mixerOrderDisplay(panel)};
  }

  function equipmentRack(scene,x,z,shell,edge){
    const unit=positionGroup(scene,x,.927,z);
    rounded(unit,.573,.361,.421,0,.183,0,shell,.019);
    for(const x of [-.259,.259])box(unit,.032,.334,.035,x,.181,.219,edge);
    const face=InteriorArtwork.canvasMap(560,330,(g,w,h)=>{
      g.fillStyle='#13181d';g.fillRect(0,0,w,h);
      const units=[['POWER','#86e3ba'],['RECORDER','#ef7b66'],['INPUT','#78bfd9']];
      for(const [i,[name,indicator]] of units.entries()){
        const y=10+i*105;
        g.fillStyle='#32373d';g.fillRect(7,y,w-14,99);
        g.fillStyle='#899097';g.fillRect(7,y,w-14,2);
        g.fillStyle='#c1cad0';g.font='bold 18px sans-serif';g.fillText(name,30,y+34);
        g.fillStyle=indicator;g.fillRect(31,y+56,21,8);
        g.fillStyle='#15272a';g.fillRect(168,y+20,135,58);
        g.fillStyle=indicator;
        for(let b=0;b<10-i;b++)g.fillRect(182+b*11,y+48,7,13);
        for(const x of [21,w-22]){
          g.fillStyle='#9b9ea3';g.fillRect(x-2,y+17,4,4);g.fillRect(x-2,y+79,4,4);
        }
      }
    });
    patchPlane(unit,.472,.304,0,.181,.217,face);
    for(const y of [.084,.181,.278]){
      cylinder(unit,.023,.023,.018,.152,y,.232,edge,24).rotation.x=quarterTurn;
      cylinder(unit,.012,.012,.014,.195,y,.231,shell,20).rotation.x=quarterTurn;
    }
  }

  function nearfield(scene,x,z,shell,edge){
    const unit=positionGroup(scene,x,.927,z,-1.30);
    const rubber=standard('#15191d',.78);
    rounded(unit,.241,.345,.227,0,.176,0,shell,.022);
    for(const [y,radius] of [[.237,.042],[.113,.086]]){
      cylinder(unit,radius,radius,.012,0,y,.116,edge,32).rotation.x=quarterTurn;
      cylinder(unit,radius*.84,radius*.84,.014,0,y,.124,rubber,32).rotation.x=quarterTurn;
      cylinder(unit,radius*.38,radius*.43,.010,0,y,.134,edge,28).rotation.x=quarterTurn;
    }
    box(unit,.020,.006,.004,.067,.043,.117,new School3D.MeshBasicMaterial({color:'#68c6a6'}));
  }

  function headphones(scene,x,z,shell,edge){
    const unit=positionGroup(scene,x,.927,z,-.37);
    cylinder(unit,.102,.111,.029,0,.016,0,edge,36);
    rod(unit,[0,.031,0],[0,.264,0],.016,shell);
    tube(unit,[[-.122,.191,0],[-.122,.307,0],[-.062,.385,0],[.040,.396,0],
      [.114,.327,0],[.127,.191,0]],.021,shell);
    for(const side of [-1,1]){
      rounded(unit,.065,.136,.093,side*.123,.215,0,shell,.027);
      rounded(unit,.033,.112,.084,side*.093,.215,0,edge,.014);
    }
  }

  function announcerMic(scene,shell,edge){
    const unit=positionGroup(scene,-1.54,.897,1.38,.15);
    cylinder(unit,.09,.095,.033,0,.019,0,edge,36);
    rod(unit,[0,.032,0],[0,.245,0],.019,shell);
    cylinder(unit,.028,.025,.042,0,.196,0,edge,20);
    rod(unit,[0,.230,0],[.052,.303,-.064],.017,edge);
    const mic=positionGroup(unit,.053,.309,-.076);
    mic.rotation.set(.48,0,-.31);
    cylinder(mic,.038,.029,.142,0,.037,0,shell,32);
    cylinder(mic,.044,.043,.060,0,.136,0,edge,36);
    for(const y of [.122,.137,.152])cylinder(mic,.044,.044,.003,0,y,0,shell,28);
    tube(unit,[[.046,.299,-.060],[.121,.212,-.023],[.074,.097,.012],[.035,.037,-.018]],.005,shell);
  }

  function broadcast(scene,room,art,shadow){
    const worktop=studioFinish(art,'wood',[85,89,98],.57);
    const apron=studioFinish(art,'red',[49,53,61],.73);
    const shell=standard('#24292f',.55),edge=standard('#4a515a',.48,.20);
    const upholstered=studioFinish(art,'fabric',[56,60,68],.87),frame=standard('#737985',.46,.30);
    slab(scene,anchor,.897,worktop,.078,.193);
    slab(scene,{...anchor,w:anchor.w-.092,d:anchor.d-.107},.835,apron,.756,.178);
    slab(scene,{...anchor,w:anchor.w-.11,d:anchor.d-.13},.087,edge,.075,.171);
    studioChair(scene,-2.01,.77,Math.PI,upholstered,frame);
    announcerMic(scene,shell,edge);
    shadow(anchor.w+.6,anchor.d+.60,anchor.x,anchor.z,.006,.65);

    slab(scene,consoleDesk,.927,worktop,.082,.116);
    slab(scene,deskReturn,.927,worktop,.082,.108);
    for(const z of [1.40,drawerZ])box(scene,1.15,.824,.58,consoleDesk.x,.416,z,apron);
    box(scene,.51,.818,.734,2.046,.424,1.24,apron);
    shapedPanel(scene,.392,.63,.044,.028,2.046,.435,1.604,shell);
    rounded(scene,.028,.122,.031,2.146,.62,1.638,edge,.010);
    for(const y of [.19,.385,.587,.761]){
      shapedPanel(scene,.53,.164,.054,.021,2.63,y,drawerZ,shell).rotation.y=-quarterTurn;
      rounded(scene,.025,.029,.156,2.593,y+.016,drawerZ,edge,.009);
    }
    const recording=waveform(),levels=meterDisplay();
    equipmentRack(scene,2.101,1.167,shell,edge);
    nearfield(scene,3.54,1.24,shell,edge);
    studioMonitor(scene,3.49,.929,1.70,recording,shell);
    studioMonitor(scene,3.51,.929,2.36,levels,shell);
    nearfield(scene,3.69,2.81,shell,edge);
    studioChair(scene,studioSeat.x,studioSeat.z,-quarterTurn,upholstered,frame);
    const mixer=mixingBoard(scene,shell,edge);
    headphones(scene,3.56,3.52,shell,edge);
    tripodCamera(scene,recording);
    shadow(.78,.83,tripod.x,tripod.z,.005,.49);
    shadow(.79,.79,studioSeat.x,studioSeat.z,.005,.55);
    shadow(1.91,4.63,3.01,consoleDesk.z,.005,.57);
    return mixer;
  }

  function statusLamp(scene,{xyz,angle}){
    const base=positionGroup(scene,...xyz,angle);
    rounded(base,.134,.167,.037,0,0,0,standard('#3b424a',.56),.012);
    const indicator=new School3D.MeshBasicMaterial({color:'#f38d72'});
    cylinder(base,.025,.026,.01,0,0,.024,indicator,28).rotation.x=quarterTurn;
    return open=>indicator.color.set(open?'#74d5a9':'#f38d72');
  }

  function ceilingLights(scene,room){
    const {width,back,height}=room.wall;
    const circular=room.kind==='library';
    const shade=standard(circular?'#daa869':room.kind==='broadcast'?'#535a66':'#d8d7d3',.57);
    const emitter=new School3D.MeshBasicMaterial({color:circular?'#fff6df':'#fffdf7'});
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
    scene.environment.mapping=School3D.EquirectangularReflectionMapping;

    const fill=new School3D.HemisphereLight(warm?'#fff4df':'#fcfdff',warm?'#c6a787':'#bdc4ce',1.48);
    const lampColor=warm?'#fff2d7':'#fff9ef';
    const key=new School3D.DirectionalLight(lampColor,.98);
    key.position.set(width*.38,height+1.65,back*.81);
    key.target.position.set(-.25,.52,back*.33);
    key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);
    key.shadow.bias=-.00014;
    key.shadow.normalBias=.027;
    const span=Math.hypot(width,back)*.56;
    Object.assign(key.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:.15,far:span*2.8});
    // Furniture is static. The opening door is outside this cached shadow pass.
    key.shadow.autoUpdate=false;
    key.shadow.needsUpdate=true;
    const overhead=new School3D.DirectionalLight(lampColor,1.21);
    overhead.position.set(width*.28,height+2.65,back*.75);
    overhead.target=key.target;
    const bounce=new School3D.DirectionalLight(warm?'#f9e9d9':'#e6efff',.76);
    bounce.position.set(-width*.38,height*.64,back*.43);
    scene.add(fill,key,key.target,overhead,bounce);
  }

  function architectureMaterial(art,room,map,surface){
    const floor=surface==='floor',ceiling=surface==='ceiling';
    const material=new School3D.MeshStandardMaterial({
      map,side:School3D.DoubleSide,envMapIntensity:.6,
      roughness:floor&&room.kind==='science'?.61:.90,
      emissiveMap:map,emissive:'#ffffff',emissiveIntensity:ceiling?.56:.11
    });
    if(room.kind==='broadcast'){
      const tone={wall:'#8b94a0',ceiling:'#a8acb5',floor:'#a2a8b1'}[surface];
      material.color.set(tone);
      material.emissive.set(tone);
    }
    if(floor){
      const pattern={library:'wood',science:'paint',broadcast:'cloth'}[room.kind];
      const relief=art.relief(pattern).clone();
      relief.wrapS=relief.wrapT=School3D.RepeatWrapping;
      relief.repeat.set(room.wall.width/2,room.depth/2);
      material.bumpMap=relief;
      material.bumpScale=room.kind==='science'?.003:.013;
    }
    return material;
  }

  function addCard(scene,clue,card){
    if(clue.placement==='instrument')return;
    const {width,height}=clue.surface,group=positionGroup(scene,...clue.xyz,clue.rotationY??0);
    if(clue.placement==='monitor'){
      const casing=standard('#29323a',.60),steel=standard('#647078',.42);
      const top=.94-clue.xyz[1];
      rounded(group,width+.049,height+.053,.046,0,0,-.027,casing,.012);
      const neckHeight=-height/2-top;
      box(group,.087,neckHeight,.049,0,top+neckHeight/2,-.055,steel);
      rounded(group,.32,.024,.19,0,top+.012,-.045,casing,.008);
      rounded(group,.43,.021,.15,0,top+.013,.224,casing,.008);
      for(let row=0;row<4;row++){
        const count=row===3?4:12;
        const pitch=.38/count;
        for(let key=0;key<count;key++){
          box(group,pitch-.005,.008,.019,(key+.5)*pitch-.19,top+.027,.182+row*.026,steel);
        }
      }
    }else{
      const frame=standard('#d7c498',.82);
      rounded(group,width+.037,height+.035,.037,0,0,-.022,frame,.012);
      if(clue.placement==='stand'){
        box(group,width+.05,.026,.132,0,-height/2+.001,-.041,frame);
        rod(group,[0,-height*.19,-.028],[0,-height*.50,-.123],.010,frame);
      }
    }
    patchPlane(group,width,height,0,0,0,imageMap(card));
  }

  async function build(scene,room){
    const design=designs[room.kind];
    const cards=room.clues.filter(clue=>clue.placement!=='instrument'&&clue.placement!=='bench');
    const [art,cardImages]=await Promise.all([InteriorArtwork.load(room.kind),Promise.all(cards.map(clueBoardArt))]);
    lightRoom(scene,room);
    enclosure(scene,room,art,design.trim,(map,surface)=>architectureMaterial(art,room,map,surface));
    const doorParent=room.entrance.side==='right'?positionGroup(scene,room.wall.width/2,0,room.depth/2,-quarterTurn):scene;
    const doorFinish=room.kind==='broadcast'?studioFinish(art,'door',[49,54,61],.50):materialFrom(art,'door',.54);
    const swingDoor=entrance(doorParent,room,art,doorFinish);
    ceilingLights(scene,room);
    if(room.kind==='broadcast')acousticPanels(scene,room,art);
    const furniture=positionGroup(scene,0,0,0);
    const device=design.build(furniture,room,art,groundShadow(scene));
    for(const [i,clue] of cards.entries())addCard(furniture,clue,cardImages[i]);
    furniture.traverse(mesh=>{
      if(mesh.isMesh && mesh.material.isMeshStandardMaterial && !mesh.material.transparent)mesh.castShadow=true;
    });
    scene.traverse(mesh=>{
      if(mesh.isMesh && mesh.material.isMeshStandardMaterial)mesh.receiveShadow=true;
    });
    const canvas=document.getElementById('roomView');
    const version={library:'lending-v52',science:'balance-v1',broadcast:'studio-v34'}[room.kind];
    Object.assign(canvas.dataset,{interior:room.kind,artwork:version});
    const updateDoorStatus=statusLamp(scene,design.statusLamp);
    return {
      ...device,
      setDoor(amount){swingDoor(amount);updateDoorStatus(amount>0)}
    };
  }

  return {definition,build};
})();
