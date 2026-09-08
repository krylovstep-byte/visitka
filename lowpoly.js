import * as THREE from './vendor/three/three.module.js';

const host = document.querySelector('#portal-room');
const ui = document.querySelector('#monitor-ui');
const root = document.querySelector('.lowpoly');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#100e0c');
scene.fog = new THREE.Fog('#100e0c', 21, 40);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({antialias: true});
} catch {
  root.classList.add('no-webgl');
  document.querySelector('#scene-status').textContent = '3D недоступно. Все разделы открываются через меню.';
  renderer = {domElement: document.createElement('canvas'), shadowMap: {}, setPixelRatio(){}, setSize(){}, render(){}};
}
renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth<=900?1.25:1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
host.append(renderer.domElement);
const camera = new THREE.PerspectiveCamera(38, 1, .1, 60);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let seed = 829;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
function canvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
  return texture;
}
// Reusable material maps: wood grain, worn plastic and plaster, not baked lighting.
function grain(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(512, 512);
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const fibre = kind === 'wood' ? 14 * Math.sin(y * 1.6 + 5 * Math.sin(x / 95)) + 9 * Math.sin(y * .18) : 0;
    const value = 183 + fibre + (random() - .5) * (kind === 'wood' ? 49 : 32);
    const i = (y * 512 + x) * 4;
    pixels.data[i] = value; pixels.data[i+1] = value; pixels.data[i+2] = value; pixels.data[i+3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  if (kind === 'wood') {
    for (let i = 0; i < 170; i++) {
      ctx.strokeStyle = 'rgba(35,24,16,' + (.04 + random() * .14) + ')';
      ctx.lineWidth = .4 + random();
      const x = random() * 512, y = random() * 512;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 + random() * 220, y + random() * 3); ctx.stroke();
    }
  }
  const texture = canvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
const woodMap = grain('wood'), plasticMap = grain('plastic');
const mats = new Map();
function mat(color, kind = 'plastic') {
  const id = color + kind;
  if (!mats.has(id)) mats.set(id, new THREE.MeshStandardMaterial({
    color, map: kind === 'wood' ? woodMap : plasticMap,
    bumpMap: kind === 'wood' ? woodMap : plasticMap,
    bumpScale: kind === 'wood' ? .035 : .009,
    roughness: kind === 'metal' ? .55 : .91,
    metalness: kind === 'metal' ? .45 : 0,
    flatShading: true
  }));
  return mats.get(id);
}
function mesh(geometry, material, x, y, z, parent = scene) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(w,h,d,color,x,y,z,parent=scene,kind='plastic') {
  return mesh(new THREE.BoxGeometry(w,h,d),mat(color,kind),x,y,z,parent);
}
function cylinder(r1,r2,h,color,x,y,z,segments=8,parent=scene,kind='plastic') {
  return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat(color,kind),x,y,z,parent);
}
function beam(a,b,r,color,parent=scene) {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
  const m=cylinder(r,r,start.distanceTo(end),color,0,0,0,8,parent,'metal');
  m.position.copy(start).add(end).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());
  return m;
}
function group(x,y,z,parent=scene) {
  const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;
}
function chamferBox(w,h,d,color,x,y,z,parent=scene,kind='plastic',bevel=.045) {
  const s = new THREE.Shape();
  s.moveTo(-w/2+bevel,-h/2);s.lineTo(w/2-bevel,-h/2);
  s.lineTo(w/2,-h/2+bevel);s.lineTo(w/2,h/2-bevel);
  s.lineTo(w/2-bevel,h/2);s.lineTo(-w/2+bevel,h/2);
  s.lineTo(-w/2,h/2-bevel);s.lineTo(-w/2,-h/2+bevel);s.closePath();
  const geo = new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel});
  geo.translate(0,0,-d/2+bevel);
  return mesh(geo,mat(color,kind),x,y,z,parent);
}
// Text canvases follow the physical face ratio, so book spines do not squash letters.
function writing(w,h,lines,{background='#cbb891',ink='#252015',grid=false,size,align='left',transparent=false}={}) {
  const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);
  const ctx=c.getContext('2d');
  if (!transparent) {
    ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<c.width*c.height/25;i++) {
      ctx.fillStyle=random()>.5?'#ffffff0c':'#35291d12';
      ctx.fillRect(random()*c.width,random()*c.height,1+random()*3,1+random()*2);
    }
    if(grid) {
      ctx.strokeStyle='#77624535';ctx.lineWidth=1;
      for(let p=0;p<Math.max(c.width,c.height);p+=36) {
        ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,c.height);
        ctx.moveTo(0,p);ctx.lineTo(c.width,p);ctx.stroke();
      }
    }
  }
  const margin=transparent?10:55;
  let font=size || Math.min(80,(c.height-margin*2)/(lines.length*1.3));
  ctx.font=font+'px "Courier New", monospace';
  const widest=Math.max(...lines.map(line=>ctx.measureText(line).width),1);
  if(widest>c.width-margin*2) font*= (c.width-margin*2)/widest;
  ctx.font=font+'px "Courier New", monospace';ctx.fillStyle=ink;
  ctx.textAlign=align;ctx.textBaseline='middle';
  const step=(c.height-margin*2)/lines.length;
  lines.forEach((line,i)=>ctx.fillText(line,align==='center'?c.width/2:margin,margin+step*(i+.5)));
  return canvasTexture(c);
}
function label(w,h,lines,x,y,z,parent,options={}) {
  const texture=writing(w,h,lines,options);
  const material=new THREE.MeshStandardMaterial({map:texture,transparent:!!options.transparent,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
  return mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,parent);
}
function applyArtwork(face,path){
  new THREE.TextureLoader().load(path,texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
    face.material.map.dispose();face.material.map=texture;face.material.needsUpdate=true;
  });
}
function screw(x,y,z,parent) {
  const s=cylinder(.026,.026,.014,'#7d7563',x,y,z,8,parent,'metal');s.rotation.x=Math.PI/2;
  box(.031,.005,.016,'#29251d',x,y,z+.009,parent);
}

