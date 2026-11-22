'use strict';

// The oblique rear view is taken from the original chair illustration.
// The other views show the same rounded seat as the player walks around it.
async function studioSeats(scene, panel) {
  const names=['original','back','side','front-angle','front'];
  const images=await Promise.all(names.map(name=>studioImage('chair-'+name)));
  const maps=images.map(imageMap);
  const seats=[];
  const shade=document.createElement('canvas');shade.width=shade.height=96;
  const ctx=shade.getContext('2d'),grad=ctx.createRadialGradient(48,48,1,48,48,47);
  grad.addColorStop(0,'rgba(43,39,36,.29)');grad.addColorStop(.52,'rgba(43,39,36,.13)');grad.addColorStop(1,'rgba(43,39,36,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,96,96);
  const shading=imageMap(shade);
  function shadow(x,z,w,h){
    const mat=panel(shading,w,h,[x,.006,z],true);mat.rotation.x=-Math.PI/2;
    mat.material.depthWrite=false;mat.material.alphaTest=.002;mat.renderOrder=-1;
  }
  const tripod=document.createElement('canvas');tripod.width=250;tripod.height=435;
  const g=tripod.getContext('2d');
  function stroke(points,width,color){g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke()}
  for(const [x,y] of [[43,417],[204,413],[128,425]]){
    stroke([[124,333],[x,y]],6,'#403b35');stroke([[123,333],[x,y-1]],2,'#686156');
  }
  stroke([[124,351],[124,123]],8,'#35312d');stroke([[122,336],[122,126]],2,'#8f897e');
  const steel=g.createLinearGradient(0,12,40,164);steel.addColorStop(0,'#68645d');steel.addColorStop(.5,'#514c46');steel.addColorStop(1,'#423d38');
  g.fillStyle=steel;g.beginPath();g.roundRect(11,10,228,150,12);g.fill();
  g.globalCompositeOperation='destination-out';
  for(let row=0;row<3;row++)for(let col=0;col<7;col++){g.beginPath();g.ellipse(37+29.3*col,38+40*row,5.4,7.5,-.13,0,Math.PI*2);g.fill()}
  g.globalCompositeOperation='source-over';stroke([[13,158],[239,158]],6,'#3b3731');
  const standMap=imageMap(tripod);
  for(const side of [-1,1]){
    for(const [x,z,angle] of [[2.02,-2.50,.23],[2.86,-2.96,.32],[3.54,-3.52,.43],[1.76,-3.86,.18],[2.55,-4.26,.36],[3.26,-4.44,.4]]){
      const px=x*side,h=.92;
      const mesh=panel(maps[0],1,h,[px,h/2,z],true);
      seats.push({mesh,angle:angle*side,h});
      shadow(px,z,.87,.72);
    }
    for(const [x,z] of [[1.56,-3.40],[3.06,-4.68]]){
      const mesh=panel(standMap,.66,1.17,[x*side,.585,z],true);
      mesh.rotation.y=side*.30;shadow(x*side,z,.60,.53);
    }
  }
  return function updateSeatViews(eye){
    for(const seat of seats){
      const p=seat.mesh.position,heading=Math.atan2(eye.x-p.x,eye.z-p.z);
      const relative=School3D.MathUtils.euclideanModulo(heading-seat.angle+Math.PI,Math.PI*2)-Math.PI;
      const degrees=Math.abs(relative)*180/Math.PI;
      const index=degrees<12?1:degrees<74?0:degrees<102?2:degrees<158?3:4;
      seat.mesh.material.map=maps[index];seat.mesh.rotation.y=heading;
      const sign=(index===0?relative<0:relative>0)?-1:1;
      seat.mesh.scale.x=sign*seat.h*(images[index].width/images[index].height);
    }
  };
}
