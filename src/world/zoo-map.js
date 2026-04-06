import * as THREE from 'three';
import { addStaticBox } from '../core/physics.js';

const ZOO_HALF = 36;

export function buildZooWorld(scene, world) {
  scene.add(makeStripedGround());
  addStaticBox(world, ZOO_HALF, 0.1, ZOO_HALF, 0, -0.1, 0);

  buildBoundaryWalls(scene, world);
  buildPaths(scene);

  const enclosures = [
    { name: 'Lions',     color: 0xd4a44c, pos: [-12, 0, -8],   size: [5, 2, 5] },
    { name: 'Elephants', color: 0x7a7a7a, pos: [12, 0, -8],    size: [6, 3, 6] },
    { name: 'Monkeys',   color: 0x7B3F00, pos: [-12, 0, -22],  size: [5, 2, 5] },
    { name: 'Penguins',  color: 0x5ba3c9, pos: [12, 0, -22],   size: [5, 1.6, 5] },
    { name: 'Giraffes',  color: 0xd4b347, pos: [0, 0, -32],    size: [6, 4, 6] },
  ];
  enclosures.forEach((e) => buildEnclosure(scene, world, e));

  const starPositions = [
    [-5, 1.2, -3], [5, 1.2, -3], [0, 1.2, -15],
    [-8, 1.2, -28], [8, 1.2, -28], [-20, 1.2, -15], [20, 1.2, -15],
  ];
  const stars = [];
  starPositions.forEach((p) => {
    const s = makeStar();
    s.position.set(p[0], p[1], p[2]);
    scene.add(s);
    stars.push(s);
  });

  buildEntrance(scene, world);

  [[-6,0,1],[6,0,1],[-18,0,-5],[18,0,-5],[-18,0,-18],[18,0,-18],
   [-6,0,-30],[6,0,-30],[-24,0,-10],[24,0,-10],[-24,0,-28],[24,0,-28],
   [-30,0,-2],[30,0,-2],[0,0,-10]].forEach((p) => {
    const t = makeTree(); t.position.set(p[0],p[1],p[2]); scene.add(t);
  });

  [[-2.5,0.3,-5],[2.5,0.3,-5],[-2.5,0.3,-15],[2.5,0.3,-15],
   [-2.5,0.3,-25],[2.5,0.3,-25]].forEach((p) => {
    const b = makeBench(); b.position.set(p[0],p[1],p[2]); scene.add(b);
  });

  [[-1.8,0,-2],[1.8,0,-2],[-1.8,0,-10],[1.8,0,-10],
   [-1.8,0,-18],[1.8,0,-18],[-1.8,0,-26],[1.8,0,-26]].forEach((p) => {
    const l = makeLampPost(); l.position.set(p[0],p[1],p[2]); scene.add(l);
  });

  [[-20,0,-3],[22,0,-12],[-15,0,-30],[28,0,-25],[-28,0,-20],[15,0,-35]].forEach((p) => {
    const r = makeRock(); r.position.set(p[0],p[1],p[2]); scene.add(r);
  });

  const fountain = makeFountain();
  fountain.position.set(0, 0, -10);
  scene.add(fountain);

  const s1 = makeDirSign('\u2190 Lions & Monkeys');
  s1.position.set(-2, 0, -6); scene.add(s1);
  const s2 = makeDirSign('Elephants & Penguins \u2192');
  s2.position.set(2, 0, -6); scene.add(s2);
  const s3 = makeDirSign('\u2191 Giraffes');
  s3.position.set(0, 0, -12); scene.add(s3);

  return { stars };
}

/* ============ GROUND ============ */

