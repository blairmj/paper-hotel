'use strict';

(() => {
  const {mat4,mat3}=glMatrix,{Vector3}=School3D;
  class Box3 {constructor(min,max){this.min=min;this.max=max}}
  // The direction can be unnormalised after conversion to local coordinates.
  // This preserves the world-space distance parameter under non-uniform scale.
  function boxDistance(o,d,b){
    let near=-Infinity,far=Infinity;
    for(let i=0;i<3;i++){
      if(Math.abs(d[i])<1e-12){if(o[i]<b[i]-1e-8||o[i]>b[i+3]+1e-8)return Infinity;continue}
      const a=(b[i]-o[i])/d[i],c=(b[i+3]-o[i])/d[i];
      near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));
      if(near>far+1e-8)return Infinity;
    }
    return far<0?Infinity:near<0?far:near;
  }
  class Ray {
    constructor(){this.origin=new Vector3();this.direction=new Vector3(0,0,-1)}
    at(t,result){return result.copy(this.direction).multiplyScalar(t).add(this.origin)}
    intersectBox(box,result){
      const distance=boxDistance(this.origin.toArray(),this.direction.toArray(),[...box.min,...box.max]);
      return Number.isFinite(distance)?this.at(distance,result):null;
    }
  }
  const inverses=new WeakMap();
  function localTransforms(mesh){
    let cache=inverses.get(mesh);
    if(cache&&cache.world===mesh.worldVersion&&cache.instances===mesh.instanceVersion)return cache.list;
    const list=[];
    for(let i=0;i<(mesh.isInstancedMesh?mesh.count:1);i++){
      const world=mesh.matrixWorld.elements,combined=mat4.create();
      const instance=mesh.isInstancedMesh?mesh.transforms.subarray(i*16,i*16+16):null;
      if(instance)mat4.multiply(combined,world,instance);
      const inverse=mat4.invert(combined,instance?combined:world);
      if(inverse)list.push({inverse,instance,index:i});
    }
    inverses.set(mesh,{world:mesh.worldVersion,instances:mesh.instanceVersion,list});return list;
  }
  function localHit(mesh,origin,direction){
    const geometry=mesh.geometry,bounds=geometry.bounds;
    if(!Number.isFinite(boxDistance(origin,direction,bounds)))return null;
    const positions=geometry.attributes.position.array,indices=geometry.index;
    const count=indices?indices.length:positions.length/3;
    const [ox,oy,oz]=origin,[dx,dy,dz]=direction;
    let nearest=Infinity,normal;
    for(let i=0;i<count;i+=3){
      const a=3*(indices?indices[i]:i),b=3*(indices?indices[i+1]:i+1),c=3*(indices?indices[i+2]:i+2);
      const ex=positions[b]-positions[a],ey=positions[b+1]-positions[a+1],ez=positions[b+2]-positions[a+2];
      const fx=positions[c]-positions[a],fy=positions[c+1]-positions[a+1],fz=positions[c+2]-positions[a+2];
      const px=dy*fz-dz*fy,py=dz*fx-dx*fz,pz=dx*fy-dy*fx;
      const det=ex*px+ey*py+ez*pz;
      if(Math.abs(det)<1e-12)continue;
      const ax=ox-positions[a],ay=oy-positions[a+1],az=oz-positions[a+2];
      const u=(ax*px+ay*py+az*pz)/det;
      if(u<-.000001||u>1.000001)continue;
      const qx=ay*ez-az*ey,qy=az*ex-ax*ez,qz=ax*ey-ay*ex;
      const v=(dx*qx+dy*qy+dz*qz)/det;
      if(v<-.000001||u+v>1.000001)continue;
      const distance=(fx*qx+fy*qy+fz*qz)/det;
      if(distance<0||distance>=nearest)continue;
      const material=Array.isArray(mesh.material)?mesh.material[geometry.groups.find(group=>i>=group.start&&i<group.start+group.count)?.materialIndex??0]:mesh.material;
      if(!material||material.visible===false||(material.side!==2&&det<0))continue;
      nearest=distance;normal=new Vector3(ey*fz-ez*fy,ez*fx-ex*fz,ex*fy-ey*fx).normalize();
    }
    return normal?{distance:nearest,face:{normal}}:null;
  }
  class Raycaster {
    constructor(){this.ray=new Ray()}
    setFromCamera(mouse,camera){
      camera.getWorldPosition(this.ray.origin);
      this.ray.direction.set(mouse.x,mouse.y,.5).transform(camera.inverseViewProjection).sub(this.ray.origin).normalize();
    }
    intersectObjects(meshes){
      const hits=[],o=this.ray.origin,d=this.ray.direction;
      for(const mesh of meshes){
        let nearest;
        for(const {inverse,instance,index} of localTransforms(mesh)){
          const origin=o.clone().transform(inverse).toArray(),dir=d.clone().transform(inverse,0).toArray();
          const hit=localHit(mesh,origin,dir);
          if(!hit||(nearest&&hit.distance>=nearest.distance))continue;
          if(instance){
            hit.face.normal.applyNormalMatrix({elements:mat3.normalFromMat4(mat3.create(),instance)});
            hit.instanceId=index;
          }
          nearest=hit;
        }
        if(nearest){nearest.object=mesh;nearest.point=this.ray.at(nearest.distance,new Vector3());hits.push(nearest)}
      }
      return hits.sort((a,b)=>a.distance-b.distance);
    }
  }
  Object.assign(School3D,{Ray,Raycaster,Box3});
})();
