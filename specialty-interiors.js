'use strict';

const SpecialtyInteriors=(()=>{
  const {enclosure,entrance,box,rounded,patchPlane,standard,cylinder,rod,groundShadow}=SchoolInterior;
  const styles={
    library:{
      size:[8.6,7.2,3.14],accent:'#f0b52e',wall:'#fff5db',lower:'#e8ecff',floor:'#eacfa4',
      obstacles:[[-4.02,-3.50,1.02,5.85],[-.75,1.89,3.28,5.22],[3.29,4.02,3.84,6.52],[-3.44,.19,.25,.68]],
      clues:[
        {id:'shelfGuide',name:'책장 옆 찾기 표지',xyz:[-4.23,1.48,1.58],rotationY:Math.PI/2,approach:{x:-2.08,z:1.58}},
        {id:'loanSlip',name:'열람대의 대출 메모',xyz:[.59,.981,4.36],surface:{width:.63,height:.37},approach:{x:.59,z:5.65}}
      ],
      build:library
    },
    science:{
      size:[9.1,7.9,3.48],accent:'#1aafa9',wall:'#f1fbff',lower:'#d2f2f0',floor:'#dce9ed',
      obstacles:[[-2.46,1.84,2.68,4.49],[-4.20,-3.26,3.30,7.11],[1.98,4.26,6.67,7.60]],
      clues:[
        {id:'waterCycle',name:'실험대의 급수 순서',xyz:[-2.05,1.76,.087],approach:{x:-2.05,z:1.35}},
        {id:'waterStart',name:'물통의 시작 눈금',xyz:[.74,1.13,4.06],surface:{width:.76,height:.44},approach:{x:.74,z:5.40}}
      ],
      build:science
    },
    broadcast:{
      size:[7.8,6.5,2.91],accent:'#ea584f',wall:'#eaf0ff',lower:'#d9e4f9',floor:'#ccd8ee',
      obstacles:[[-2.48,1.73,1.05,2.61],[-.77,.26,3.30,4.49],[-3.59,-2.94,3.40,5.75]],
      clues:[
        {id:'broadcastRules',name:'벽의 방송 장치 안내표',xyz:[-3.79,1.69,2.82],rotationY:Math.PI/2,approach:{x:-2.74,z:2.87}},
        {id:'broadcastLog',name:'믹서 옆 방송 시험 기록',xyz:[.95,1.101,2.48],surface:{width:.74,height:.44},approach:{x:1.06,z:3.65}}
      ],
      build:broadcast
    }
  };

  function definition(kind){
    const {size:[width,depth,height],accent,clues,obstacles}=styles[kind];
    const entrance={x:width/2-1.48,width:1.30,height:2.23,moldingColor:accent};
    const lock={center:[entrance.x+(kind==='broadcast'?1.01:-.97),1.29,.088],width:.57,height:.33};
    const targets=[
      {id:'lock',name:SCHOOL_PUZZLES[kind].title,xyz:lock.center,surface:lock,approach:{x:lock.center[0],z:1.23}},
      ...clues.map(clue=>({surface:{width:1.19,height:.69},...clue}))
    ];
    return {
      ...RECOVERY_ROOMS.find(room=>room.kind===kind),depth,interior:true,
      wall:{width,height,z:0,back:depth},ceilingMinimum:height,entrance,lock,clues:targets.slice(1),targets,
      door:[entrance.x,1.30,.05],obstacles,
      bounds:{left:-width/2+.27,right:width/2-.27,front:.27,back:depth-.27},
      start:[0,1.55,depth-.38],firstView:[.20,1.07,depth*.42],portraitView:[.20,1.11,depth*.42],
      stops:[...targets.map(target=>target.xyz),[width/2,1.3,depth/2],[0,1.3,depth],[-width/2,1.3,depth/2]]
    };
  }

  function finishes(style){
    const [width,,height]=style.size;
    const {wall,lower,floor,accent}=style;
    const door=InteriorArtwork.canvasMap(192,256,(g,w,h)=>{
      g.fillStyle=accent;g.fillRect(0,0,w,h);
      g.fillStyle='#ffffff15';g.fillRect(0,0,w*.34,h);
    });
    return {
      sample:()=>door,
      surface(name,span){
        return InteriorArtwork.canvasMap(Math.round(100*(span||width)),256,(g,w,h)=>{
          g.fillStyle=name==='ceiling'?'#fcfdff':name==='floor'?floor:wall;g.fillRect(0,0,w,h);
          if(name==='wall'){
            const trim=h*(1-.85/height);
            g.fillStyle=lower;g.fillRect(0,trim,w,h-trim);
            g.fillStyle=accent;g.fillRect(0,trim,w,3);
          }
          if(name==='floor'&&style===styles.library){
            g.fillStyle='#bba07c52';
            for(let y=12;y<h;y+=16){g.fillRect(0,y,w,1);g.fillRect((y*31)%w,y,1,16)}
          }
        });
      }
    };
  }

  function bookcase(scene,x,z,width,angle,accent){
    const unit=new THREE.Group();unit.position.set(x,0,z);unit.rotation.y=angle;scene.add(unit);
    const wood=standard('#e9c88e',.82),frame=standard(accent,.74);
    const colors=['#376bc8','#f2b932','#e96358','#6aa8a7','#f4f1e4'].map(color=>standard(color));
    box(unit,width,1.88,.042,0,.96,-.204,frame);
    for(const dx of [-width/2+.03,width/2-.03])box(unit,.07,1.88,.46,dx,.96,0,wood);
    for(const y of [.13,.68,1.22,1.89])box(unit,width,.055,.46,0,y,.002,wood);
    const count=Math.floor((width-.16)/.132);
    for(const [shelf,y] of [.158,.708,1.248].entries()){
      for(let i=0;i<count;i++){
        if((i+shelf)%8===6)continue;
        const tall=.23+.17*((i*5+shelf*2)%7)/6;
        box(unit,.099,tall,.25,-width/2+.123+i*.133,y+tall/2,.047,colors[(i+2*shelf)%colors.length]);
      }
    }
  }

  function library(scene,shadow){
    bookcase(scene,-1.62,.295,3.49,0,'#edb82d');
    bookcase(scene,-3.83,4.04,3.38,Math.PI/2,'#366ccc');
    bookcase(scene,3.78,5.18,2.53,-Math.PI/2,'#edb82d');
    const table=standard('#ebcb97',.82),blue=standard('#376ad0',.62), yellow=standard('#efb92f',.72);
    shadow(2.26,1.73,.55,4.32,.006,.65);
    cylinder(scene,.77,.77,.065,.55,.77,4.27,table);
    cylinder(scene,.096,.11,.7,.55,.38,4.27,blue);
    for(const [x,z,material] of [[-.49,4.04,blue],[1.45,4.53,yellow]]){
      cylinder(scene,.26,.25,.082,x,.43,z,material);
      for(const dx of [-.155,.155])for(const dz of [-.15,.15]){
        rod(scene,[x+dx,.4,z+dz],[x+dx*1.15,.02,z+dz*1.15],.024,blue);
      }
    }
    for(let i=0;i<3;i++){
      rounded(scene,.32,.034,.24,.96,.821+.036*i,4.18,i%2?blue:yellow,.008).rotation.y=i*.16;
    }
    box(scene,1.24,.70,.36,-3.25,.35,6.84,standard('#edb82d'));
    rounded(scene,1.22,.11,.40,-3.25,.75,6.84,blue,.044);
  }

  function science(scene,shadow){
    const yellow=standard('#f0c24a'),white=standard('#f8f9f3',.65);
    const aqua=standard('#48b8b4',.68),steel=standard('#919fa6',.38,.30);
    const blue=standard('#51bbeb',.38);
    shadow(4.34,1.92,-.3,3.56,.006,.75);
    box(scene,3.85,.81,1.07,-.30,.41,3.57,yellow);
    rounded(scene,4.01,.09,1.23,-.30,.864,3.57,white,.023);
    for(const x of [-1.7,-.81,.08,.99]){
      rounded(scene,.84,.58,.036,x,.47,4.115,aqua,.019);
      box(scene,.198,.029,.043,x,.63,4.144,steel);
    }
    box(scene,2.22,.81,.69,3.04,.41,7.28,aqua);
    rounded(scene,2.30,.055,.72,3.04,.839,7.28,white,.011);
    box(scene,.69,.86,3.25,-3.85,.43,5.15,aqua);
    rounded(scene,.76,.069,3.30,-3.85,.88,5.15,white,.014);
    box(scene,3.26,1.32,.052,-2.04,1.75,.039,steel);
    box(scene,3.20,1.26,.015,-2.04,1.75,.068,white);
    box(scene,3.23,.031,.12,-2.04,1.086,.100,steel);
    const glass=new THREE.MeshPhysicalMaterial({color:'#74d9ed',transparent:true,opacity:.35,roughness:.18,depthWrite:false});
    box(scene,.82,.035,.31,-.86,.925,3.73,steel);
    box(scene,.72,.55,.277,-.86,1.216,3.73,glass);
    box(scene,.668,.105,.238,-.86,1.002,3.73,blue);
    for(let i=0;i<5;i++)box(scene,.115,.01,.014,-1.145,1.009+i*.094,3.875,steel);
    for(const [x,r,h] of [[-1.80,.090,.31],[-1.49,.072,.243],[1.41,.092,.249]]){
      cylinder(scene,r,r*.78,h,x,.91+h/2,3.37,glass);
      cylinder(scene,r*.82,r*.73,h*.28,x,.91+h*.14,3.37,x>0?yellow:blue);
    }
    rod(scene,[.17,.91,3.24],[.17,1.22,3.24],.022,steel);
    rod(scene,[.17,1.22,3.24],[.17,1.22,3.38],.02,steel);
  }

  function broadcast(scene,shadow){
    const red=standard('#e45a53',.66),blue=standard('#577ecc',.72);
    const dark=standard('#263652',.69), white=standard('#f3f5fd',.65);
    for(const z of [1.18,2.02,3.32,4.23,5.12]){
      rounded(scene,.052,1.29,.70,3.86,1.75,z,blue,.018);
    }
    for(const x of [-2.97,-2.27,-1.56,-.85,-.14]){
      rounded(scene,.57,1.07,.033,x,1.84,.035,blue,.015);
    }
    shadow(4.52,1.8,-.38,1.87,.006,.70);
    rounded(scene,3.83,.078,1.23,-.37,.84,1.93,white,.031);
    for(const x of [-2.14,1.43])box(scene,.11,.82,1.03,x,.414,1.93,blue);
    const mixer=rounded(scene,1.38,.124,.57,-.61,.938,2.02,dark,.024);
    for(let i=0;i<7;i++){
      const x=mixer.position.x-.52+i*.17;
      box(scene,.022,.008,.21,x,1.003,2.10,white);
      rounded(scene,.085,.032,.053,x,1.022,2.03+(i%3)*.061,i%3===0?red:blue,.008);
    }
    for(const x of [-2.08,1.14]){
      rounded(scene,.31,.46,.237,x,1.103,1.49,dark,.016);
      const cone=cylinder(scene,.092,.092,.014,x,1.057,1.618,red);
      cone.rotation.x=Math.PI/2;
    }
    rod(scene,[-.63,.899,1.47],[-.02,1.43,1.77],.022,blue);
    rounded(scene,.122,.246,.114,-.02,1.507,1.78,dark,.04).rotation.z=-.27;
    rounded(scene,.55,.086,.53,-.25,.52,3.82,red,.04);
    rounded(scene,.53,.37,.067,-.25,.83,4.065,red,.046).rotation.x=.12;
    cylinder(scene,.041,.04,.48,-.25,.25,3.82,dark);
    cylinder(scene,.30,.32,.07,-.25,.055,3.82,blue);
    box(scene,.53,.79,2,-3.50,.395,4.65,white);
  }

  async function build(scene,room){
    const style=styles[room.kind], art=finishes(style);
    const cards=await Promise.all(room.clues.map(clueBoardArt));
    scene.add(new THREE.HemisphereLight('#fcfdff','#b2bbd0',2.14));
    const key=new THREE.DirectionalLight('#fff7e8',1.18);key.position.set(-2.6,3.5,5);scene.add(key);
    enclosure(scene,room,art,style.accent);
    const setDoor=entrance(scene,room,art);
    const lamp=new THREE.MeshBasicMaterial({color:'#ffffff'}), trim=standard('#c6d1dc',.69);
    for(const x of [-room.wall.width*.27,room.wall.width*.27]){
      for(const portion of [.27,.70]){
        box(scene,.31,.048,1.71,x,room.wall.height-.029,room.depth*portion,trim);
        box(scene,.267,.012,1.64,x,room.wall.height-.06,room.depth*portion,lamp);
      }
    }
    style.build(scene,groundShadow(scene));
    const holder=standard('#d1d5dc',.69);
    for(const [i,clue] of room.clues.entries()){
      if(clue.surface.width<.8){
        const [x,y,z]=clue.xyz,bottom=y-clue.surface.height/2;
        box(scene,clue.surface.width+.03,.035,.105,x,bottom+.013,z-.02,holder);
      }
      const card=patchPlane(scene,clue.surface.width,clue.surface.height,...clue.xyz,imageMap(cards[i]));
      card.rotation.y=clue.rotationY??0;
    }
    const lock=patchPlane(scene,room.lock.width,room.lock.height,...room.lock.center,imageMap(schoolLockArt(room,[])));
    document.getElementById('roomView').dataset.interior=room.kind;
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
