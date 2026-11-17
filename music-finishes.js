'use strict';

// The four photographs in this atlas are oak, plaster, woven felt and maple boards.
let studioSwatches;
async function loadStudioFinishes(){
  if(!studioSwatches){
    studioSwatches=Promise.all(['studio-finishes','studio-reflection'].map(async name=>{
      const img=new Image();
      img.src='rooms/'+name+'.webp';
      await img.decode();
      return img;
    }));
  }
  return studioSwatches;
}

function makeStudioFinishes([atlas,reflection],scene){
  const textures=new Map();
  function swatch(quadrant,repeatX=1,repeatY=1){
    const key=[quadrant,repeatX,repeatY].join(',');
    if(textures.has(key))return textures.get(key);
    const tile=document.createElement('canvas');tile.width=tile.height=512;
    const g=tile.getContext('2d'),w=atlas.naturalWidth/2,h=atlas.naturalHeight/2;
    g.filter=quadrant===3?'saturate(.46) brightness(.99)':quadrant===0?'saturate(.58)':'saturate(.75)';
    g.drawImage(atlas,(quadrant%2)*w+2,Math.floor(quadrant/2)*h+2,w-4,h-4,0,0,512,512);
    const t=new THREE.CanvasTexture(tile);
    t.colorSpace=THREE.SRGBColorSpace;
    t.wrapS=t.wrapT=THREE.MirroredRepeatWrapping;t.repeat.set(repeatX,repeatY);t.anisotropy=8;
    textures.set(key,t);return t;
  }
  const material=(map,color,roughness,metalness=0)=>new THREE.MeshStandardMaterial({map,color,roughness,metalness});
  const environment=new THREE.Texture(reflection);
  environment.mapping=THREE.EquirectangularReflectionMapping;environment.colorSpace=THREE.SRGBColorSpace;
  environment.needsUpdate=true;scene.environment=environment;
  return {
    wood:material(swatch(0,1,1),0xf4e2c6,.36),
    piano:material(swatch(0,1,1),0xddbb96,.29),
    trim:material(swatch(0,1,.45),0xc5b49b,.46),
    plaster:material(swatch(1,6,2),0xfffcf6,.96),
    felt:material(swatch(2,3,4),0xc8d5ca,.95),
    sage:material(swatch(1,5,2),0xb4c2b0,.83),
    door:material(swatch(0,.45,3),0xd0b17b,.41),
    floor:material(swatch(3,4,8),0xf0e7d8,.52),
    steel:material(null,0x747c7b,.27,.77),
    darkMetal:material(null,0x333d3d,.38,.58),
    brass:material(null,0xc09d5b,.30,.65)
  };
}

function studioRod(parent,start,end,radius,finish){
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),delta=b.sub(a);
  const cylinder=geometry('studioRod',()=>new THREE.CylinderGeometry(1,1,1,12));
  const part=mesh(parent,cylinder,finish,a.x+delta.x/2,a.y+delta.y/2,a.z+delta.z/2);
  part.scale.set(radius,delta.length(),radius);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  return part;
}

function studioPanelShape(width,height,radius){
  const shape=new THREE.Shape(),l=-width/2,r=width/2,b=-height/2,t=height/2;
  shape.moveTo(l+radius,b);shape.lineTo(r-radius,b);shape.quadraticCurveTo(r,b,r,b+radius);
  shape.lineTo(r,t-radius);shape.quadraticCurveTo(r,t,r-radius,t);shape.lineTo(l+radius,t);
  shape.quadraticCurveTo(l,t,l,t-radius);shape.lineTo(l,b+radius);shape.quadraticCurveTo(l,b,l+radius,b);
  return shape;
}

