'use strict';

const OrchestraRoom=(()=>{
  const {box,rounded,patchPlane,standard,rod,cylinder}=SchoolInterior;
  let standPaper,cloud;
  function reflector(){
    return cloud??=InteriorArtwork.canvasMap(128,68,(g,w,h)=>{
      g.fillStyle='#ede2c8';g.fillRect(0,0,w,h);
      g.fillStyle='#bba989';for(let y=4;y<h;y+=6)for(let x=4;x<w;x+=7)g.fillRect(x,y,1,1);
    });
  }
  function finishes(art){
    const maps=new Map();
    return {surface(kind,span,height,side){
      const key=[kind,span,height,side].join('/');
      if(maps.has(key))return maps.get(key);
      const map=InteriorArtwork.canvasMap(1024,512,(g,w,h)=>{
        if(kind==='floor'){
          g.fillStyle='#d7b98e';g.fillRect(0,0,w,h);
          for(let row=0;row<27;row++)for(let col=-1;col<7;col++){
            const x=(col+(row%3)/3)*184,y=row*h/27;
            g.fillStyle=['#dfc69e','#d7ba90','#e4ccaa','#d9bf99'][(row*5+col+8)%4];
            g.fillRect(x+1,y+1,183,h/27-1);
            g.fillStyle='#93735424';g.fillRect(x+9,y+7,130-(row%4)*12,1);
          }
        }else if(kind==='ceiling'){
          g.fillStyle='#f0eee4';g.fillRect(0,0,w,h);
          g.strokeStyle='#d0caba';for(let y=36;y<h;y+=88){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
        }else{
          const n=Math.round(span/.94),sw=w/n;
          for(let i=0;i<n;i++){
            const x=i*sw;
            g.fillStyle=i%2?'#d4b38b':'#dfc399';g.fillRect(x,0,sw+1,h);
            for(let slat=2;slat<sw;slat+=7){
              g.fillStyle='#96714c88';g.fillRect(x+slat,h*.60,1.7,h*.4);
            }
            g.fillStyle=side==='front'?'#8ba7a6':side==='back'?'#a5b0a7':'#b7b8a7';
            g.fillRect(x+3,12,sw-6,h*.57);
            g.fillStyle='#ffffff13';for(let j=15;j<h*.59;j+=4)g.fillRect(x+5,j,sw-10,1);
          }
          g.fillStyle='#997550';g.fillRect(0,h*.60,w,4);
        }
      });
      maps.set(key,map);return map;
    },sample:art.sample};
  }
  function score(){
    return standPaper??=InteriorArtwork.canvasMap(220,136,(g,w,h)=>{
      g.fillStyle='#f7f0d8';g.fillRect(0,0,w,h);g.fillStyle='#3f4443';
      for(let side=0;side<2;side++)for(let staff=0;staff<3;staff++){
        const x=side*108+11,y=17+36*staff;
        for(let line=0;line<5;line++)g.fillRect(x,y+line*3,86,1);
        for(let n=0;n<7;n++){const yy=y+2+((n+staff*2)%5)*2;g.beginPath();g.ellipse(x+6+11*n,yy,2.8,2,-.3,0,Math.PI*2);g.fill();g.fillRect(x+8+11*n,yy-9,1,9)}
      }
      g.fillStyle='#bdaf8c';g.fillRect(108,2,1,h-4);
    });
  }
  function standScore(tray){patchPlane(tray,.38,.225,0,.006,.012,score())}
  function cello(scene,x,z,rotation){
    const group=new School3D.Group();group.position.set(x,.19,z);group.rotation.y=rotation;scene.add(group);
    const amber=standard('#aa6030',.46),black=standard('#342b28',.54),maple=standard('#e1b25f',.6);
    const outline=new School3D.Shape();outline.moveTo(0,0);
    for(const [cx,cy,ex,ey] of [
      [.32,-.02,.29,.28],[.28,.36,.20,.42],[.10,.54,.17,.62],[.25,.62,.215,.76],
      [.20,.97,0,.98],[-.20,.97,-.215,.76],[-.25,.62,-.17,.62],[-.10,.54,-.20,.42],
      [-.28,.36,-.29,.28],[-.32,-.02,0,0]
    ])outline.quadraticCurveTo(cx,cy,ex,ey);
    const body=new School3D.Mesh(new School3D.ExtrudeGeometry(outline,{depth:.115,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2}),amber);
    group.add(body);
    box(group,.075,.67,.069,0,1.13,.07,amber);box(group,.064,.70,.025,0,1.0,.151,black);
    box(group,.095,.048,.034,0,.405,.169,maple);box(group,.071,.21,.03,0,.19,.161,black);
    for(const dx of [-.022,-.007,.007,.022])rod(group,[dx,.21,.185],[dx,1.44,.15],.0025,maple);
    for(const side of [-1,1]){
      rod(group,[side*.11,.34,.137],[side*.085,.58,.138],.008,black);
      for(const y of [1.39,1.46])rod(group,[0,y,.071],[side*.083,y+.01,.071],.013,black);
    }
    rod(group,[0,0,.05],[0,-.18,.073],.012,black);
    for(const dx of [-.14,.14])rod(group,[0,.30,-.04],[dx,-.17,-.13],.016,black);
    rod(group,[.22,.08,.17],[.38,1.46,.16],.009,black);
  }
  function instruments(scene){
    const brass=standard('#ac7446',.48,.35), metal=standard('#555d5c',.47,.35),head=standard('#f2e5c9',.74);
    const frame=standard('#3d474c',.57),wood=standard('#bc976b',.63);
    rounded(scene,1.28,.17,.64,0,.085,2.19,wood,.02);
    box(scene,1.25,.025,.62,0,.181,2.19,standard('#485d65',.9));
    cylinder(scene,.13,.18,.035,0,.216,2.02,frame);rod(scene,[0,.22,2.02],[0,1.19,2.02],.025,frame);
    const desk=box(scene,.72,.38,.035,0,1.30,2.02,frame);desk.rotation.x=-.35;
    const paper=patchPlane(scene,.58,.31,0,1.304,2.044,score());paper.rotation.x=-.35;
    rod(scene,[-.18,1.18,2.118],[.25,1.33,2.087],.009,wood);
    cello(scene,-5.61,3.94,.60);cello(scene,-5.53,4.82,.92);
    for(const [x,z,r] of [[5.38,3.67,.43],[5.69,4.43,.37]]){
      const kettle=new School3D.Mesh(new School3D.SphereGeometry(1,32,22),brass);
      kettle.scale.set(r,.31,r);kettle.position.set(x,.755,z);scene.add(kettle);
      cylinder(scene,r+.014,r+.014,.046,x,.91,z,metal);cylinder(scene,r,r,.023,x,.944,z,head);
      for(const angle of [0,2.094,4.188]){
        const dx=Math.cos(angle),dz=Math.sin(angle);
        rod(scene,[x+dx*r*.62,.65,z+dz*r*.62],[x+dx*r*.92,.04,z+dz*r*.92],.022,metal);
      }
      rod(scene,[x-.23,.961,z-.12],[x+.16,.967,z+.12],.013,wood);
      const tip=new School3D.Mesh(new School3D.SphereGeometry(.041,16,10),head);
      tip.position.set(x+.16,.972,z+.12);scene.add(tip);
    }
  }
  return {finishes,reflector,standScore,instruments};
})();