function makeStripedGround() {
  const size = ZOO_HALF * 2;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(0, 0, 512, 512);
  const stripeH = 512 / 16;
  ctx.fillStyle = 'rgba(90,145,70,0.35)';
  for (let i = 0; i < 16; i += 2) ctx.fillRect(0, i * stripeH, 512, stripeH);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(${40+Math.random()*30},${80+Math.random()*50},${30+Math.random()*30},0.15)`;
    ctx.fillRect(Math.random()*512, Math.random()*512, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(size / 8, size / 8);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

/* ============ WALLS ============ */

function buildBoundaryWalls(scene, world) {
  const H = 3.5, T = 0.5, half = ZOO_HALF;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: 0.9 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x6b635b });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6b635b });

  [{px:0,pz:-half,sx:half*2,sz:T},{px:0,pz:half,sx:half*2,sz:T},
   {px:-half,pz:0,sx:T,sz:half*2},{px:half,pz:0,sx:T,sz:half*2}].forEach(({px,pz,sx,sz})=>{
    const w = new THREE.Mesh(new THREE.BoxGeometry(sx,H,sz), wallMat);
    w.position.set(px,H/2,pz); w.castShadow=true; w.receiveShadow=true; scene.add(w);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(sx+0.2,0.25,sz+0.2), trimMat);
    tr.position.set(px,H+0.125,pz); tr.castShadow=true; scene.add(tr);
    addStaticBox(world, sx/2, H/2, sz/2, px, H/2, pz);
  });

  const pGeo = new THREE.BoxGeometry(1.2, H+0.6, 1.2);
  [[-half,-half],[-half,half],[half,-half],[half,half]].forEach(([x,z])=>{
    const p = new THREE.Mesh(pGeo, pillarMat);
    p.position.set(x,(H+0.6)/2,z); p.castShadow=true; scene.add(p);
  });
}

/* ============ PATHS ============ */

function buildPaths(scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb8a07a, roughness: 0.85 });
  const add = (w,h,x,y,z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat);
    m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.receiveShadow=true; scene.add(m);
  };
  add(3.2, 68, 0, 0.015, -2);
  add(68, 3.2, 0, 0.015, -10);
  add(3.2, 20, -12, 0.012, -28);
  add(3.2, 20,  12, 0.012, -28);
}

/* ============ ENCLOSURES ============ */

function buildEnclosure(scene, world, {name, color, pos, size}) {
  const [sx,sy,sz] = size;
  const hx = sx/2, hz = sz/2;

  // Ground pad
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(sx+1, sz+1),
    new THREE.MeshStandardMaterial({color:0x5a4a3a,roughness:0.95})
  );
  pad.rotation.x=-Math.PI/2; pad.position.set(pos[0],0.005,pos[2]);
  pad.receiveShadow=true; scene.add(pad);

  // Fence posts
  const postMat = new THREE.MeshStandardMaterial({color:0x3a3a3a,metalness:0.6,roughness:0.4});
  const postGeo = new THREE.CylinderGeometry(0.04,0.04,sy+0.5,6);
  const spacing = 0.6;
  for (let side=0; side<4; side++) {
    const isX = side<2, sign = side%2===0?-1:1;
    const count = Math.floor((isX?sz:sx)/spacing);
    for (let i=0; i<=count; i++) {
      const t = -0.5 + i/count;
      const p = new THREE.Mesh(postGeo, postMat);
      if (isX) p.position.set(pos[0]+sign*hx, (sy+0.5)/2, pos[2]+t*sz);
      else     p.position.set(pos[0]+t*sx, (sy+0.5)/2, pos[2]+sign*hz);
      p.castShadow=true; scene.add(p);
    }
    // Top rail
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(isX?0.06:sx, 0.06, isX?sz:0.06), postMat
    );
    rail.position.set(pos[0]+(isX?sign*hx:0), sy+0.4, pos[2]+(isX?0:sign*hz));
    scene.add(rail);
  }

  // Subtle coloured interior
  const inner = new THREE.Mesh(
    new THREE.BoxGeometry(sx*0.9, sy*0.3, sz*0.9),
    new THREE.MeshStandardMaterial({color, transparent:true, opacity:0.15})
  );
  inner.position.set(pos[0], sy*0.15, pos[2]); scene.add(inner);

  // Label sign
  const sg = new THREE.Group();
  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05,0.05,2,6),
    new THREE.MeshStandardMaterial({color:0x4a4a4a})
  );
  signPost.position.set(0,1,0);
  sg.add(signPost);
  const label = makeLabel(name); label.position.y=2.2; sg.add(label);
  sg.position.set(pos[0], 0, pos[2]+hz+0.8); scene.add(sg);

  addStaticBox(world, hx, sy/2, hz, pos[0], sy/2, pos[2]);
}

/* ============ ENTRANCE ============ */

function buildEntrance(scene, world) {
  const mat = new THREE.MeshStandardMaterial({color:0x8a3324, roughness:0.7});
  const lp = new THREE.Mesh(new THREE.BoxGeometry(0.8,4,0.8), mat);
  lp.position.set(-3,2,3); lp.castShadow=true; scene.add(lp);
  addStaticBox(world,0.4,2,0.4,-3,2,3);
  const rp = lp.clone(); rp.position.set(3,2,3); scene.add(rp);
  addStaticBox(world,0.4,2,0.4,3,2,3);
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(7,0.6,0.8),
    new THREE.MeshStandardMaterial({color:0x6b2318})
  );
  beam.position.set(0,4.1,3); beam.castShadow=true; scene.add(beam);
  const al = makeLabel('ZOO');
  al.position.set(0,4.8,3.5); al.scale.set(3.5,0.9,1); scene.add(al);
}

/* ============ OBJECTS ============ */

function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width=512; c.height=128;
  const ctx = c.getContext('2d');
  ctx.fillStyle='rgba(20,20,20,0.8)';
  ctx.beginPath(); ctx.roundRect(8,8,496,112,14); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(8,8,496,112,14); ctx.stroke();
  ctx.fillStyle='#e8e8e8';
  ctx.font='600 42px "SF Pro Display","Segoe UI",Roboto,"Helvetica Neue",sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text,256,64);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex}));
  s.scale.set(2.8,0.7,1);
  return s;
}

function makeStar() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.25,0),
    new THREE.MeshStandardMaterial({color:0xffd700,emissive:0xffa500,emissiveIntensity:0.5,metalness:0.3})
  );
  m.castShadow=true; g.add(m);
  g.userData.isStar=true;
  return g;
}

function makeTree() {
  const g = new THREE.Group();
  const th = 1.2+Math.random()*0.8, lr = 0.9+Math.random()*0.5, lh = 2+Math.random();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12,0.18,th,7),
    new THREE.MeshStandardMaterial({color:0x5c3a1e,roughness:0.9})
  );
  trunk.position.y=th/2; trunk.castShadow=true; g.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(lr,lh,8),
    new THREE.MeshStandardMaterial({color:0x2d6b2d})
  );
  leaves.position.y=th+lh/2-0.2; leaves.castShadow=true; g.add(leaves);
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(lr*0.6,lh*0.6,7),
    new THREE.MeshStandardMaterial({color:0x358535})
  );
  top.position.y=th+lh*0.8; top.castShadow=true; g.add(top);
  return g;
}

function makeBench() {
  const g = new THREE.Group();
  const w = new THREE.MeshStandardMaterial({color:0x6b4226,roughness:0.85});
  const mt = new THREE.MeshStandardMaterial({color:0x3a3a3a,metalness:0.5});
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.08,0.45),w);
  seat.position.y=0.45; seat.castShadow=true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.5,0.06),w);
  back.position.set(0,0.7,-0.2); back.castShadow=true; g.add(back);
  [[-0.55,0],[0.55,0]].forEach(([x,z])=>{
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.45,0.4),mt);
    leg.position.set(x,0.225,z); g.add(leg);
  });
  return g;
}

function makeLampPost() {
  const g = new THREE.Group();
  const mt = new THREE.MeshStandardMaterial({color:0x2a2a2a,metalness:0.7,roughness:0.3});
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,3.5,8),mt);
  pole.position.y=1.75; pole.castShadow=true; g.add(pole);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18,8,6,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:0xfff8e0,emissive:0xfff0b0,emissiveIntensity:0.3})
  );
  head.position.y=3.5; g.add(head);
  return g;
}

function makeRock() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({color:0x7a756e,roughness:0.95});
  const n = 1+Math.floor(Math.random()*3);
  for (let i=0; i<n; i++) {
    const r = 0.3+Math.random()*0.5;
    const geo = new THREE.SphereGeometry(r,5,4);
    const pa = geo.attributes.position;
    for (let j=0; j<pa.count; j++)
      pa.setXYZ(j,pa.getX(j)*(0.8+Math.random()*0.4),pa.getY(j)*(0.6+Math.random()*0.4),pa.getZ(j)*(0.8+Math.random()*0.4));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo,mat);
    m.position.set(Math.random()*0.6-0.3,r*0.4,Math.random()*0.6-0.3);
    m.castShadow=true; g.add(m);
  }
  return g;
}

function makeFountain() {
  const g = new THREE.Group();
  const st = new THREE.MeshStandardMaterial({color:0x9a9590,roughness:0.8});
  const wt = new THREE.MeshStandardMaterial({color:0x3a8abf,transparent:true,opacity:0.6,metalness:0.1});
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2,2.2,0.6,16),st);
  basin.position.y=0.3; basin.castShadow=true; g.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.8,16),wt);
  water.rotation.x=-Math.PI/2; water.position.y=0.58; g.add(water);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,1.5,8),st);
  pillar.position.y=1.05; pillar.castShadow=true; g.add(pillar);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.4,0.3,10),st);
  bowl.position.y=1.8; g.add(bowl);
  return g;
}

function makeDirSign(text) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04,0.05,1.8,6),
    new THREE.MeshStandardMaterial({color:0x5c3a1e,roughness:0.85})
  );
  post.position.y=0.9; g.add(post);
  const c = document.createElement('canvas');
  c.width=512; c.height=96;
  const ctx = c.getContext('2d');
  ctx.fillStyle='rgba(60,40,20,0.9)';
  ctx.beginPath(); ctx.roundRect(4,4,504,88,10); ctx.fill();
  ctx.fillStyle='#e8dcc8';
  ctx.font='500 32px "SF Pro Display","Segoe UI",Roboto,"Helvetica Neue",sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text,256,48);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex}));
  s.scale.set(2.2,0.42,1); s.position.y=1.7; g.add(s);
  return g;
}