function studioPly(parent,back,finish){
  const w=.48,h=back ? .29 : .43;
  const geom=geometry(back?'studioSeatBack':'studioSeatPan',()=>{
    const shape=studioPanelShape(w,h,.045);
    if(back){
      const handle=new THREE.Path();handle.absellipse(0,.083,.058,.012,0,Math.PI*2,true,0);
      shape.holes.push(handle);
    }
    const g=new THREE.ExtrudeGeometry(shape,{depth:.017,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:3,curveSegments:10});
    // Bend the plywood across its grain. Split wide faces first so the handle and
    // outer bevel follow the same continuous curve as the middle of the panel.
    const source=g.attributes.position,normals=g.attributes.normal;
    const vertices=[],lighting=[],uvs=[];
    function clip(poly,x,keepRight){
      const output=[];
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length];
        const inA=keepRight?a[0]>=x:a[0]<=x,inB=keepRight?b[0]>=x:b[0]<=x;
        if(inA)output.push(a);
        if(inA!==inB){
          const t=(x-a[0])/(b[0]-a[0]);
          output.push(a.map((value,n)=>value+t*(b[n]-value)));
        }
      }
      return output;
    }
    function vertex([x,y,z,nx,ny,nz]){
      const coefficient=back ? -.57 : .28;
      const adjustedX=nx-2*coefficient*x*nz,length=Math.hypot(adjustedX,ny,nz)||1;
      vertices.push(x,y,z+coefficient*x*x+(back ? .026 : 0));
      lighting.push(adjustedX/length,ny/length,nz/length);uvs.push(x/w+.5,y/h+.5);
    }
    for(let i=0;i<source.count;i+=3){
      const tri=[i,i+1,i+2].map(n=>[source.getX(n),source.getY(n),source.getZ(n),normals.getX(n),normals.getY(n),normals.getZ(n)]);
      const low=Math.floor(Math.min(...tri.map(v=>v[0]))/.04),high=Math.floor(Math.max(...tri.map(v=>v[0]))/.04);
      for(let band=low;band<=high;band++){
        const poly=clip(clip(tri,band*.04,true),(band+1)*.04,false);
        for(let k=1;k<poly.length-1;k++){vertex(poly[0]);vertex(poly[k]);vertex(poly[k+1])}
      }
    }
    const curved=new THREE.BufferGeometry();
    curved.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    curved.setAttribute('normal',new THREE.Float32BufferAttribute(lighting,3));
    curved.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.dispose();
    return curved;
  });
  const part=mesh(parent,geom,finish,0,back ? .72 : .43,back ? .207 : 0);
  part.rotation.x=back ? .15 : -Math.PI/2+.025;
}

function studioStandTray(parent,finish){
  const geom=geometry('studioStandTray',()=>{
    const shape=studioPanelShape(.45,.29,.016);
    for(const y of [-.065,0,.065])for(const x of [-.155,-.077,0,.077,.155]){
      const hole=new THREE.Path();hole.absellipse(x,y,.021,.011,0,Math.PI*2,true,0);
      shape.holes.push(hole);
    }
    return new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,curveSegments:6});
  });
  mesh(parent,geom,finish,0,0,0);
}

// Two printed pages share a shallow V-shaped music rack so the centre fold catches light.
function studioScore(parent,x,y,z,width,height){
  const book=group(parent,x,y,z);
  for(const side of [-1,1]){
    const leaf=group(book,side*width*.245,0,0);leaf.rotation.y=side*.09;
    print(leaf,0,0,.005,width*.495,height,(c,W,H)=>{
      const page=c.createLinearGradient(0,0,W,0);
      page.addColorStop(0,side>0?'#c7bfae':'#f8f6ec');
      page.addColorStop(.12,'#f8f6ea');page.addColorStop(.87,'#fbf9ef');
      page.addColorStop(1,side<0?'#cdc5b5':'#f5f4ec');c.fillStyle=page;c.fillRect(0,0,W,H);
      c.strokeStyle='#4a4844';c.fillStyle='#383934';c.lineWidth=W*.003;
      for(let system=0;system<5;system++){
        const top=H*(.12+system*.164),space=H*.014;
        for(let l=0;l<5;l++){const v=top+l*space;c.beginPath();c.moveTo(W*.09,v);c.lineTo(W*.92,v);c.stroke()}
        for(let n=0;n<9;n++){
          const xx=W*(.135+n*.088),yy=top+space*(.5+(n*3+system+(side+1))%7*.5);
          c.beginPath();c.ellipse(xx,yy,W*.012,space*.48,-.32,0,Math.PI*2);c.fill();c.fillRect(xx+W*.009,yy-space*2.9,W*.004,space*2.85);
        }
        for(const xx of [.09,.505,.92])c.fillRect(W*xx,top,W*.003,4*space);
      }
    },width*.495/height);
  }
}
