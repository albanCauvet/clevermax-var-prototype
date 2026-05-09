import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function load(file){return new Promise((res,rej)=>fs.createReadStream(file).pipe(new PNG()).on('parsed',function(){res(this)}).on('error',rej));}
function a(p,x,y){return p.data[(y*p.width+x)*4+3];}
function comps(p){const w=p.width,h=p.height,seen=new Uint8Array(w*h),r=[],d=[[1,0],[-1,0],[0,1],[0,-1]];for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(seen[i]||a(p,x,y)<20)continue;seen[i]=1;const q=[[x,y]];let minX=x,maxX=x,minY=y,maxY=y,c=0;for(let qi=0;qi<q.length;qi++){const [cx,cy]=q[qi];c++;if(cx<minX)minX=cx;if(cx>maxX)maxX=cx;if(cy<minY)minY=cy;if(cy>maxY)maxY=cy;for(const [dx,dy]of d){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;const ni=ny*w+nx;if(seen[ni]||a(p,nx,ny)<20)continue;seen[ni]=1;q.push([nx,ny]);}}r.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,pixels:c,cx:(minX+maxX)/2,cy:(minY+maxY)/2});}return r;}
function cluster(vals,t){const s=[...vals].sort((a,b)=>a-b),g=[];for(const v of s){if(!g.length||Math.abs(v-g[g.length-1].m)>t)g.push({m:v,a:[v]});else{const x=g[g.length-1];x.a.push(v);x.m=x.a.reduce((p,n)=>p+n,0)/x.a.length}}return g.map(x=>x.m)}
function idx(v,arr){let bi=0,bd=1e9;for(let i=0;i<arr.length;i++){const d=Math.abs(v-arr[i]);if(d<bd){bd=d;bi=i}}return bi}
function frames(cs,minPixels,pad,xT,yT){const f=cs.filter(c=>c.pixels>=minPixels&&c.w>20&&c.h>30);const rows=cluster(f.map(c=>c.cy),yT);const cols=cluster(f.map(c=>c.cx),xT);return {rows,cols,frames:f.map(c=>({row:idx(c.cy,rows),col:idx(c.cx,cols),x:Math.max(0,c.x-pad),y:Math.max(0,c.y-pad),w:c.w+2*pad,h:c.h+2*pad,pixels:c.pixels})).sort((a,b)=>a.row-b.row||a.col-b.col)};}

const root='/Users/alban/Documents/New project/assets/level-01-pack-v2-technical';
const hero=await load(path.join(root,'hero_max_16x24_4dir_v2.clean2.png'));
const npc=await load(path.join(root,'npc_pack_16x24_3chars_v2.clean2.png'));
const hf=frames(comps(hero),1300,8,90,90);
const nf=frames(comps(npc),1000,6,70,85);
const out={version:3,hero:{file:'hero_max_16x24_4dir_v2.clean2.png',rows:['down','left','right','up'],cols:['idle','walk_1','walk_2','walk_3'],rowCenters:hf.rows,colCenters:hf.cols,frames:hf.frames},npcs:{file:'npc_pack_16x24_3chars_v2.clean2.png',characters:['student','merchant','rc'],rowCenters:nf.rows,colCenters:nf.cols,frames:nf.frames}};
fs.writeFileSync(path.join(root,'sprite-manifest.auto.json'),JSON.stringify(out,null,2)+'\n');
console.log('hero',hf.frames.length,'rows',hf.rows.length,'cols',hf.cols.length);
console.log('npc',nf.frames.length,'rows',nf.rows.length,'cols',nf.cols.length);
