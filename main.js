const TILE = 32;
const SPEED = 2;
const VIEW_W = 960;
const VIEW_H = 640;
const CAMERA_ZOOM = 1.18;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const zoneNameEl = document.getElementById('zoneName');
const objectiveEl = document.getElementById('objective');
const flagsEl = document.getElementById('flags');

const dialogBox = document.getElementById('dialog');
const dialogName = document.getElementById('dialogName');
const dialogText = document.getElementById('dialogText');
const dialogBtn = document.getElementById('dialogBtn');

const keys = new Set();
const SAVE_KEY = 'clevermax_var_save_v3';
const state = {
  zones: null,
  dialogues: null,
  quests: null,
  currentZoneId: 'CM_PLACE_CENTRALE',
  player: { x: 720, y: 740, w: 22, h: 22, dir: 'down', walkTick: 0 },
  flags: new Set(),
  dialogQueue: [],
  assets: null,
  dialog: { open: false, speaker: '', lines: [], index: 0, onClose: null },
  toast: { text: '', until: 0 },
  tileCache: null,
  camera: { x: 0, y: 0, w: VIEW_W, h: VIEW_H },
  audio: { ctx: null, master: null, delay: null, started: false, muted: false, timers: [] },
};

const DIR_FROM_VEC = (dx, dy, prev) => {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  if (Math.abs(dy) > 0) return dy > 0 ? 'down' : 'up';
  return prev;
};

const heroRowIndex = { down: 0, left: 1, right: 2, up: 3 };

const npcKinds = {
  NPC_RC_M1_START: 'rc',
  NPC_RC_M1_END: 'rc',
  NPC_CM_STUDENT_M1: 'student',
  NPC_CM_MERCHANT_M1: 'merchant',
};

const npcDisplay = {
  NPC_CM_STUDENT_M1: { name: 'Léa', marker: 'FAC', role: 'Étudiante', questFlag: 'FLAG_CM_M1_TALK_STUDENT' },
  NPC_CM_MERCHANT_M1: { name: 'Marius', marker: 'MARCHÉ', role: 'Commerçant', questFlag: 'FLAG_CM_M1_TALK_MERCHANT' },
  NPC_RC_M1_END: { name: 'RC', marker: 'RC', role: 'Coordinateur', questFlag: 'FLAG_CM_M1_REPORT_RC' },
  NPC_RC_M1_START: { name: 'RC', marker: 'RC', role: 'Coordinateur', questFlag: null },
};

const fallbackData = {
  zones: {
    zones: [
      { id: 'CM_PLACE_CENTRALE', displayName: 'Place centrale de Toulon' },
      { id: 'CM_PORT_TOULON', displayName: 'Port de Toulon' },
      { id: 'CM_GARE', displayName: 'Gare de Toulon' },
      { id: 'CM_CENTRE_RUES', displayName: 'Rues provençales' },
    ],
  },
  quests: { missions: [] },
  dialogues: {
    NPC_RC_M1_START: [
      'Max, ici RC. Alerte niveau 1 sur la place centrale.',
      'Une session professionnelle serait restée ouverte dans un bureau municipal.',
      "Avant d'intervenir, recoupe l'information avec deux témoins.",
      "Cherche le repère FAC près des stands bleus, puis le repère MARCHÉ.",
      'Quand tu auras leurs versions, sécurise le poste et reviens me voir près de la statue.',
    ],
    NPC_CM_STUDENT_M1: [
      'Salut Max. Je suis Léa, je révise souvent ici entre deux bus.',
      "J'ai aperçu un mail bizarre sur un poste déjà connecté: objet urgent, pièce jointe, ton très pressant.",
      "Le plus inquiétant, c'est qu'il n'y avait personne devant l'écran.",
      "Si quelqu'un passe par là, il peut lire, répondre ou envoyer n'importe quoi au nom de l'agent.",
      'Va voir le commerçant au marché. Il a remarqué quelque chose avec un badge ce matin.',
    ],
    NPC_CM_MERCHANT_M1: [
      'Ah, Max! Marius, fruits du marché et ragots vérifiés.',
      'Ce matin, un badge professionnel traînait sur mon comptoir, posé entre les cagettes.',
      "Une personne pressée l'a repris sans même vérifier qui regardait.",
      "Un badge visible plus une session ouverte, ça commence à faire une belle porte d'entrée.",
      'Le bureau est derrière la façade claire. Si tu vois le terminal allumé, verrouille-le tout de suite.',
    ],
    OBJ_M1_BUREAU_TERMINAL: [
      'Session détectée: utilisateur municipal connecté.',
      'Écran actif, messagerie ouverte, pièce jointe en attente.',
      'Verrouillage de la session en cours...',
      'Session verrouillée. Accès protégé.',
      "Note de Max: un simple raccourci clavier aurait évité l'incident.",
      'Retourne voir RC près de la statue pour faire ton rapport.',
    ],
    NPC_RC_M1_PROGRESS: [
      'Pas trop vite, Max.',
      'En cybersécurité, une intuition ne suffit pas: il faut croiser les signaux.',
      "Repère d'abord le témoin FAC, puis le témoin MARCHÉ.",
      'Quand les deux versions concordent, seulement là tu verrouilles la session.',
    ],
    NPC_RC_M1_END: [
      'Excellent travail, Max.',
      "Tu as recoupé les témoignages avant d'agir: c'est exactement le bon réflexe.",
      'Une session ouverte paraît banale, mais elle peut suffire à envoyer un faux message ou récupérer des documents.',
      "Je t'ajoute le module Verrouillage de session.",
      "Le Port de Toulon est maintenant accessible. On y parle d'un réseau public un peu trop accueillant.",
    ],
    SYSTEM_M1_LESSON: [
      'Réflexe clé: ne jamais quitter un poste sans verrouiller sa session.',
    ],
  },
};

function hasFlag(flag) { return state.flags.has(flag); }
function setFlag(flag) { state.flags.add(flag); updateUI(); }
function toast(text, ms = 1800) {
  state.toast.text = text;
  state.toast.until = performance.now() + ms;
}
function saveGame() {
  const payload = {
    currentZoneId: state.currentZoneId,
    player: {
      x: state.player.x,
      y: state.player.y,
      dir: state.player.dir,
      walkTick: state.player.walkTick,
    },
    flags: [...state.flags],
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s || !s.currentZoneId || !Array.isArray(s.flags)) return false;
    state.currentZoneId = s.currentZoneId;
    state.flags = new Set(s.flags);
    if (s.player) {
      state.player.x = s.player.x ?? state.player.x;
      state.player.y = s.player.y ?? state.player.y;
      state.player.dir = s.player.dir ?? state.player.dir;
      state.player.walkTick = s.player.walkTick ?? state.player.walkTick;
    }
    return true;
  } catch {
    return false;
  }
}
function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  state.flags.clear();
  state.currentZoneId = 'CM_PLACE_CENTRALE';
  state.player.x = 720;
  state.player.y = 740;
  state.player.dir = 'down';
  state.player.walkTick = 0;
  updateUI();
  toast('Partie réinitialisée');
}
function canUseTerminal() { return hasFlag('FLAG_CM_M1_TALK_STUDENT') && hasFlag('FLAG_CM_M1_TALK_MERCHANT'); }
function missionDone() { return hasFlag('FLAG_CM_MISSION_01_DONE'); }

