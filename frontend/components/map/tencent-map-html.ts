// 旅行地图内嵌文档 —— 加载腾讯地图 JavaScript API GL（含 service 附加库），
// 通过 postMessage 桥与 React 层通信。web 用 <iframe srcDoc>，原生用 WebView。
//
// 「把 WebService 代理改成 React 原生 API」即指此处：定位 / 搜索 / 路线规划
// 全部走 GL SDK 的 service 库在客户端直接完成，不再经过后端中转。

// GL JS Key：走 EXPO_PUBLIC_* 环境变量（见 .env.example），缺省回退到演示 Key。
// 地图 JS Key 必然暴露在客户端，应在腾讯位置服务控制台配置域名白名单。
export const TENCENT_MAP_KEY =
  process.env.EXPO_PUBLIC_TENCENT_MAP_KEY ?? 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77';

// 桥消息的来源标记，避免误收 Metro / 浏览器扩展等无关 postMessage。
export const EVENT_TAG = 'tmap';
export const COMMAND_TAG = 'tmap-cmd';

// 内嵌文档里的脚本逻辑。注意：不得使用反引号 / ${}（外层是模板字符串）。
const MAP_SCRIPT = `
(function(){
  var GL_KEY = "__GL_KEY__";
  var map, ready=false, queue=[];
  var userMarker, poiMarker, destMarker, routeLine, navMarker;
  var userLatLng=null, currentCity='广州市';
  var routePath=null, navTimer=null, navIdx=0;

  function emit(obj){
    obj.__src='${EVENT_TAG}';
    var s=JSON.stringify(obj);
    if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(s); }
    else if(window.parent && window.parent!==window){ window.parent.postMessage(s,'*'); }
  }
  function handle(cmd){
    if(!cmd || !cmd.type) return;
    if(!ready){ queue.push(cmd); return; }
    try{ dispatch(cmd); }catch(e){ emit({type:'routeError',message:String(e&&e.message||e)}); }
  }
  function flush(){
    var q=queue; queue=[];
    q.forEach(function(c){
      try{ dispatch(c); }
      catch(e){ emit({type:'routeError',message:String((e&&e.message)||e)}); }
    });
  }

  // 原生端 injectJavaScript 调用入口
  window.__tmapCmd=function(json){ try{ handle(JSON.parse(json)); }catch(e){} };
  // web 端 iframe 收 postMessage
  window.addEventListener('message',function(e){
    if(typeof e.data!=='string') return;
    var c; try{ c=JSON.parse(e.data); }catch(_){ return; }
    if(!c || c.__src!=='${COMMAND_TAG}') return;
    handle(c);
  });

  function pin(color){
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">'
      +'<path d="M13 0C6 0 .5 5.4.5 12.1.5 21 13 34 13 34s12.5-13 12.5-21.9C25.5 5.4 20 0 13 0z" fill="'+color+'"/>'
      +'<circle cx="13" cy="12" r="5" fill="#fff"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  function dot(color){
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">'
      +'<circle cx="11" cy="11" r="9" fill="'+color+'" fill-opacity="0.25"/>'
      +'<circle cx="11" cy="11" r="5" fill="'+color+'" stroke="#fff" stroke-width="2"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }

  function initMap(){
    if(!window.TMap){ emit({type:'fatal',message:'地图组件初始化失败'}); return; }
    map=new TMap.Map(document.getElementById('map'),{
      center:new TMap.LatLng(23.1288,113.2644), zoom:11, viewMode:'2D'
    });
    userMarker=new TMap.MultiMarker({map:map,styles:{u:new TMap.MarkerStyle({width:22,height:22,anchor:{x:11,y:11},src:dot('#1E9E63')})},geometries:[]});
    poiMarker=new TMap.MultiMarker({map:map,styles:{p:new TMap.MarkerStyle({width:26,height:34,anchor:{x:13,y:34},src:pin('#386641')})},geometries:[]});
    destMarker=new TMap.MultiMarker({map:map,styles:{d:new TMap.MarkerStyle({width:30,height:39,anchor:{x:15,y:39},src:pin('#E8552D')})},geometries:[]});
    routeLine=new TMap.MultiPolyline({map:map,styles:{r:new TMap.PolylineStyle({color:'#1E9E63',width:7,borderColor:'#FFFFFF',borderWidth:2,lineCap:'round'})},geometries:[]});
    navMarker=new TMap.MultiMarker({map:map,styles:{n:new TMap.MarkerStyle({width:22,height:22,anchor:{x:11,y:11},src:dot('#E8552D')})},geometries:[]});
    ready=true;
    emit({type:'ready'});
    flush();
  }

  function dispatch(cmd){
    if(cmd.type==='locate') return doLocate();
    if(cmd.type==='search') return doSearch(cmd.keyword);
    if(cmd.type==='selectPoi') return doSelectPoi(cmd);
    if(cmd.type==='planRoute') return doPlanRoute(cmd);
    if(cmd.type==='clearRoute') return doClearRoute();
    if(cmd.type==='startNav') return doStartNav();
    if(cmd.type==='stopNav') return doStopNav();
  }

  function doLocate(){
    if(!navigator.geolocation){ emit({type:'locateError',message:'当前环境不支持定位'}); return; }
    navigator.geolocation.getCurrentPosition(function(pos){
      var ll=new TMap.LatLng(pos.coords.latitude,pos.coords.longitude);
      userLatLng=ll;
      userMarker.setGeometries([{id:'u',styleId:'u',position:ll}]);
      map.setCenter(ll); map.setZoom(14);
      reverseCity(ll);
      emit({type:'located',lat:pos.coords.latitude,lng:pos.coords.longitude});
    },function(err){
      emit({type:'locateError',message:(err&&err.message)||'定位失败'});
    },{enableHighAccuracy:true,timeout:8000,maximumAge:0});
  }

  function reverseCity(ll){
    try{
      new TMap.service.Geocoder().getAddress({location:ll}).then(function(res){
        var c=res&&res.result&&res.result.address_component&&res.result.address_component.city;
        if(c) currentCity=c;
      }).catch(function(){});
    }catch(e){}
  }

  function doSearch(keyword){
    keyword=(keyword||'').trim();
    if(!keyword){ emit({type:'searchResults',list:[]}); return; }
    var s=new TMap.service.Search({pageSize:12});
    s.searchRegion({keyword:keyword,cityName:currentCity,autoExtend:true}).then(function(res){
      var list=(res.data||[]).filter(function(p){ return p&&p.location; }).map(function(p){
        return {id:String(p.id),title:p.title,address:p.address||'',lat:p.location.lat,lng:p.location.lng};
      });
      poiMarker.setGeometries(list.map(function(p,i){
        return {id:'p'+i,styleId:'p',position:new TMap.LatLng(p.lat,p.lng)};
      }));
      emit({type:'searchResults',list:list});
    }).catch(function(err){
      emit({type:'searchError',message:String((err&&err.message)||'搜索失败')});
    });
  }

  function doSelectPoi(c){
    var ll=new TMap.LatLng(c.lat,c.lng);
    destMarker.setGeometries([{id:'d',styleId:'d',position:ll}]);
    poiMarker.setGeometries([]);
    map.setCenter(ll); map.setZoom(15);
  }

  function doPlanRoute(c){
    var to=new TMap.LatLng(c.toLat,c.toLng);
    destMarker.setGeometries([{id:'d',styleId:'d',position:to}]);
    var from=userLatLng||map.getCenter();
    var ctorMap={driving:TMap.service.Driving,walking:TMap.service.Walking,bicycling:TMap.service.Bicycling};
    var Ctor=ctorMap[c.mode];
    if(!Ctor){ emit({type:'routeError',message:'不支持的出行方式'}); return; }
    new Ctor().search({from:from,to:to}).then(function(res){
      var routes=(res&&res.result&&res.result.routes)||[];
      if(!routes.length){ emit({type:'routeError',message:'未找到可用路线'}); return; }
      var r=routes[0];
      routePath=r.polyline;
      routeLine.setGeometries([{id:'r',styleId:'r',paths:routePath}]);
      fitPath(routePath);
      var steps=(r.steps||[]).map(function(s){
        return {instruction:s.instruction||s.road_name||'沿路前行',distance:s.distance||0};
      });
      emit({type:'routeResult',route:{mode:c.mode,distance:r.distance,duration:r.duration,steps:steps}});
    }).catch(function(err){
      emit({type:'routeError',message:String((err&&err.message)||'路线规划失败')});
    });
  }

  function doClearRoute(){
    doStopNav();
    routePath=null;
    routeLine.setGeometries([]);
    destMarker.setGeometries([]);
    navMarker.setGeometries([]);
  }

  function fitPath(path){
    if(!path||!path.length) return;
    var b=new TMap.LatLngBounds(path[0],path[0]);
    path.forEach(function(p){ b.extend(p); });
    map.fitBounds(b,{padding:{top:120,bottom:260,left:50,right:50}});
  }

  function doStartNav(){
    if(!routePath||routePath.length<2) return;
    doStopNav();
    navIdx=0;
    navTimer=setInterval(function(){
      if(navIdx>=routePath.length){ doStopNav(); emit({type:'navEnd'}); return; }
      var p=routePath[navIdx++];
      navMarker.setGeometries([{id:'n',styleId:'n',position:p}]);
      map.setCenter(p);
    },120);
  }
  function doStopNav(){
    if(navTimer){ clearInterval(navTimer); navTimer=null; }
  }

  var sdk=document.createElement('script');
  sdk.src='https://map.qq.com/api/gljs?v=1.exp&key='+GL_KEY+'&libraries=service';
  sdk.onload=initMap;
  sdk.onerror=function(){ emit({type:'fatal',message:'地图资源加载失败，请检查网络'}); };
  document.head.appendChild(sdk);
  setTimeout(function(){ if(!ready) emit({type:'fatal',message:'地图加载超时'}); },12000);
})();
`;

let cachedHtml: string | null = null;

// 生成内嵌地图文档（结果缓存，整个会话只构建一次）。
export function buildMapHtml(): string {
  if (cachedHtml) return cachedHtml;
  cachedHtml = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html,body,#map{ margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#E8EDE9; }
</style>
</head>
<body>
<div id="map"></div>
<script>${MAP_SCRIPT.replace('__GL_KEY__', TENCENT_MAP_KEY)}</script>
</body>
</html>`;
  return cachedHtml;
}
