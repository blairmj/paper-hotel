'use strict';

const ScienceBalance=(()=>{
  const colors={black:'검은 구슬',white:'흰 구슬'};
  const viewWidth=320,viewHeight=166,arm=90,pivotY=38,panOffset=77;

  function panPoint(side,angle){
    return {x:160+side*arm*Math.cos(angle),y:pivotY+side*arm*Math.sin(angle)};
  }
  function beadSlots(count,weighted){
    const columns=weighted?3:4;
    return Array.from({length:count},(_,i)=>{
      const row=Math.floor(i/columns);
      const occupied=Math.min(columns,count-row*columns);
      return {x:((i%columns)-(occupied-1)/2)*25-(weighted?14:0),y:11+row*21};
    });
  }

  function build(scene,room){
    const {rounded,cylinder,rod,standard,patchPlane}=SchoolInterior;
    function group(parent,x,y,z){
      const g=new School3D.Group();g.position.set(x,y,z);parent.add(g);return g;
    }
    const navy=standard('#245293',.36,.23),chrome=standard('#a7bdcc',.27,.57);
    const foot=standard('#344553',.51),brass=standard('#cd9c43',.28,.54);
    const glass={black:standard('#232a32',.22,.23),white:standard('#f3f0e8',.20,.16)};
    const sphere=new School3D.SphereGeometry(.031,18,14),beads=BALANCE_BEADS.map(({color})=>new School3D.Mesh(sphere,glass[color]));
    function tag(parent,label,w,h,x,y,z){
      const map=InteriorArtwork.canvasMap(240,96,(g,ww,hh)=>{
        g.fillStyle='#e8e6d8';g.fillRect(0,0,ww,hh);g.fillStyle='#26343b';
        g.textAlign='center';g.textBaseline='middle';g.font='bold 64px Arial';g.fillText(label,ww/2,hh*.53);
      });
      patchPlane(parent,w,h,x,y,z,map);
    }
    const [benchX,,benchZ]=room.clues.find(clue=>clue.id==='balanceBench').xyz;
    const tableTop=.92,halfArm=.214,axleHeight=.43;
    const devices=BALANCE_SCALES.map((scale,i)=>{
      const g=group(scene,benchX+(i===0?-.422:.422),tableTop,benchZ);
      rounded(g,.30,.034,.19,0,.021,0,foot,.009);
      rounded(g,.272,.044,.175,0,.050,0,navy,.012);
      cylinder(g,.030,.065,.357,0,.247,-.017,navy);
      const beam=group(g,0,axleHeight,0);
      rounded(beam,.46,.026,.038,0,0,0,chrome,.005);
      cylinder(g,.027,.027,.054,0,axleHeight,.017,brass).rotation.x=Math.PI/2;
      tag(g,i===0?'I':'II',.058,.024,0,.051,.089);
      const pans=[-1,1].map(side=>{
        const pan=group(g,side*halfArm,axleHeight,0);
        for(const [x,z] of [[-.126,.015],[.095,.072],[.058,-.109]])
          rod(pan,[0,-.005,0],[x,-.177,z],.0038,chrome);
        cylinder(pan,.140,.093,.023,0,-.194,0,chrome,36);
        cylinder(pan,.141,.140,.006,0,-.180,0,chrome,36);
        if(side===1){
          cylinder(pan,.043,.048,.085,.082,-.135,0,brass);
          cylinder(pan,.025,.018,.025,.082,-.081,0,brass);
          tag(pan,scale.weight+'g',.067,.031,.082,-.139,.045);
        }
        return pan;
      });
      return {beam,pans};
    });
    const tray=group(scene,benchX,tableTop,benchZ+.49);
    rounded(tray,.69,.019,.20,0,.012,0,chrome,.006);
    for(const s of [-1,1]){
      rounded(tray,.69,.014,.012,0,.025,s*.096,chrome,.003);
      rounded(tray,.012,.014,.19,s*.34,.025,0,chrome,.003);
    }
    const dial=group(scene,...room.lock.center);dial.rotation.y=room.lock.rotationY;
    rounded(dial,room.lock.width+.024,room.lock.height+.023,.044,0,0,-.023,foot,.009);
    const screen=patchPlane(dial,room.lock.width,room.lock.height,0,0,.003,imageMap(schoolLockArt(room,[])));
    function setBalance(places){
      BALANCE_SCALES.forEach((scale,i)=>{
        const {angle}=readBalance(scale,places),{beam,pans}=devices[i];
        beam.rotation.z=-angle;
        [scale.left,scale.right].forEach((place,j)=>{
          const pan=pans[j],side=j===0?-1:1;
          pan.position.set(side*halfArm*Math.cos(angle),axleHeight-side*halfArm*Math.sin(angle),0);
          const ids=beads.map((_,id)=>id).filter(id=>places[id]===place);
          const slots=beadSlots(ids.length,j===1);
          ids.forEach((id,k)=>{
            pan.add(beads[id]);
            beads[id].position.set(slots[k].x*.00225,-.177+.031+Math.floor(k/(j===1?3:4))*.042,.019);
          });
        });
      });
      const loose=beads.map((_,id)=>id).filter(id=>places[id]==='tray');
      loose.forEach((id,k)=>{
        tray.add(beads[id]);beads[id].position.set((k-(loose.length-1)/2)*.067,.055,0);
      });
    }
    setBalance(initialBeadPlaces());
    return {setBalance,setDigits(values){
      screen.material.map.image=schoolLockArt(room,values);screen.material.map.needsUpdate=true;
    }};
  }

  function paint(canvas,scale,angle){
    const g=canvas.getContext('2d');
    g.setTransform(canvas.width/viewWidth,0,0,canvas.height/viewHeight,0,0);
    g.clearRect(0,0,viewWidth,viewHeight);
    function gradient(y1,y2,stops){
      const fill=g.createLinearGradient(0,y1,0,y2);stops.forEach(([at,color])=>fill.addColorStop(at,color));return fill;
    }
    function path(points,fill,stroke,width=1){
      g.beginPath();points(g);
      if(fill){g.fillStyle=fill;g.fill()}
      if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke()}
    }
    function rounded(x,y,w,h,r,fill){
      path(p=>p.roundRect(x,y,w,h,r),fill);
    }
    const silver=gradient(27,51,[[0,'#657887'],[.43,'#eef2f1'],[.62,'#aec0cc'],[1,'#506776']]);
    const metal=gradient(124,154,[[0,'#547ba5'],[.33,'#386296'],[.66,'#264d7d'],[1,'#193b60']]);
    g.lineJoin='round';g.lineCap='round';
    path(p=>p.ellipse(160,155,97,6,0,0,2*Math.PI),'#27405b18');
    rounded(108,144,104,11,5,'#34444e');rounded(112,137,96,13,5,metal);
    path(p=>{p.moveTo(153,39);p.lineTo(167,39);p.lineTo(174,131);p.quadraticCurveTo(185,132,189,140);
      p.lineTo(131,140);p.quadraticCurveTo(135,132,146,131);p.closePath()},'#31619b','#274c75',1.5);
    path(p=>{p.moveTo(155,51);p.lineTo(152,127)},null,'#7d9fbd',2);
    path(p=>{p.moveTo(150,21);p.quadraticCurveTo(160,16,170,21)},null,'#839297',1.3);
    for(let i=-1;i<=1;i++)path(p=>{p.moveTo(160+i*8,18+Math.abs(i)*2);p.lineTo(160+i*7,22+Math.abs(i)*2)},null,'#657681',1.5);
    g.save();g.translate(160,pivotY);g.rotate(angle);
    path(p=>{p.moveTo(-arm,2);p.lineTo(-arm,-2);p.lineTo(0,-5);p.lineTo(arm,-2);p.lineTo(arm,2);
      p.lineTo(0,5);p.closePath()},silver,'#647985',1.2);
    path(p=>{p.moveTo(0,-19);p.lineTo(2,-3);p.lineTo(-2,-3);p.closePath()},'#8d6735');
    g.restore();
    path(p=>p.arc(160,pivotY,6.1,0,2*Math.PI),'#d7a44f','#806636',1.5);
    for(const side of [-1,1]){
      const {x,y}=panPoint(side,angle),lip=y+panOffset;
      for(const dx of [-53,53])path(p=>{p.moveTo(x,y+3);p.lineTo(x+dx,lip)},null,'#8a9ba5',1.7);
      path(p=>p.arc(x,y,3.3,0,2*Math.PI),'#cbd7db','#667984',1.1);
      const bowl=gradient(lip-1,lip+13,[[0,'#e0e8e9'],[.4,'#bac8cc'],[1,'#6d818b']]);
      path(p=>{p.moveTo(x-58,lip);p.lineTo(x+58,lip);p.quadraticCurveTo(x+49,lip+12,x+20,lip+13);
        p.lineTo(x-20,lip+13);p.quadraticCurveTo(x-49,lip+12,x-58,lip);p.closePath()},bowl,'#788a95',1.3);
      path(p=>{p.moveTo(x-56,lip+1);p.lineTo(x+56,lip+1)},null,'#f3f6f5',2);
      if(side===1){
        const cx=x+36;
        rounded(cx-6,lip-34,12,5,2,'#82663e');rounded(cx-8,lip-38,16,6,2,'#bc9655');
        rounded(cx-14,lip-30,28,29,3,gradient(lip-30,lip,[[0,'#eace93'],[.6,'#c6a163'],[1,'#967442']]));
        g.fillStyle='#3c3425';g.textAlign='center';g.font='bold 12px Arial';g.fillText(scale.weight+' g',cx,lip-11);
      }
    }
  }

  function open(host,initial,onChange){
    let places=initial.slice(),selected=null,drag=null,frame=0;
    const root=document.createElement('div');root.className='balance-experiment';
    root.innerHTML='<p class="balance-direction" id="balanceHelp">구슬을 끌어 옮기세요. 구슬을 누른 뒤 놓을 곳을 눌러도 돼요.</p>'+
      '<div class="balance-pair"></div><div class="balance-tray" data-holder="tray">'+
      '<button type="button" class="tray-target" data-place="tray">구슬 받침</button><div class="balance-loose"></div></div>'+
      '<div class="balance-tools"><button type="button" class="balance-restore">처음 배치로</button></div>';
    host.replaceChildren(root);
    const pair=root.querySelector('.balance-pair'),tray=root.querySelector('.balance-loose');
    const stations=BALANCE_SCALES.map(scale=>{
      const section=document.createElement('section');section.className='balance-station';
      section.innerHTML='<header><h2>'+scale.label+'</h2><output aria-live="polite"></output></header>'+
        '<div class="balance-machine"><canvas width="800" height="415" aria-hidden="true"></canvas></div>';
      pair.append(section);
      const machine=section.querySelector('.balance-machine');
      const pans=[scale.left,scale.right].map((place,j)=>{
        const target=document.createElement('button');target.type='button';target.className='pan-target';
        target.dataset.place=place;
        const label=scale.label+' '+(j?'오른쪽':'왼쪽')+' 접시';
        target.setAttribute('aria-label',label);
        if(j===1)target.setAttribute('aria-description',scale.weight+'그램 추가 놓여 있어요.');
        machine.append(target);return target;
      });
      return {scale,machine,pans,canvas:machine.querySelector('canvas'),status:section.querySelector('output'),angle:0};
    });
    const beads=BALANCE_BEADS.map(({color},i)=>{
      const bead=document.createElement('button');bead.type='button';bead.className='balance-bead '+color;
      bead.dataset.bead=String(i);bead.setAttribute('aria-pressed','false');return bead;
    });
    function select(id){
      selected=id;beads.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===id)));
      root.classList.toggle('carrying',id!==null);
    }
    function render(){
      stations.forEach(({scale,machine,pans,canvas,angle})=>{
        paint(canvas,scale,angle);
        pans.forEach((pan,j)=>{
          const {x,y}=panPoint(j===0?-1:1,angle),lip=y+panOffset;
          pan.style.left=x/viewWidth*100+'%';pan.style.top=(lip+14)/viewHeight*100+'%';
          const ids=beads.map((_,i)=>i).filter(i=>places[i]===pan.dataset.place);
          const slots=beadSlots(ids.length,j===1);
          ids.forEach((id,k)=>{
            const bead=beads[id];
            if(bead.parentNode!==machine)machine.append(bead);
            bead.style.left=(x+slots[k].x)/viewWidth*100+'%';
            bead.style.top=(lip-slots[k].y)/viewHeight*100+'%';
            bead.setAttribute('aria-label',colors[BALANCE_BEADS[id].color]+', '+pan.getAttribute('aria-label'));
          });
        });
      });
      beads.forEach((bead,i)=>{
        if(places[i]==='tray'&&bead.parentNode!==tray){
          tray.append(bead);bead.style.removeProperty('left');bead.style.removeProperty('top');
          bead.setAttribute('aria-label',colors[BALANCE_BEADS[i].color]+', 구슬 받침');
        }
      });
    }
    function update(animate){
      cancelAnimationFrame(frame);
      const start=performance.now(),from=stations.map(s=>s.angle);
      const target=stations.map(station=>{
        const {left,right,angle}=readBalance(station.scale,places);
        station.status.textContent=left===right?'수평':(left>right?'왼쪽':'오른쪽')+'이 무거워요';
        return angle;
      });
      function draw(time){
        if(!root.isConnected)return;
        const t=animate?Math.min(1,(time-start)/280):1;
        stations.forEach((station,i)=>{station.angle=from[i]+(target[i]-from[i])*(1-(1-t)**3)});
        render();if(t<1)frame=requestAnimationFrame(draw);
      }
      draw(start);
    }
    function commit(next){
      if(!onChange(next))return;
      places=next;select(null);update(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    function place(id,holder){
      if(!holder||id===null)return;
      if(places[id]===holder){select(null);return}
      const next=places.slice();next[id]=holder;commit(next);
    }
    function holderAt(x,y){
      const hit=document.elementFromPoint(x,y);
      if(!hit||!root.contains(hit))return null;
      const bead=hit.closest('[data-bead]');
      if(bead)return places[Number(bead.dataset.bead)];
      const holder=hit.closest('[data-place],[data-holder]');
      return holder?.dataset.place??holder?.dataset.holder;
    }
    function highlight(holder){
      root.querySelectorAll('[data-place]').forEach(target=>target.classList.toggle('drop-over',target.dataset.place===holder));
    }
    function release(){
      if(!drag)return;
      drag.ghost?.remove();beads[drag.id].classList.remove('lifted');drag=null;highlight(null);
    }
    beads.forEach((button,id)=>{
      button.onclick=event=>{if(event.detail===0)select(selected===id?null:id)};
      button.onpointerdown=event=>{
        if(!event.isPrimary||event.button!==0)return;
        drag={id,pointer:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
        button.setPointerCapture(event.pointerId);
      };
      button.onpointermove=event=>{
        if(!drag||drag.pointer!==event.pointerId)return;
        if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<5)return;
        if(!drag.ghost){
          const ghost=document.createElement('span');ghost.className='balance-ghost '+BALANCE_BEADS[id].color;
          ghost.style.width=button.getBoundingClientRect().width+'px';root.append(ghost);
          drag.ghost=ghost;button.classList.add('lifted');select(id);
        }
        drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
        highlight(holderAt(event.clientX,event.clientY));
      };
      button.onpointerup=event=>{
        if(!drag||drag.pointer!==event.pointerId)return;
        const moved=!!drag.ghost,holder=moved&&holderAt(event.clientX,event.clientY);
        release();
        if(moved)place(id,holder);else select(selected===id?null:id);
      };
      button.onpointercancel=button.onlostpointercapture=release;
    });
    root.querySelectorAll('[data-place]').forEach(target=>{target.onclick=()=>place(selected,target.dataset.place)});
    root.querySelector('.balance-restore').onclick=()=>commit(initialBeadPlaces());
    update(false);
  }
  return {build,open};
})();
