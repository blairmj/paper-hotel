'use strict';

// The corridor is rendered beyond the real door frame, in the door's local coordinates.
function buildSchoolCorridor(parent,x,hinge,leafWidth){
  const {box,flat,patchPlane,standard}=SchoolInterior;
  const corridor=new THREE.Group();
  corridor.name='학교 복도';
  corridor.position.x=x;
  corridor.visible=false;
  parent.add(corridor);
  const width=3.64,length=11.6,height=2.92,bays=4;
  const half=width/2;
  const plaster=standard('#ebe5d8'),base=standard('#aebed0'),wood=standard('#b68e64');
  const rail=standard('#887768'),frame=standard('#dfded5'),trim=standard('#758594');
  const lamp=new THREE.MeshBasicMaterial({color:'#fff8e3'});

  const floor=InteriorArtwork.canvasMap(448,1408,(g,w,h)=>{
    const shade=g.createLinearGradient(0,0,w,0);
    shade.addColorStop(0,'#a39e96');shade.addColorStop(.39,'#c0bbb0');shade.addColorStop(1,'#b0ada6');
    g.fillStyle=shade;g.fillRect(0,0,w,h);
    // Each pair of panes projects a patch of sun. The gaps are the mullion shadows.
    const bay=h/bays;
    g.save();g.transform(1,-.38,0,1,0,0);g.filter='blur(2px)';
    for(let i=0;i<=bays;i++){
      for(const offset of [.07,.516]){
        const y=(i+offset)*bay;
        g.fillStyle='#f2e0bd';g.fillRect(w*.19,y,w*.39,bay*.418);
        g.fillStyle='#edddbf';g.fillRect(w*.60,y,w*.37,bay*.418);
      }
    }
    g.restore();
    g.fillStyle='#918b8147';
    for(let i=0;i<12500;i++)g.fillRect((i*117.73)%w,(i*179.39)%h,1.15,1);
    g.strokeStyle='#7b797555';g.lineWidth=1.1;g.beginPath();
    for(let xx=0;xx<w;xx+=w/6){g.moveTo(xx,0);g.lineTo(xx,h)}
    for(let yy=h;yy>0;yy-=h/19){g.moveTo(0,yy);g.lineTo(w,yy)}
    g.stroke();
  });
  flat(corridor,width,length+.04,0,-.001,-length/2,floor);
  box(corridor,width+.14,.10,length,0,height+.05,-length/2,plaster);
  for(let i=0;i<bays;i++){
    const z=-(i+.45)*length/bays;
    box(corridor,.32,.042,1.28,-.06,height-.021,z,trim);
    box(corridor,.275,.012,1.22,-.06,height-.048,z,lamp);
  }

  const outside=InteriorArtwork.canvasMap(1024,240,(g,w,h)=>{
    const sky=g.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#a6d3e7');sky.addColorStop(.66,'#ecf4eb');sky.addColorStop(1,'#c0ceac');
    g.fillStyle=sky;g.fillRect(0,0,w,h);
    g.fillStyle='#ddd2be';g.fillRect(74,150,543,90);
    for(let row=0;row<2;row++)for(let i=0;i<12;i++){
      g.fillStyle='#8da8b4';g.fillRect(90+i*44,159+row*34,29,17);
    }
    for(let i=0;i<48;i++){
      const px=(i*113)%w,y=h-15+22*Math.sin(i*1.8),r=18+12*(1+Math.cos(i*.9));
      g.fillStyle=['#94ad8a','#b0c396','#7f9e81'][i%3];
      g.beginPath();g.arc(px,y,r,0,Math.PI*2);g.fill();
    }
  });
  function windowWall(sideX,z,angle,span,panes){
    const wall=new THREE.Group();wall.position.set(sideX,0,z);wall.rotation.y=angle;corridor.add(wall);
    const sill=.90,head=2.48,glassHeight=head-sill;
    box(wall,span,sill,.13,0,sill/2,-.065,base);
    box(wall,span,height-head,.13,0,(head+height)/2,-.065,plaster);
    patchPlane(wall,span+.12,glassHeight+.12,0,(head+sill)/2,-.18,outside);
    box(wall,span,.068,.15,0,sill,.02,wood);
    box(wall,span,.045,.065,0,head,.009,frame);
    box(wall,span,.038,.044,0,sill+glassHeight*.62,.012,frame);
    box(wall,span,.09,.025,0,.045,.014,trim);
    for(let i=0;i<=panes;i++){
      const wide=i%2===0;
      box(wall,wide?.092:.038,glassHeight,.095,-span/2+i*span/panes,(head+sill)/2,0,frame);
    }
  }
  windowWall(-half,-length/2,Math.PI/2,length,bays*2);
  windowWall(0,-length,0,width,4);

  const inner=new THREE.Group();inner.position.set(half,0,-length/2);inner.rotation.y=-Math.PI/2;
  corridor.add(inner);
  box(inner,length,height,.13,0,height/2,-.07,plaster);
  box(inner,length,.92,.04,0,.46,.005,base);
  box(inner,length,.06,.075,0,.93,.028,wood);
  box(inner,length,.092,.05,0,.046,.022,trim);
  const leaf=standard('#cfac83'),glazing=standard('#879eaa',.42),paper=standard('#f5eddc');
  for(let i=0;i<3;i++){
    const along=length/2-1.86-i*3.69;
    box(inner,1.15,2.19,.094,along,1.095,.055,rail);
    box(inner,1.025,2.09,.052,along,1.045,.119,leaf);
    box(inner,.73,.59,.018,along,1.56,.155,frame);
    box(inner,.659,.519,.019,along,1.56,.168,glazing);
    box(inner,.175,.034,.067,along-.356,1.02,.178,trim);
    const sign=InteriorArtwork.canvasMap(150,73,(g,w,h)=>{
      g.fillStyle='#385773';g.fillRect(0,0,w,h);g.fillStyle='#f5f4ea';
      g.textAlign='center';g.textBaseline='middle';g.font='bold 40px Arial';g.fillText('3–'+(i+1),w/2,h/2+1);
    });
    patchPlane(inner,.35,.17,along,2.34,.075,sign);
    box(inner,.83,.53,.061,along-1.30,1.50,.055,wood);
    box(inner,.76,.46,.025,along-1.30,1.50,.094,base);
    for(const offset of [-.16,.13])box(inner,.22,.29,.009,along-1.30+offset,1.51,.111,paper);
  }
  box(corridor,1.28,.10,.39,-.60,.45,-length+.32,wood);
  for(const dx of [-.47,.47])box(corridor,.08,.41,.32,-.60+dx,.205,-length+.32,trim);

  // Soft-edged sunlight and the leaf's projected shadow reach across the actual classroom floor.
  const feather=InteriorArtwork.canvasMap(128,128,(g,w,h)=>{
    for(let i=0;i<12;i++){
      g.fillStyle='rgba(255,255,255,.18)';
      g.fillRect(i,i,w-2*i,h-2*i);
    }
  });
  function projection(color,y,order){
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(12),3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
    geometry.setIndex([0,1,2,0,2,3]);
    const material=new THREE.MeshBasicMaterial({map:feather,color,transparent:true,depthWrite:false,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material);mesh.position.y=y;mesh.renderOrder=order;
    mesh.frustumCulled=false;corridor.add(mesh);
    return (x1,z1,x2,z2,dx,dz,opacity)=>{
      const positions=geometry.getAttribute('position');
      positions.setXYZ(0,x1,0,z1);positions.setXYZ(1,x2,0,z2);
      positions.setXYZ(2,x2+dx,0,z2+dz);positions.setXYZ(3,x1+dx,0,z1+dz);
      positions.needsUpdate=true;material.opacity=opacity;
    };
  }
  const sun=projection('#ffe8b5',.010,3),shadow=projection('#443c46',.014,4);
  const hingeX=hinge.position.x-x,hingeZ=hinge.position.z;
  return amount=>{
    corridor.visible=amount>0;
    if(!corridor.visible)return;
    const angle=hinge.rotation.y;
    const latchX=hingeX-leafWidth*Math.cos(angle),latchZ=hingeZ+leafWidth*Math.sin(angle);
    sun(hingeX-leafWidth,.01,latchX,.01,.72,1.68,.42*amount);
    shadow(latchX,latchZ,hingeX,hingeZ,.72,1.68,.29*amount);
  };
}
