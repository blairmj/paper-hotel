'use strict';

const COMPUTER_INPUTS = {recordA:'111010010',recordB:'131232030',target:'525333525'};
const BALL_NAMES = {'🏀':'농구공','🎾':'테니스공','🏐':'배구공','🏈':'미식축구공'};

function schoolRoomDefinition(kind){
  return (kind==='art' ? SchoolInterior : SportsComputerInteriors).definition(kind);
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
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=420;
  const g=canvas.getContext('2d');
  g.fillStyle='#aaaead';g.fillRect(0,0,720,420);
  g.fillStyle='#f1f1e9';g.fillRect(5,5,710,410);
  g.fillStyle='#39474c';g.fillRect(30,31,660,3);
  g.font='600 30px Malgun Gothic,Arial,sans-serif';g.fillStyle='#33444c';
  g.fillText(clue.name,34,70);
  const image=new Image();
  image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(schoolClueSvg(clue.id));
  await image.decode();g.drawImage(image,77,65,566,340);
  return canvas;
}

function schoolLockArt(room,values){
  const canvas=document.createElement('canvas');canvas.width=420;canvas.height=236;
  const g=canvas.getContext('2d');
  const frame=g.createLinearGradient(0,0,420,236);
  frame.addColorStop(0,'#78838d');frame.addColorStop(.46,'#45515c');frame.addColorStop(1,'#343b41');
  g.fillStyle=frame;g.fillRect(0,0,420,236);
  g.strokeStyle='#9aa4a7';g.lineWidth=4;g.strokeRect(5,5,410,226);
  for(const x of [22,398])for(const y of [23,213]){
    g.fillStyle='#b2b9ba';g.beginPath();g.arc(x,y,5,0,Math.PI*2);g.fill();
  }
  if(room.kind==='computer'){
    g.fillStyle='#29333d';g.fillRect(101,32,218,172);
    for(let i=0;i<9;i++){
      g.fillStyle=values[i]?'#73bea6':'#d3dbdf';
      g.fillRect(110+(i%3)*68,39+Math.floor(i/3)*54,64,49);
    }
  }else{
    g.font='86px Georgia,serif';g.textAlign='center';g.textBaseline='middle';
    for(let i=0;i<4;i++){
      g.fillStyle='#d6d7cb';g.fillRect(43+i*85,45,79,146);
      g.fillStyle='#29343a';g.fillText(values[i]??0,82+i*85,122);
    }
  }
  return canvas;
}

function buildSchoolRoom(scene,room){
  return (room.kind==='art' ? SchoolInterior : SportsComputerInteriors).build(scene,room);
}
