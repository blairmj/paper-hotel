'use strict';

const SchoolShaders=(()=>{
  const vertex=`
    precision highp float;
    attribute vec3 aPosition, aNormal, aTint;
    attribute vec2 aUv;
    attribute vec4 aI0, aI1, aI2, aI3;
    uniform mat4 uViewProjection, uModel;
    uniform mat3 uNormal;
    varying vec2 vUv;
    varying vec3 vWorld, vNormal, vTint;
    void main(){
      mat4 instance=mat4(aI0,aI1,aI2,aI3);
      vec4 p=uModel*instance*vec4(aPosition,1.);
      // Cofactors support rotated or non-uniformly scaled desks and book spines.
      mat3 normalBasis=mat3(cross(aI1.xyz,aI2.xyz),cross(aI2.xyz,aI0.xyz),cross(aI0.xyz,aI1.xyz));
      vNormal=normalize(uNormal*normalBasis*aNormal);
      vWorld=p.xyz;vUv=aUv;vTint=aTint;
      gl_Position=uViewProjection*p;
    }`;
  const fragment=`
    precision highp float;
    varying vec2 vUv;
    varying vec3 vWorld,vNormal,vTint;
    uniform sampler2D uMap,uEmissionMap,uBump,uEnvironment,uShadow;
    uniform vec3 uColor,uEmission,uSky,uGround,uEye;
    uniform vec3 uSun[3],uSunColor[3],uPoint[2],uPointColor[2];
    uniform vec2 uRange,uRepeat,uBumpRepeat,uShadowStep;
    uniform vec4 uSurface; // lit, roughness, metalness, environment strength
    uniform vec4 uAlpha;   // opacity, alpha test, bump scale, shadow enabled
    uniform vec2 uShadowBias;
    uniform mat4 uLightProjection;
    vec3 linearColor(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
    vec3 displayColor(vec3 c){c=max(c,vec3(0.));return mix(12.92*c,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
    float projectedShadow(vec3 normal){
      if(uAlpha.w==0.)return 1.;
      vec4 light=uLightProjection*vec4(vWorld+normal*uShadowBias.y,1.);
      vec3 q=light.xyz/light.w*.5+.5;
      if(any(lessThan(q,vec3(0.)))||any(greaterThan(q,vec3(1.))))return 1.;
      float sum=0.;
      for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
        vec4 depth=texture2D(uShadow,q.xy+vec2(float(x),float(y))*uShadowStep);
        sum+=step(q.z+uShadowBias.x,dot(depth,vec4(1.,1./255.,1./65025.,1./16581375.)));
      }
      return sum/9.;
    }
    vec3 illuminate(vec3 l,vec3 light,vec3 n,vec3 v,vec3 albedo){
      float ndl=max(dot(n,l),0.);
      vec3 h=normalize(l+v);
      float rough=clamp(uSurface.y,.08,1.),a2=pow(rough,4.);
      float ndh=max(dot(n,h),0.),ndv=max(dot(n,v),.001),vdh=max(dot(v,h),0.);
      float denom=ndh*ndh*(a2-1.)+1.;
      float d=a2/(3.14159*denom*denom+.000001);
      float gv=ndl*sqrt(a2+(1.-a2)*ndv*ndv),gl=ndv*sqrt(a2+(1.-a2)*ndl*ndl);
      vec3 f0=mix(vec3(.04),albedo,uSurface.z);
      vec3 f=f0+(1.-f0)*pow(1.-vdh,5.);
      return ndl*light*(albedo*(1.-uSurface.z)/3.14159+d*f*.5/max(.0001,gv+gl));
    }
    void main(){
      vec4 tex=texture2D(uMap,vUv*uRepeat);
      float opacity=tex.a*uAlpha.x;if(opacity<uAlpha.y)discard;
      vec3 albedo=uColor*vTint*linearColor(tex.rgb),result=albedo;
      if(uSurface.x>.5){
        vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
        #ifdef GL_OES_standard_derivatives
        if(uAlpha.z!=0.){
          vec2 uv=vUv*uBumpRepeat;
          float h=texture2D(uBump,uv).r;
          vec2 offset=vec2(texture2D(uBump,uv+dFdx(uv)).r-h,texture2D(uBump,uv+dFdy(uv)).r-h)*uAlpha.z;
          vec3 sx=dFdx(vWorld),sy=dFdy(vWorld),r1=cross(sy,n),r2=cross(n,sx);
          float det=dot(sx,r1);
          n=normalize(abs(det)*n-sign(det)*(offset.x*r1+offset.y*r2));
        }
        #endif
        vec3 v=normalize(uEye-vWorld);
        result=albedo*(1.-uSurface.z)*mix(uGround,uSky,.5+.5*n.y)/3.14159;
        float shadow=projectedShadow(n);
        for(int i=0;i<3;i++)result+=illuminate(uSun[i],uSunColor[i],n,v,albedo)*(i==0?shadow:1.);
        for(int i=0;i<2;i++){
          vec3 delta=uPoint[i]-vWorld;float dist=max(.01,length(delta));
          float fade=uRange[i]>0.?pow(clamp(1.-pow(dist/uRange[i],4.),0.,1.),2.):1.;
          result+=illuminate(delta/dist,uPointColor[i]*fade/max(.01,dist*dist),n,v,albedo);
        }
        if(uSurface.w>0.){
          vec3 r=reflect(-v,n);vec2 uv=vec2(atan(r.z,r.x)/6.283185+.5,asin(clamp(r.y,-1.,1.))/3.14159+.5);
          vec3 env=linearColor(texture2D(uEnvironment,uv,uSurface.y*6.).rgb);
          result+=uSurface.w*(env*mix(vec3(.04),albedo,uSurface.z)+.10*albedo*(1.-uSurface.z));
        }
        result+=uEmission*linearColor(texture2D(uEmissionMap,vUv*uRepeat).rgb);
      }
      gl_FragColor=vec4(displayColor(result),opacity);
    }`;
  const shadowVertex=`
    attribute vec3 aPosition;
    attribute vec4 aI0,aI1,aI2,aI3;
    uniform mat4 uViewProjection,uModel;
    void main(){gl_Position=uViewProjection*uModel*mat4(aI0,aI1,aI2,aI3)*vec4(aPosition,1.);}
  `;
  const shadowFragment=`
    precision highp float;
    void main(){
      vec4 d=fract(gl_FragCoord.z*vec4(1.,255.,65025.,16581375.));
      gl_FragColor=d-d.yzww*vec4(1./255.,1./255.,1./255.,0.);
    }`;
  return {vertex,fragment,shadowVertex,shadowFragment};
})();