scene.add(new THREE.HemisphereLight('#e3d3ae','#121519',.9));
const key=new THREE.DirectionalLight('#ffdfb2',2.1);
key.position.set(-4,7,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-6});
key.shadow.normalBias=.016;key.shadow.bias=-.00015;scene.add(key);
const fill=new THREE.DirectionalLight('#a5b7ce',.32);fill.position.set(5,4,5);scene.add(fill);
const screenLight=new THREE.PointLight('#88bbdf',2.2,5,2);screenLight.position.set(-.35,2,.25);scene.add(screenLight);

box(12,.24,7,'#3e2b1b',0,-.14,0,scene,'wood');
for(let row=0;row<14;row++) {
  const z=-3.25+row*.5;
  for(let col=0;col<4;col++) {
    const plank=box(2.985,.025,.485,['#4a3422','#3e2a1b','#513923'][(row+col)%3],-4.5+col*3,.005,z,scene,'wood');
    plank.position.x += row%2 ? .03 : 0;
  }
}
const wallMaterial=new THREE.MeshStandardMaterial({color:'#625d50',roughness:1,emissive:'#34332d',emissiveIntensity:.18});
const backWall=mesh(new THREE.BoxGeometry(16,15,.2),wallMaterial,0,4.4,-2.55);
const leftWall=mesh(new THREE.BoxGeometry(.2,15,13),wallMaterial,-8,4.4,3.9);
const rightWall=mesh(new THREE.BoxGeometry(.2,15,13),wallMaterial,8,4.4,3.9);
const roomShelf=group(-.4,10.6,-2.0);
box(5.5,.16,.8,'#95683e',0,0,0,roomShelf,'wood');
for(const x of [-2.15,2.15]){box(.1,.6,.12,'#36352d',x,-.35,-.22,roomShelf,'metal');beam([x,-.6,-.2],[x,-.08,.3],.035,'#36352d',roomShelf);}
['#546b60','#a96741','#b59a66','#48566f','#88554b','#6d7654'].forEach((color,i)=>{
 const h=.75+(i%3)*.12;
 box(.27,h,.48,color,-2.05+i*.3,h/2+.08,0,roomShelf,'wood');
 box(.19,.026,.01,'#dccb9c',-2.05+i*.3,h-.08,.246,roomShelf);
});
box(1,.74,.1,'#463023',.7,.47,-.08,roomShelf,'wood');
label(.84,.57,['ДЕЛУ','ВРЕМЯ'],.7,.47,-.019,roomShelf,{background:'#d6c192',ink:'#343125',align:'center'});
cylinder(.3,.22,.5,'#aa7950',2,.33,0,8,roomShelf);
for(let i=0;i<7;i++){
 const leaf=mesh(new THREE.ConeGeometry(.13,.85,4),mat('#5d7441'),2+Math.sin(i*2.4)*.16,.89,Math.cos(i*2.4)*.12,roomShelf);
 leaf.rotation.z=Math.sin(i*2.4)*.45;
}
const roomWindow=group(6.15,5.3,-2.39);
box(2.85,3.65,.18,'#433c30',0,0,0,roomWindow,'wood');
const nightGlass=mesh(new THREE.PlaneGeometry(2.55,3.35),new THREE.MeshBasicMaterial({color:'#253e5c'}),0,0,.101,roomWindow);
nightGlass.castShadow=false;
for(const x of [-1.37,0,1.37])box(.13,3.65,.22,'#b0a38b',x,0,.16,roomWindow,'wood');
for(const y of [-1.76,0,1.76])box(2.85,.13,.22,'#b0a38b',0,y,.16,roomWindow,'wood');
box(3.15,.16,.65,'#b0a38b',0,-1.86,.3,roomWindow,'wood');
const moon=mesh(new THREE.CircleGeometry(.24,12),new THREE.MeshBasicMaterial({color:'#e2e9d8'}),.65,.92,.115,roomWindow);
moon.castShadow=false;
for(const [x,y] of [[-.8,1.25],[-.38,.6],[.9,-.55],[-.9,-1.1],[.4,-1.35]]){
  const star=mesh(new THREE.PlaneGeometry(.025,.025),new THREE.MeshBasicMaterial({color:'#b8cce0'}),x,y,.116,roomWindow);star.castShadow=false;
}
const windowLight=new THREE.PointLight('#9bbce2',9,12,2);windowLight.position.set(5.8,5.1,-1.5);scene.add(windowLight);
box(16,.2,17,'#493a29',0,-3.2,4,scene,'wood');
box(12,.16,7,'#322317',0,-.10,0,scene,'wood');
for(const x of [-5.55,5.55])for(const z of [-2.8,2.8])box(.22,3,.22,'#32291d',x,-1.62,z,scene,'wood');
box(9,.025,6,'#34352b',0,-3.085,3.8,scene,'fabric');