function objectiveText() {
  if (!hasFlag('FLAG_CM_M1_TALK_STUDENT')) return "Trouver le repère FAC près des stands bleus.";
  if (!hasFlag('FLAG_CM_M1_TALK_MERCHANT')) return "Trouver le repère MARCHÉ et recouper le témoignage.";
  if (!hasFlag('FLAG_CM_M1_LOCK_SESSION')) return "Verrouiller la session au terminal du bureau.";
  if (!hasFlag('FLAG_CM_M1_REPORT_RC')) return "Faire le rapport au repère RC près de la statue.";
  return 'Mission 1 terminée. Le Port est débloqué.';
}

function updateUI() {
  const z = state.zones.zones.find((zone) => zone.id === state.currentZoneId);
  zoneNameEl.textContent = `Zone: ${z.displayName}`;
  objectiveEl.textContent = `Objectif: ${objectiveText()}`;
  const progress = [
    ['Témoin 1', 'FLAG_CM_M1_TALK_STUDENT'],
    ['Témoin 2', 'FLAG_CM_M1_TALK_MERCHANT'],
    ['Session verrouillée', 'FLAG_CM_M1_LOCK_SESSION'],
    ['Rapport RC', 'FLAG_CM_M1_REPORT_RC'],
  ].map(([label, flag]) => `${hasFlag(flag) ? 'OK' : '...'} ${label}`).join(' | ');
  flagsEl.textContent = `Carnet cyber: ${progress}`;
}

function showDialog(lines, onClose, speaker = '') {
  state.dialog.open = true;
  state.dialog.speaker = speaker;
  state.dialog.lines = [...lines];
  state.dialog.index = 0;
  state.dialog.onClose = onClose;
  dialogBox.classList.add('hidden');
  dialogName.textContent = '';
  dialogText.textContent = '';
  dialogBtn.onclick = null;
}

function advanceDialog() {
  if (!state.dialog.open) return;
  if (state.dialog.index < state.dialog.lines.length - 1) {
    state.dialog.index++;
    return;
  }
  const onClose = state.dialog.onClose;
  state.dialog.open = false;
  state.dialog.speaker = '';
  state.dialog.lines = [];
  state.dialog.index = 0;
  state.dialog.onClose = null;
  if (onClose) onClose();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function decorCollider(d) {
  if (!d.collides) return null;
  const w = d.cw ?? 24;
  const h = d.ch ?? 18;
  return {
    x: Math.round(d.x - w / 2),
    y: Math.round(d.y - h + 8),
    w,
    h,
  };
}

function sceneryCollider(s) {
  if (!['building', 'water', 'fountain', 'imageCollider'].includes(s.type)) return null;
  return { x: s.x, y: s.y, w: s.w, h: s.h };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function updateCamera(z) {
  state.camera.w = Math.round(VIEW_W / CAMERA_ZOOM);
  state.camera.h = Math.round(VIEW_H / CAMERA_ZOOM);
  state.camera.x = clamp(
    Math.round(state.player.x + state.player.w / 2 - state.camera.w / 2),
    0,
    Math.max(0, z.walkable.w - state.camera.w)
  );
  state.camera.y = clamp(
    Math.round(state.player.y + state.player.h / 2 - state.camera.h / 2),
    0,
    Math.max(0, z.walkable.h - state.camera.h)
  );
}

function currentQuestTarget(z) {
  if (!hasFlag('FLAG_CM_M1_TALK_STUDENT')) return (z.npcs || []).find((n) => n.id === 'NPC_CM_STUDENT_M1');
  if (!hasFlag('FLAG_CM_M1_TALK_MERCHANT')) return (z.npcs || []).find((n) => n.id === 'NPC_CM_MERCHANT_M1');
  if (!hasFlag('FLAG_CM_M1_LOCK_SESSION')) return (z.terminals || [])[0];
  if (!hasFlag('FLAG_CM_M1_REPORT_RC')) return (z.npcs || []).find((n) => n.id === 'NPC_RC_M1_END');
  return (z.exits || [])[0];
}

function midiToFreq(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

function playTone(ctx, destination, freq, start, duration, type = 'square', gain = 0.08) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function scheduleMusicBar(offset = 0) {
  if (!state.audio.ctx || state.audio.muted) return;
  const ctx = state.audio.ctx;
  const dest = state.audio.delay || state.audio.master;
  const start = ctx.currentTime + offset;
  const step = 0.18;
  const barCount = state.audio.barCount ?? 0;
  const melody = [76, 79, 81, 83, 81, 79, 76, 74, 76, 79, 84, 83, 81, 79, 78, 76];
  const counter = [64, 67, 69, 71, 69, 67, 64, 62, 64, 67, 72, 71, 69, 67, 66, 64];
  const bass = [45, 45, 52, 52, 43, 43, 50, 50];
  const motif = [76, 79, 81, 84, 83, 79];
  for (let i = 0; i < melody.length; i++) {
    const t = start + i * step;
    playTone(ctx, dest, midiToFreq(melody[i]), t, step * 0.82, 'square', 0.055);
    if (i % 2 === 1) playTone(ctx, dest, midiToFreq(counter[i]), t, step * 0.65, 'triangle', 0.028);
  }
  if (barCount % 3 === 1) {
    const motifStart = start + step * 7.5;
    motif.forEach((note, i) => {
      playTone(ctx, dest, midiToFreq(note), motifStart + i * step * 0.75, step * 0.52, 'square', 0.075);
    });
  }
  for (let i = 0; i < bass.length; i++) {
    playTone(ctx, state.audio.master, midiToFreq(bass[i]), start + i * step * 2, step * 1.6, 'sawtooth', 0.03);
  }
  state.audio.barCount = barCount + 1;
}

function startMusic() {
  if (state.audio.started || state.audio.muted) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.28;
  master.connect(ctx.destination);

  const delay = ctx.createDelay();
  const feedback = ctx.createGain();
  const wet = ctx.createGain();
  delay.delayTime.value = 0.18;
  feedback.gain.value = 0.18;
  wet.gain.value = 0.16;
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(master);

  state.audio.ctx = ctx;
  state.audio.master = master;
  state.audio.delay = delay;
  state.audio.started = true;

  scheduleMusicBar(0.05);
  const loopMs = 16 * 0.18 * 1000;
  const timer = window.setInterval(() => scheduleMusicBar(0.08), loopMs);
  state.audio.timers.push(timer);
  toast('Musique 16-bit activée');
}

function toggleMusic() {
  if (!state.audio.started) {
    state.audio.muted = false;
    startMusic();
    return;
  }
  state.audio.muted = !state.audio.muted;
  if (state.audio.master) state.audio.master.gain.value = state.audio.muted ? 0 : 0.28;
  toast(state.audio.muted ? 'Musique coupée' : 'Musique activée');
}

function drawMarker(x, y, label, active = false) {
  const pulse = active ? Math.sin(performance.now() / 160) * 3 : 0;
  ctx.save();
  ctx.fillStyle = active ? 'rgba(17,197,217,0.22)' : 'rgba(11,30,58,0.18)';
  ctx.strokeStyle = active ? '#11c5d9' : '#f2a65a';
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 22 + pulse, 9 + pulse * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const w = Math.max(28, label.length * 7 + 12);
  ctx.fillStyle = active ? '#0b1e3a' : 'rgba(11,30,58,0.9)';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - 42 - pulse), w, 18);
  ctx.strokeStyle = active ? '#11c5d9' : '#f2a65a';
  ctx.strokeRect(Math.round(x - w / 2), Math.round(y - 42 - pulse), w, 18);
  ctx.fillStyle = '#f6f1e9';
  ctx.font = '10px Trebuchet MS';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 29 - pulse);
  ctx.restore();
}

