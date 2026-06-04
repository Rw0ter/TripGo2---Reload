// VR 全景内嵌文档 —— 用 Three.js 渲染等距柱状投影 360° 全景图。
// web 用 <iframe srcDoc>，原生用 WebView source={{ html }}。
// 通过 postMessage 桥与 React 层双向通信。

export const EVENT_TAG = 'vr-viewer';
export const COMMAND_TAG = 'vr-cmd';

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';

export interface PanoramaParams {
  image: string;   // 全景图 URL（后端 /static/legacy/ 下的文件）
  name: string;
  city: string;
  weather: string;
  apiBase: string; // 后端基址，用于拼接图片 URL
}

export function buildPanoramaHtml(p: PanoramaParams): string {
  const imgUrl = `${p.apiBase}/static/legacy/${p.image}`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>${p.name}</title>
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#000;
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
  -webkit-tap-highlight-color:transparent;touch-action:none;
  -webkit-user-select:none;user-select:none}
canvas{display:block;position:fixed;inset:0}

#loading{position:fixed;inset:0;z-index:200;background:#0a0a12;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  transition:opacity .7s,visibility .7s}
#loading.done{opacity:0;visibility:hidden;pointer-events:none}
.ring{width:48px;height:48px;border:3px solid rgba(255,255,255,.07);
  border-top-color:#40CEA7;border-right-color:#38bdf8;border-radius:50%;
  animation:spin 1.1s infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.prog-text{margin-top:14px;color:rgba(255,255,255,.4);font-size:12px;letter-spacing:.8px}
.scene-name{color:rgba(255,255,255,.15);font-size:20px;font-weight:700;margin-top:24px;letter-spacing:1px}

#vignette{position:fixed;inset:0;z-index:2;pointer-events:none;
  background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.45) 100%)}
#top-bar{position:fixed;top:0;left:0;right:0;z-index:10;pointer-events:none;
  background:linear-gradient(to bottom,rgba(0,0,0,.55) 0%,transparent 100%);height:130px}
#bottom-bar{position:fixed;bottom:0;left:0;right:0;z-index:10;pointer-events:none;
  background:linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 100%);height:160px}

.ctrl-overlay{position:fixed;top:max(12px,env(safe-area-inset-top));left:0;right:0;z-index:20;
  display:flex;align-items:center;justify-content:space-between;padding:0 14px}
.ctrl-btn{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.15);
  background:rgba(0,0,0,.25);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .2s;-webkit-tap-highlight-color:transparent;outline:none;pointer-events:auto}
.ctrl-btn:active{background:rgba(255,255,255,.2);transform:scale(.9)}
.ctrl-btn.on{background:rgba(64,206,167,.3);border-color:rgba(64,206,167,.5);color:#40CEA7}
.ctrl-group{display:flex;gap:8px}
.hud-title{color:#fff;font-size:15px;font-weight:600;letter-spacing:.5px;
  text-shadow:0 1px 12px rgba(0,0,0,.7)}

#gesture-hint{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:8;
  color:rgba(255,255,255,.45);font-size:11px;letter-spacing:.5px;pointer-events:none;
  transition:opacity .8s}
#gesture-hint.fade{opacity:0}

.hotspot{position:fixed;z-index:5;pointer-events:auto;cursor:pointer;transform:translate(-50%,-50%)}
.hotspot-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.7);
  box-shadow:0 0 20px rgba(64,206,167,.3);animation:pulse 2.4s infinite}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.7}}
.hotspot-label{position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);
  white-space:nowrap;color:#fff;font-size:11px;font-weight:500;
  background:rgba(0,0,0,.5);padding:3px 10px;border-radius:99px;border:1px solid rgba(255,255,255,.1)}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div id="loading">
  <div class="ring"></div>
  <div class="prog-text">全景加载中…</div>
  <div class="scene-name">${p.name}</div>
</div>
<div id="vignette"></div>
<div id="top-bar"></div>
<div id="bottom-bar"></div>

<div class="ctrl-overlay">
  <button class="ctrl-btn" id="btn-back">✕</button>
  <span class="hud-title">${p.name}</span>
  <div class="ctrl-group">
    <button class="ctrl-btn on" id="btn-rotate">↻</button>
    <button class="ctrl-btn" id="btn-fs">⛶</button>
  </div>
