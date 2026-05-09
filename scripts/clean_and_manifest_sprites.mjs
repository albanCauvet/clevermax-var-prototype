import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function loadPng(file) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file).pipe(new PNG()).on('parsed', function () { resolve(this); }).on('error', reject);
  });
}
function savePng(png, file) { return new Promise((resolve, reject) => png.pack().pipe(fs.createWriteStream(file)).on('finish', resolve).on('error', reject)); }

function key(r,g,b){return `${r},${g},${b}`}

function stripChecker(png) {
  const freq = new Map();
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i+3];
    if (a < 250) continue;
    const r = png.data[i], g = png.data[i+1], b = png.data[i+2];
    const k = key(r,g,b);
    freq.set(k, (freq.get(k)||0)+1);
  }
  const top = [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k])=>k.split(',').map(Number));
  const bg = top.filter(([r,g,b]) => Math.abs(r-g)<4 && Math.abs(g-b)<4 && r>180 && r<245).slice(0,2);
  const bgSet = new Set(bg.map(([r,g,b])=>key(r,g,b)));
  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i], g = png.data[i+1], b = png.data[i+2];
    if (bgSet.has(key(r,g,b))) png.data[i+3] = 0;
  }
  return bg;
}

function getAlpha(png, x, y){return png.data[(png.width*y+x)*4+3];}
function components(png, minAlpha=10){
  const {width,height}=png; const seen=new Uint8Array(width*height); const comps=[]; const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const idx=y*width+x; if(seen[idx]||getAlpha(png,x,y)<minAlpha)continue;
    seen[idx]=1; const q=[[x,y]]; let minX=x,maxX=x,minY=y,maxY=y,count=0;
    for(let qi=0;qi<q.length;qi++){
      const [cx,cy]=q[qi]; count++; if(cx<minX)minX=cx;if(cx>maxX)maxX=cx;if(cy<minY)minY=cy;if(cy>maxY)maxY=cy;
      for(const [dx,dy] of dirs){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const ni=ny*width+nx;if(seen[ni]||getAlpha(png,nx,ny)<minAlpha)continue;seen[ni]=1;q.push([nx,ny]);}
    }
    comps.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,pixels:count,cx:(minX+maxX)/2,cy:(minY+maxY)/2});
  }
  return comps;
}
function cluster(vals,t){const s=[...vals].sort((a,b)=>a-b);const g=[];for(const v of s){if(!g.length||Math.abs(v-g[g.length-1].m)>t)g.push({a:[v],m:v});else{const k=g[g.length-1];k.a.push(v);k.m=k.a.reduce((p,n)=>p+n,0)/k.a.length}}return g.map(x=>x.m)}
function assign(v,cs){let bi=0,bd=1e9;for(let i=0;i<cs.length;i++){const d=Math.abs(v-cs[i]);if(d<bd){bd=d;bi=i}}return bi}

function packFrames(comps, minPixels, xT, yT, pad){
  const f=comps.filter(c=>c.pixels>=minPixels);
  const rows=cluster(f.map(c=>c.cy),yT); const cols=cluster(f.map(c=>c.cx),xT);
  return {rows, cols, frames:f.map(c=>({row:assign(c.cy,rows),col:assign(c.cx,cols),x:Math.max(0,c.x-pad),y:Math.max(0,c.y-pad),w:c.w+2*pad,h:c.h+2*pad})).sort((a,b)=>a.row-b.row||a.col-b.col)};
}

async function run(){
  const root='/Users/alban/Documents/New project/assets/level-01-pack-v2-technical';
  const hero=await loadPng(path.join(root,'hero_max_16x24_4dir_v2.png'));
  const npc=await loadPng(path.join(root,'npc_pack_16x24_3chars_v2.png'));
  const heroBg=stripChecker(hero); const npcBg=stripChecker(npc);
  await savePng(hero,path.join(root,'hero_max_16x24_4dir_v2.clean.png'));
  await savePng(npc,path.join(root,'npc_pack_16x24_3chars_v2.clean.png'));
  const heroData=packFrames(components(hero,20),1500,100,110,8);
  const npcData=packFrames(components(npc,20),1200,80,90,6);
  const out={version:2,heroBg,npcBg,hero:{file:'hero_max_16x24_4dir_v2.clean.png',rows:['down','left','right','up'],cols:['idle','walk_1','walk_2','walk_3'],rowCenters:heroData.rows,colCenters:heroData.cols,frames:heroData.frames},npcs:{file:'npc_pack_16x24_3chars_v2.clean.png',characters:['student','merchant','rc'],rowCenters:npcData.rows,colCenters:npcData.cols,frames:npcData.frames}};
  fs.writeFileSync(path.join(root,'sprite-manifest.auto.json'),JSON.stringify(out,null,2)+'\n');
  console.log('hero frames',heroData.frames.length,'npc frames',npcData.frames.length);
}
run();