// Monitor dimensions, screen plane and approved camera remain unchanged.
const monitor=group(-.35,0,-.55);
box(1.65,.18,1.25,'#9a8966',0,.09,0,monitor);
box(.7,.48,.65,'#b7a37a',0,.38,-.1,monitor);
chamferBox(4.65,3.32,1.12,'#b3a07a',0,2.12,-.48,monitor);
box(4.7,.3,.24,'#d0bb8a',0,3.82,.13,monitor);
box(4.7,.42,.25,'#bfa777',0,.66,.13,monitor);
box(.31,2.94,.25,'#d0bb8a',-2.19,2.22,.13,monitor);
box(.31,2.94,.25,'#a88f62',2.19,2.22,.13,monitor);
box(4.08,2.67,.04,'#172126',0,2.23,.155,monitor);
const previewWallpaper=new THREE.TextureLoader().load('./wallpaper.jpg');previewWallpaper.colorSpace=THREE.SRGBColorSpace;
const previewScreen=mesh(new THREE.PlaneGeometry(4.04,2.6),new THREE.MeshBasicMaterial({map:previewWallpaper}),0,2.24,.181,monitor);
const powerLed=mesh(new THREE.BoxGeometry(.065,.065,.015),new THREE.MeshBasicMaterial({color:'#28351a'}),1.58,.67,.27,monitor);
box(.36,.30,.03,'#494434',1.97,.67,.265,monitor);
const powerButton=group(1.97,.67,.30,monitor);
chamferBox(.29,.25,.09,'#988666',0,0,0,powerButton,'plastic',.012);
const powerRing=mesh(new THREE.TorusGeometry(.071,.008,4,18,Math.PI*1.65),mat('#292a20'),0,0,.048,powerButton);powerRing.rotation.z=Math.PI*.675;
box(.014,.085,.014,'#292a20',0,.039,.052,powerButton);
label(.86,.18,['StepanOS'],-1.45,.67,.266,monitor,{background:'#b6a07c',size:145});
for(let i=0;i<9;i++)box(.012,.14,.02,'#564c3b',2.35,1.0+i*.22,-.2,monitor);

// Smaller peripheral bodies occupy the desk rather than disappearing under the toolbar.
const keyboard=group(-.3,.14,1.10);keyboard.scale.set(.83,1,.83);
chamferBox(4.1,.18,1.3,'#a89772',0,0,0,keyboard);
for(let row=0;row<5;row++)for(let col=0;col<15;col++) {
  if(row===4&&col>3&&col<11)continue;
  chamferBox(.225,.095,.19,(row===0||col===14)?'#a18d66':'#d1bd94',-1.83+col*.25,.13,-.48+row*.235,keyboard,'plastic',.009);
}
chamferBox(1.7,.09,.19,'#d1bd94',-.05,.13,.46,keyboard,'plastic',.009);
const mouse=group(2.06,.14,1.25);
const mouseBody=cylinder(.22,.28,.18,'#c5b187',0,0,0,8,mouse);mouseBody.scale.z=1.5;
box(.011,.01,.27,'#746b52',0,.094,-.075,mouse);
const mouseCable=group(0,0,0);
beam([2.06,.1,.9],[2.16,.04,-.15],.014,'#27231d',mouseCable);

// Articulated metal lamp; the warm interior follows exactly the same tilt as the shade.
const lampRig=group(-4.8,0,-.15);
cylinder(.42,.52,.13,'#3e392b',0,.08,0,8,lampRig,'metal');
beam([0,.14,0],[-.25,1.45,-.12],.055,'#62503a',lampRig);
beam([-.25,1.45,-.12],[.46,3.30,-.42],.055,'#62503a',lampRig);
beam([-.08,.15,.08],[-.33,1.45,-.04],.027,'#a58b58',lampRig);
beam([-.33,1.45,-.04],[.40,3.30,-.46],.027,'#a58b58',lampRig);
for(const [x,y,z] of [[0,.16,0],[-.28,1.45,-.02],[.46,3.30,-.44]]) {
  const joint=cylinder(.10,.10,.15,'#736043',x,y,z,10,lampRig,'metal');joint.rotation.x=Math.PI/2;
}
const shade=group(.75,3.24,.27,lampRig);
shade.rotation.x=-.64;shade.rotation.z=-.12;
mesh(new THREE.CylinderGeometry(.22,.72,.78,10,1,true),mat('#484538','metal'),0,0,0,shade);
cylinder(.22,.16,.26,'#4d4a40',0,.51,0,8,shade,'metal');
const insideMaterial=new THREE.MeshStandardMaterial({color:'#ffdfa2',emissive:'#ffb635',emissiveIntensity:1.8,side:THREE.DoubleSide,roughness:.8});
mesh(new THREE.CylinderGeometry(.205,.685,.76,10,1,true),insideMaterial,0,-.007,0,shade);
const bulb=mesh(new THREE.SphereGeometry(.19,10,6),new THREE.MeshBasicMaterial({color:'#fff5ce'}),0,-.1,0,shade);
const rim=mesh(new THREE.TorusGeometry(.7,.027,4,10),mat('#8c7650','metal'),0,-.39,0,shade);rim.rotation.x=Math.PI/2;
const lamp=new THREE.PointLight('#ffc478',13,7,2);lamp.position.set(0,-.43,0);shade.add(lamp);
const metronome=group(-5.45,0,.25);
// A flat front keeps the dial and pendulum clear of the wooden case.
const metroShape=new THREE.Shape();
metroShape.moveTo(-.36,.12);metroShape.lineTo(.36,.12);
metroShape.lineTo(.17,1.27);metroShape.lineTo(-.17,1.27);metroShape.closePath();
mesh(new THREE.ExtrudeGeometry(metroShape,{depth:.42,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1,steps:1}),mat('#956039','wood'),0,0,-.23,metronome);
box(.82,.12,.58,'#36251b',0,.08,0,metronome,'wood');
box(.75,.035,.53,'#ba8c4a',0,.16,0,metronome,'metal');
const dial=group(0,0,.235,metronome);
box(.28,.87,.018,'#e3cb91',0,.77,0,dial);
for(let i=0;i<11;i++){
  const y=.4+i*.07;
  box(i%2===0?.19:.12,.009,.008,'#493523',0,y,.016,dial);
}
box(.31,.035,.035,'#c59a52',0,1.23,.24,metronome,'metal');
const metroPivot=group(0,.32,.285,metronome);
beam([0,-.12,0],[0,.8,0],.018,'#e2c789',metroPivot);
box(.14,.17,.075,'#d2af64',0,.52,.012,metroPivot,'metal');
box(.09,.09,.012,'#f1db95',0,.53,.057,metroPivot,'metal');
const metroAxle=cylinder(.055,.055,.075,'#c6a15d',0,.32,.29,12,metronome,'metal');
metroAxle.rotation.x=Math.PI/2;
box(.25,.09,.022,'#c4a165',0,.225,.25,metronome,'metal');
let metroTime=0;