function drawQuestMarkers(z) {
  const target = currentQuestTarget(z);
  const drawFor = (entity, label, doneFlag = null) => {
    const done = doneFlag && hasFlag(doneFlag);
    if (done) return;
    const active = entity === target;
    drawMarker(entity.x + entity.w / 2, entity.y + entity.h + 5, label, active);
  };

  for (const npc of z.npcs || []) {
    const display = npcDisplay[npc.id];
    if (display?.marker) drawFor(npc, display.marker, display.questFlag);
  }
  for (const terminal of z.terminals || []) {
    if (!hasFlag('FLAG_CM_M1_LOCK_SESSION')) drawFor(terminal, 'SESSION', 'FLAG_CM_M1_LOCK_SESSION');
  }
  for (const ex of z.exits || []) {
    if (missionDone()) drawMarker(ex.x + ex.w / 2, ex.y + ex.h / 2, 'PORT', ex === target);
  }
}

function drawHudOverlay() {
  const next = objectiveText();
  const z = currentZoneModel();
  ctx.save();
  ctx.fillStyle = 'rgba(11,30,58,0.78)';
  ctx.fillRect(12, 12, 374, 58);
  ctx.strokeStyle = '#11c5d9';
  ctx.strokeRect(12, 12, 374, 58);
  ctx.fillStyle = '#f2a65a';
  ctx.font = 'bold 12px Trebuchet MS';
  ctx.fillText('MISSION 01 - SESSION OUVERTE', 24, 32);
  ctx.fillStyle = '#f6f1e9';
  ctx.font = '12px Trebuchet MS';
  ctx.fillText(next.length > 58 ? `${next.slice(0, 56)}...` : next, 24, 52);

  ctx.fillStyle = 'rgba(11,30,58,0.78)';
  ctx.fillRect(12, 78, 196, 28);
  ctx.strokeStyle = '#f2a65a';
  ctx.strokeRect(12, 78, 196, 28);
  ctx.fillStyle = '#f6f1e9';
  ctx.font = '12px Trebuchet MS';
  ctx.fillText(z.displayName ?? 'Lieu inconnu', 24, 97);

  const moduleText = hasFlag('FLAG_CM_M1_LOCK_SESSION')
    ? 'Module cyber acquis: verrouillage de session'
    : 'Réflexe cyber: recouper avant d’agir';
  ctx.fillStyle = 'rgba(246,241,233,0.92)';
  ctx.fillRect(VIEW_W - 322, 12, 310, 34);
  ctx.strokeStyle = '#0b1e3a';
  ctx.strokeRect(VIEW_W - 322, 12, 310, 34);
  ctx.fillStyle = '#0b1e3a';
  ctx.font = '12px Trebuchet MS';
  ctx.fillText(moduleText, VIEW_W - 310, 34);
  ctx.restore();
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawDialogOverlay() {
  if (!state.dialog.open) return;
  const boxX = 34;
  const boxY = VIEW_H - 170;
  const boxW = VIEW_W - 68;
  const boxH = 136;
  const speaker = state.dialog.speaker;
  const line = state.dialog.lines[state.dialog.index] ?? '';
  const isLast = state.dialog.index === state.dialog.lines.length - 1;

  ctx.save();
  ctx.fillStyle = 'rgba(4, 16, 32, 0.74)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = '#fffaf1';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#0b1e3a';
  ctx.lineWidth = 4;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#11c5d9';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 7, boxY + 7, boxW - 14, boxH - 14);

  if (speaker) {
    const nameW = Math.max(86, speaker.length * 12 + 30);
    ctx.fillStyle = '#0b1e3a';
    ctx.fillRect(boxX + 20, boxY - 26, nameW, 28);
    ctx.strokeStyle = '#f2a65a';
    ctx.strokeRect(boxX + 20, boxY - 26, nameW, 28);
    ctx.fillStyle = '#f6f1e9';
    ctx.font = 'bold 15px Trebuchet MS';
    ctx.fillText(speaker, boxX + 34, boxY - 7);
  }

  ctx.fillStyle = '#1a1a1a';
  ctx.font = '18px Trebuchet MS';
  const lines = wrapText(line, boxW - 76).slice(0, 4);
  lines.forEach((textLine, i) => {
    ctx.fillText(textLine, boxX + 34, boxY + 42 + i * 24);
  });

  ctx.fillStyle = '#0b1e3a';
  ctx.font = '12px Trebuchet MS';
  ctx.fillText(isLast ? 'Espace: fermer' : 'Espace: continuer', boxX + boxW - 138, boxY + boxH - 18);
  ctx.restore();
}

function drawOverlayItem(item) {
  if (item.type === 'sign') {
    const w = Math.max(54, item.text.length * 9 + 20);
    const h = 24;
    ctx.save();
    ctx.fillStyle = '#f6f1e9';
    ctx.fillRect(item.x, item.y, w, h);
    ctx.strokeStyle = '#0b1e3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x, item.y, w, h);
    ctx.fillStyle = '#0b1e3a';
    ctx.font = 'bold 11px Trebuchet MS';
    ctx.textAlign = 'center';
    ctx.fillText(item.text, item.x + w / 2, item.y + 16);

    ctx.fillStyle = '#0b1e3a';
    if (item.arrow === 'right') {
      ctx.beginPath();
      ctx.moveTo(item.x + w + 7, item.y + 12);
      ctx.lineTo(item.x + w - 3, item.y + 5);
      ctx.lineTo(item.x + w - 3, item.y + 19);
      ctx.closePath();
      ctx.fill();
    } else if (item.arrow === 'up') {
      ctx.beginPath();
      ctx.moveTo(item.x + w / 2, item.y - 8);
      ctx.lineTo(item.x + w / 2 - 8, item.y + 2);
      ctx.lineTo(item.x + w / 2 + 8, item.y + 2);
      ctx.closePath();
      ctx.fill();
    } else if (item.arrow === 'down') {
      ctx.beginPath();
      ctx.moveTo(item.x + w / 2, item.y + h + 8);
      ctx.lineTo(item.x + w / 2 - 8, item.y + h - 2);
      ctx.lineTo(item.x + w / 2 + 8, item.y + h - 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (item.type === 'rctRibbon') {
    ctx.save();
    const stripe = 14;
    for (let x = item.x; x < item.x + item.w; x += stripe) {
      ctx.fillStyle = ((x - item.x) / stripe) % 2 === 0 ? '#151515' : '#c91f2e';
      ctx.fillRect(x, item.y, stripe, 14);
    }
    ctx.strokeStyle = 'rgba(246,241,233,0.75)';
    ctx.strokeRect(item.x, item.y, item.w, 14);
    ctx.fillStyle = '#f6f1e9';
    ctx.font = 'bold 9px Trebuchet MS';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, item.x + item.w / 2, item.y + 10);
    ctx.restore();
    return;
  }

  if (item.type === 'rctFlag') {
    ctx.save();
    ctx.fillStyle = '#151515';
    ctx.fillRect(item.x, item.y, 4, 30);
    ctx.fillStyle = '#c91f2e';
    ctx.fillRect(item.x + 4, item.y + 2, 18, 10);
    ctx.fillStyle = '#151515';
    ctx.fillRect(item.x + 4, item.y + 12, 18, 10);
    ctx.restore();
  }
}

function drawOverlays(z) {
  for (const item of z.overlays || []) drawOverlayItem(item);
}

function zoneTemplate(id) {
  if (id === 'CM_GARE') {
    return {
      bg: '#c2dceb',
      walkable: { x: 0, y: 0, w: 24 * TILE, h: 16 * TILE },
      npcs: [
        { id: 'NPC_RC_M1_START', x: 5 * TILE, y: 8 * TILE, w: 24, h: 24, dir: 'down' },
        { id: 'NPC_CM_STUDENT_M1', x: 15 * TILE, y: 6 * TILE, w: 24, h: 24, dir: 'down' },
      ],
      scenery: [
        { type: 'building', x: 2 * TILE, y: 1 * TILE, w: 19 * TILE, h: 3 * TILE, label: 'GARE', variant: 'station', roof: 'slate' },
        { type: 'road', x: 2 * TILE, y: 11 * TILE, w: 21 * TILE, h: 2 * TILE },
        { type: 'crosswalk', x: 10 * TILE, y: 11 * TILE, w: 3 * TILE, h: 2 * TILE },
        { type: 'planterRow', x: 3 * TILE, y: 5 * TILE, w: 16 * TILE, h: TILE },
        { type: 'awning', x: 4 * TILE, y: 4 * TILE, w: 5 * TILE, h: 14, color: '#11c5d9' },
        { type: 'awning', x: 12 * TILE, y: 4 * TILE, w: 5 * TILE, h: 14, color: '#f2a65a' },
        { type: 'bollardRow', x: 3 * TILE, y: 10 * TILE, w: 18 * TILE },
        { type: 'posterWall', x: 18 * TILE, y: 2 * TILE, w: 2 * TILE, h: TILE },
      ],
      decor: [
        { prop: 0, x: 3 * TILE, y: 5 * TILE, s: 0.13, collides: true, cw: 18, ch: 18 },
        { prop: 1, x: 8 * TILE, y: 5 * TILE, s: 0.12, collides: true, cw: 22, ch: 18 },
        { prop: 13, x: 19 * TILE, y: 5 * TILE, s: 0.16, collides: true, cw: 16, ch: 18 },
        { prop: 3, x: 20 * TILE, y: 12 * TILE, s: 0.14, collides: true, cw: 24, ch: 20 },
        { prop: 6, x: 12 * TILE, y: 13 * TILE, s: 0.10, collides: true, cw: 38, ch: 18 },
        { prop: 10, x: 16 * TILE, y: 13 * TILE, s: 0.12, collides: true, cw: 20, ch: 18 },
        { prop: 14, x: 21 * TILE, y: 6 * TILE, s: 0.12, collides: true, cw: 18, ch: 18 },
      ],
      exits: [{ x: 23 * TILE, y: 7 * TILE, w: TILE, h: 2 * TILE, to: 'CM_CENTRE_RUES' }],
      blocks: [{ x: 0, y: 0, w: 2 * TILE, h: 16 * TILE }, { x: 0, y: 0, w: 24 * TILE, h: TILE }]
    };
  }
  if (id === 'CM_CENTRE_RUES') {
    return {
      bg: '#efd0a2',
      walkable: { x: 0, y: 0, w: 28 * TILE, h: 18 * TILE },
      npcs: [{ id: 'NPC_CM_MERCHANT_M1', x: 8 * TILE, y: 11 * TILE, w: 24, h: 24, dir: 'down' }],
      scenery: [
        { type: 'building', x: 2 * TILE, y: 1 * TILE, w: 8 * TILE, h: 5 * TILE, label: 'CAFE', variant: 'shop', roof: 'terra' },
        { type: 'building', x: 17 * TILE, y: 1 * TILE, w: 8 * TILE, h: 5 * TILE, label: 'MARCHE', variant: 'market', roof: 'terra' },
        { type: 'building', x: 2 * TILE, y: 14 * TILE, w: 6 * TILE, h: 3 * TILE, label: '', variant: 'house', roof: 'terra' },
        { type: 'building', x: 21 * TILE, y: 14 * TILE, w: 5 * TILE, h: 3 * TILE, label: '', variant: 'house', roof: 'slate' },
        { type: 'alley', x: 12 * TILE, y: 0, w: 3 * TILE, h: 18 * TILE },
        { type: 'road', x: 0, y: 8 * TILE, w: 28 * TILE, h: 3 * TILE },
        { type: 'awning', x: 3 * TILE, y: 6 * TILE, w: 6 * TILE, h: 14, color: '#d86a4f' },
        { type: 'awning', x: 18 * TILE, y: 6 * TILE, w: 6 * TILE, h: 14, color: '#11c5d9' },
        { type: 'clothesLine', x: 10 * TILE, y: 3 * TILE, w: 8 * TILE },
        { type: 'bollardRow', x: 1 * TILE, y: 7 * TILE, w: 25 * TILE },
      ],
      decor: [
        { prop: 8, x: 5 * TILE, y: 6 * TILE, s: 0.09, collides: true, cw: 42, ch: 18 },
        { prop: 5, x: 18 * TILE, y: 6 * TILE, s: 0.10, collides: true, cw: 30, ch: 22 },
        { prop: 9, x: 23 * TILE, y: 6 * TILE, s: 0.09, collides: true, cw: 42, ch: 22 },
        { prop: 2, x: 4 * TILE, y: 13 * TILE, s: 0.13, collides: true, cw: 20, ch: 18 },
        { prop: 10, x: 20 * TILE, y: 12 * TILE, s: 0.11, collides: true, cw: 22, ch: 18 },
        { prop: 11, x: 24 * TILE, y: 13 * TILE, s: 0.09, collides: true, cw: 46, ch: 18 },
        { prop: 12, x: 14 * TILE, y: 14 * TILE, s: 0.12, collides: true, cw: 24, ch: 18 },
      ],
      exits: [
        { x: 0, y: 8 * TILE, w: TILE, h: 2 * TILE, to: 'CM_GARE' },
        { x: 27 * TILE, y: 8 * TILE, w: TILE, h: 2 * TILE, to: 'CM_PLACE_CENTRALE' }
      ],
      blocks: [{ x: 11 * TILE, y: 4 * TILE, w: 6 * TILE, h: 2 * TILE }]
    };
  }
  if (id === 'CM_PORT_TOULON') {
    return {
      bg: '#b7ddec',
      walkable: { x: 0, y: 0, w: 26 * TILE, h: 16 * TILE },
      npcs: [],
      scenery: [
        { type: 'water', x: 0, y: 0, w: 26 * TILE, h: 5 * TILE },
        { type: 'dock', x: 2 * TILE, y: 4 * TILE, w: 21 * TILE, h: 2 * TILE },
        { type: 'road', x: 0, y: 12 * TILE, w: 26 * TILE, h: 2 * TILE },
        { type: 'building', x: 18 * TILE, y: 7 * TILE, w: 5 * TILE, h: 4 * TILE, label: 'PORT', variant: 'harbor', roof: 'slate' },
        { type: 'rails', x: 2 * TILE, y: 6 * TILE, w: 18 * TILE },
        { type: 'awning', x: 18 * TILE, y: 11 * TILE, w: 5 * TILE, h: 14, color: '#f2a65a' },
        { type: 'boat', x: 4 * TILE, y: 1 * TILE, w: 4 * TILE, h: 2 * TILE },
        { type: 'boat', x: 12 * TILE, y: 1 * TILE, w: 5 * TILE, h: 2 * TILE },
      ],
      decor: [
        { prop: 6, x: 5 * TILE, y: 7 * TILE, s: 0.10, collides: true, cw: 38, ch: 18 },
        { prop: 8, x: 11 * TILE, y: 7 * TILE, s: 0.09, collides: true, cw: 42, ch: 18 },
        { prop: 2, x: 15 * TILE, y: 11 * TILE, s: 0.12, collides: true, cw: 20, ch: 18 },
        { prop: 13, x: 22 * TILE, y: 12 * TILE, s: 0.16, collides: true, cw: 16, ch: 18 },
      ],
      exits: [
        { x: 0, y: 8 * TILE, w: TILE, h: 2 * TILE, to: 'CM_PLACE_CENTRALE' },
      ],
      blocks: [
        { x: 0, y: 0, w: 26 * TILE, h: 4 * TILE },
        { x: 18 * TILE, y: 7 * TILE, w: 5 * TILE, h: 4 * TILE },
      ],
    };
  }
  return {
    bg: '#cdebb7',
    background: 'centralSquare',
    walkable: { x: 0, y: 0, w: 1448, h: 1086 },
    npcs: [
      { id: 'NPC_CM_STUDENT_M1', x: 690, y: 452, w: 24, h: 24, dir: 'down' },
      { id: 'NPC_CM_MERCHANT_M1', x: 1140, y: 545, w: 24, h: 24, dir: 'left' },
      { id: 'NPC_RC_M1_END', x: 850, y: 745, w: 24, h: 24, dir: 'left' },
    ],
    scenery: [
      { type: 'imageCollider', x: 0, y: 0, w: 1448, h: 235 },
      { type: 'imageCollider', x: 85, y: 125, w: 275, h: 420 },
      { type: 'imageCollider', x: 510, y: 125, w: 350, h: 300 },
      { type: 'imageCollider', x: 930, y: 115, w: 300, h: 285 },
      { type: 'imageCollider', x: 1240, y: 210, w: 180, h: 360 },
      { type: 'imageCollider', x: 0, y: 840, w: 420, h: 246 },
      { type: 'imageCollider', x: 770, y: 795, w: 250, h: 235 },
      { type: 'imageCollider', x: 654, y: 570, w: 180, h: 112 },
      { type: 'imageCollider', x: 1040, y: 610, w: 160, h: 265 },
      { type: 'imageCollider', x: 1055, y: 400, w: 205, h: 125 },
      { type: 'imageCollider', x: 874, y: 390, w: 92, h: 178 },
      { type: 'imageCollider', x: 205, y: 575, w: 150, h: 120 },
      { type: 'imageCollider', x: 0, y: 520, w: 78, h: 210 },
      { type: 'imageCollider', x: 1320, y: 600, w: 128, h: 486 },
    ],
    decor: [
      { prop: 10, x: 560, y: 690, s: 0.11, collides: true, cw: 22, ch: 18 },
      { prop: 13, x: 935, y: 755, s: 0.15, collides: true, cw: 16, ch: 18 },
      { prop: 6, x: 1130, y: 880, s: 0.10, collides: true, cw: 38, ch: 18 },
    ],
    overlays: [
      { type: 'sign', x: 620, y: 462, text: 'FAC', arrow: 'up' },
      { type: 'sign', x: 1074, y: 540, text: 'MARCHÉ', arrow: 'right' },
      { type: 'sign', x: 1270, y: 560, text: 'PORT', arrow: 'right' },
      { type: 'sign', x: 812, y: 790, text: 'STATUE', arrow: 'down' },
      { type: 'rctRibbon', x: 84, y: 548, w: 245, label: 'RCT' },
      { type: 'rctRibbon', x: 1060, y: 446, w: 165, label: 'TOULON' },
      { type: 'rctFlag', x: 1000, y: 392 },
      { type: 'rctFlag', x: 278, y: 708 },
    ],
    terminals: [{ id: 'OBJ_M1_BUREAU_TERMINAL', x: 802, y: 452, w: 24, h: 24 }],
    exits: [
      { x: 1308, y: 510, w: 60, h: 90, to: 'CM_PORT_TOULON', requires: 'FLAG_CM_MISSION_01_DONE' }
    ],
    blocks: []
  };
}

function currentZoneModel() { return zoneTemplate(state.currentZoneId); }

function tryInteract() {
  const z = currentZoneModel();
  const probe = { x: state.player.x - 8, y: state.player.y - 8, w: state.player.w + 16, h: state.player.h + 16 };

  if (state.currentZoneId === 'CM_PLACE_CENTRALE') {
    const rc = (z.npcs || []).find((n) => n.id === 'NPC_RC_M1_END');
    if (rc && rectsOverlap(probe, rc) && hasFlag('FLAG_CM_M1_LOCK_SESSION') && hasFlag('FLAG_CM_M1_TALK_STUDENT') && hasFlag('FLAG_CM_M1_TALK_MERCHANT') && !hasFlag('FLAG_CM_M1_REPORT_RC')) {
      showDialog(state.dialogues.NPC_RC_M1_END.concat(state.dialogues.SYSTEM_M1_LESSON), () => {
        setFlag('FLAG_CM_M1_REPORT_RC');
        setFlag('FLAG_CM_MISSION_01_DONE');
        toast('Mission 1 validée - Port débloqué');
        saveGame();
      }, 'RC');
      return;
    }
  }

  for (const npc of z.npcs || []) {
    if (!rectsOverlap(probe, npc)) continue;
    if (npc.id === 'NPC_RC_M1_END' && !hasFlag('FLAG_CM_M1_LOCK_SESSION')) {
      showDialog(state.dialogues.NPC_RC_M1_PROGRESS, null, 'RC');
      return;
    }
    const lines = state.dialogues[npc.id];
    if (!lines) continue;
    showDialog(lines, () => {
      if (npc.id === 'NPC_CM_STUDENT_M1') setFlag('FLAG_CM_M1_TALK_STUDENT');
      if (npc.id === 'NPC_CM_MERCHANT_M1') setFlag('FLAG_CM_M1_TALK_MERCHANT');
    }, npcDisplay[npc.id]?.name ?? '');
    return;
  }

  for (const obj of z.terminals || []) {
    if (!rectsOverlap(probe, obj)) continue;
    if (!canUseTerminal()) {
      showDialog(["Tu dois d'abord recouper les témoignages (étudiante + commerçant)."], null, 'Terminal');
      return;
    }
    showDialog(state.dialogues[obj.id], () => setFlag('FLAG_CM_M1_LOCK_SESSION'), 'Terminal du bureau');
    return;
  }

}

function changeZone(to) {
  if (to === 'CM_PORT_TOULON' && !missionDone()) {
    showDialog(["Le passage vers le Port est verrouillé.", "Termine la mission 1 pour l'ouvrir."], null, 'Accès');
    return;
  }
  if (!['CM_GARE', 'CM_CENTRE_RUES', 'CM_PLACE_CENTRALE', 'CM_PORT_TOULON'].includes(to)) return;
  state.currentZoneId = to;
  if (to === 'CM_GARE') { state.player.x = 3 * TILE; state.player.y = 8 * TILE; }
  else if (to === 'CM_CENTRE_RUES') { state.player.x = 2 * TILE; state.player.y = 9 * TILE; }
  else if (to === 'CM_PLACE_CENTRALE') { state.player.x = 720; state.player.y = 740; }
  else { state.player.x = 3 * TILE; state.player.y = 8 * TILE; }
  updateUI();
  saveGame();
}

function tryWarp() {
  const z = currentZoneModel();
  for (const ex of z.exits || []) {
    if (!rectsOverlap(state.player, ex)) continue;
    if (ex.requires && !hasFlag(ex.requires)) return;
    if (ex.to === 'CM_PORT_TOULON') {
      showDialog(["Port de Toulon débloqué! Mission 1 réussie."], () => changeZone('CM_PORT_TOULON'), 'Nouvelle zone');
      return;
    }
    changeZone(ex.to);
    return;
  }
}

function movePlayer() {
  let dx = 0, dy = 0;
  if (keys.has('ArrowLeft') || keys.has('q')) dx -= SPEED;
  if (keys.has('ArrowRight') || keys.has('d')) dx += SPEED;
  if (keys.has('ArrowUp') || keys.has('z')) dy -= SPEED;
  if (keys.has('ArrowDown') || keys.has('s')) dy += SPEED;
  state.player.dir = DIR_FROM_VEC(dx, dy, state.player.dir);
  if (!dx && !dy) return;

  const next = { ...state.player, x: state.player.x + dx, y: state.player.y + dy };
  const z = currentZoneModel();
  if (next.x < 0 || next.y < 0 || next.x + next.w > z.walkable.w || next.y + next.h > z.walkable.h) return;
  for (const block of z.blocks || []) if (rectsOverlap(next, block)) return;
  for (const s of z.scenery || []) {
    const collider = sceneryCollider(s);
    if (collider && rectsOverlap(next, collider)) return;
  }
  for (const d of z.decor || []) {
    const collider = decorCollider(d);
    if (collider && rectsOverlap(next, collider)) return;
  }
  for (const npc of z.npcs || []) if (rectsOverlap(next, npc)) return;
  for (const t of z.terminals || []) if (rectsOverlap(next, t)) return;

  state.player = next;
  state.player.walkTick++;
}

function drawSprite(img, f, x, y, scale = 0.20) {
  if (!img || !f) return;
  const w = Math.round(f.w * scale);
  const h = Math.round(f.h * scale);
  ctx.drawImage(img, f.x, f.y, f.w, f.h, Math.round(x - w / 2), Math.round(y - h + 8), w, h);
}

function drawProp(item, x, y, scale = 0.12) {
  if (!state.assets?.propsImg || !item) return;
  const w = Math.round(item.w * scale);
  const h = Math.round(item.h * scale);
  ctx.drawImage(
    state.assets.propsImg,
    item.x, item.y, item.w, item.h,
    Math.round(x - w / 2), Math.round(y - h + 8), w, h
  );
}

function buildTileCache(tilesetImg, tileSize = 16) {
  const c = document.createElement('canvas');
  c.width = tilesetImg.width;
  c.height = tilesetImg.height;
  const cctx = c.getContext('2d', { willReadFrequently: true });
  cctx.drawImage(tilesetImg, 0, 0);

  const cols = Math.floor(tilesetImg.width / tileSize);
  const rows = Math.floor(tilesetImg.height / tileSize);
  const opaqueTiles = [];

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const data = cctx.getImageData(tx * tileSize, ty * tileSize, tileSize, tileSize).data;
      let alphaSum = 0;
      for (let i = 3; i < data.length; i += 4) alphaSum += data[i];
      if (alphaSum > 2000) {
        opaqueTiles.push({ sx: tx * tileSize, sy: ty * tileSize, sw: tileSize, sh: tileSize });
      }
    }
  }

  return { opaqueTiles, tileSize };
}

function drawTiledGround(zoneId, width, height) {
  const t = state.tileCache;
  if (!t || !t.opaqueTiles.length) return false;

  const paletteByZone = {
    CM_GARE: [0, 1, 2, 3],
    CM_CENTRE_RUES: [4, 5, 6, 7],
    CM_PLACE_CENTRALE: [8, 9, 10, 11],
    CM_PORT_TOULON: [12, 13, 14, 15],
  };
  const picks = (paletteByZone[zoneId] || [0, 1, 2, 3]).map((i) => t.opaqueTiles[i % t.opaqueTiles.length]);

  for (let y = 0; y < height; y += TILE) {
    for (let x = 0; x < width; x += TILE) {
      const tile = picks[((x / TILE) + (y / TILE)) % picks.length];
      ctx.drawImage(
        state.assets.tilesetImg,
        tile.sx, tile.sy, tile.sw, tile.sh,
        x, y, TILE, TILE
      );
    }
  }
  return true;
}

function drawZoneBackground(z) {
  if (z.background === 'centralSquare' && state.assets?.centralSquareImg) {
    ctx.drawImage(state.assets.centralSquareImg, 0, 0, z.walkable.w, z.walkable.h);
    return true;
  }
  return false;
}

function drawSceneryItem(s) {
  if (s.type === 'imageCollider') return;
  if (s.type === 'road') {
    ctx.fillStyle = '#6e7480';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(246,241,233,0.75)';
    for (let x = s.x + 12; x < s.x + s.w; x += 48) {
      ctx.fillRect(x, s.y + Math.floor(s.h / 2) - 2, 22, 4);
    }
    return;
  }
  if (s.type === 'crosswalk') {
    ctx.fillStyle = 'rgba(246,241,233,0.72)';
    for (let x = s.x + 3; x < s.x + s.w; x += 13) {
      ctx.fillRect(x, s.y + 4, 7, s.h - 8);
    }
    return;
  }
  if (s.type === 'alley') {
    ctx.fillStyle = 'rgba(76,70,62,0.26)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(16,35,63,0.12)';
    for (let y = s.y + 8; y < s.y + s.h; y += 24) ctx.fillRect(s.x + 5, y, s.w - 10, 4);
    return;
  }
  if (s.type === 'plaza') {
    ctx.fillStyle = 'rgba(246,241,233,0.32)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(11,30,58,0.18)';
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    return;
  }
  if (s.type === 'water') {
    ctx.fillStyle = '#4aa7c9';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let x = s.x + 8; x < s.x + s.w; x += 42) {
      ctx.fillRect(x, s.y + 18, 24, 3);
      ctx.fillRect(x + 12, s.y + 52, 30, 3);
    }
    return;
  }
  if (s.type === 'dock') {
    ctx.fillStyle = '#9b7651';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(44,31,22,0.35)';
    for (let x = s.x; x < s.x + s.w; x += 24) ctx.strokeRect(x, s.y, 24, s.h);
    return;
  }
  if (s.type === 'rails') {
    ctx.strokeStyle = '#f6f1e9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.w, s.y);
    ctx.moveTo(s.x, s.y + 10);
    ctx.lineTo(s.x + s.w, s.y + 10);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let x = s.x + 8; x < s.x + s.w; x += 18) ctx.fillRect(x, s.y - 2, 3, 16);
    return;
  }
  if (s.type === 'boat') {
    ctx.fillStyle = '#f6f1e9';
    ctx.fillRect(s.x + 8, s.y + 12, s.w - 16, s.h - 18);
    ctx.fillStyle = '#d86a4f';
    ctx.fillRect(s.x + 18, s.y + 2, s.w - 36, 10);
    ctx.fillStyle = '#0b1e3a';
    ctx.fillRect(s.x + 26, s.y + 17, s.w - 52, 8);
    return;
  }
  if (s.type === 'planterRow') {
    ctx.fillStyle = '#47744a';
    for (let x = s.x; x < s.x + s.w; x += 40) {
      ctx.fillRect(x, s.y, 24, 10);
      ctx.fillStyle = '#d76c54';
      ctx.fillRect(x + 4, s.y - 3, 4, 4);
      ctx.fillRect(x + 14, s.y - 2, 4, 4);
      ctx.fillStyle = '#47744a';
    }
    return;
  }
  if (s.type === 'bollardRow') {
    for (let x = s.x; x < s.x + s.w; x += 26) {
      ctx.fillStyle = '#0b1e3a';
      ctx.fillRect(x, s.y, 5, 12);
      ctx.fillStyle = '#11c5d9';
      ctx.fillRect(x, s.y + 2, 5, 2);
    }
    return;
  }
  if (s.type === 'awning') {
    ctx.fillStyle = s.color ?? '#f2a65a';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let x = s.x; x < s.x + s.w; x += 18) ctx.fillRect(x, s.y, 8, s.h);
    ctx.fillStyle = 'rgba(11,30,58,0.25)';
    ctx.fillRect(s.x, s.y + s.h - 3, s.w, 3);
    return;
  }
  if (s.type === 'clothesLine') {
    ctx.strokeStyle = '#0b1e3a';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.w, s.y);
    ctx.stroke();
    const colors = ['#f6f1e9', '#11c5d9', '#f2a65a', '#d86a4f'];
    for (let x = s.x + 12, i = 0; x < s.x + s.w - 8; x += 22, i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, s.y + 4, 12, 14);
    }
    return;
  }
  if (s.type === 'posterWall') {
    const colors = ['#11c5d9', '#f2a65a', '#f6f1e9'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(s.x + i * 15, s.y, 11, s.h);
      ctx.strokeStyle = 'rgba(11,30,58,0.35)';
      ctx.strokeRect(s.x + i * 15, s.y, 11, s.h);
    }
    return;
  }
  if (s.type === 'treeCluster') {
    for (let i = 0; i < 6; i++) {
      const x = s.x + (i % 3) * 26;
      const y = s.y + Math.floor(i / 3) * 28;
      ctx.fillStyle = '#6b4a2f';
      ctx.fillRect(x + 9, y + 18, 7, 16);
      ctx.fillStyle = '#47744a';
      ctx.fillRect(x, y + 6, 25, 22);
      ctx.fillStyle = '#5d9659';
      ctx.fillRect(x + 5, y, 17, 14);
    }
    return;
  }
  if (s.type === 'fountain') {
    ctx.fillStyle = '#e7dcc9';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = '#67bfd5';
    ctx.fillRect(s.x + 10, s.y + 8, s.w - 20, s.h - 16);
    ctx.strokeStyle = '#0b1e3a';
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    return;
  }
  if (s.type === 'building') {
    const facadeByVariant = {
      station: '#d7a06a',
      shop: '#d38a5e',
      market: '#c97957',
      house: '#dca86e',
      office: '#c69067',
      civic: '#d9b06f',
      harbor: '#c9845f',
    };
    const roofByKind = {
      terra: '#8d4d35',
      slate: '#304f76',
    };
    const facade = facadeByVariant[s.variant] ?? '#c98355';
    const roof = roofByKind[s.roof] ?? '#8d4d35';
    ctx.fillStyle = 'rgba(37,27,22,0.22)';
    ctx.fillRect(s.x + 5, s.y + 6, s.w, s.h);
    ctx.fillStyle = roof;
    ctx.fillRect(s.x - 4, s.y, s.w + 8, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(s.x - 2, s.y + 2, s.w + 4, 3);
    ctx.fillStyle = facade;
    ctx.fillRect(s.x, s.y + 13, s.w, s.h - 13);
    ctx.fillStyle = 'rgba(255,232,190,0.28)';
    for (let y = s.y + 18; y < s.y + s.h - 10; y += 18) ctx.fillRect(s.x, y, s.w, 2);
    ctx.fillStyle = '#f6d7a8';
    for (let x = s.x + 13; x < s.x + s.w - 12; x += 34) {
      ctx.fillRect(x, s.y + 30, 16, 18);
      ctx.fillStyle = '#30506f';
      ctx.fillRect(x + 3, s.y + 34, 10, 10);
      ctx.fillStyle = '#f6d7a8';
    }
    if (s.h > 100) {
      for (let x = s.x + 18; x < s.x + s.w - 12; x += 42) {
        ctx.fillRect(x, s.y + 62, 14, 16);
        ctx.fillStyle = '#365d75';
        ctx.fillRect(x + 3, s.y + 65, 8, 8);
        ctx.fillStyle = '#f6d7a8';
      }
    }
    ctx.fillStyle = '#4c3429';
    ctx.fillRect(s.x + Math.floor(s.w / 2) - 10, s.y + s.h - 28, 20, 28);
    ctx.fillStyle = '#f2a65a';
    ctx.fillRect(s.x + Math.floor(s.w / 2) - 4, s.y + s.h - 16, 3, 3);
    if (s.label) {
      ctx.fillStyle = '#0b1e3a';
      ctx.fillRect(s.x + 10, s.y + 13, Math.min(s.w - 20, 86), 16);
      ctx.fillStyle = '#f6f1e9';
      ctx.font = '10px Trebuchet MS';
      ctx.fillText(s.label, s.x + 15, s.y + 25);
    }
  }
}

