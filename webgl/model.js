'use strict';

// CPU-side room data. Only renderer.js owns a WebGL context.
const School3D = (() => {
  const {mat4,mat3,quat,vec3}=glMatrix;
  const MathUtils={
    clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t,
    degToRad:x=>x*Math.PI/180,radToDeg:x=>x*180/Math.PI,
    euclideanModulo:(x,n)=>((x%n)+n)%n
  };
  class Vector2{
    constructor(x=0,y=0){this.set(x,y)}
    set(x,y){this.x=x;this.y=y;return this}
    lengthSq(){return this.x*this.x+this.y*this.y}
  }
  class Vector3{
    constructor(x=0,y=0,z=0){this.set(x,y,z)}
    set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
    setScalar(v){return this.set(v,v,v)}
    copy(v){return this.set(v.x,v.y,v.z)}
    clone(){return new Vector3(this.x,this.y,this.z)}
    fromArray(a){return this.set(a[0],a[1],a[2])}
    toArray(){return [this.x,this.y,this.z]}
    *[Symbol.iterator](){yield this.x;yield this.y;yield this.z}
    add(v){return this.set(this.x+v.x,this.y+v.y,this.z+v.z)}
    sub(v){return this.set(this.x-v.x,this.y-v.y,this.z-v.z)}
    subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z)}
    multiplyScalar(s){return this.set(this.x*s,this.y*s,this.z*s)}
    divideScalar(s){return this.multiplyScalar(1/s)}
    negate(){return this.multiplyScalar(-1)}
    dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}
    cross(v){return this.set(this.y*v.z-this.z*v.y,this.z*v.x-this.x*v.z,this.x*v.y-this.y*v.x)}
    lengthSq(){return this.dot(this)}
    length(){return Math.sqrt(this.lengthSq())}
    normalize(){return this.divideScalar(this.length()||1)}
    distanceToSquared(v){return (v.x-this.x)**2+(v.y-this.y)**2+(v.z-this.z)**2}
    distanceTo(v){return Math.sqrt(this.distanceToSquared(v))}
    transform(m,w=1){
      const {x,y,z}=this;
      const k=w?(m[3]*x+m[7]*y+m[11]*z+m[15]||1):1;
      return this.set((m[0]*x+m[4]*y+m[8]*z+w*m[12])/k,
        (m[1]*x+m[5]*y+m[9]*z+w*m[13])/k,(m[2]*x+m[6]*y+m[10]*z+w*m[14])/k);
    }
    project(camera){return this.transform(camera.viewProjection)}
    applyNormalMatrix(matrix){
      const m=matrix.elements,{x,y,z}=this;
      return this.set(m[0]*x+m[3]*y+m[6]*z,m[1]*x+m[4]*y+m[7]*z,m[2]*x+m[5]*y+m[8]*z).normalize();
    }
  }
  class Matrix4{
    constructor(){this.elements=mat4.create()}
    makeTranslation(x,y,z){mat4.fromTranslation(this.elements,[x,y,z]);return this}
    multiply(b){mat4.multiply(this.elements,this.elements,b.elements);return this}
  }
  class Matrix3{
    constructor(){this.elements=mat3.create()}
    getNormalMatrix(m){mat3.normalFromMat4(this.elements,m.elements);return this}
  }
  const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
  const srgb=v=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055;
  class Color{
    constructor(value=0xffffff){this.set(value)}
    set(value){
      if(value instanceof Color){this.r=value.r;this.g=value.g;this.b=value.b;return this}
      if(typeof value==='string'){
        let hex=value.replace('#','');
        if(hex.length===3)hex=hex.split('').map(c=>c+c).join('');
        value=parseInt(hex,16);
      }
      this.r=linear(((value>>16)&255)/255);this.g=linear(((value>>8)&255)/255);this.b=linear((value&255)/255);
      return this;
    }
    setScalar(v){this.r=this.g=this.b=v;return this}
    clone(){return new Color(this)}
    toArray(){return [this.r,this.g,this.b]}
    getHexString(){return this.toArray().map(c=>Math.round(255*MathUtils.clamp(srgb(c),0,1)).toString(16).padStart(2,'0')).join('')}
  }
  class Texture{
    constructor(image=null){this.image=image;this.repeat=new Vector2(1,1);this.version=0;this.disposed=false;this.colorSpace='srgb'}
    set needsUpdate(value){if(value)this.version++}
    clone(){const t=Object.assign(new Texture(),this);t.repeat=new Vector2(this.repeat.x,this.repeat.y);return t}
    dispose(){this.disposed=true;this.release?.()}
  }
  class Material{
    constructor(options={},lit=false){
      Object.assign(this,{opacity:1,transparent:false,depthWrite:true,depthTest:true,side:0,
        roughness:1,metalness:0,emissiveIntensity:1,alphaTest:0,visible:true},options);
      this.color=new Color(options.color??0xffffff);this.emissive=new Color(options.emissive??0);
      this.isMeshStandardMaterial=lit;
    }
    clone(){return Object.assign(new this.constructor(),this,{color:this.color.clone(),emissive:this.emissive.clone()})}
    dispose(){}
  }
  class MeshBasicMaterial extends Material{}
  class MeshStandardMaterial extends Material{constructor(options){super(options,true)}}
  class MeshPhysicalMaterial extends MeshStandardMaterial{}

  class Rotation extends Vector3{
    set(x,y,z,order=this.order??'XYZ'){super.set(x,y,z);this.order=order;return this}
  }
  class Object3D{
    constructor(){
      this.children=[];this.parent=null;this.visible=true;this.userData={};this.renderOrder=0;
      this.position=new Vector3();this.scale=new Vector3(1,1,1);this.rotation=new Rotation();
      this.matrix=new Matrix4();this.matrixWorld=new Matrix4();this._q=quat.create();
      this._transform=new Float64Array(9).fill(NaN);this._parentVersion=-1;this.worldVersion=0;
    }
    add(...nodes){for(const node of nodes){node.parent?.remove(node);this.children.push(node);node.parent=this;node._parentVersion=-1}return this}
    remove(node){const i=this.children.indexOf(node);if(i>=0){this.children.splice(i,1);node.parent=null;node._parentVersion=-1}return this}
    traverse(fn){fn(this);for(const node of this.children)node.traverse(fn)}
    traverseVisible(fn){if(this.visible){fn(this);for(const node of this.children)node.traverseVisible(fn)}}
    alignY(direction){
      this._alignment=quat.create();quat.rotationTo(this._alignment,[0,1,0],direction.toArray());
      this._transform[0]=NaN;return this;
    }
    updateMatrix(){
      const p=this.position,r=this.rotation,s=this.scale,v=this._transform;
      if(p.x===v[0]&&p.y===v[1]&&p.z===v[2]&&r.x===v[3]&&r.y===v[4]&&r.z===v[5]&&s.x===v[6]&&s.y===v[7]&&s.z===v[8]&&r.order===this._order)return false;
      v.set([p.x,p.y,p.z,r.x,r.y,r.z,s.x,s.y,s.z]);this._order=r.order;
      const q=this._q;quat.identity(q);
      for(const axis of r.order){
        if(axis==='X')quat.rotateX(q,q,r.x);
        else if(axis==='Y')quat.rotateY(q,q,r.y);
        else quat.rotateZ(q,q,r.z);
      }
      if(this._alignment)quat.multiply(q,q,this._alignment);
      mat4.fromRotationTranslationScale(this.matrix.elements,q,v.subarray(0,3),v.subarray(6,9));
      this._parentVersion=-1;
      return true;
    }
    updateMatrixWorld(){
      const localChanged=this.updateMatrix(),parentVersion=this.parent?.worldVersion??0;
      if(localChanged||parentVersion!==this._parentVersion){
        const m=this.matrixWorld.elements;
        if(this.parent)mat4.multiply(m,this.parent.matrixWorld.elements,this.matrix.elements);
        else mat4.copy(m,this.matrix.elements);
        this.worldVersion++;this._parentVersion=parentVersion;
      }
      for(const node of this.children)node.updateMatrixWorld();
    }
    getWorldPosition(result){const m=this.matrixWorld.elements;return result.set(m[12],m[13],m[14])}
    localToWorld(p){return p.transform(this.matrixWorld.elements)}
  }
  class Group extends Object3D{constructor(){super();this.isGroup=true}}
  class Scene extends Group{constructor(){super();this.isScene=true;this.background=new Color(0);this.environment=null}}
  class Mesh extends Object3D{
    constructor(geometry,material){super();this.geometry=geometry;this.material=material;this.isMesh=true}
  }
  class InstancedMesh extends Mesh{
    constructor(geometry,material,count){
      super(geometry,material);this.count=count;this.isInstancedMesh=true;
      this.transforms=new Float32Array(count*16);this.colors=new Float32Array(count*3).fill(1);this.instanceVersion=0;
      for(let i=0;i<count;i++)mat4.identity(this.transforms.subarray(i*16,i*16+16));
    }
    setMatrixAt(i,m){this.transforms.set(m.elements,i*16);this.instanceVersion++}
    setColorAt(i,c){this.colors.set(c.toArray(),i*3);this.instanceVersion++}
  }
  class PerspectiveCamera extends Object3D{
    constructor(fov,aspect,near,far){
      super();Object.assign(this,{fov,aspect,near,far});
      this.projection=mat4.create();this.view=mat4.create();this.viewProjection=mat4.create();this.inverseViewProjection=mat4.create();
      this.updateProjectionMatrix();
    }
    updateProjectionMatrix(){mat4.perspective(this.projection,MathUtils.degToRad(this.fov),this.aspect,this.near,this.far);this.updateMatrixWorld()}
    updateMatrixWorld(){
      super.updateMatrixWorld();mat4.invert(this.view,this.matrixWorld.elements);
      mat4.multiply(this.viewProjection,this.projection,this.view);mat4.invert(this.inverseViewProjection,this.viewProjection);
    }
    lookAt(x,y,z){
      const d=new Vector3(x,y,z).sub(this.position);
      this.rotation.set(Math.atan2(d.y,Math.hypot(d.x,d.z)),Math.atan2(-d.x,-d.z),0,'YXZ');
    }
  }
  class Light extends Object3D{
    constructor(type,color,intensity=1){super();this.lightType=type;this.color=new Color(color);this.intensity=intensity}
  }
  class HemisphereLight extends Light{
    constructor(sky,ground,intensity){super('sky',sky,intensity);this.groundColor=new Color(ground)}
  }
  class DirectionalLight extends Light{
    constructor(color,intensity){
      super('directional',color,intensity);this.position.y=1;this.target=new Object3D();
      this.shadow={mapSize:new Vector2(512,512),camera:{left:-5,right:5,top:5,bottom:-5,near:.1,far:50},bias:0,normalBias:0};
    }
  }
  class PointLight extends Light{
    constructor(color,intensity,distance=0,decay=2){super('point',color,intensity);this.distance=distance;this.decay=decay}
  }
  return {MathUtils,Vector2,Vector3,Matrix3,Matrix4,Color,Texture,CanvasTexture:Texture,
    MeshBasicMaterial,MeshStandardMaterial,MeshPhysicalMaterial,Object3D,Group,Scene,Mesh,InstancedMesh,
    PerspectiveCamera,HemisphereLight,DirectionalLight,PointLight,DoubleSide:2,SRGBColorSpace:'srgb',
    NoColorSpace:'linear',RepeatWrapping:'repeat',EquirectangularReflectionMapping:'environment'};
})();