// Two wooden speakers, including inset cones, ports and screws.
function speaker(x,y,z,scale=1) {
  const g=group(x,y,z);g.scale.setScalar(scale);
  chamferBox(.93,1.45,.73,'#88613a',0,.725,0,g,'wood');
  const ring=cylinder(.295,.295,.025,'#14120f',0,.86,.39,12,g);ring.rotation.x=Math.PI/2;
  const cone=cylinder(.215,.27,.09,'#302b20',0,.86,.421,12,g);cone.rotation.x=Math.PI/2;
  const centre=mesh(new THREE.SphereGeometry(.09,10,6),mat('#8b6b36','metal'),0,.86,.49,g);centre.scale.z=.6;
  for(let i=-1;i<=1;i++)box(.105,.105,.025,'#141411',i*.24,.24,.382,g);
  for(const x of [-.37,.37])for(const y of [.12,1.33])screw(x,y,.391,g);
  return g;
}
const speakerLeft=speaker(-3.36,0,-.78);
const speakerRight=speaker(2.85,0,-.88,.86);
const spineBox=group(-4.4,0,-1.04);
chamferBox(.47,2.05,.65,'#715a3c',0,1.025,0,spineBox,'wood');
const spineLabel=label(.33,1.78,[...'СТЕПАН', '', ...'КРЫЛОВ'],0,1.04,.365,spineBox,{background:'#e0bd78',ink:'#080603',align:'center',size:300});
spineLabel.material.emissive.set('#5b3d16');spineLabel.material.emissiveIntensity=.42;

// Book spines get textures with their actual aspect ratio and full original titles.
const bookGroups=[];
['LAUNCH PLAN','USER RESEARCH','PM HANDBOOK v1.0'].forEach((title,i)=>{
  const g=group(3.78,.2+i*.32,-1.48);g.rotation.y=i===1?-.035:.01;bookGroups.push(g);
  const color=['#252b24','#23332c','#71634b'][i];
  box(1.55,.30,1.0,color,0,0,0,g,'wood');
  box(1.45,.21,.91,'#a3926c',0,0,-.035,g);
  box(1.55,.035,1,color,0,.16,0,g,'wood');
  box(1.55,.035,1,color,0,-.16,0,g,'wood');
  box(1.55,.30,.08,color,0,0,.49,g,'wood');
  label(1.38,.21,[title],0,0,.534,g,{transparent:true,ink:i===2?'#1c1b15':'#c4b897',align:'center',size:112});
  for(const x of [-.67,.67])box(.022,.29,.011,'#8a784e',x,0,.54,g);
});
const topBox=group(3.82,1.19,-1.58);
chamferBox(1.6,.45,1.02,'#322e25',0,0,0,topBox,'wood');
box(1.61,.032,1.03,'#4c4331',0,.13,0,topBox,'wood');

// A hollow faceted mug, printed directly on its faces.
const cup=group(-4.13,.0,.57);
const mug=mesh(new THREE.CylinderGeometry(.38,.32,.75,10,1,true),mat('#b6a07b'),0,.42,0,cup);
label(.38,.48,['> focus','> build','> launch','> repeat'],0,.43,.363,cup,{transparent:true,ink:'#211b13',size:125});
const lip=mesh(new THREE.TorusGeometry(.37,.038,4,10),mat('#c5af85'),0,.8,0,cup);lip.rotation.x=Math.PI/2;
cylinder(.325,.29,.11,'#56422b',0,.69,0,10,cup);
cylinder(.31,.31,.008,'#24160d',0,.75,0,10,cup);
const handle=mesh(new THREE.TorusGeometry(.23,.052,4,6),mat('#b29b71'),.4,.45,0,cup);