function pickHeroFrame() {
  const m = state.assets.manifest.hero;
  const row = heroRowIndex[state.player.dir] ?? 0;
  const moving = (keys.has('ArrowLeft') || keys.has('q') || keys.has('ArrowRight') || keys.has('d') || keys.has('ArrowUp') || keys.has('z') || keys.has('ArrowDown') || keys.has('s'));
  let col = 0;
  if (moving) col = 1 + (Math.floor(state.player.walkTick / 10) % 3);
  return m.frames.find((f) => f.row === row && f.col === col) || m.frames.find((f) => f.row === row && f.col === 0);
}

function pickNpcFrame(npcId, dir = 'down') {
  const m = state.assets.manifest.npcs;
  const baseRow = { student: 0, merchant: 1, rc: 2 }[npcKinds[npcId] || 'student'];
  const offsetByDir = { down: 0, left: 3, up: 6, right: 9 };
  const baseCol = offsetByDir[dir] ?? 0;
  const col = baseCol;
  return m.frames.find((f) => f.row === baseRow && f.col === col) || m.frames.find((f) => f.row === baseRow);
}

function draw() {
  const z = currentZoneModel();
  updateCamera(z);
  if (canvas.width !== VIEW_W) canvas.width = VIEW_W;
  if (canvas.height !== VIEW_H) canvas.height = VIEW_H;

  ctx.save();
  ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
  ctx.translate(-state.camera.x, -state.camera.y);

  const hasBackground = drawZoneBackground(z);
  const tiled = hasBackground || drawTiledGround(state.currentZoneId, z.walkable.w, z.walkable.h);
  if (!hasBackground && !tiled) {
    ctx.fillStyle = z.bg;
    ctx.fillRect(0, 0, z.walkable.w, z.walkable.h);
  }

  if (!hasBackground) {
    for (let x = 0; x < z.walkable.w; x += TILE) {
      for (let y = 0; y < z.walkable.h; y += TILE) {
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.strokeRect(x, y, TILE, TILE);
      }
    }
  }

  if (!hasBackground) for (const s of z.scenery || []) drawSceneryItem(s);
  drawOverlays(z);

  for (const block of z.blocks || []) {
    ctx.fillStyle = 'rgba(65,47,34,0.18)';
    ctx.fillRect(block.x, block.y, block.w, block.h);
  }

  for (const d of z.decor || []) {
    const item = state.assets?.propsManifest?.items?.[d.prop];
    drawProp(item, d.x, d.y, d.s ?? 0.12);
  }

  drawQuestMarkers(z);

  for (const npc of z.npcs || []) {
    const frame = pickNpcFrame(npc.id, npc.dir || 'down');
    if (frame) drawSprite(state.assets.npcImg, frame, npc.x + npc.w / 2, npc.y + npc.h + 6, 0.18);
    else {
      ctx.fillStyle = '#8a3f14';
      ctx.fillRect(npc.x, npc.y, npc.w, npc.h);
    }
  }

  for (const t of z.terminals || []) {
    const active = !hasFlag('FLAG_CM_M1_LOCK_SESSION') && canUseTerminal();
    ctx.fillStyle = active ? '#11c5d9' : '#6f7f89';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.strokeStyle = active ? '#f2a65a' : '#0b1e3a';
    ctx.strokeRect(t.x - 3, t.y - 3, t.w + 6, t.h + 6);
    ctx.fillStyle = '#0b1e3a';
    ctx.fillRect(t.x + 5, t.y + 7, 14, 9);
    ctx.fillStyle = active ? '#f6f1e9' : '#b7ddec';
    ctx.fillRect(t.x + 7, t.y + 9, 10, 5);
  }

  for (const ex of z.exits || []) {
    const locked = ex.requires && !hasFlag(ex.requires);
    ctx.fillStyle = locked ? 'rgba(180,0,0,0.35)' : 'rgba(0,150,0,0.25)';
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  }

  const heroFrame = pickHeroFrame();
  if (heroFrame) drawSprite(state.assets.heroImg, heroFrame, state.player.x + state.player.w / 2, state.player.y + state.player.h + 8, 0.18);
  else {
    ctx.fillStyle = '#1f4d26';
    ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
  }

  ctx.restore();

  drawHudOverlay();
  drawDialogOverlay();

  if (state.toast.until > performance.now()) {
    const w = Math.min(VIEW_W - 20, 420);
    const h = 28;
    const x = Math.floor((VIEW_W - w) / 2);
    const y = 8;
    ctx.fillStyle = 'rgba(11,30,58,0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#11c5d9';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#f6f1e9';
    ctx.font = '14px Trebuchet MS';
    ctx.fillText(state.toast.text, x + 10, y + 18);
  }
}

