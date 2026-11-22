'use strict';

// The renderer owns the canvas, shaders, GPU uploads and both draw passes.
// Room builders only supply meshes, materials, lights and camera poses.
globalThis.SchoolWebGL={
  create(canvas){
    const gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,powerPreference:'high-performance'});
    if(!gl)throw new Error('WebGL을 시작할 수 없습니다.');
    const {mat4,mat3,vec3}=glMatrix;
    const layout=['aPosition','aNormal','aUv','aI0','aI1','aI2','aI3','aTint'];
    const identity=mat4.create(),normal=mat3.create(),lightVP=mat4.create();
    const enabledAttributes=new Set(),textureBindings=[];
    let program,shadowProgram,extInstances,anisotropy,wideIndex,white;
    let buffers,textures,shadowCache,lastGeometry,lastInstances,lastScene,lastCamera;
    let ratio=1,width=canvas.width,height=canvas.height,lost=false;
    const shadowMap={needsUpdate:false};

    function compile(vertex,fragment){
      const p=gl.createProgram();
      for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
        const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
        gl.attachShader(p,shader);gl.deleteShader(shader);
      }
      layout.forEach((name,i)=>gl.bindAttribLocation(p,i,name));gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
      const locations={};
      for(let i=0;i<gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);i++){
        const name=gl.getActiveUniform(p,i).name;
        locations[name.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,name);
      }
      return {id:p,uniform:locations};
    }
    function initialize(){
      extInstances=gl.getExtension('ANGLE_instanced_arrays');
      anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');
      wideIndex=gl.getExtension('OES_element_index_uint');
      const derivatives=gl.getExtension('OES_standard_derivatives')?'#extension GL_OES_standard_derivatives : enable\n':'';
      program=compile(SchoolShaders.vertex,derivatives+SchoolShaders.fragment);
      shadowProgram=compile(SchoolShaders.shadowVertex,SchoolShaders.shadowFragment);
      buffers=new WeakMap();textures=new WeakMap();shadowCache=new WeakMap();
      enabledAttributes.clear();textureBindings.length=0;lastGeometry=null;lastInstances=undefined;
      white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,white);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.useProgram(program.id);
      ['uMap','uEmissionMap','uBump','uEnvironment','uShadow'].forEach((name,i)=>gl.uniform1i(program.uniform[name],i));
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    }
    function bindTexture(slot,texture){
      if(textureBindings[slot]===texture)return;
      gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,texture);textureBindings[slot]=texture;
    }
    function imageTexture(map,slot){
      if(!map?.image){bindTexture(slot,white);return}
      let data=textures.get(map);
      if(!data){
        data={handle:gl.createTexture(),version:-1};textures.set(map,data);
        map.release=()=>{gl.deleteTexture(data.handle);textures.delete(map)};
      }
      bindTexture(slot,data.handle);
      if(data.version===map.version&&data.image===map.image)return;
      gl.activeTexture(gl.TEXTURE0+slot);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,map.image);
      const power=n=>n>0&&(n&(n-1))===0;
      const mip=power(map.image.width)&&power(map.image.height);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,mip&&map.wrapS==='repeat'?gl.REPEAT:gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,mip&&map.wrapT==='repeat'?gl.REPEAT:gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
      if(mip)gl.generateMipmap(gl.TEXTURE_2D);
      if(anisotropy&&map.anisotropy>1)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,map.anisotropy));
      data.version=map.version;data.image=map.image;
    }
    function upload(key,array,version,target){
      let record=buffers.get(key);
      if(!record){record={handle:gl.createBuffer(),version:-1};buffers.set(key,record)}
      if(record.version!==version){
        gl.bindBuffer(target,record.handle);gl.bufferData(target,array,record.version<0?gl.STATIC_DRAW:gl.DYNAMIC_DRAW);
        record.version=version;
      }
      return record.handle;
    }
    function attribute(index,enabled){
      if(enabled===enabledAttributes.has(index))return;
      if(enabled){gl.enableVertexAttribArray(index);enabledAttributes.add(index)}
      else{gl.disableVertexAttribArray(index);enabledAttributes.delete(index)}
    }
    function bindGeometry(geom){
      if(lastGeometry===geom)return;
      for(const [i,name] of ['position','normal','uv'].entries()){
        const a=geom.attributes[name];attribute(i,!!a);
        if(!a)continue;
        gl.bindBuffer(gl.ARRAY_BUFFER,upload(a,a.array,a.version,gl.ARRAY_BUFFER));
        gl.vertexAttribPointer(i,a.itemSize,gl.FLOAT,false,0,0);
      }
      if(geom.index)gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,upload(geom.index,geom.index,0,gl.ELEMENT_ARRAY_BUFFER));
      lastGeometry=geom;
    }
    function constInstance(m,c){
      for(let i=0;i<4;i++)gl.vertexAttrib4f(3+i,m[i*4],m[i*4+1],m[i*4+2],m[i*4+3]);
      gl.vertexAttrib3f(7,c?c[0]:1,c?c[1]:1,c?c[2]:1);
    }
    function bindInstances(mesh){
      const inst=mesh.isInstancedMesh&&extInstances?mesh:null;
      if(lastInstances===inst)return;
      if(inst){
        const generation=inst.instanceVersion;
        const mb=upload(inst.transforms,inst.transforms,generation,gl.ARRAY_BUFFER);
        const cb=upload(inst.colors,inst.colors,generation,gl.ARRAY_BUFFER);
        gl.bindBuffer(gl.ARRAY_BUFFER,mb);
        for(let i=0;i<4;i++){attribute(3+i,true);gl.vertexAttribPointer(3+i,4,gl.FLOAT,false,64,i*16);extInstances.vertexAttribDivisorANGLE(3+i,1)}
        gl.bindBuffer(gl.ARRAY_BUFFER,cb);attribute(7,true);gl.vertexAttribPointer(7,3,gl.FLOAT,false,0,0);extInstances.vertexAttribDivisorANGLE(7,1);
      }else{
        for(let i=3;i<=7;i++){attribute(i,false);extInstances?.vertexAttribDivisorANGLE(i,0)}
        constInstance(identity);
      }
      lastInstances=inst;
    }
    function draw(mesh,start,count){
      const g=mesh.geometry;bindGeometry(g);bindInstances(mesh);
      const indexed=g.index,bytes=indexed?.BYTES_PER_ELEMENT;
      if(bytes===4&&!wideIndex)throw new Error('This mesh needs 32-bit indices.');
      const type=bytes===4?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;
      if(mesh.isInstancedMesh&&extInstances){
        if(indexed)extInstances.drawElementsInstancedANGLE(gl.TRIANGLES,count,type,start*bytes,mesh.count);
        else extInstances.drawArraysInstancedANGLE(gl.TRIANGLES,start,count,mesh.count);
      }else{
        const number=mesh.isInstancedMesh?mesh.count:1;
        for(let i=0;i<number;i++){
          if(mesh.isInstancedMesh)constInstance(mesh.transforms.subarray(i*16,i*16+16),mesh.colors.subarray(i*3,i*3+3));
          if(indexed)gl.drawElements(gl.TRIANGLES,count,type,start*bytes);else gl.drawArrays(gl.TRIANGLES,start,count);
        }
        if(mesh.isInstancedMesh)constInstance(identity);
      }
    }
    function makeShadow(light){
      const size=Math.min(light.shadow.mapSize.x,gl.getParameter(gl.MAX_TEXTURE_SIZE));
      const texture=gl.createTexture();bindTexture(4,texture);gl.activeTexture(gl.TEXTURE4);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      for(const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,param,gl.NEAREST);
      for(const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);
      const depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depth);
      gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,size,size);
      const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('WebGL shadow framebuffer incomplete');
      return {texture,fbo,size};
    }
    const position=node=>{const m=node.matrixWorld.elements;return [m[12],m[13],m[14]]};
    const triangleCount=g=>g.index?g.index.length:g.attributes.position.count;
    function shadowPass(light,meshes){
      const settings=light.shadow;
      let entry=shadowCache.get(light);
      if(entry&&settings.autoUpdate===false&&!settings.needsUpdate&&!shadowMap.needsUpdate)return entry;
      if(!entry){entry=makeShadow(light);shadowCache.set(light,entry)}
      const c=settings.camera,view=mat4.create(),proj=mat4.create();
      mat4.lookAt(view,position(light),position(light.target),[0,1,0]);mat4.ortho(proj,c.left,c.right,c.bottom,c.top,c.near,c.far);
      mat4.multiply(lightVP,proj,view);
      gl.bindFramebuffer(gl.FRAMEBUFFER,entry.fbo);gl.viewport(0,0,entry.size,entry.size);
      gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);
      gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(shadowProgram.id);gl.uniformMatrix4fv(shadowProgram.uniform.uViewProjection,false,lightVP);
      for(const mesh of meshes)if(mesh.castShadow){
        gl.uniformMatrix4fv(shadowProgram.uniform.uModel,false,mesh.matrixWorld.elements);draw(mesh,0,triangleCount(mesh.geometry));
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);settings.needsUpdate=false;shadowMap.needsUpdate=false;
      return entry;
    }
    function lights(uniform,objects){
      const sky=[0,0,0],ground=[0,0,0],suns=[],points=[];
      for(const light of objects){
        const intensity=light.intensity,color=light.color.toArray().map(c=>c*intensity);
        if(light.lightType==='sky'){
          light.groundColor.toArray().forEach((c,i)=>{sky[i]+=color[i];ground[i]+=c*intensity});
        }else if(light.lightType==='directional'){
          const direction=vec3.subtract(vec3.create(),position(light),position(light.target));vec3.normalize(direction,direction);
          if(light.castShadow)suns.unshift({direction,color,light});else suns.push({direction,color,light});
        }else points.push({position:position(light),color,range:light.distance});
      }
      gl.uniform3fv(uniform.uSky,sky);gl.uniform3fv(uniform.uGround,ground);
      gl.uniform3fv(uniform.uSun,[0,1,2].flatMap(i=>Array.from(suns[i]?.direction??[0,1,0])));
      gl.uniform3fv(uniform.uSunColor,[0,1,2].flatMap(i=>suns[i]?.color??[0,0,0]));
      gl.uniform3fv(uniform.uPoint,[0,1].flatMap(i=>points[i]?.position??[0,0,0]));
      gl.uniform3fv(uniform.uPointColor,[0,1].flatMap(i=>points[i]?.color??[0,0,0]));
      gl.uniform2f(uniform.uRange,points[0]?.range??0,points[1]?.range??0);
    }
    function frustumPlanes(matrix){
      const planes=[];
      for(let i=0;i<3;i++)for(const sign of [-1,1]){
        const plane=[0,4,8,12].map(j=>matrix[j+3]+sign*matrix[j+i]);
        planes.push(plane);
      }
      return planes;
    }
    function inView(mesh,planes){
      if(mesh.isInstancedMesh)return true;
      const g=mesh.geometry,version=g.attributes.position.version;
      let box=mesh._worldBounds;
      if(!box||box.world!==mesh.worldVersion||box.vertices!==version){
        const b=g.bounds,m=mesh.matrixWorld.elements,x=(b[0]+b[3])/2,y=(b[1]+b[4])/2,z=(b[2]+b[5])/2;
        const w=(b[3]-b[0])/2,h=(b[4]-b[1])/2,d=(b[5]-b[2])/2;
        box={world:mesh.worldVersion,vertices:version,center:[],extent:[]};
        for(let i=0;i<3;i++){
          box.center[i]=m[i]*x+m[i+4]*y+m[i+8]*z+m[i+12];
          box.extent[i]=Math.abs(m[i])*w+Math.abs(m[i+4])*h+Math.abs(m[i+8])*d;
        }
        mesh._worldBounds=box;
      }
      const [x,y,z]=box.center,[w,h,d]=box.extent;
      return planes.every(([a,b,c,e])=>a*x+b*y+c*z+e+Math.abs(a)*w+Math.abs(b)*h+Math.abs(c)*d>=0);
    }
    const materialIds=new WeakMap();let nextMaterial=1;
    function render(scene,camera){
      if(lost)return;
      lastScene=scene;lastCamera=camera;scene.updateMatrixWorld();camera.updateMatrixWorld();
      lastGeometry=null;lastInstances=undefined;
      const meshes=[],sources=[];
      scene.traverseVisible(node=>{if(node.isMesh)meshes.push(node);else if(node.lightType)sources.push(node)});
      const caster=sources.find(light=>light.lightType==='directional'&&light.castShadow);
      const shadow=caster?shadowPass(caster,meshes):null;
      gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program.id);
      gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
      const bg=scene.background?.getHexString()??'000000',value=parseInt(bg,16);
      gl.clearColor(((value>>16)&255)/255,((value>>8)&255)/255,(value&255)/255,1);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const u=program.uniform;lights(u,sources);
      gl.uniformMatrix4fv(u.uViewProjection,false,camera.viewProjection);gl.uniform3fv(u.uEye,position(camera));
      gl.uniformMatrix4fv(u.uLightProjection,false,lightVP);gl.uniform2f(u.uShadowStep,1/(shadow?.size??1),1/(shadow?.size??1));
      gl.uniform2f(u.uShadowBias,caster?.shadow.bias??0,caster?.shadow.normalBias??0);
      bindTexture(4,shadow?.texture??white);imageTexture(scene.environment,3);
      const opaque=[],transparent=[],planes=frustumPlanes(camera.viewProjection),view=camera.view;
      for(const mesh of meshes){
        if(!inView(mesh,planes))continue;
        const g=mesh.geometry,m=mesh.matrixWorld.elements;
        const z=view[2]*m[12]+view[6]*m[13]+view[10]*m[14]+view[14];
        const enqueue=(material,start,count)=>{
          if(!material||!material.visible)return;
          if(!materialIds.has(material))materialIds.set(material,nextMaterial++);
          (material.transparent?transparent:opaque).push({mesh,material,start,count,z,id:materialIds.get(material)});
        };
        if(Array.isArray(mesh.material)){
          for(const group of g.groups)enqueue(mesh.material[group.materialIndex],group.start,group.count);
        }else enqueue(mesh.material,0,triangleCount(g));
      }
      opaque.sort((a,b)=>a.mesh.renderOrder-b.mesh.renderOrder||a.id-b.id);
      transparent.sort((a,b)=>a.mesh.renderOrder-b.mesh.renderOrder||a.z-b.z);
      let prevMaterial=null,prevShadow=null,prevMesh=null;
      for(const list of [opaque,transparent]){
        if(list===transparent)gl.enable(gl.BLEND);else gl.disable(gl.BLEND);
        for(const {mesh,material:m,start,count} of list){
          if(prevMesh!==mesh){
            const matrix=mesh.matrixWorld.elements;
            gl.uniformMatrix4fv(u.uModel,false,matrix);
            gl.uniformMatrix3fv(u.uNormal,false,mat3.normalFromMat4(normal,matrix)??normal);
            gl.frontFace(mat4.determinant(matrix)<0?gl.CW:gl.CCW);prevMesh=mesh;
          }
          if(prevMaterial!==m){
            imageTexture(m.map,0);imageTexture(m.emissiveMap,1);imageTexture(m.bumpMap,2);
            gl.uniform2f(u.uRepeat,m.map?.repeat.x??1,m.map?.repeat.y??1);
            gl.uniform2f(u.uBumpRepeat,m.bumpMap?.repeat.x??1,m.bumpMap?.repeat.y??1);
            gl.uniform3f(u.uColor,m.color.r,m.color.g,m.color.b);
            gl.uniform3f(u.uEmission,m.emissive.r*m.emissiveIntensity,m.emissive.g*m.emissiveIntensity,m.emissive.b*m.emissiveIntensity);
            gl.uniform4f(u.uSurface,m.isMeshStandardMaterial?1:0,m.roughness,m.metalness,scene.environment?(m.envMapIntensity??1):0);
            gl.depthMask(m.depthWrite);if(m.depthTest)gl.enable(gl.DEPTH_TEST);else gl.disable(gl.DEPTH_TEST);
            if(m.side===2)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK)}
          }
          if(prevMaterial!==m||prevShadow!==mesh.receiveShadow){
            gl.uniform4f(u.uAlpha,m.opacity,m.alphaTest,m.bumpMap?(m.bumpScale??1):0,shadow&&mesh.receiveShadow?1:0);
            prevShadow=mesh.receiveShadow;
          }
          prevMaterial=m;draw(mesh,start,count);
        }
      }
      canvas.dataset.renderer='native-webgl';
    }
    function resize(){
      const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
      if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    }
    initialize();
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true});
    canvas.addEventListener('webglcontextrestored',()=>{initialize();lost=false;if(lastScene)render(lastScene,lastCamera)});
    return {render,getContext:()=>gl,shadowMap,getPixelRatio:()=>ratio,
      setPixelRatio(value){if(value!==ratio){ratio=value;resize()}},
      setSize(w,h){width=w;height=h;resize()}};
  }
};