// Notebook with visible pages and wire rings.
const notebook=group(-2.98,.065,1.66);notebook.rotation.y=-.15;notebook.scale.setScalar(.8);
box(2.08,.09,1.27,'#6d5435',0,.0,0,notebook,'wood');
box(2.01,.075,1.2,'#c3b18a',0,.06,0,notebook);
const notes=label(2.0,1.2,[
  'МОИ ИДЕИ','1. ИИ для созвонов','2. Умный городской маршрут',
  '3. Архив личных знаний','4. Сервис случайных','   знакомств по интересам'
],0,.104,0,notebook,{grid:true,size:58});
notes.rotation.x=-Math.PI/2;
applyArtwork(notes,'./assets/scene/notebook-page.png');
for(let i=0;i<11;i++){
  const loop=mesh(new THREE.TorusGeometry(.082,.015,5,12),mat('#302c22','metal'),-.99,.09,-.52+i*.103,notebook);
  loop.rotation.y=Math.PI/2;
}
const pen=group(-1.22,.055,1.92);pen.rotation.y=-.52;
beam([0,.035,-.42],[0,.035,.35],.033,'#183f74',pen);
beam([0,.035,-.46],[0,.035,-.38],.036,'#bfb99c',pen);
const nib=cylinder(.0,.033,.12,'#252a2b',0,.035,-.52,6,pen);nib.rotation.x=-Math.PI/2;
beam([.026,.07,.05],[.026,.07,.29],.009,'#9b9b87',pen);

// Recognisable 3.5-inch floppy, label, shutter, spindle slot and corner holes.
const diskette=group(-2.97,.085,.53);diskette.rotation.y=-.16;
chamferBox(1.03,.075,.95,'#1b2548',0,0,0,diskette,'plastic',.015);
box(1.0,.016,.36,'#201f1c',0,.047,-.29,diskette);
box(.46,.017,.31,'#847d65',.02,.059,-.30,diskette,'metal');
box(.14,.018,.2,'#1d1c18',.06,.071,-.32,diskette);
const diskLabel=label(.75,.36,['WorkDisk','2HD'],0,.056,.18,diskette,{background:'#cfba8d',size:125,align:'center'});diskLabel.rotation.x=-Math.PI/2;
for(const x of [-.42,.42])box(.065,.018,.07,'#07090f',x,.044,.37,diskette);

// Clean cathedral artwork reconstructed from the original poster.
const poster=group(-3.95,3.25,-2.39);
const posterFace=label(1.66,2.13,['ЯРОСЛАВЛЬ —','ЛУЧШИЙ ГОРОД'],0,0,0,poster,{background:'#927443',size:92});
new THREE.TextureLoader().load('./assets/scene/yaroslavl-poster.png',texture=>{
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  posterFace.material.map=texture;posterFace.material.needsUpdate=true;
});
poster.rotation.z=-.017;
function tape(x,y,z,parent,angle=0) {
  const strip=box(.22,.095,.012,'#8a734b',x,y,z,parent);strip.rotation.z=angle;
}
tape(-.73,.99,.015,poster,-.65);tape(.73,.99,.015,poster,.7);

const schedule=group(3.7,3.12,-2.38);schedule.rotation.z=-.035;
const scheduleFace=label(1.52,2.02,[
  'УТРОМ','1. ПРЕСС КАЧАТ','2. БЕГИТ','3. ТУРНИК','4. АНЖУМАНЯ',
  '','ВЕЧЕРОМ','1. ПРЕСС КАЧАТ','2. БЕГИТ','3. ТУРНИК','4. АНЖУМАНЯ'
],0,0,0,schedule,{grid:true,background:'#b29b73',size:70});
applyArtwork(scheduleFace,'./assets/scene/exercise-note.png');
const hangingTape=box(.28,.27,.012,'#464238',0,1.06,.008,schedule);
hangingTape.rotation.z=.08;

// Aloe above the right speaker, with separated angular leaves and a visible pot.
const plant=group(2.87,1.26,-.92);
cylinder(.35,.25,.42,'#746449',0,.22,0,7,plant,'wood');
cylinder(.30,.30,.014,'#252419',0,.436,0,9,plant);
for(let i=0;i<11;i++){
  const a=i*2.4, length=.48+random()*.5, spread=.2+random()*.35;
  const geo=new THREE.BufferGeometry();
  const base=[Math.cos(a)*.08,.43,Math.sin(a)*.08];
  const tip=[Math.cos(a)*spread,.43+length,Math.sin(a)*spread];
  const side=[Math.sin(a)*.065,0,-Math.cos(a)*.065];
  geo.setAttribute('position',new THREE.Float32BufferAttribute([
    base[0]-side[0],base[1],base[2]-side[2],
    base[0]+side[0],base[1],base[2]+side[2],
    tip[0],tip[1],tip[2],
    base[0]+side[0],base[1],base[2]+side[2],
    (base[0]+tip[0])*.5,(base[1]+tip[1])*.5+.06,(base[2]+tip[2])*.5+.04,
    tip[0],tip[1],tip[2]
  ],3));geo.computeVertexNormals();
  const material=mat(i%2?'#415126':'#2c3f1c').clone();material.side=THREE.DoubleSide;
  mesh(geo,material,0,0,0,plant);
}

const techBox=group(3.42,.38,.72);
chamferBox(1.48,.7,1.13,'#383226',0,0,0,techBox,'wood');
box(1.30,.52,.035,'#191a16',0,0,.59,techBox);
box(.92,.26,.027,'#0d100e',.10,-.015,.62,techBox);
box(.90,.012,.015,'#5f5942',.10,.125,.64,techBox);
box(.12,.13,.035,'#943126',-.52,.03,.645,techBox);
box(.075,.04,.04,'#828943',-.52,.18,.646,techBox);
for(let i=0;i<8;i++)box(.55,.005,.027,'#151711',0,.357,-.4+i*.07,techBox);
for(const x of [-.62,.62])for(const y of [-.25,.25])screw(x,y,.63,techBox);

