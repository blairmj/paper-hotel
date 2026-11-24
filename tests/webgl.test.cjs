const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const runtime=vm.createContext({});
for(const file of ['vendor/gl-matrix.min.js','vendor/earcut.min.js','webgl/model.js','webgl/geometry.js','webgl/picking.js','music-world.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),runtime,{filename:file});
}
const {Vector2,Vector3,Box3,Scene,Group,Shape,Path,ExtrudeGeometry,BoxGeometry,MeshBasicMaterial,
  Mesh,InstancedMesh,Matrix4,PerspectiveCamera,Raycaster}=vm.runInContext('School3D',runtime);

test('camera zoom scales the view and picks the same cabinet door on portrait and landscape canvases',()=>{
  const scene=new Scene(),hinge=new Group(),leaf=new Mesh(new BoxGeometry(.6,1,.03),new MeshBasicMaterial());
  hinge.add(leaf);scene.add(hinge);hinge.position.set(.3,1,0);leaf.position.x=.3;
  const camera=new PerspectiveCamera(55,1,.04,42);camera.position.set(.4,1.55,2.5);camera.lookAt(.6,1,0);
  for(const [aspect,baseFov] of [[.48,74],[1.77,55]])for(const zoom of [.5,.7,1,1.2,2])for(const turn of [0,.85]){
    camera.aspect=aspect;camera.fov=runtime.roomViewFov(55,aspect,zoom);camera.updateProjectionMatrix();
    assert.ok(Math.abs(camera.projection[5]*Math.tan(baseFov*Math.PI/360)-zoom)<1e-6);
    hinge.rotation.y=turn;hinge.updateMatrix();scene.updateMatrixWorld();
    const center=leaf.localToWorld(new Vector3(0,0,.015));
    const pixel=center.clone().project(camera);
    const pick=new Raycaster();pick.setFromCamera(new Vector2(pixel.x,pixel.y),camera);
    const hit=pick.intersectObjects([leaf])[0];
    assert.ok(hit.point.distanceTo(center)<.0001);
    assert.ok(Math.abs(hit.face.normal.z-1)<.00001);
  }
});

test('the opening in a music stand is open to a ray, while its metal face is solid',()=>{
  const shape=new Shape();
  shape.moveTo(-1,-1).lineTo(1,-1).lineTo(1,1).lineTo(-1,1);
  const hole=new Path();hole.absarc(0,0,.3,0,Math.PI*2,true);shape.holes.push(hole);
  const geometry=new ExtrudeGeometry(shape,{depth:.03,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:2});
  const stand=new Mesh(geometry,new MeshBasicMaterial());stand.updateMatrixWorld();
  const pick=new Raycaster();pick.ray.origin.set(0,0,2);
  assert.equal(pick.intersectObjects([stand]).length,0);
  pick.ray.origin.x=.65;
  assert.ok(Math.abs(pick.intersectObjects([stand])[0].point.z-.035)<1e-6);
});

test('picking accounts for each repeated computer station and a ray starting inside the room',()=>{
  const copies=new InstancedMesh(new BoxGeometry(),new MeshBasicMaterial(),2);
  copies.setMatrixAt(1,new Matrix4().makeTranslation(2,0,0));copies.updateMatrixWorld();
  const raycaster=new Raycaster();raycaster.ray.origin.set(2,0,3);
  assert.equal(raycaster.intersectObjects([copies])[0].instanceId,1);
  const box=new Box3(new Vector3(-4,-1,-6),new Vector3(4,3,5));
  assert.equal(raycaster.ray.intersectBox(box,new Vector3()).z,-6);
});

test('every playable classroom starts the native renderer',()=>{
  for(const name of ['index','music','art','library','science','broadcast','sports','print','council','computer']){
    const html=fs.readFileSync(path.join(root,name+'.html'),'utf8');
    assert.doesNotMatch(html,/three\.min\.js/i);
    assert.match(html,/src="webgl\/renderer\.js/);
    assert.ok(html.indexOf('webgl/renderer.js')<html.indexOf('music-world.js'));
  }
});
