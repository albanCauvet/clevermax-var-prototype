import fs from 'node:fs';
import { PNG } from 'pngjs';
const file='/Users/alban/Documents/New project/assets/level-01-pack-v2-technical/props_city_med_v2.png';
function load(file){return new Promise((res,rej)=>fs.createReadStream(file).pipe(new PNG()).on('parsed',function(){res(this)}).on('error',rej));}
function a(p,x,y){return p.data[(y*p.width+x)*4+3];}
function comps(p){const w=p.width,h=p.height,seen=new Uint8Array(w*h),r=[],d=[[1,0],[-1,0],[0,1],[0,-1]];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(seen[i]||a(p,x,y)<20)continue;seen[i]=1;const q=[[x,y]];let minX=x,maxX=x,minY=y,maxY=y,c=0;for(let qi=0;qi<q.length;qi++){const [cx,cy]=q[qi];c++;if(cx<minX)minX=cx;if(cx>maxX)maxX=cx;if(cy<minY)minY=cy;if(cy>maxY)maxY=cy;for(const [dx,dy]of d){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(seen[ni]||a(p,nx,ny)<20)continue;seen[ni]=1;q.push([nx,ny]);}}r.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,pixels:c});}return r;}
const p=await load(file);const c=comps(p).filter(x=>x.pixels>500).sort((a,b)=>a.y-b.y||a.x-b.x);
console.log('count',c.length);
c.slice(0,30).forEach((b,i)=>console.log(i,b));