const legacyDialog=document.createElement('div');legacyDialog.className='legacy-confirm';legacyDialog.hidden=true;
legacyDialog.setAttribute('role','dialog');legacyDialog.setAttribute('aria-label','Старая версия сайта');
legacyDialog.innerHTML='<div class="legacy-title">StepanOS.exe</div><p>Перейти на старую версию сайта?</p><div class="legacy-actions"><a href="/stepanos/">Да</a><button type="button">Нет</button></div>';
root.append(legacyDialog);
let legacyTimer;
function hideLegacy(){legacyDialog.hidden=true;clearTimeout(legacyTimer);}
function showLegacy(event){
  callout.classList.remove('is-visible');
  legacyDialog.hidden=false;
  const w=legacyDialog.offsetWidth,h=legacyDialog.offsetHeight;
  legacyDialog.style.left=`${Math.max(8,Math.min(innerWidth-w-8,event.clientX-w*.12))}px`;
  legacyDialog.style.top=`${Math.max(8,Math.min(innerHeight-h-76,event.clientY-h-12))}px`;
  clearTimeout(legacyTimer);legacyTimer=setTimeout(hideLegacy,2667);
}
legacyDialog.querySelector('button').addEventListener('click',hideLegacy);
legacyDialog.addEventListener('pointerenter',()=>clearTimeout(legacyTimer));
legacyDialog.addEventListener('focusin',()=>clearTimeout(legacyTimer));
document.addEventListener('keydown',event=>{if(event.key==='Escape')hideLegacy();});
window.addEventListener('resize',hideLegacy);