</div>
<div id="gesture-hint">↔ 拖动查看 · 双指缩放</div>
<div id="hotspots-container"></div>

<script src="${THREE_CDN}"></script>
<script>
(function(){
  'use strict';
  var canvas=document.getElementById('c');
  var loading=document.getElementById('loading');
  var hint=document.getElementById('gesture-hint');
  var hotsCtr=document.getElementById('hotspots-container');
  var btnBack=document.getElementById('btn-back');
  var btnRotate=document.getElementById('btn-rotate');
  var btnFS=document.getElementById('btn-fs');

  var autoRotate=true;
  var lon=180,lat=0,targetLon=180,targetLat=0;
  var fov=75,targetFov=75;
  var isDragging=false,dragStartX=0,dragStartY=0,dragStartLon=0,dragStartLat=0;
  var velocityX=0,velocityY=0,lastDragX=0,lastDragY=0,lastDragTime=0;
  var pinchDist0=0,pinchFov0=75;

  var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth,window.innerHeight);

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(fov,window.innerWidth/window.innerHeight,0.1,2000);
  camera.position.set(0,0,0.1);

  var geometry=new THREE.SphereGeometry(800,64,42);
  geometry.scale(-1,1,1);
  var sphere,texture,material;

  function createSphere(url){
    if(sphere){scene.remove(sphere);if(material)material.dispose();}
    var tex=new THREE.TextureLoader().load(url,
      function(xhr){},
      function(){loading.classList.add('done')},
      function(){loading.classList.add('done')}
    );
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.minFilter=THREE.LinearFilter;
    tex.magFilter=THREE.LinearFilter;
    texture=tex;
    material=new THREE.MeshBasicMaterial({map:tex});
    sphere=new THREE.Mesh(geometry,material);
    scene.add(sphere);
  }

  function updateCamera(){
    lon+=(targetLon-lon)*0.12;
    lat+=(targetLat-lat)*0.12;
    fov+=(targetFov-fov)*0.15;
    camera.fov=fov;camera.updateProjectionMatrix();
    var phi=THREE.MathUtils.degToRad(90-lat);
    var theta=THREE.MathUtils.degToRad(lon);
    camera.position.set(0.1*Math.sin(phi)*Math.cos(theta),0.1*Math.cos(phi),0.1*Math.sin(phi)*Math.sin(theta));
    camera.lookAt(0,0,0);
  }

  function notifyRN(obj){
    obj._src='${EVENT_TAG}';
    var s=JSON.stringify(obj);
    if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(s)}
    else if(window.parent&&window.parent!==window){window.parent.postMessage(s,'*')}
  }

  var lastFrame=performance.now();
  function animate(now){
    requestAnimationFrame(animate);
    var dt=Math.min((now-lastFrame)/1000,0.1);lastFrame=now;
    if(!isDragging&&Math.abs(velocityX)>0.01){targetLon+=velocityX*dt*60;velocityX*=0.94}
    if(!isDragging&&Math.abs(velocityY)>0.01){targetLat+=velocityY*dt*60;velocityY*=0.94}
    if(autoRotate&&!isDragging){targetLon+=10*dt}
    targetLat=Math.max(-85,Math.min(85,targetLat));
    updateCamera();
    renderer.render(scene,camera);
  }

  canvas.addEventListener('mousedown',function(e){
    if(e.button!==0)return;isDragging=true;
    dragStartX=e.clientX;dragStartY=e.clientY;
    dragStartLon=targetLon;dragStartLat=targetLat;
    velocityX=0;velocityY=0;lastDragX=e.clientX;lastDragY=e.clientY;lastDragTime=performance.now();
    canvas.style.cursor='grabbing';hint.classList.add('fade')
  });
  window.addEventListener('mousemove',function(e){
    if(!isDragging)return;
    targetLon=dragStartLon-(e.clientX-dragStartX)*0.3;
    targetLat=dragStartLat+(e.clientY-dragStartY)*0.3;
    var now=performance.now(),dt=Math.max(now-lastDragTime,1);
    velocityX=-(e.clientX-lastDragX)/dt*16;
    velocityY=(e.clientY-lastDragY)/dt*16;
    lastDragX=e.clientX;lastDragY=e.clientY;lastDragTime=now
  });
  window.addEventListener('mouseup',function(){isDragging=false;canvas.style.cursor='grab'});
  canvas.addEventListener('wheel',function(e){e.preventDefault();targetFov=Math.max(30,Math.min(110,targetFov+e.deltaY*0.05))},{passive:false});
  canvas.style.cursor='grab';

  canvas.addEventListener('touchstart',function(e){
    hint.classList.add('fade');
    if(e.touches.length===1){isDragging=true;dragStartX=e.touches[0].clientX;dragStartY=e.touches[0].clientY;dragStartLon=targetLon;dragStartLat=targetLat;velocityX=0;velocityY=0}
    else if(e.touches.length===2){isDragging=false;var dx=e.touches[0].clientX-e.touches[1].clientX;var dy=e.touches[0].clientY-e.touches[1].clientY;pinchDist0=Math.sqrt(dx*dx+dy*dy);pinchFov0=targetFov}
  },{passive:false});
  canvas.addEventListener('touchmove',function(e){
    e.preventDefault();
    if(e.touches.length===1&&isDragging){targetLon=dragStartLon-(e.touches[0].clientX-dragStartX)*0.25;targetLat=dragStartLat+(e.touches[0].clientY-dragStartY)*0.25;velocityX=0;velocityY=0}
    else if(e.touches.length===2){var dx=e.touches[0].clientX-e.touches[1].clientX;var dy=e.touches[0].clientY-e.touches[1].clientY;var dist=Math.sqrt(dx*dx+dy*dy);targetFov=Math.max(30,Math.min(110,pinchFov0*(pinchDist0/Math.max(dist,1))))}
  },{passive:false});
  canvas.addEventListener('touchend',function(){isDragging=false});

  btnBack.addEventListener('click',function(){notifyRN({type:'back'})});
  btnFS.addEventListener('click',function(){
    var el=document.documentElement;
    if(document.fullscreenElement){document.exitFullscreen();btnFS.classList.remove('on')}
    else{(el.requestFullscreen||el.webkitRequestFullscreen).call(el).then(function(){btnFS.classList.add('on')}).catch(function(){})}
  });
  document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement)btnFS.classList.remove('on')});
  btnRotate.addEventListener('click',function(){autoRotate=!autoRotate;autoRotate?btnRotate.classList.add('on'):btnRotate.classList.remove('on')});

  window.addEventListener('keydown',function(e){
    switch(e.key){case'ArrowLeft':targetLon-=15;break;case'ArrowRight':targetLon+=15;break;case'ArrowUp':targetLat+=10;break;case'ArrowDown':targetLat-=10;break;case'f':btnFS.click();break;case'r':btnRotate.click();break;case'Escape':notifyRN({type:'back'});break}
  });

  window.addEventListener('resize',function(){renderer.setSize(window.innerWidth,window.innerHeight);camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix()});

  // Receive commands from React (injectJavaScript for native, postMessage for web)
  window.__vrCmd=function(json){
    try{var d=JSON.parse(json);if(d.type==='switchScene'){switchScene(d.image,d.name,d.city,d.weather)}}
    catch(e){}
  };
  window.addEventListener('message',function(e){
    var d;try{d=typeof e.data==='string'?JSON.parse(e.data):e.data}catch(_){return}
    if(!d||d._src!=='${COMMAND_TAG}')return;
    if(d.type==='switchScene')switchScene(d.image,d.name,d.city,d.weather)
  });

  function switchScene(imgFile,name,city,weather){
    loading.classList.remove('done');createSphere(p.apiBase+'/static/legacy/'+imgFile);
    document.querySelector('.hud-title').textContent=name;
    document.querySelector('.scene-name').textContent=name;
  }

  createSphere('${imgUrl}');
  setTimeout(function(){hint.classList.add('fade')},6000);
  setTimeout(function(){notifyRN({type:'ready'})},500);
  requestAnimationFrame(animate);
})();
</script>
</body>
</html>`;
}
