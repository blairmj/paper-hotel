'use strict';

const COMPUTER_INPUTS = {recordA:'111010010',recordB:'131232030',target:'525333525'};
const BALL_NAMES = {'🏀':'농구공','🎾':'테니스공','🏐':'배구공','🏈':'미식축구공'};

function schoolRoomDefinition(kind){
  if(kind==='art')return SchoolInterior.definition(kind);
  const entry=REVIEW_ROOMS.find(room=>room.kind===kind);
  const lock={center:[2.65,1.30,-8.10],width:1,height:.55};
  const front=(id,name,xyz,width,height)=>({
    id,name,xyz,surface:{width,height},approach:{x:xyz[0],z:-5.75}
  });
  const clues={
    art:[
      front('stamps','작업대 도장함',[-5.8,1.38,-8.10],1.65,.92),
      {id:'printOrder',name:'인쇄 순서 카드',xyz:[0,1.75,5.36],surface:{width:1.65,height:1},
        rotationY:Math.PI,approach:{x:0,z:2.85}}
    ],
    sports:[
      front('photo','운동회 사진',[-6.6,1.8,-8.10],1.8,1.08),
      {id:'ballOrder',name:'공 반납 순서',xyz:[9.43,1.65,0],surface:{width:1.7,height:1},
        rotationY:-Math.PI/2,approach:{x:7.1,z:0}}
    ],
    computer:[
      front('recordA','모니터 출력 기록',[-4.4,1.35,-8.10],1.18,.82),
      {id:'recordB',name:'뒤쪽 화면 점검 기록',xyz:[0,1.84,5.36],surface:{width:3.5,height:1.45},
        rotationY:Math.PI,approach:{x:0,z:2.85}}
    ]
  }[kind];
  return {
    ...entry,start:[0,1.55,1.1],wall:paintedRoom.wall,portal:paintedRoom.portal,door:paintedRoom.door,
    lock,obstacles:[],clues,
    targets:[{id:'lock',name:'문 잠금장치',xyz:lock.center,surface:lock,approach:{x:2.65,z:-5.75}},...clues],
    firstView:[0,1.2,-8.1],portraitView:[1.6,1.4,-8.1],
    stops:[[2.65,1.3,-8.1],[9.4,1.6,0],[0,1.6,5.3],[-9.4,1.6,0],clues[0].xyz]
  };
}

function ballDrawing(symbol){
  if(symbol==='🏈')return '<ellipse rx="29" ry="19" fill="#a66a3f" stroke="#5c3d2a" stroke-width="2"/><path d="M-14 0H14M-9-5V5M-3-5V5M3-5V5M9-5V5" stroke="#fff4d7" stroke-width="2.5"/>';
  const colors={'🏀':'#cf7d3e','🎾':'#b2c657','🏐':'#f3edd9'};
  let lines='<path d="M-27 0H27M0-27V27M-19-19Q7 0-19 19M19-19Q-7 0 19 19" stroke="#5a402e" stroke-width="2" fill="none"/>';
  if(symbol==='🎾')lines='<path d="M-19-19Q9 0-19 19M19-19Q-9 0 19 19" stroke="#fffce9" stroke-width="3" fill="none"/>';
  if(symbol==='🏐')lines='<path d="M0 0Q-15-18-6-26M0 0Q25-7 25 10M0 0Q-7 24-24 12M-6-26Q12-6 0 0M25 10Q3 13 0 0M-24 12Q-15-8 0 0" stroke="#45697b" stroke-width="5" fill="none"/>';
  return '<circle r="27" fill="'+colors[symbol]+'" stroke="#6b6757" stroke-width="1.5"/>'+lines;
}

function pixelDrawing(values,x,y,output=false){
  return [...values].map((value,i)=>{
    const cx=x+(i%3)*62,cy=y+Math.floor(i/3)*62;
    const on=output && Number(value)%2===1;
    return '<rect x="'+cx+'" y="'+cy+'" width="56" height="56" rx="3" fill="'+(output?(on?'#4d8d79':'#d8dfda'):'#fbfaf1')+'" stroke="#9caea4"/>'+
      (output?'':'<text x="'+(cx+28)+'" y="'+(cy+38)+'" text-anchor="middle" font-size="30" fill="#364b47">'+value+'</text>');
  }).join('');
}

