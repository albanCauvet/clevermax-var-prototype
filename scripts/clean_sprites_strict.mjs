import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function loadPng(file){return new Promise((res,rej)=>fs.createReadStream(file).pipe(new PNG()).on('parsed',function(){res(this)}).on('error',rej));}
function savePng(png,file){return new Promise((res,rej)=>png.pack().pipe(fs.createWriteStream(file)).on('finish',res).on('error',rej));}

function clearBg(png){
  for(let i=0;i<png.data.length;i+=4){
    const r=png.data[i],g=png.data[i+1],b=png.data[i+2];
    const mx=Math.max(r,g,b), mn=Math.min(r,g,b), sat=mx-mn;
    if(r>165&&g>165&&b>165&&sat<16){png.data[i+3]=0;}
  }
}
function alpha(p,x,y){return p.data[(y*p.width+x)*4+3];}
function countComp(p){
  const w=p.width,h=p.height,seen=new Uint8Array(w*h);let n=0;const d=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const idx=y*w+x;if(seen[idx]||alpha(p,x,y)<20)continue;n++;seen[idx]=1;const q=[[x,y]];
    for(let i=0;i<q.length;i++){const [cx,cy]=q[i];for(const [dx,dy] of d){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(seen[ni]||alpha(p,nx,ny)<20)continue;seen[ni]=1;q.push([nx,ny]);}}
  }
  return n;
}

const root='/Users/alban/Documents/New project/assets/level-01-pack-v2-technical';
for (const name of ['hero_max_16x24_4dir_v2.png','npc_pack_16x24_3chars_v2.png']){
  const p=await loadPng(path.join(root,name));
  clearBg(p);
  const out=path.join(root,name.replace('.png','.clean2.png'));
  await savePng(p,out);
  const p2=await loadPng(out);
  console.log(name,'components',countComp(p2));
}