// Whole-object interaction: labels, handles and cones follow their parent object.
const interactive=[];
let hovered=null,activeCallout=null,calloutTimer;
const callout=document.createElement('div');
callout.id='scene-callout';callout.setAttribute('role','status');
callout.setAttribute('aria-live','polite');root.appendChild(callout);
function makeInteractive(object,label) {
  object.traverse(node=>{
    if(!node.isMesh || !node.material?.clone)return;
    node.material=node.material.clone();
    node.userData.baseEmissive=node.material.emissive?.clone();
    node.userData.baseIntensity=node.material.emissiveIntensity || 0;
  });
  const item={object,label};interactive.push(item);return item;
}
const interactiveItems=[
  makeInteractive(roomShelf,'Книги на полке. Планы — чуть выше.'),
  makeInteractive(roomWindow,'Перейти на старую версию сайта?'),
  makeInteractive(metronome,'Тикает ровно, пока дедлайн делает вид, что его нет.'),
  makeInteractive(mouse,'Курсор двигается быстрее, чем я принимаю решения.'),
  makeInteractive(keyboard,'Большинство хороших идей здесь сначала выглядят как опечатки.'),
  makeInteractive(lampRig,'Включаю её, когда город уже лёг, а дедлайн — нет.'),
  makeInteractive(notebook,'Некоторые идеи уже стали проектами. Остальные пока делают вид.'),
  makeInteractive(poster,'Я сам из Ярославля, но живу в Москве.'),
  makeInteractive(schedule,'Утром — тело, вечером — таблицы. Баланс, как его понимает менеджер.'),
  makeInteractive(spineBox,'Коробка с именем. Переезжала чаще, чем хотелось бы.'),
  makeInteractive(diskette,'Когда-то на этой дискете помещалась целая жизнь. Сейчас — один мем.'),
  ...bookGroups.map((book,i)=>makeInteractive(book,['План запуска, который пережил четыре версии.','Сначала поговорить с людьми. Потом открывать таблицы.','Открыл её — и снова хочется всё систематизировать.'][i])),
  makeInteractive(cup,'Кофе закончился. Проект почему-то нет.'),
  makeInteractive(techBox,'Работает тихо. Это подозрительно.'),
  makeInteractive(plant,'Единственный участник команды, которому не нужны созвоны.'),
  makeInteractive(speakerLeft,'Из этой колонки обычно звучит музыка для первого прототипа.'),
  makeInteractive(speakerRight,'Правая колонка отвечает за бас и тяжёлые решения.'),
  makeInteractive(pen,'Этой ручкой написаны четыре экзамена и несколько решений, которые пришлось переписать.'),
  makeInteractive(monitor,'Рабочий стол. Здесь идеи сначала становятся ярлыками.')
];
// Project the live HTML screen onto the monitor's four corners.
const corners=[[-2.02,3.54,.181],[2.02,3.54,.181],[2.02,.94,.181],[-2.02,.94,.181]].map(v=>new THREE.Vector3(...v));
function matrix(points){const w=ui.offsetWidth,h=ui.offsetHeight;const src=[[0,0],[w,0],[w,h],[0,h]],a=[],b=[];src.forEach(([x,y],i)=>{const [u,v]=points[i];a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);});for(let i=0;i<8;i++){let p=i;for(let j=i+1;j<8;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;[a[i],a[p]]=[a[p],a[i]];[b[i],b[p]]=[b[p],b[i]];const q=a[i][i];if(Math.abs(q)<1e-10)return;for(let k=i;k<8;k++)a[i][k]/=q;b[i]/=q;for(let j=0;j<8;j++)if(j!==i){const f=a[j][i];for(let k=i;k<8;k++)a[j][k]-=f*a[i][k];b[j]-=f*b[i];}}return `matrix3d(${b[0]},${b[3]},0,${b[6]},${b[1]},${b[4]},0,${b[7]},0,0,1,0,${b[2]},${b[5]},0,1)`;}
let close=true;root.classList.add('computer-view');const target=new THREE.Vector3(),look=new THREE.Vector3(),currentLook=new THREE.Vector3();
const mobileLayout=[
  [monitor,[0,0,-.85],[1.32,1.82,1]],
  [poster,[-.75,8.45,-2.39],[1,1,1]],
  [schedule,[1.7,8.45,-2.38],[1,1,1]],
  [lampRig,[-3.15,0,.0],[.9,2.25,.9]],
  [metronome,[2.0,0,.9],[1.15,1.15,1.15]],
  [shade,[.75,3.24,.27],[1,1,1]],
  [speakerLeft,[-4.25,0,-1.45],[1.45,1.55,1.45]],
  [speakerRight,[4.25,0,-1.45],[1.45,1.55,1.45]],
  [spineBox,[-2.75,0,-.65],[.85,.85,.85]],
  [plant,[1.15,0,3.0],[.85,.85,.85]],
  [cup,[-2.5,0,2.05],[1.05,1.05,1.05]],
  [notebook,[-1.8,.065,3.15],[.8,.8,.8]],
  [pen,[-.55,.055,3.1],[1,1,1]],
  [keyboard,[0,.15,1.65],[.95,.95,.95]],
  [mouse,[2.1,.14,2.0],[1,1,1]],
  [mouseCable,[.04,0,.75],[1,1,1]],
  [diskette,[-1.5,.085,.75],[.85,.85,.85]],
  [techBox,[3.7,.38,3.05],[1.05,1.05,1.05]],
  [topBox,[2.7,.73,-.9],[.72,.5,.72]],
  ...bookGroups.map((book,i)=>[book,[2.7,.1+i*.17,-.9],[.72,.5,.72]])
].map(([object,position,scale])=>({object,position,scale,originalPosition:object.position.clone(),originalScale:object.scale.clone()}));
function destination(){if(innerWidth<=900){target.set(0,close?5.9:8,close?14.5:25);look.set(0,3.8,-.45);return;}if(close){target.set(1.25,3.1,7.9);look.set(-.35,2.1,-.45);}else{target.set(2,6.5,17);look.set(0,2.4,-.5);}}
function resize(){
  const mobile=innerWidth<=900;
  roomShelf.visible=true;
  roomShelf.position.set(-.4,mobile?10.6:5.65,-2.0);
  roomShelf.scale.setScalar(mobile?1.45:1);
  for(const wall of [backWall,leftWall,rightWall])wall.scale.y=mobile?2:1;
  shade.matrixAutoUpdate=true;
  for(const item of mobileLayout){
    if(mobile){item.object.position.set(...item.position);item.object.scale.set(...item.scale);}
    else{item.object.position.copy(item.originalPosition);item.object.scale.copy(item.originalScale);}
  }
  if(mobile){
    lampRig.updateMatrixWorld(true);
    const headWorld=new THREE.Matrix4().compose(shade.getWorldPosition(new THREE.Vector3()),shade.quaternion,new THREE.Vector3(.9,.9,.9));
    shade.matrix.copy(lampRig.matrixWorld.clone().invert().multiply(headWorld));
    shade.matrixAutoUpdate=false;
  }
  previewScreen.visible=false;
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.7));
  renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;
  camera.fov=mobile?THREE.MathUtils.radToDeg(2*Math.atan(Math.max(5.2,3.65/camera.aspect)/15)):38;
  camera.updateProjectionMatrix();destination();
}
resize();camera.position.copy(target);currentLook.copy(look);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const approachStart=target.clone().add(new THREE.Vector3(.65,1.1,6));
let introTime=0,bootComplete=false;
let powerClicked=false;
function playPowerClick(){
  try{
    const audio=new (window.AudioContext||window.webkitAudioContext)();
    const osc=audio.createOscillator(),gain=audio.createGain();
    osc.type='square';osc.frequency.setValueAtTime(105,audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55,audio.currentTime+.055);
    audio.resume();
    gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.34,audio.currentTime+.006);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.12);
    osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.1);
  }catch{}
}
const bootOverlay=document.createElement('div');bootOverlay.className='monitor-boot';
bootOverlay.setAttribute('role','status');bootOverlay.setAttribute('aria-live','polite');
bootOverlay.innerHTML='<div class="boot95"><div class="boot95-flag" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="boot95-brand"><small>Степан Крылов</small><strong>Stepan<span>OS</span><b>95</b></strong><p>Проекты, игры и немного магии.</p></div><div class="boot95-bottom">Запуск StepanOS…<div class="boot95-progress"></div></div></div>';
ui.append(bootOverlay);ui.inert=true;root.classList.add('is-booting');
function updateIntro(dt){
  if(bootComplete)return;
  if(document.querySelector('.phone-intro')){camera.position.copy(approachStart);return;}
  introTime+=dt;
  const arrival=reducedMotion || document.body.classList.contains('paused')?0:2;
  if(introTime<arrival){
    const walkingTime=arrival*(2.05/3);
    const standing=target.clone().add(new THREE.Vector3(0,.8,.65));
    if(introTime<walkingTime){
      const t=introTime/walkingTime;
      const travel=t*t*(3-2*t);
      const steps=t*Math.PI*8;
      const envelope=Math.sin(Math.PI*t);
      camera.position.lerpVectors(approachStart,standing,travel);
      camera.position.y+=Math.abs(Math.sin(steps))*.16*envelope;
      camera.position.x+=Math.sin(steps*.5)*.13*envelope;
      camera.up.set(Math.sin(steps*.5)*.022*envelope,1,0).normalize();
    }else{
      const t=(introTime-walkingTime)/(arrival-walkingTime);
      const seated=t*t*(3-2*t);
      camera.position.lerpVectors(standing,target,seated);
      camera.position.y-=Math.sin(t*Math.PI)*.15;
      camera.position.z+=Math.sin(t*Math.PI*3)*.12*(1-t);
      camera.up.set(Math.sin(t*Math.PI*2)*.025*(1-t),1,0).normalize();
    }
  }else{
    camera.up.set(0,1,0);
  }
  const press=introTime-arrival;
  if(press>=0 && !powerClicked){powerClicked=true;playPowerClick();}
  powerButton.position.z=.30-(press>=0 && press<.38?Math.sin(Math.PI*press/.38)*.065:0);
  const elapsed=press-.22;
  if(elapsed>=0){
    powerLed.material.color.set('#82ba27');
    bootOverlay.classList.add('is-powered');

  }
  if(elapsed>=1.7){
    bootComplete=true;ui.inert=false;root.classList.remove('is-booting');
    bootOverlay.remove();
  }
}