function schoolClueSvg(id){
  let drawing='';
  if(id==='stamps'||id==='printOrder'){
    drawing='<rect x="34" y="65" width="532" height="240" rx="8" fill="#e1d2b5"/>';
    ['I','P','E'].forEach((letter,i)=>{
      const x=122+i*178,size=[46,72,98][i];
      drawing+='<rect x="'+(x-60)+'" y="110" width="120" height="155" rx="9" fill="#af8252" stroke="#89633c" stroke-width="3"/>'+
        '<text x="'+x+'" y="225" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="'+size+'" fill="#fff9e7">'+letter+'</text>';
      if(id==='printOrder'&&i<2)drawing+='<text x="'+(x+90)+'" y="210" text-anchor="middle" font-size="36" fill="#3e6153">→</text>';
    });
    if(id==='printOrder')drawing+='<text x="300" y="335" text-anchor="middle" font-size="22" fill="#3d554a">작은 도장 → 큰 도장</text>';
  }else if(id==='photo'){
    drawing='<rect x="24" y="48" width="552" height="290" fill="#e7e8d8"/>';
    sportsBalls.forEach((ball,i)=>{
      const x=78+(i%5)*110,y=104+Math.floor(i/5)*92;
      drawing+='<g transform="translate('+x+' '+y+')">'+ballDrawing(ball)+'</g>';
    });
  }else if(id==='ballOrder'){
    ['🏐','🏈','🎾','🏀'].forEach((ball,i)=>{
      drawing+='<g transform="translate('+(80+i*145)+' 175) scale(1.45)">'+ballDrawing(ball)+'</g>';
      if(i<3)drawing+='<text x="'+(150+i*145)+'" y="186" text-anchor="middle" font-size="30" fill="#4c6759">→</text>';
    });
  }else{
    const values=COMPUTER_INPUTS[id];
    drawing='<text x="120" y="70" text-anchor="middle" font-size="22" fill="#465c53">입력</text>'+
      '<text x="474" y="70" text-anchor="middle" font-size="22" fill="#465c53">출력</text>'+
      pixelDrawing(values,32,92)+'<text x="300" y="206" text-anchor="middle" font-size="42" fill="#4c6759">→</text>'+
      pixelDrawing(values,384,92,true);
    if(id==='recordB')drawing+='<text x="300" y="325" text-anchor="middle" font-size="22" fill="#465c53">5 → 켜짐　　4 → 꺼짐</text>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" role="img" aria-label="단서 그림" font-family="Malgun Gothic,Arial,sans-serif">'+drawing+'</svg>';
}

async function clueBoardArt(clue){
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=480;
  const g=canvas.getContext('2d');
  g.fillStyle='#907b5a';g.fillRect(0,0,720,480);
  g.fillStyle='#f6f4e8';g.fillRect(9,9,702,462);
  g.fillStyle='#346451';g.fillRect(32,8,40,42);
  g.font='600 30px Malgun Gothic,Arial,sans-serif';g.fillStyle='#3f5148';
  g.fillText(clue.name,38,72);
  const image=new Image();
  image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(schoolClueSvg(clue.id));
  await image.decode();g.drawImage(image,28,85,664,375);
  return canvas;
}

function schoolLockArt(room,values){
  const canvas=document.createElement('canvas');canvas.width=420;canvas.height=236;
  const g=canvas.getContext('2d');
  g.fillStyle='#506858';g.fillRect(0,0,420,236);
  g.strokeStyle='#c4af77';g.lineWidth=10;g.strokeRect(6,6,408,224);
  g.fillStyle='#efeee3';g.fillRect(30,48,360,140);
  if(room.kind==='computer'){
    for(let i=0;i<9;i++){
      g.fillStyle=values[i]?'#4d8d79':'#ccd5cc';
      g.fillRect(123+(i%3)*60,49+Math.floor(i/3)*47,52,40);
    }
  }else{
    g.fillStyle='#34493d';g.font=(room.kind==='art'?'52':'72')+'px Georgia,serif';
    g.textAlign='center';g.textBaseline='middle';g.fillText(values.join('')||'······',210,122);
  }
  return canvas;
}

async function buildSchoolRoom(scene,room){
  if(room.interior)return SchoolInterior.build(scene,room);
  const load=async url=>{const image=new Image();image.src=url;await image.decode();return image};
  const [front,back,left,right,door,corridor]=await Promise.all([
    ...['front','back','left','right'].map(wall=>load('rooms/'+room.kind+'/'+wall+'.webp')),
    load('rooms/music-art/door.webp'),studioImage('front')
  ]);
  const panel=(...args)=>placeRoomPanel(scene,...args);
  const {width,height,z}=room.wall,depth=5.4-z,mid=(5.4+z)/2;
  const setDoor=buildEntrance(scene,panel,front,door,room,corridor);
  panel(imageMap(back),width,height,[0,height/2,5.4]).rotation.y=Math.PI;
  panel(imageMap(left),depth,height,[-width/2,height/2,mid]).rotation.y=Math.PI/2;
  panel(imageMap(right),depth,height,[width/2,height/2,mid]).rotation.y=-Math.PI/2;
  panel(imageMap(studioFloor()),width+.02,depth+.01,[0,0,mid]).rotation.x=-Math.PI/2;
  panel(imageMap(studioCeiling()),width,depth,[0,height,mid]).rotation.x=Math.PI/2;
  for(const clue of room.clues){
    const art=await clueBoardArt(clue);
    panel(imageMap(art),clue.surface.width,clue.surface.height,clue.xyz).rotation.y=clue.rotationY||0;
  }
  const lock=panel(imageMap(schoolLockArt(room,[])),room.lock.width,room.lock.height,room.lock.center);
  return {
    setDoor,
    setDigits(values){lock.material.map.image=schoolLockArt(room,values);lock.material.map.needsUpdate=true}
  };
}
