import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function loadPng(file) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(new PNG())
      .on('parsed', function () { resolve(this); })
      .on('error', reject);
  });
}

function getAlpha(png, x, y) {
  const idx = (png.width * y + x) << 2;
  return png.data[idx + 3];
}

function components(png, minAlpha = 10) {
  const { width, height } = png;
  const seen = new Uint8Array(width * height);
  const comps = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (seen[i] || getAlpha(png, x, y) < minAlpha) continue;
      let minX = x, maxX = x, minY = y, maxY = y, count = 0;
      const q = [[x, y]];
      seen[i] = 1;
      for (let qi = 0; qi < q.length; qi++) {
        const [cx, cy] = q[qi];
        count++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (seen[ni] || getAlpha(png, nx, ny) < minAlpha) continue;
          seen[ni] = 1;
          q.push([nx, ny]);
        }
      }
      comps.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, pixels: count, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 });
    }
  }
  return comps;
}

function clusterValues(values, threshold) {
  const sorted = [...values].sort((a,b)=>a-b);
  const groups = [];
  for (const v of sorted) {
    if (!groups.length || Math.abs(v - groups[groups.length-1].mean) > threshold) {
      groups.push({ values: [v], mean: v });
    } else {
      const g = groups[groups.length-1];
      g.values.push(v);
      g.mean = g.values.reduce((s,n)=>s+n,0) / g.values.length;
    }
  }
  return groups.map(g => g.mean);
}

function assignIndex(v, centers) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs(v - centers[i]);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function buildFrames(comps, xThresh, yThresh, minPixels = 2000, pad = 6) {
  const filtered = comps.filter(c => c.pixels >= minPixels);
  const rows = clusterValues(filtered.map(c => c.cy), yThresh);
  const cols = clusterValues(filtered.map(c => c.cx), xThresh);
  const frames = filtered.map(c => {
    const col = assignIndex(c.cx, cols);
    const row = assignIndex(c.cy, rows);
    return {
      row,
      col,
      x: Math.max(0, c.x - pad),
      y: Math.max(0, c.y - pad),
      w: c.w + pad * 2,
      h: c.h + pad * 2,
      bbox: c,
    };
  }).sort((a,b) => a.row - b.row || a.col - b.col);
  return { rows, cols, frames };
}

async function main() {
  const root = '/Users/alban/Documents/New project/assets/level-01-pack-v2-technical';
  const heroPath = path.join(root, 'hero_max_16x24_4dir_v2.png');
  const npcPath = path.join(root, 'npc_pack_16x24_3chars_v2.png');

  const [heroPng, npcPng] = await Promise.all([loadPng(heroPath), loadPng(npcPath)]);

  const heroData = buildFrames(components(heroPng, 12), 80, 80, 3000, 8);
  const npcData = buildFrames(components(npcPng, 12), 60, 90, 2500, 6);

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    notes: 'Auto-detected sprite boxes for current generated atlases.',
    hero: {
      file: 'hero_max_16x24_4dir_v2.png',
      rows: ['down', 'left', 'right', 'up'],
      cols: ['idle', 'walk_1', 'walk_2', 'walk_3'],
      rowCenters: heroData.rows,
      colCenters: heroData.cols,
      frames: heroData.frames,
    },
    npcs: {
      file: 'npc_pack_16x24_3chars_v2.png',
      characters: ['student', 'merchant', 'rc'],
      rowsPerCharacter: ['front', 'left', 'back', 'right'],
      colsPerDirection: ['idle', 'walk_1', 'walk_2'],
      rowCenters: npcData.rows,
      colCenters: npcData.cols,
      frames: npcData.frames,
    },
  };

  fs.writeFileSync(path.join(root, 'sprite-manifest.auto.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('written', path.join(root, 'sprite-manifest.auto.json'));
  console.log('hero frames', heroData.frames.length, 'npc frames', npcData.frames.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
