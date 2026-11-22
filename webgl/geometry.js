'use strict';

// Room meshes are triangulated on the CPU. Positions, normals and UVs can also be
// edited by the door, balance and instrument animations before the next draw.
(() => {
  const {Vector3}=School3D;
  const tau=2*Math.PI;
  class Float32BufferAttribute {
    constructor(values,size){
      this.array=values instanceof Float32Array?values:new Float32Array(values);
      this.itemSize=size;this.count=this.array.length/size;this.version=0;
    }
    getX(i){return this.array[i*this.itemSize]}
    getY(i){return this.array[i*this.itemSize+1]}
    getZ(i){return this.array[i*this.itemSize+2]}
    setXY(i,x,y){const k=i*this.itemSize;this.array[k]=x;this.array[k+1]=y;return this}
    setXYZ(i,x,y,z){this.setXY(i,x,y);this.array[i*this.itemSize+2]=z;return this}
    set needsUpdate(value){if(value)this.version++}
  }
  class BufferGeometry {
    constructor(){this.attributes={};this.index=null;this.groups=[];this.parameters={}}
    setAttribute(name,value){this.attributes[name]=value;return this}
    getAttribute(name){return this.attributes[name]}
    setIndex(indices){
      this.index=indices.some(i=>i>65535)?new Uint32Array(indices):new Uint16Array(indices);
      return this;
    }
    get bounds(){
      const p=this.attributes.position;
      if(this._boundSource!==p||this._boundVersion!==p.version){
        const a=p.array,b=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
        for(let i=0;i<a.length;i+=3)for(let j=0;j<3;j++){
          b[j]=Math.min(b[j],a[i+j]);b[j+3]=Math.max(b[j+3],a[i+j]);
        }
        this._bounds=b;this._boundSource=p;this._boundVersion=p.version;
      }
      return this._bounds;
    }
    translate(x,y,z){
      const p=this.attributes.position;
      for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);
      p.needsUpdate=true;return this;
    }
    computeVertexNormals(){
      const p=this.attributes.position.array,n=new Float32Array(p.length);
      const index=this.index,count=index?index.length:p.length/3;
      for(let i=0;i<count;i+=3){
        const a=3*(index?index[i]:i),b=3*(index?index[i+1]:i+1),c=3*(index?index[i+2]:i+2);
        const bx=p[b]-p[a],by=p[b+1]-p[a+1],bz=p[b+2]-p[a+2];
        const cx=p[c]-p[a],cy=p[c+1]-p[a+1],cz=p[c+2]-p[a+2];
        const nx=by*cz-bz*cy,ny=bz*cx-bx*cz,nz=bx*cy-by*cx;
        for(const k of [a,b,c]){n[k]+=nx;n[k+1]+=ny;n[k+2]+=nz}
      }
      for(let i=0;i<n.length;i+=3){
        const length=Math.hypot(n[i],n[i+1],n[i+2])||1;
        n[i]/=length;n[i+1]/=length;n[i+2]/=length;
      }
      return this.setAttribute('normal',new Float32BufferAttribute(n,3));
    }
    fill(p,n,uv,indices){
      this.setAttribute('position',new Float32BufferAttribute(p,3));
      this.setAttribute('uv',new Float32BufferAttribute(uv,2));
      if(indices)this.setIndex(indices);
      if(n)this.setAttribute('normal',new Float32BufferAttribute(n,3));
      else this.computeVertexNormals();
      return this;
    }
    dispose(){this.release?.()}
  }
  class PlaneGeometry extends BufferGeometry {
    constructor(w=1,h=1){
      super();this.parameters={width:w,height:h};
      this.fill([-w/2,h/2,0,-w/2,-h/2,0,w/2,-h/2,0,w/2,h/2,0],
        [0,0,1,0,0,1,0,0,1,0,0,1],[0,1,0,0,1,0,1,1],[0,1,2,0,2,3]);
    }
  }
  class BoxGeometry extends BufferGeometry {
    constructor(w=1,h=1,d=1){
      super();const p=[],n=[],uv=[],indices=[];
      const face=(u,v,axis,du,dv,width,height,depth)=>{
        const base=p.length/3,start=indices.length;
        for(const [i,j] of [[0,0],[0,1],[1,1],[1,0]]){
          const vertex=[0,0,0],normal=[0,0,0];
          vertex[u]=(i-.5)*du*width;vertex[v]=(j-.5)*dv*height;vertex[axis]=depth/2;
          normal[axis]=Math.sign(depth);p.push(...vertex);n.push(...normal);uv.push(i,1-j);
        }
        indices.push(base,base+1,base+3,base+1,base+2,base+3);
        this.groups.push({start,count:6,materialIndex:this.groups.length});
      };
      face(2,1,0,-1,-1,d,h,w);face(2,1,0,1,-1,d,h,-w);
      face(0,2,1,1,1,w,d,h);face(0,2,1,1,-1,w,d,-h);
      face(0,1,2,1,-1,w,h,d);face(0,1,2,-1,-1,w,h,-d);
      this.fill(p,n,uv,indices);
    }
  }
  function gridIndices(columns,rows,reverse=false){
    const indices=[];
    for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
      const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;
      if(reverse)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);
    }
    return indices;
  }
  class CylinderGeometry extends BufferGeometry {
    constructor(top=1,bottom=1,height=1,sides=16){
      super();const p=[],n=[],uv=[],index=gridIndices(sides,1,true);
      const slope=(bottom-top)/height,length=Math.hypot(1,slope);
      for(let row=0;row<2;row++)for(let i=0;i<=sides;i++){
        const s=Math.sin(tau*i/sides),c=Math.cos(tau*i/sides),r=row?bottom:top;
        p.push(r*s,(.5-row)*height,r*c);n.push(s/length,slope/length,c/length);uv.push(i/sides,1-row);
      }
      this.groups.push({start:0,count:index.length,materialIndex:0});
      for(const sign of [1,-1]){
        const r=sign>0?top:bottom;if(!r)continue;
        const center=p.length/3,start=index.length,y=sign*height/2;
        p.push(0,y,0);n.push(0,sign,0);uv.push(.5,.5);
        for(let i=0;i<=sides;i++){
          const s=Math.sin(tau*i/sides),c=Math.cos(tau*i/sides);
          p.push(r*s,y,r*c);n.push(0,sign,0);uv.push(.5+.5*s,.5+.5*sign*c);
          if(i>0)index.push(center,center+i+(sign<0?1:0),center+i+(sign>0?1:0));
        }
        this.groups.push({start,count:index.length-start,materialIndex:sign>0?1:2});
      }
      this.fill(p,n,uv,index);
    }
  }
  class SphereGeometry extends BufferGeometry {
    constructor(radius=1,width=24,height=16){
      super();const p=[],n=[],uv=[];
      for(let j=0;j<=height;j++)for(let i=0;i<=width;i++){
        const u=i/width,v=j/height,theta=Math.PI*v;
        const x=-Math.cos(tau*u)*Math.sin(theta),y=Math.cos(theta),z=Math.sin(tau*u)*Math.sin(theta);
        n.push(x,y,z);p.push(radius*x,radius*y,radius*z);uv.push(u,1-v);
      }
      this.fill(p,n,uv,gridIndices(width,height,true));
    }
  }
  class CircleGeometry extends BufferGeometry {
    constructor(radius=1,sides=32){
      super();const p=[0,0,0],n=[0,0,1],uv=[.5,.5],index=[];
      for(let i=0;i<=sides;i++){
        const x=Math.cos(i*tau/sides),y=Math.sin(i*tau/sides);
        p.push(x*radius,y*radius,0);n.push(0,0,1);uv.push(.5+x/2,.5+y/2);
        if(i)index.push(0,i,i+1);
      }
      this.fill(p,n,uv,index);
    }
  }
  class TorusGeometry extends BufferGeometry {
    constructor(radius=1,tube=.1,radial=8,along=32,arc=tau){
      super();const p=[],n=[],uv=[];
      for(let j=0;j<=radial;j++)for(let i=0;i<=along;i++){
        const a=i*arc/along,b=j*tau/radial,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
        n.push(ca*cb,sa*cb,sb);p.push((radius+tube*cb)*ca,(radius+tube*cb)*sa,tube*sb);uv.push(i/along,j/radial);
      }
      this.fill(p,n,uv,gridIndices(along,radial));
    }
  }
  class IcosahedronGeometry extends BufferGeometry {
    constructor(radius=1,detail=0){
      super();const t=(1+Math.sqrt(5))/2;
      const vertices=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
      const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
      const p=[],n=[],uv=[];
      function tri(a,b,c,level){
        if(level){
          const middle=(u,v)=>u.map((x,i)=>(x+v[i])/2);
          const ab=middle(a,b),bc=middle(b,c),ca=middle(c,a);
          for(const f of [[a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]])tri(...f,level-1);
        }else for(const vertex of [a,b,c]){
          const v=vertex.map(x=>x/Math.hypot(...vertex));
          n.push(...v);p.push(...v.map(x=>radius*x));uv.push(.5+Math.atan2(v[2],v[0])/tau,.5+Math.asin(v[1])/Math.PI);
        }
      }
      for(const f of faces)tri(...f.map(i=>vertices[i]),detail);
      this.fill(p,detail?n:null,uv);
    }
  }
  class CatmullRomCurve3 {
    constructor(points){this.points=points}
    sample(t){
      const points=this.points,s=Math.min(1,Math.max(0,t))*(points.length-1),i=Math.min(points.length-2,Math.floor(s)),u=s-i;
      const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
      const coord=k=>.5*(2*b[k]+(-a[k]+c[k])*u+(2*a[k]-5*b[k]+4*c[k]-d[k])*u*u+(-a[k]+3*b[k]-3*c[k]+d[k])*u*u*u);
      return new Vector3(coord('x'),coord('y'),coord('z'));
    }
  }
  class TubeGeometry extends BufferGeometry {
    constructor(curve,segments,radius,sides){
      super();const p=[],n=[],uv=[];let oldNormal;
      for(let j=0;j<=segments;j++){
        const t=j/segments,center=curve.sample(t),tangent=curve.sample(t+.0001).sub(curve.sample(t-.0001)).normalize();
        const seed=oldNormal??(Math.abs(tangent.y)<.9?new Vector3(0,1,0):new Vector3(1,0,0));
        const normal=seed.clone().sub(tangent.clone().multiplyScalar(tangent.dot(seed))).normalize(),binormal=tangent.clone().cross(normal);
        for(let i=0;i<=sides;i++){
          const a=tau*i/sides,v=normal.clone().multiplyScalar(Math.cos(a)).add(binormal.clone().multiplyScalar(Math.sin(a)));
          n.push(...v);p.push(...v.multiplyScalar(radius).add(center));uv.push(t,i/sides);
        }
        oldNormal=normal;
      }
      this.fill(p,n,uv,gridIndices(sides,segments));
    }
  }
  class Path {
    constructor(){this.commands=[]}
    moveTo(x,y){this.commands.push(['move',x,y]);return this}
    lineTo(x,y){this.commands.push(['line',x,y]);return this}
    quadraticCurveTo(cx,cy,x,y){this.commands.push(['quad',cx,cy,x,y]);return this}
    absarc(x,y,r,a,b,cw){return this.absellipse(x,y,r,r,a,b,cw)}
    absellipse(x,y,rx,ry,a,b,cw){this.commands.push(['ellipse',x,y,rx,ry,a,b,cw]);return this}
    closePath(){return this}
    contour(resolution){
      const points=[];
      function add(x,y){const last=points.at(-1);if(!last||Math.hypot(x-last[0],y-last[1])>1e-8)points.push([x,y])}
      for(const [op,...v] of this.commands){
        if(op==='quad'){
          const [sx,sy]=points.at(-1),[cx,cy,x,y]=v;
          for(let i=1;i<=resolution;i++){
            const t=i/resolution,k=1-t;add(k*k*sx+2*k*t*cx+t*t*x,k*k*sy+2*k*t*cy+t*t*y);
          }
        }else if(op==='ellipse'){
          const [x,y,rx,ry,a,b,cw]=v;
          let sweep=(b-a)%tau;if(cw&&sweep>=0)sweep-=tau;if(!cw&&sweep<=0)sweep+=tau;
          const steps=Math.max(4,Math.ceil(2*resolution*Math.abs(sweep)/tau));
          for(let i=0;i<=steps;i++){const angle=a+sweep*i/steps;add(x+rx*Math.cos(angle),y+ry*Math.sin(angle))}
        }else add(v[0],v[1]);
      }
      if(points.length>1&&Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<1e-8)points.pop();
      return points;
    }
  }
  class Shape extends Path {constructor(){super();this.holes=[]}}
  class ExtrudeGeometry extends BufferGeometry {
    constructor(shape,options={}){
      super();const {depth=1,curveSegments=10,bevelEnabled=false,bevelSize=.02,bevelThickness=.02,bevelSegments=1}=options;
      const rings=[shape,...shape.holes].map((path,index)=>{
        const pts=path.contour(curveSegments);
        const area=pts.reduce((a,[x,y],i)=>{const q=pts[(i+1)%pts.length];return a+x*q[1]-y*q[0]},0);
        if((area>0)!==(index===0))pts.reverse();
        return pts;
      });
      const verts=rings.flat(),holes=[];let off=rings[0].length;
      for(const ring of rings.slice(1)){holes.push(off);off+=ring.length}
      const triangles=earcut(verts.flat(),holes,2),p=[],uv=[];
      function emit(a,b,c){p.push(...a,...b,...c);for(const v of [a,b,c])uv.push(v[0],v[1])}
      const bevel=bevelEnabled&&bevelSegments>0;
      for(let i=0;i<triangles.length;i+=3){
        const [a,b,c]=triangles.slice(i,i+3).map(k=>verts[k]);
        const low=bevel?-bevelThickness:0,high=bevel?depth+bevelThickness:depth;
        emit([...a,high],[...b,high],[...c,high]);emit([...c,low],[...b,low],[...a,low]);
      }
      const caps=p.length/3;this.groups.push({start:0,count:caps,materialIndex:0});
      const profile=[];
      if(bevel){
        for(let i=0;i<=bevelSegments;i++){const angle=i*Math.PI/(2*bevelSegments);profile.push([-bevelThickness*Math.cos(angle),bevelSize*Math.sin(angle)])}
        for(let i=0;i<=bevelSegments;i++){const angle=i*Math.PI/(2*bevelSegments);profile.push([depth+bevelThickness*Math.sin(angle),bevelSize*Math.cos(angle)])}
      }else profile.push([0,0],[depth,0]);
      for(const ring of rings){
        const offsets=ring.map(([x,y],i)=>{
          const a=ring[(i+ring.length-1)%ring.length],b=ring[(i+1)%ring.length];
          const la=Math.hypot(x-a[0],y-a[1])||1,lb=Math.hypot(b[0]-x,b[1]-y)||1;
          const ax=(y-a[1])/la,ay=(a[0]-x)/la,bx=(b[1]-y)/lb,by=(x-b[0])/lb;
          const scale=1/Math.max(.4,1+ax*bx+ay*by);return [(ax+bx)*scale,(ay+by)*scale];
        });
        const layers=profile.map(([z,k])=>ring.map(([x,y],i)=>[x+k*offsets[i][0],y+k*offsets[i][1],z]));
        for(let j=1;j<layers.length;j++)for(let i=0;i<ring.length;i++){
          const next=(i+1)%ring.length,low=layers[j-1],high=layers[j];
          emit(low[i],low[next],high[next]);emit(low[i],high[next],high[i]);
        }
      }
      this.groups.push({start:caps,count:p.length/3-caps,materialIndex:1});
      this.fill(p,null,uv);
    }
  }
  Object.assign(School3D,{Float32BufferAttribute,BufferGeometry,PlaneGeometry,BoxGeometry,CylinderGeometry,SphereGeometry,
    CircleGeometry,TorusGeometry,IcosahedronGeometry,CatmullRomCurve3,TubeGeometry,Path,Shape,ExtrudeGeometry});
})();
