'use strict';

const ScienceBalance=(()=>{
  const colors={black:'검은 구슬',white:'흰 구슬'};
  const beadRadius=.031,halfArm=.214,axleHeight=.43;

  function build(scene,room){
    const {rounded,cylinder,rod,standard,patchPlane}=SchoolInterior;
    function group(parent,x,y,z){
      const g=new School3D.Group();g.position.set(x,y,z);parent.add(g);return g;
    }
    const navy=standard('#245293',.36,.23),chrome=standard('#a7bdcc',.34,.46);
    const foot=standard('#344553',.51),brass=standard('#ce9b44',.35,.43);
    const felt=standard('#547489',.90),hover=standard('#7eb9c4',.5,.14);
    const glass={black:standard('#252e38',.25,.19),white:standard('#faf6ed',.26,.12)};
    const sphere=new School3D.SphereGeometry(beadRadius,24,16);
    const beads=BALANCE_BEADS.map(({color})=>new School3D.Mesh(sphere,glass[color]));
    function tag(parent,label,w,h,x,y,z){
      const map=InteriorArtwork.canvasMap(240,96,(g,ww,hh)=>{
        g.fillStyle='#f4efd9';g.fillRect(0,0,ww,hh);g.fillStyle='#26343b';
        g.textAlign='center';g.textBaseline='middle';g.font='bold 64px Arial';g.fillText(label,ww/2,hh*.53);
      });
      return patchPlane(parent,w,h,x,y,z,map);
    }
    const [benchX,,benchZ]=room.clues.find(clue=>clue.id==='balanceBench').xyz;
    const tableTop=.92,holders=new Map();
    const devices=BALANCE_SCALES.map((scale,i)=>{
      const g=group(scene,benchX+(i===0?-.422:.422),tableTop,benchZ);
      rounded(g,.30,.034,.19,0,.021,0,foot,.009);
      rounded(g,.272,.044,.175,0,.050,0,navy,.012);
      cylinder(g,.030,.065,.357,0,.247,-.017,navy);
      const beam=group(g,0,axleHeight,0);
      rounded(beam,.46,.026,.038,0,0,0,chrome,.005);
      rounded(g,.070,.048,.01,0,axleHeight+.05,-.02,foot,.004);
      rounded(g,.002,.040,.005,0,axleHeight+.05,-.010,chrome,.001);
      rod(beam,[0,0,0],[0,.071,0],.003,brass);
      cylinder(g,.027,.027,.054,0,axleHeight,.017,brass).rotation.x=Math.PI/2;
      tag(g,i===0?'I':'II',.061,.030,0,.051,.090);
      const pans=[scale.left,scale.right].map((place,j)=>{
        const pan=group(g,(j===0?-1:1)*halfArm,axleHeight,0);
        for(const [x,z] of [[-.123,.060],[.130,.036],[.006,-.123]])
          rod(pan,[0,-.005,0],[x,-.177,z],.0033,chrome);
        cylinder(pan,.140,.093,.023,0,-.194,0,chrome,36);
        const surface=cylinder(pan,.141,.140,.006,0,-.180,0,chrome,36);
        if(j===1){
          cylinder(pan,.050,.054,.096,.080,-.129,.015,brass);
          cylinder(pan,.026,.020,.024,.080,-.069,.015,brass);
          tag(pan,scale.weight+' g',.106,.053,.080,-.128,.069).rotation.x=-.24;
        }
        holders.set(place,{node:pan,surface,xHalf:.145,zHalf:.133,bottom:-.197,top:-.106,
          label:scale.label+' '+(j?'오른쪽':'왼쪽')+' 접시'});
        return pan;
      });
      return {beam,pans,angle:0,goal:0};
    });
    const tray=group(scene,benchX,tableTop,benchZ+.43);
    rounded(tray,.34,.026,.28,0,.016,0,chrome,.009);
    const lining=rounded(tray,.320,.010,.256,0,.030,0,felt,.005);
    for(const side of [-1,1]){
      rounded(tray,.34,.020,.012,0,.034,side*.133,chrome,.004);
      rounded(tray,.012,.020,.265,side*.164,.034,0,chrome,.004);
    }
    holders.set('tray',{node:tray,surface:lining,xHalf:.17,zHalf:.14,bottom:.014,top:.066,label:'구슬 받침'});
    const dial=group(scene,...room.lock.center);dial.rotation.y=room.lock.rotationY;
    rounded(dial,room.lock.width+.024,room.lock.height+.023,.044,0,0,-.023,foot,.009);
    const screen=patchPlane(dial,room.lock.width,room.lock.height,0,0,.003,imageMap(schoolLockArt(room,[])));

    const shadowLight=scene.parent?.children.find(item=>item.castShadow&&item.shadow);
    let places=initialBeadPlaces(),held=null,shadowDirty=false;
    function pose(device){
      const {angle,beam,pans}=device;
      beam.rotation.z=-angle;
      pans.forEach((pan,j)=>{
        const side=j===0?-1:1;
        pan.position.set(side*halfArm*Math.cos(angle),axleHeight-side*halfArm*Math.sin(angle),0);
      });
    }
    function arrange(animate){
      shadowDirty=true;
      for(const [place,holder] of holders){
        const ids=beads.map((_,id)=>id).filter(id=>id!==held&&places[id]===place);
        const loose=place==='tray',weighted=place.endsWith('R');
        const columns=loose?4:weighted?2:ids.length===4?4:3;
        ids.forEach((id,k)=>{
          const bead=beads[id],row=Math.floor(k/columns),occupied=Math.min(columns,ids.length-row*columns);
          if(bead.parent!==holder.node)holder.node.add(bead);
          const rows=Math.min(3,Math.ceil(ids.length/columns));
          bead.position.set(((k%columns)-(occupied-1)/2)*.066-(weighted?.049:0),
            (loose?.035:-.177)+beadRadius+Math.floor(row/3)*.054,
            ((rows-1)/2-row%3)*.064+(loose?0:.012));
        });
      }
      const loading=places.slice();
      if(held!==null)loading[held]='tray';
      devices.forEach((device,i)=>{
        device.goal=readBalance(BALANCE_SCALES[i],loading).angle;
        if(!animate){device.angle=device.goal;pose(device)}
      });
    }
    function setBalance(next,animate=false){
      if(held!==null)beads[held].castShadow=true;
      held=null;places=next.slice();arrange(animate);
    }
    function lift(id){
      if(held!==null)setBalance(places,true);
      const bead=beads[id],position=bead.getWorldPosition(new School3D.Vector3());
      // The furniture root uses room coordinates. Keep this same mesh under the pointer.
      scene.add(bead);bead.position.copy(position);bead.position.y+=.065;bead.castShadow=false;
      held=id;arrange(true);
    }
    function animate(dt,reduced){
      let moving=false;
      for(const device of devices){
        if(device.angle===device.goal)continue;
        const gap=device.goal-device.angle;
        device.angle=reduced||Math.abs(gap)<.001?device.goal:device.angle+gap*(1-Math.exp(-14*dt));
        pose(device);moving||=device.angle!==device.goal;
      }
      if(!moving&&shadowDirty){
        if(shadowLight)shadowLight.shadow.needsUpdate=true;
        shadowDirty=false;
      }
      return moving;
    }
    setBalance(places);
    const workbench=controls({benchX,benchZ,beads,holders,
      get places(){return places},get held(){return held},lift,putBack(){setBalance(places,true)},
      highlight(place){
        for(const [key,holder] of holders)holder.surface.material=place===key?hover:key==='tray'?felt:chrome;
      }
    });
    return {workbench,setBalance,animate,setDigits(values){
      screen.material.map.image=schoolLockArt(room,values);screen.material.map.needsUpdate=true;
    }};
  }

  // These transparent controls follow the WebGL objects. The camera always draws the same classroom.
  function controls(model){
    const root=document.getElementById('balanceWorkbench'),layer=document.getElementById('balanceTargets');
    const tabs=document.getElementById('balanceScales'),status=document.getElementById('balanceStatus');
    const help=document.getElementById('balanceHelp'),initialHelp=help.textContent;
    const camera=new School3D.PerspectiveCamera(52,1,.04,42),v=new School3D.Vector3();
    let session=null,press=null,scaleIndex=0,width=1,height=1,dragDepth=0;
    function target(data,value,label){
      const button=document.createElement('button');button.type='button';
      button.dataset[data]=value;button.setAttribute('aria-label',label);layer.append(button);return button;
    }
    const pans=new Map(Array.from(model.holders,([place,holder])=>[place,target('place',place,holder.label)]));
    for(const scale of BALANCE_SCALES)pans.get(scale.right).setAttribute('aria-description',scale.weight+' g 추');
    const beads=model.beads.map((_,id)=>target('bead',id,colors[BALANCE_BEADS[id].color]));
    function announce(){
      const loading=model.places.slice();
      if(model.held!==null)loading[model.held]='tray';
      const readings=BALANCE_SCALES.map(scale=>{
        const {left,right}=readBalance(scale,loading);
        return scale.label+' '+(left===right?'수평':left>right?'왼쪽이 무거움':'오른쪽이 무거움');
      });
      const selected=model.held===null?'':colors[BALANCE_BEADS[model.held].color]+' 선택. ';
      status.textContent=selected+readings.join('. ')+'.';
    }
    function update(){
      layer.classList.toggle('carrying',model.held!==null);
      help.textContent=model.held===null?initialHelp:'놓을 접시나 구슬 받침을 누르세요.';
      beads.forEach((el,id)=>{
        el.setAttribute('aria-pressed',String(id===model.held));
        el.setAttribute('aria-label',colors[BALANCE_BEADS[id].color]+', '+model.holders.get(model.places[id]).label);
      });
      announce();session?.refresh();
    }
    function cancel(){
      press=null;model.highlight(null);
      if(model.held!==null)model.putBack();
      update();
    }
    function pick(id){
      model.lift(id);update();
    }
    function drop(place){
      const id=model.held;
      if(id===null)return;
      if(!place||place===model.places[id]){cancel();return}
      const next=model.places.slice();next[id]=place;
      if(!session.commit(next)){cancel();return}
      model.highlight(null);update();
    }
    function activate(bead,place){
      if(model.held===null){if(bead!==null)pick(bead);return}
      if(bead===model.held){cancel();return}
      const destination=bead===null?place:model.places[bead];
      if(bead!==null&&destination===model.places[model.held])pick(bead);
      else drop(destination);
    }
    function setScale(i){
      if(scaleIndex!==i&&model.held!==null){
        model.beads[model.held].position.copy(model.holders.get('tray').node.localToWorld(v.set(0,.16,0)));
      }
      scaleIndex=i;Array.from(tabs.children).forEach((el,j)=>el.setAttribute('aria-pressed',String(i===j)));
      session?.refresh();
    }
    Array.from(tabs.children).forEach((el,i)=>el.onclick=()=>setScale(i));
    document.getElementById('balanceReset').onclick=()=>{
      if(!session)return;
      cancel();session.commit(initialBeadPlaces());update();
    };
    document.getElementById('leaveBench').onclick=()=>session?.leave();
    function sizeCamera(w,h,zoom){
      width=w;height=h;
      const compact=w<720&&w/h<1.25,aspect=w/h;
      const heightInRoom=Math.max(.98,(compact?1.15:1.86)/aspect)/zoom;
      const visibleWidth=heightInRoom*aspect;
      tabs.hidden=!compact&&visibleWidth>=1.60;
      const offset=compact?.238:Math.max(0,(1.60-visibleWidth)/2);
      const shift=scaleIndex===0?-offset:offset;
      const x=model.benchX+shift,z=model.benchZ;
      camera.position.set(x,1.62,z+1.25);
      camera.lookAt(x,1.065,z+.12);
      camera.aspect=aspect;
      camera.fov=2*Math.atan(heightInRoom/(2*Math.hypot(1.13,.555)))*180/Math.PI;
      camera.updateProjectionMatrix();
      return camera;
    }
    function project(node,x,y,z){
      node.localToWorld(v.set(x,y,z)).project(camera);
      return [(1+v.x)*width/2,(1-v.y)*height/2];
    }
    function placeButton(button,x,y,w,h){
      button.style.left=x+'px';button.style.top=y+'px';button.style.width=w+'px';button.style.height=h+'px';
    }
    function drawTargets(){
      for(const [place,{node,xHalf,zHalf,bottom,top}] of model.holders){
        const button=pans.get(place);
        const corners=[];
        for(const x of [-xHalf,xHalf])for(const z of [-zHalf,zHalf])for(const y of [bottom,top])corners.push(project(node,x,y,z));
        const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
        const left=Math.min(...xs),right=Math.max(...xs),hi=Math.min(...ys),lo=Math.max(...ys);
        button.hidden=right<0||left>width||lo<0||hi>height;
        placeButton(button,(left+right)/2,(hi+lo)/2,right-left+4,lo-hi+4);
      }
      model.beads.forEach((node,id)=>{
        const el=beads[id];
        const [x,y]=project(node,0,0,0),[edge]=project(node,beadRadius,0,0);
        el.hidden=x<0||x>width||y<0||y>height;
        if(!el.hidden){
          const size=Math.max(28,Math.abs(edge-x)*2+5);
          placeButton(el,x,y,size,size);
        }
      });
    }
    function beadAt(x,y,except=null){
      let nearest=null,best=Infinity;
      beads.forEach((button,id)=>{
        if(button.hidden||id===except)return;
        const r=button.getBoundingClientRect(),dx=x-r.x-r.width/2,dy=y-r.y-r.height/2;
        const d=dx*dx+dy*dy;
        if(d<=(r.width/2)**2&&d<best){best=d;nearest=id}
      });
      return nearest;
    }
    function holderAt(x,y){
      for(const [place,button] of pans){
        if(button.hidden)continue;
        const r=button.getBoundingClientRect();
        if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return place;
      }
      const id=beadAt(x,y,model.held);
      return id===null?null:model.places[id];
    }
    layer.onpointerdown=e=>{
      if(!session||!e.isPrimary||e.button!==0)return;
      e.preventDefault();
      press={pointer:e.pointerId,x:e.clientX,y:e.clientY,bead:beadAt(e.clientX,e.clientY),dragged:false};
      layer.setPointerCapture(e.pointerId);
    };
    layer.onpointermove=e=>{
      if(!press||press.pointer!==e.pointerId||press.bead===null)return;
      if(!press.dragged){
        if(Math.hypot(e.clientX-press.x,e.clientY-press.y)<5)return;
        if(model.held!==press.bead)pick(press.bead);
        dragDepth=v.copy(model.beads[press.bead].position).project(camera).z;
        press.dragged=true;
      }
      const rect=layer.getBoundingClientRect();
      v.set(2*(e.clientX-rect.left)/width-1,1-2*(e.clientY-rect.top-6)/height,dragDepth);
      model.beads[press.bead].position.copy(v.transform(camera.inverseViewProjection));
      model.highlight(holderAt(e.clientX,e.clientY));session.refresh();
    };
    layer.onpointerup=e=>{
      if(!press||press.pointer!==e.pointerId)return;
      const {bead,dragged}=press;press=null;
      const place=holderAt(e.clientX,e.clientY);
      if(dragged)drop(place);else activate(bead,place);
    };
    layer.onpointercancel=layer.onlostpointercapture=()=>{if(press)cancel()};
    layer.onclick=e=>{
      if(!session||e.detail!==0)return;
      const {bead,place}=e.target.dataset;
      if(bead!==undefined||place)activate(bead!==undefined?Number(bead):null,place);
    };
    document.addEventListener('keydown',e=>{
      if(!session||e.key!=='Escape'||e.defaultPrevented)return;
      e.preventDefault();if(model.held!==null)cancel();else session.leave();
    });
    window.addEventListener('blur',()=>{if(session)cancel()});
    return {id:'balanceBench',surface:layer,get active(){return !!session},sizeCamera,drawTargets,
      enter(options){
        session=options;root.hidden=false;setScale(0);update();
        root.tabIndex=-1;root.focus({preventScroll:true});
      },
      exit(){
        cancel();session=null;root.hidden=true;
      }
    };
  }
  return {build};
})();
