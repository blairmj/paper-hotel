'use strict';

// The seats and stands sit on the floor as separate objects, so walking down
// the aisle reveals the floor and instruments behind them.
function addSchoolEnsemble(scene) {
  const T=THREE;
  scene.add(new T.HemisphereLight(0xfff3df,0xa69b8a,1.75));
  const light=new T.DirectionalLight(0xfff3e0,1.30);
  light.position.set(-3,6,2);scene.add(light);
  const fill=new T.DirectionalLight(0xfff4e3,1.15);
  fill.position.set(2,2,5);scene.add(fill);

  const steel=new T.MeshStandardMaterial({color:0x9c9690,metalness:.32,roughness:.45});
  const black=new T.MeshStandardMaterial({color:0x34302e,metalness:.18,roughness:.62});
  const feet=new T.MeshStandardMaterial({color:0x47433d,roughness:.86});
  const batches=new Map();
  function add(group,geometry,material,position,rotation=null,scale=null){
    const temp=new T.Object3D();
    temp.position.copy(position);
    if(rotation)temp.quaternion.copy(rotation);
    if(scale)temp.scale.copy(scale);
    temp.updateMatrix();group.updateMatrix();
    const key=geometry.uuid+material.uuid;
    if(!batches.has(key))batches.set(key,{geometry,material,matrices:[]});
    batches.get(key).matrices.push(group.matrix.clone().multiply(temp.matrix));
  }
  const tube=new T.CylinderGeometry(1,1,1,12),vertical=new T.Vector3(0,1,0);
  function rod(group,a,b,r,mat){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),direction=end.clone().sub(start);
    const rotation=new T.Quaternion().setFromUnitVectors(vertical,direction.clone().normalize());
    add(group,tube,mat,start.add(end).multiplyScalar(.5),rotation,new T.Vector3(r,direction.length(),r));
  }
  const cut=document.createElement('canvas');cut.width=512;cut.height=768;
  const ink=cut.getContext('2d');ink.fillStyle='white';
  ink.beginPath();ink.roundRect(4,4,504,760,49);ink.fill();
  ink.fillStyle='black';ink.beginPath();ink.roundRect(193,95,126,29,13);ink.fill();
  const mask=new T.CanvasTexture(cut);
  const cream=new T.MeshStandardMaterial({color:0xeddbc6,emissive:0x453a30,roughness:.54,metalness:.025,
    side:T.DoubleSide,alphaMap:mask,alphaTest:.45});
  const profile=new T.CatmullRomCurve3([
    new T.Vector3(0,.44,-.245),new T.Vector3(0,.465,-.21),new T.Vector3(0,.461,-.125),
    new T.Vector3(0,.434,.015),new T.Vector3(0,.431,.12),new T.Vector3(0,.458,.185),
    new T.Vector3(0,.53,.205),new T.Vector3(0,.66,.24),new T.Vector3(0,.82,.273)]);
  const shell=new T.PlaneGeometry(1,1,24,38),vertices=shell.attributes.position,uv=shell.attributes.uv;
  for(let i=0;i<vertices.count;i++){
    const x=uv.getX(i)*2-1,v=uv.getY(i),pt=profile.getPointAt(v);
    const half=.256-.031*Math.sin(v*Math.PI)**2;
    vertices.setXYZ(i,x*half,pt.y+x*x*.016*(1-v),pt.z-x*x*.042*v);
  }
  shell.computeVertexNormals();

  const trayCanvas=document.createElement('canvas');trayCanvas.width=512;trayCanvas.height=350;
  const paint=trayCanvas.getContext('2d');paint.fillStyle='#fff';paint.beginPath();
  paint.roundRect(8,8,496,334,25);paint.fill();paint.fillStyle='#000';
  for(let row=0;row<3;row++)for(let col=0;col<7;col++){
    paint.beginPath();paint.ellipse(57+col*66,83+row*82,12,16,0,0,2*Math.PI);paint.fill();
  }
  const trayMaterial=new T.MeshStandardMaterial({color:0x3d3835,side:T.DoubleSide,roughness:.62,metalness:.18,alphaMap:new T.CanvasTexture(trayCanvas),alphaTest:.48});
  const tray=new T.PlaneGeometry(.52,.335),ledge=new T.BoxGeometry(.51,.018,.06);
  const tilt=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-.24);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const shade=shadowCanvas.getContext('2d'),gr=shade.createRadialGradient(64,64,1,64,64,63);
  gr.addColorStop(0,'rgba(59,48,35,.27)');gr.addColorStop(.5,'rgba(65,54,42,.12)');gr.addColorStop(1,'rgba(75,64,50,0)');
  shade.fillStyle=gr;shade.fillRect(0,0,128,128);
  const shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  const ground=new T.PlaneGeometry(1,1);
  const flat=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
  function shadow(g,x,z,w,h,height){add(g,ground,shadowMat,new T.Vector3(x,height,z),flat,new T.Vector3(w,h,1))}
  function groupAt(x,z,angle){const g=new T.Object3D();g.position.set(x,0,z);g.rotation.y=angle;return g}
  function chair(x,z,angle) {
    const g=groupAt(x,z,angle);
    shadow(g,0,.02,.88,.78,.006);add(g,shell,cream,new T.Vector3());
    for(const side of [-1,1])for(const end of [-1,1]){
      const ax=side*.19,az=end*.135,bx=side*.23,bz=end*.225;
      rod(g,[ax,.439,az],[bx,.025,bz],.010,steel);
      rod(g,[bx,.034,bz],[bx,.009,bz],.013,feet);
      shadow(g,bx,bz,.115,.099,.01);
    }
    for(const side of [-1,1])rod(g,[side*.185,.42,-.15],[side*.185,.42,.16],.011,steel);
  }
  function stand(x,z,angle){
    const g=groupAt(x,z,angle);
    shadow(g,0,.025,.72,.67,.006);
    rod(g,[0,.06,0],[0,.65,0],.015,black);rod(g,[0,.65,0],[0,1.04,0],.010,black);
    for(let i=0;i<3;i++){
      const th=i*Math.PI*2/3+.3,xx=Math.sin(th)*.27,zz=Math.cos(th)*.27;
      rod(g,[0,.21,0],[xx,.018,zz],.012,black);shadow(g,xx,zz,.1,.09,.01);
    }
    add(g,tray,trayMaterial,new T.Vector3(0,1.07,0),tilt);
    add(g,ledge,black,new T.Vector3(0,.907,.055),tilt);
  }
  for(const side of [-1,1]){
    chair(side*2.52,-4.12,side*.32);chair(side*3.50,-3.88,side*.43);chair(side*1.66,-3.74,side*.22);
    chair(side*2.61,-2.84,side*.39);chair(side*1.73,-2.46,side*.26);chair(side*3.39,-2.96,side*.43);
    stand(side*2.80,-4.61,side*.25);stand(side*1.56,-3.40,side*.25);
  }
  for(const {geometry,material,matrices} of batches.values()){
    const inst=new T.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((matrix,i)=>inst.setMatrixAt(i,matrix));scene.add(inst);
  }
}