function tick() {
  if (!state.dialog.open) {
    movePlayer();
    tryWarp();
  }
  draw();
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.add(k);
  if (k !== 'm') startMusic();
  if (k === ' ' || k === 'Enter') {
    e.preventDefault();
    if (!state.dialog.open) tryInteract();
    else advanceDialog();
  }
  if (k === '1') changeZone('CM_GARE');
  if (k === '2') changeZone('CM_CENTRE_RUES');
  if (k === '3') changeZone('CM_PLACE_CENTRALE');
  if (k === 'm') toggleMusic();
  if (k === 'r') resetGame();
});
window.addEventListener('keyup', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.delete(k);
});
canvas.addEventListener('pointerdown', startMusic);

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadJsonOrFallback(src, fallback) {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return fallback;
  }
}

async function boot() {
  const [zones, dialogues, quests, manifest, propsManifest] = await Promise.all([
    loadJsonOrFallback('./data/maps/zones.json', fallbackData.zones),
    loadJsonOrFallback('./data/dialogues/dialogues.json', fallbackData.dialogues),
    loadJsonOrFallback('./data/quests/quests.json', fallbackData.quests),
    fetch('./assets/level-01-pack-v2-technical/sprite-manifest.auto.json').then((r) => r.json()),
    fetch('./assets/level-01-pack-v2-technical/props-manifest.auto.json').then((r) => r.json()),
  ]);

  const [heroImg, npcImg, tilesetImg, propsImg, centralSquareImg] = await Promise.all([
    loadImage('./assets/level-01-pack-v2-technical/hero_max_16x24_4dir_v2.clean2.png'),
    loadImage('./assets/level-01-pack-v2-technical/npc_pack_16x24_3chars_v2.clean2.png'),
    loadImage('./assets/level-01-pack-v2-technical/tileset_city_med_16x16_v2.png'),
    loadImage('./assets/level-01-pack-v2-technical/props_city_med_v2.clean2.png'),
    loadImage('./assets/playable-backgrounds/central-square-rpg.png'),
  ]);

  state.zones = zones;
  state.dialogues = dialogues;
  state.quests = quests;
  state.assets = { manifest, heroImg, npcImg, tilesetImg, propsImg, propsManifest, centralSquareImg };
  state.tileCache = buildTileCache(tilesetImg, 16);

  updateUI();
  const loaded = loadGame();
  updateUI();
  if (!loaded) showDialog(state.dialogues.NPC_RC_M1_START, null, 'RC');
  else toast('Sauvegarde chargée');
  saveGame();
  tick();
}

boot();