function itemAt(event){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(scene.children,true).filter(hit=>hit.object.visible);if(!hits.length)return null;let node=hits[0].object;return interactiveItems.find(item=>{let current=node;while(current){if(current===item.object)return true;current=current.parent;}return false;})||null;}
function highlight(item) {
  if(hovered===item)return;
  if(hovered)hovered.object.traverse(node=>{
    if(!node.material?.emissive)return;
    node.material.emissive.copy(node.userData.baseEmissive || new THREE.Color(0));
    node.material.emissiveIntensity=node.userData.baseIntensity || 0;
  });
  hovered=item;
  if(item)item.object.traverse(node=>{
    if(!node.material?.emissive || node.userData.baseIntensity>1)return;
    node.material.emissive.setHex(0xa98743);node.material.emissiveIntensity=.23;
  });
  renderer.domElement.style.cursor=item?'pointer':'default';
}
function showCallout(item){if(!item)return;const bounds=new THREE.Box3().setFromObject(item.object);item.anchor=bounds.getCenter(new THREE.Vector3());item.anchor.y=bounds.max.y+.12;activeCallout=item;callout.textContent=item.label;callout.classList.add('is-visible');clearTimeout(calloutTimer);calloutTimer=setTimeout(()=>{activeCallout=null;callout.classList.remove('is-visible');},2667);}
let touchHighlightTimer;
renderer.domElement.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')highlight(itemAt(event));});
renderer.domElement.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')highlight(null);});
renderer.domElement.addEventListener('pointerdown',event=>{const item=itemAt(event);clearTimeout(touchHighlightTimer);highlight(item);if(event.pointerType!=='mouse')touchHighlightTimer=setTimeout(()=>highlight(null),2667);if(item?.object===roomWindow)showLegacy(event);else{hideLegacy();showCallout(item);}});
renderer.domElement.addEventListener('pointercancel',()=>highlight(null));
function selectView(computer){
  close=computer;destination();root.classList.toggle('computer-view',close);
  root.dataset.camera=close?'computer':'room';
  document.querySelectorAll('button[data-camera]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.camera===root.dataset.camera)));
}
window.portalView={enter(){selectView(true);},exit(){selectView(false);}};
const computerControl=document.querySelector('#view-computer');
computerControl.textContent='К компьютеру';computerControl.dataset.camera='computer';
const roomControl=document.createElement('button');roomControl.textContent='Комната';roomControl.dataset.camera='room';
computerControl.after(roomControl);
computerControl.addEventListener('click',()=>selectView(true));
roomControl.addEventListener('click',()=>selectView(false));
selectView(true);
window.addEventListener('resize',resize);
const clock=new THREE.Clock();function draw(){requestAnimationFrame(draw);if(document.hidden){clock.getDelta();return;}const elapsedFrame=clock.getDelta();const dt=Math.min(elapsedFrame,.05);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!document.body.classList.contains('paused')){camera.position.lerp(target,reduced?1:1-Math.exp(-dt*5));currentLook.lerp(look,reduced?1:1-Math.exp(-dt*5));}if(!document.body.classList.contains('paused'))metroTime+=elapsedFrame;metroPivot.rotation.z=reduced?0:Math.sin(metroTime*3.2)*.38;updateIntro(elapsedFrame);camera.lookAt(currentLook);camera.updateMatrixWorld();scene.updateMatrixWorld();const pts=corners.map(v=>{const p=monitor.localToWorld(v.clone()).project(camera);return[(p.x+1)*innerWidth/2,(1-p.y)*innerHeight/2];});const css=matrix(pts);if(css)ui.style.transform=css;if(callout.classList.contains('is-visible')&&activeCallout?.anchor){const p=activeCallout.anchor.clone().project(camera);const rawX=(p.x+1)*innerWidth/2,rawY=(1-p.y)*innerHeight/2,w=callout.offsetWidth,h=callout.offsetHeight;callout.style.left=`${Math.max(12+.12*w,Math.min(innerWidth-12-.88*w,rawX))}px`;callout.style.top=`${Math.max(12+1.15*h,Math.min(innerHeight-12,rawY))}px`;}renderer.render(scene,camera);root.classList.add('scene-ready');}draw();
if(location.hash)window.portalView.enter();
