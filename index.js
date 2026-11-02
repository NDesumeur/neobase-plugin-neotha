const HTML = `<div class="appWrap wide">
  <div class="agHead"><span class="label">NeoTha</span><span class="hint">Souris : survole chaque note quand elle atteint la grille · espace : jouer · P : pause</span></div>
  <div class="rhMain"><div class="thBox"><canvas id="rhCanvas" width="384" height="216"></canvas></div>
    <div class="rhSide"><div class="rhTabs"><button class="tab px on" id="rhTabSongs">CHANSONS</button><button class="tab px" id="rhTabMine">MES MUSIQUES</button></div>
      <div class="sysCard px rhImport" id="rhImport" style="display:none"><div class="row"><button class="btn main px" id="rhFileBtn">IMPORTER UN FICHIER AUDIO</button><input type="file" id="rhFile" accept="audio/*,.mp3,.m4a,.ogg,.opus,.wav,.flac,.webm" hidden></div>
        <div class="row"><select class="f gSel" id="rhMuList"></select><button class="btn px" id="rhMuBtn">CRÉER LE NIVEAU</button></div>
        <span class="hint" id="rhImpMsg">Depuis un fichier ou une musique de NeoMusic : 4 niveaux sont créés à partir de son tempo et de ses temps forts.</span></div>
      <div id="rhSongs"></div>
      <div class="sysCard px rhOpts"><label>Volume <input type="range" id="rhVol" min="0" max="100" value="70"></label>
        <label>Vitesse des notes <select class="f gSel" id="rhSpeed"><option value="1.5">Lente</option><option value="2" selected>Normale</option><option value="2.6">Rapide</option><option value="3.2">Très rapide</option></select></label>
        <label>Décalage audio <select class="f gSel" id="rhOffset"><option value="-120">-120 ms</option><option value="-80">-80 ms</option><option value="-40">-40 ms</option><option value="0" selected>0 ms</option><option value="40">+40 ms</option><option value="80">+80 ms</option><option value="120">+120 ms</option></select></label></div></div></div>
  <div class="hint">Comme Rhythia : les notes viennent vers toi dans un tunnel, déplace le curseur sur chacune au moment où elle atteint la grille. Plus tu es au centre, plus c'est précis.</div>
</div>`;
const CSS = `.thBox{display:grid;place-items:center;padding:10px;background:#05010b;box-shadow:0 0 0 3px var(--line2);flex:2;min-width:360px}
.thBox canvas{width:100%;aspect-ratio:384/216;image-rendering:pixelated;cursor:none}
.gSel{width:auto;font-size:14px;padding:6px 10px;margin-right:8px}
.rhMain{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}
.rhSide{display:flex;flex-direction:column;gap:16px;flex:1;min-width:280px}
#rhSongs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;max-height:560px;overflow-y:auto;padding:4px 8px 4px 4px}
.rhTabs{display:flex;gap:6px}
.rhImport{gap:12px}
.rhImport #rhMuList{flex:1;min-width:0;max-width:100%}
.rhSong{position:relative}
.rhDel{all:unset;position:absolute;top:8px;right:10px;cursor:var(--cp,pointer);color:var(--muted);font-size:16px}
.rhDel:hover{color:var(--red)}
.rhSong.on{--c:var(--pink)}
.rhSong .btn{height:34px;font-size:14px;padding:0 10px}
.rhOpts{flex-direction:row;flex-wrap:wrap;gap:18px;align-items:center}
.rhOpts label{display:flex;align-items:center;gap:10px;color:var(--lilac)}
.rhOpts input[type=range]{accent-color:var(--magenta)}
`;
export default async function (ctx) {
  const view = ctx.view;
  // le côté système de NeoMusic (fichiers, YouTube…) vit dans le main.js de son plugin : « neo.musicXxx » y est redirigé
  const MU_ID = 'neobase.music', MU_EV = { onMusicHotkey: 'music:hotkey', onMusicProgress: 'music:progress' };
  const neo = new Proxy({}, { get: (_, k) => { const n = ctx.neo;  // cible vide : contextBridge fige les propriétés de neo
    if (typeof k !== 'string') return n[k];
    if (MU_EV[k]) return cb => n.onPluginMain(e => { if (e.id === MU_ID && e.name === MU_EV[k]) cb(e.data); });
    const m = /^music([A-Z]\w*)$/.exec(k);
    return m ? (...a) => n.pluginMain(MU_ID, 'music:' + (m[1] === 'ImportMuPlayer' ? 'pickMuPlayer' : m[1][0].toLowerCase() + m[1].slice(1)), ...a) : n[k];
  } });
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoBase pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx } = host;
  const folder = ctx.folder;
  host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => view.querySelector('#' + id) || document.getElementById(id);
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const games = { best: {}, ...(await doc('games')) };
  let gamesTimer = null;
  const saveGames = () => { clearTimeout(gamesTimer); gamesTimer = setTimeout(() => { gamesTimer = null; folder.write('games', games).catch(() => {}); }, 500); };
  const best = (k, v) => { const b = games.best[k]; if (b == null || v > b) { games.best[k] = v; saveGames(); return true; } return false; };
  const gstore = (k, init) => (games[k] ??= init);  // la section d'un jeu

function gameLoop(st, appKey, update, draw) {
  cancelAnimationFrame(st.raf);
  const STEP = 1000 / 60; let acc = 0, last = performance.now();
  const frame = t => {
    if (!view.classList.contains('on')) { st.raf = 0; if (st.mode === 'play') st.mode = 'pause'; return; }  // leaving the tab pauses the game
    st.raf = requestAnimationFrame(frame);
    acc += Math.min(200, t - last); last = t;
    while (acc >= STEP) { if (st.mode === 'play') update(); st.tick++; acc -= STEP; }
    draw();
  };
  st.raf = requestAnimationFrame(frame);
}
function gameText(g, w, lines, y0) {  // centred pixel-font lines over a dark band
  g.fillStyle = 'rgba(11,3,28,.72)'; g.fillRect(0, y0 - 14, w, lines.length * 14 + 14);
  g.textAlign = 'center';
  lines.forEach(([text, color, size], i) => { g.fillStyle = color; g.font = (size || 8) + 'px "Press Start 2P", monospace'; g.fillText(text, w / 2, y0 + i * 14); });
  g.textAlign = 'left';
}
const px = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
function sprite(g, rows, x, y, pal) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(g, c, x + i, y + j); } }); }
  // ---- ton code d'origine ----
const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pxFont = (g, text, x, y, color, size = 8, align = 'left') => { g.font = size + 'px "Press Start 2P", monospace'; g.textAlign = align; g.fillStyle = '#05010b'; g.fillText(text, x + 1, y + 1); g.fillStyle = color; g.fillText(text, x, y); g.textAlign = 'left'; };

const clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

const muId = t => t ? (t.url ? 'url:' + t.url : 'file:' + (t.file || '')) : '';  // la bibliothèque de NeoMusic, lue telle quelle
let mu = null;
const muLoad = () => neo.musicLoad().then(d => { mu = d; });

/* ---------- Rythme: chiptune songs composed by the game (same notes every time), notes to hit on 4 lanes at the beat ---------- */
const RH = {W: 384, H: 216, HIT: 284, LANES: 4, LW: 40, X0: 40, KEYS: [['d', 'ArrowLeft'], ['f', 'ArrowDown'], ['j', 'ArrowUp'], ['k', 'ArrowRight']], COLORS: ['#ff5ad9', '#7fe0ee', '#ffd07a', '#8ee8a0'],
  WIN: [[.045, 'PARFAIT', 300, '#ffd07a'], [.09, 'BIEN', 200, '#8ee8a0'], [.14, 'OK', 100, '#7fe0ee']]};
const RH_SCALES = {major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], harmonic: [0, 2, 3, 5, 7, 8, 11]};
// the 6 first songs, then 34 more, then 60 more made from seeded choices (100 in all, none alike): names, tempo going up, scale, chords, groove (drums) and lead sound
const RH_SONGS = [
  {name: 'Lever de néon', bpm: 96, seed: 11, mode: 'major', prog: [0, 5, 3, 4], root: 48},
  {name: 'Course de pixels', bpm: 124, seed: 23, mode: 'minor', prog: [0, 5, 2, 6], root: 45},
  {name: 'Orbite basse', bpm: 110, seed: 37, mode: 'dorian', prog: [0, 3, 0, 4], root: 50},
  {name: 'Cœur 8 bits', bpm: 118, seed: 41, mode: 'major', prog: [0, 4, 5, 3], root: 47},
  {name: 'Tempête cosmique', bpm: 148, seed: 53, mode: 'minor', prog: [0, 6, 5, 4], root: 44},
  {name: 'Hyperpropulsion', bpm: 168, seed: 67, mode: 'minor', prog: [0, 2, 3, 4], root: 46},
  ...(() => {
    const A = ['Comète', 'Nébuleuse', 'Quasar', 'Aurore', 'Prisme', 'Satellite', 'Météore', 'Zénith', 'Galaxie', 'Cristal', 'Écho', 'Pulsar', 'Éclipse', 'Horizon', 'Supernova', 'Astéroïde', 'Lune', 'Signal'];
    const B = ['sauvage', 'nocturne', 'électrique', 'infinie', 'glacée', 'brûlante', 'secrète', 'rebelle', 'magnétique', 'sonique', 'céleste', 'perdue', 'dorée', 'fantôme', 'turbo', 'binaire', 'lointaine', 'chromée'];
    const progs = [[0, 5, 3, 4], [0, 3, 4, 4], [5, 3, 0, 4], [0, 4, 5, 3], [0, 6, 5, 6], [0, 2, 5, 4], [3, 4, 0, 0], [0, 5, 1, 4], [0, 1, 0, 6]];
    const modes = Object.keys(RH_SCALES), grooves = ['classic', 'four', 'break', 'half'], waves = ['square', 'sawtooth', 'triangle', 'square'];
    const r = seeded(2026), used = new Set(['Lever de néon']), out = [];
    for (let i = 0; i < 34; i++) {
      let name; do name = A[Math.floor(r() * A.length)] + ' ' + B[Math.floor(r() * B.length)]; while (used.has(name)); used.add(name);
      out.push({name, bpm: Math.round(90 + i * 3.1 + r() * 10), seed: 100 + i * 13, mode: modes[Math.floor(r() * modes.length)], prog: progs[Math.floor(r() * progs.length)],
        root: 43 + Math.floor(r() * 9), groove: grooves[Math.floor(r() * grooves.length)], wave: waves[Math.floor(r() * waves.length)]});
    }
    // 60 de plus : d'autres mots, des structures, des arpèges et des densités de mélodie différents (les 40 premières restent telles quelles)
    const A2 = ['Mirage', 'Vortex', 'Cyclone', 'Lagune', 'Volcan', 'Tonnerre', 'Mercure', 'Orion', 'Saturne', 'Titan', 'Andromède', 'Lyre', 'Phénix', 'Dragon', 'Corail', 'Cobalt', 'Ambre', 'Jade', 'Opale', 'Rubis', 'Zéphyr', 'Néon', 'Radar', 'Turbine', 'Laser'];
    const B2 = ['arctique', 'solaire', 'vertigineuse', 'cosmique', 'aveugle', 'sauvage', 'brisée', 'liquide', 'cybernétique', 'sacrée', 'éclatante', 'muette', 'enchantée', 'orbitale', 'abyssale', 'radieuse', 'furtive', 'cristalline', 'astrale', 'volante', 'pixelisée', 'ardente', 'polaire', 'stellaire', 'mécanique'];
    const arps = [[0, 2, 4, 7], [0, 4, 7, 4], [0, 7, 4, 2], [0, 2, 7, 4], [4, 2, 0, 2], [0, 4, 2, 7]], r2 = seeded(7331);
    for (let i = 0; i < 60; i++) {
      let name; do name = A2[Math.floor(r2() * A2.length)] + ' ' + B2[Math.floor(r2() * B2.length)]; while (used.has(name)); used.add(name);
      out.push({name, bpm: Math.round(86 + i * 1.65 + r2() * 6), seed: 1000 + i * 29, mode: modes[Math.floor(r2() * modes.length)], prog: progs[Math.floor(r2() * progs.length)],
        root: 41 + Math.floor(r2() * 12), groove: grooves[Math.floor(r2() * grooves.length)], wave: waves[Math.floor(r2() * waves.length)],
        form: i % 4, arp: arps[Math.floor(r2() * arps.length)], dens: Math.round((.8 + r2() * .45) * 100) / 100});
    }
    return out;
  })(),
  // 100 de plus, par styles : plus longs (2 min 30 à 5 min), avec un 2e motif, des reprises et un changement de ton vers la fin
  ...(() => {
    const RH_STYLES = [
      {n: 'Ballade', bpm: [64, 84], groove: 'ballad', wave: ['triangle', 'sine'], modes: ['minor', 'major', 'dorian'], dens: [.6, .8], sec: [240, 300]},
      {n: 'Marche', bpm: [100, 114], groove: 'march', wave: ['square'], modes: ['major', 'mixolydian', 'minor'], dens: [.9, 1.1], sec: [170, 220]},
      {n: 'Funk', bpm: [98, 116], groove: 'funk', wave: ['square', 'sawtooth'], modes: ['mixolydian', 'dorian'], dens: [1.1, 1.35], sec: [180, 230]},
      {n: 'Techno', bpm: [124, 136], groove: 'four', wave: ['sawtooth'], modes: ['minor', 'phrygian', 'harmonic'], dens: [.9, 1.2], sec: [200, 260]},
      {n: 'Jungle', bpm: [162, 176], groove: 'dnb', wave: ['sawtooth', 'square'], modes: ['minor', 'harmonic', 'phrygian'], dens: [1, 1.2], sec: [170, 210]},
      {n: 'Épopée', bpm: [112, 138], groove: 'half', wave: ['sawtooth', 'square'], modes: ['major', 'lydian', 'minor'], dens: [.85, 1.1], sec: [240, 320]},
      {n: 'Chill', bpm: [76, 92], groove: 'half', wave: ['triangle', 'sine'], modes: ['dorian', 'major', 'lydian'], dens: [.65, .85], sec: [210, 270]},
      {n: 'Arcade', bpm: [140, 158], groove: 'classic', wave: ['square'], modes: ['major', 'mixolydian'], dens: [1.15, 1.4], sec: [150, 200]},
      {n: 'Boss', bpm: [148, 168], groove: 'break', wave: ['sawtooth'], modes: ['phrygian', 'harmonic', 'minor'], dens: [1, 1.3], sec: [180, 240]},
      {n: 'Rêverie', bpm: [68, 88], groove: 'ballad', wave: ['sine', 'triangle'], modes: ['lydian', 'major', 'dorian'], dens: [.6, .8], sec: [240, 320]},
    ];
    const SUB = ['Chant', 'Danse', 'Souvenir', 'Voyage', 'Message', 'Secret', 'Voile', 'Sentier', 'Rivage', 'Palais', 'Jardin', 'Phare', 'Pont', 'Récit', 'Reflet', 'Serment', 'Sommet', 'Horizon', 'Refuge', 'Passage', 'Éveil', 'Souffle', 'Cortège', 'Veillée', 'Légende'];
    const SUF = ['de minuit', 'des cendres', 'du cristal', 'des étoiles', 'de la brume', 'du dernier soir', 'des vents', 'de l\'aube', 'du verre', 'des marées', 'de l\'orage', 'du désert', 'des lanternes', 'du grand nord', 'des ruines', 'de la forêt', 'des comètes', 'du silence', 'de l\'hiver', 'du volcan', 'des sables', 'de la lune', 'des géants', 'de l\'exil', 'du matin'];
    const progs = [[0, 5, 3, 4, 0, 5, 1, 4], [0, 3, 4, 0, 5, 3, 1, 4], [5, 3, 0, 4, 5, 3, 1, 4], [0, 6, 5, 4, 0, 6, 3, 4], [0, 2, 5, 3, 0, 2, 6, 4], [0, 5, 3, 4], [0, 4, 5, 3], [5, 3, 0, 4]];
    const arps = [[0, 2, 4, 7], [0, 4, 7, 4], [0, 7, 4, 2], [0, 2, 7, 4], [4, 2, 0, 2], [0, 4, 2, 7]], r3 = seeded(90210), used = new Set(), out = [];
    const pick = a => a[Math.floor(r3() * a.length)], between = ([a, b]) => a + r3() * (b - a);
    const longForm = bars => { const f = [['intro', 4]], cyc = [['A', 8], ['B', 8], ['A', 8], ['B', 8], ['pont', 8], ['A', 8], ['B', 8], ['B', 8]]; let n = 8, i = 0; while (n + cyc[i % 8][1] <= bars) { f.push(cyc[i % 8]); n += cyc[i % 8][1]; i++; } f.push(['outro', 4]); return {form: f, bars: n}; };
    for (let i = 0; i < 100; i++) {
      const S = RH_STYLES[i % 10], bpm = Math.round(between(S.bpm)), barSec = 240 / bpm, want = Math.round(between(S.sec) / barSec / 4) * 4, {form, bars} = longForm(want);
      let name; do name = pick(SUB) + ' ' + pick(SUF); while (used.has(name)); used.add(name);
      out.push({name, style: S.n, bpm, seed: 5000 + i * 31, mode: pick(S.modes), prog: pick(progs), root: 41 + Math.floor(r3() * 12), groove: S.groove, wave: pick(S.wave),
        form, long: true, arp: pick(arps), dens: Math.round(between(S.dens) * 100) / 100, mod: i % 3 === 1 ? Math.round(bars * .66 / 4) * 4 : 0, len: bars * 16 * 60 / bpm / 4});
    }
    return out;
  })(),
];
console.assert(RH_SONGS.length === 200 && new Set(RH_SONGS.map(s => s.name)).size === 200 && new Set(RH_SONGS.map(s => s.seed)).size === 200 && RH_SONGS.slice(100).every(s => s.len > 140 && s.len < 340), 'rythme : 200 chansons différentes, les 100 dernières de 2 min 30 à 5 min');
// la structure d'une chanson : [partie, nombre de mesures] (0 = celle des 40 premières)
const RH_FORMS = [
  [['intro', 4], ['A', 8], ['B', 8], ['A', 8], ['pont', 4], ['B', 8], ['A', 8], ['outro', 4]],
  [['intro', 4], ['A', 8], ['A', 8], ['B', 8], ['pont', 4], ['B', 8], ['B', 8], ['outro', 4]],
  [['intro', 2], ['A', 8], ['B', 8], ['pont', 4], ['A', 8], ['B', 8], ['outro', 2]],
  [['intro', 4], ['A', 8], ['B', 8], ['A', 8], ['pont', 8], ['B', 8], ['A', 8], ['B', 8], ['outro', 4]],
];
const RH_DIFFS = {facile: 'Facile', normal: 'Normal', difficile: 'Difficile', expert: 'Expert'};
const midiHz = m => 440 * 2 ** ((m - 69) / 12);
function rhCompose(song) {  // -> {events: sounds to play, lead: melody notes, len: seconds}
  const r = seeded(song.seed), sc = RH_SCALES[song.mode], step = 60 / song.bpm / 4, events = [], lead = [], groove = song.groove || 'classic';
  const deg = d => song.root + (song.mod && bar >= song.mod ? 2 : 0) + 12 * Math.floor(d / 7) + sc[((d % 7) + 7) % 7];  // song.mod : la mesure où le morceau monte d'un ton
  const SECTIONS = Array.isArray(song.form) ? song.form : RH_FORMS[song.form || 0];
  const motif = kind => {  // a 2-bar melody: onsets on the 16th grid, scale degrees
    const out = []; let d = 9 + Math.floor(r() * 3);
    for (let s = 0; s < 32; s++) {
      const strong = (s % 8 === 0 ? .95 : s % 4 === 0 ? .7 : s % 2 === 0 ? (kind === 'B' ? .55 : .4) : (kind === 'B' ? .22 : .1)) * (song.dens || 1);
      if (r() < strong) { d += [-2, -1, -1, 0, 1, 1, 2, 3, -3][Math.floor(r() * 9)]; d = Math.max(5, Math.min(16, d)); out.push({s, d}); }
    }
    out.forEach((n, i) => n.len = Math.min(8, (out[i + 1]?.s ?? 32) - n.s));
    return out;
  };
  const kickAt = (kind, s) => kind === 'pont' ? s === 0 : groove === 'ballad' ? s === 0 || (kind === 'B' && s === 10) : groove === 'march' ? s === 0 || s === 8 : groove === 'funk' ? [0, 3, 10].includes(s) || (kind === 'B' && [6, 13].includes(s)) : groove === 'dnb' ? s === 0 || s === 10 || (kind === 'B' && s === 7) : groove === 'four' ? s % 4 === 0 : groove === 'break' ? [0, 6, 10].includes(s) || (kind === 'B' && s === 14) : groove === 'half' ? s === 0 || (kind === 'B' && s === 11) : s % 8 === 0 || (kind === 'B' && s === 10);
  const snareAt = s => groove === 'half' || groove === 'ballad' ? s === 8 : groove === 'march' ? s === 4 || s === 12 || s === 14 : groove === 'funk' ? s === 4 || s === 12 || s === 15 : s === 4 || s === 12;
  const motifs = {A: motif('A'), B: motif('B')}; if (song.long) { motifs.A2 = motif('A'); motifs.B2 = motif('B'); }  // les morceaux longs alternent deux motifs
  const hatStep = groove === 'ballad' ? 4 : groove === 'dnb' ? 1 : 0, bassStep = groove === 'ballad' ? 4 : 2, seen = {};
  let bar = 0;
  for (const [kind, bars] of SECTIONS) {
    const si = seen[kind] = (seen[kind] ?? -1) + 1;
    for (let b = 0; b < bars; b++, bar++) {
      const t0 = bar * 16 * step, chord = song.prog[bar % song.prog.length], energy = kind === 'B' ? 1 : kind === 'A' ? .8 : .5;
      for (let s = 0; s < 16; s++) {
        const t = t0 + s * step;
        if (kickAt(kind, s)) events.push({t, k: 'kick', v: 1});
        if (kind !== 'intro' && kind !== 'outro' && kind !== 'pont' && snareAt(s)) events.push({t, k: 'snare', v: .8});
        if (s % (hatStep || (kind === 'B' ? 1 : 2)) === 0 && kind !== 'pont') events.push({t, k: 'hat', v: s % 4 === 2 ? .6 : .35});
        if (s % bassStep === 0 && kind !== 'intro') events.push({t, k: 'bass', f: midiHz(deg(chord) - 12 + (s % 4 === 2 ? 12 : 0)), d: step * 1.8, v: .55 * energy});
        if (kind === 'B' || kind === 'pont') events.push({t, k: 'arp', f: midiHz(deg(chord + (song.arp || [0, 2, 4, 7])[s % 4]) + 12), d: step * .9, v: .16});
      }
      if (kind === 'A' || kind === 'B') {
        const m = motifs[kind + (song.long && si % 2 ? '2' : '')], half = b % 2, varied = b >= 6;
        for (const n of m) if ((n.s >= 16) === !!half) {
          let d = n.d + (varied && half ? 1 : 0); if (b === bars - 1 && n === m.at(-1)) d = 7;  // phrases end on the tonic
          const t = t0 + (n.s - half * 16) * step, f = midiHz(deg(d));
          events.push({t, k: 'lead', f, d: n.len * step * .92, v: song.wave === 'sawtooth' ? .22 : .3, w: song.wave || 'square'});
          lead.push({t, step: bar * 16 + n.s - half * 16, len: n.len, d, kind, downbeat: n.s % 16 === 0});
        }
      }
    }
  }
  return {events: events.sort((a, b) => a.t - b.t), lead, len: bar * 16 * step, step};
}
function rhChart(c, diff) {  // the notes to hit, from the melody (plus the snare in hard, the kick too in expert)
  const grid = {facile: 4, normal: 2, difficile: 1, expert: 1}[diff], hold = {facile: 8, normal: 6, difficile: 4, expert: 4}[diff], notes = [];
  let last = -1, lastT = -9;
  for (const n of c.lead) {
    if (n.step % grid) continue;
    if (diff === 'facile' && n.t - lastT < c.step * 3.5) continue;
    let lane = ((n.d % 4) + 4) % 4;
    if (lane === last && n.t - lastT < c.step * 2.5) lane = (lane + 1) % 4;
    const len = n.len >= hold ? n.len * c.step * .85 : 0;
    notes.push({t: n.t, lane, len});
    if (diff !== 'facile' && n.downbeat && (diff === 'expert' ? n.kind !== 'pont' : n.kind === 'B' && (diff === 'difficile' || n.step % 32 === 0))) notes.push({t: n.t, lane: (lane + 2) % 4, len: 0});
    last = lane; lastT = n.t;
  }
  const extra = diff === 'expert' ? ['snare', 'kick'] : diff === 'difficile' ? ['snare'] : [];
  for (const e of c.events) if (extra.includes(e.k) && !notes.some(n => Math.abs(n.t - e.t) < c.step * (e.k === 'kick' ? 1.1 : 1.5))) notes.push({t: e.t, lane: last = (last + 1) % 4, len: 0});
  return notes.sort((a, b) => a.t - b.t).map(n => ({...n, judged: false, held: false}));
}

/* ---------- levels made from your own music: tempo, beat and onsets found in the sound, notes placed on the beat grid ---------- */
function rhFFT(re, im) {  // in place, length a power of 2
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), h = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < h; k++) {
        const p = i + k, q = p + h, xr = re[q] * cr - im[q] * ci, xi = re[q] * ci + im[q] * cr;
        re[q] = re[p] - xr; im[q] = im[p] - xi; re[p] += xr; im[p] += xi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
// -> {bpm, beat0 (s), beat (s), peaks: [{t, s, band}], rms, fps, len}. Spectral flux on ~11 kHz mono, 512-point frames every 11.6 ms
function rhAnalyse(buf) {
  const k = Math.max(1, Math.round(buf.sampleRate / 11025)), sr = buf.sampleRate / k, chs = Array.from({length: buf.numberOfChannels}, (_, c) => buf.getChannelData(c));
  const n = Math.floor(buf.length / k), x = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (const ch of chs) for (let j = 0; j < k; j++) s += ch[i * k + j]; x[i] = s / (k * chs.length); }
  const N = 512, H = 128, fps = sr / H, F = Math.max(0, Math.floor((n - N) / H)), hz = sr / N;
  const edges = [30, 150, 500, 2000, 5000].map(f => Math.max(1, Math.min(N / 2, Math.round(f / hz))));
  const win = Float32Array.from({length: N}, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / (N - 1)));
  const flux = new Float32Array(F), band = [0, 1, 2, 3].map(() => new Float32Array(F)), rms = new Float32Array(F), re = new Float32Array(N), im = new Float32Array(N);
  let prev = new Float32Array(N / 2), cur = new Float32Array(N / 2);
  for (let f = 0; f < F; f++) {
    let e = 0;
    for (let i = 0; i < N; i++) { const v = x[f * H + i]; re[i] = v * win[i]; im[i] = 0; e += v * v; }
    rms[f] = Math.sqrt(e / N);
    rhFFT(re, im);
    for (let b = 0; b < N / 2; b++) cur[b] = Math.log1p(100 * Math.hypot(re[b], im[b]));
    for (let q = 0; q < 4; q++) { let s = 0; for (let b = edges[q]; b < edges[q + 1]; b++) { const d = cur[b] - prev[b]; if (d > 0) s += d; } band[q][f] = s / (edges[q + 1] - edges[q]); flux[f] += band[q][f]; }
    [prev, cur] = [cur, prev];
  }
  // onset envelope: flux above its local average (0.5 s), never negative
  const env = new Float32Array(F), half = Math.round(fps * .25);
  let acc = 0; for (let f = 0; f < Math.min(F, half); f++) acc += flux[f];
  for (let f = 0; f < F; f++) {
    if (f + half < F) acc += flux[f + half]; if (f - half - 1 >= 0) acc -= flux[f - half - 1];
    const cnt = Math.min(F, f + half + 1) - Math.max(0, f - half); env[f] = Math.max(0, flux[f] - acc / cnt);
  }
  // tempo: autocorrelation of the envelope over 70-180 BPM, nudged towards 120 (where most songs are counted)
  let bestL = 0, bestS = -1;
  const lmin = Math.floor(fps * 60 / 180), lmax = Math.ceil(fps * 60 / 70), ac = new Float32Array(lmax + 2);
  for (let L = lmin; L <= lmax + 1; L++) { let s = 0; for (let f = 0; f + L < F; f += 2) s += env[f] * env[f + L]; ac[L] = s; }
  for (let L = lmin + 1; L <= lmax; L++) { const w = Math.exp(-.5 * (Math.log2(fps * 60 / L / 120) / .8) ** 2), s = ac[L] * w; if (s > bestS) { bestS = s; bestL = L; } }
  const a0 = ac[bestL - 1], a1 = ac[bestL], a2 = ac[bestL + 1], shift = a0 - 2 * a1 + a2 ? .5 * (a0 - a2) / (a0 - 2 * a1 + a2) : 0;
  const P = bestL + Math.max(-.5, Math.min(.5, shift)), bpm = Math.round(fps * 60 / P * 10) / 10;
  // where the beats fall: the phase whose comb of beats collects the most onsets
  let ph = 0, phS = -1;
  for (let p = 0; p < P; p++) { let s = 0; for (let t = p; t < F; t += P) s += env[Math.round(t)] + .5 * (env[Math.round(t) + 1] || 0); if (s > phS) { phS = s; ph = p; } }
  // onsets: local maxima clearly above the surroundings (1 s window)
  const peaks = [], W1 = Math.round(fps * .5);
  for (let f = 3; f < F - 3; f++) {
    const v = env[f]; if (v <= 0 || v < env[f - 1] || v < env[f + 1] || v < env[f - 2] || v < env[f + 2] || v < env[f - 3] || v < env[f + 3]) continue;
    let m = 0, m2 = 0, c = 0; for (let j = Math.max(0, f - W1); j < Math.min(F, f + W1); j += 2) { m += env[j]; m2 += env[j] * env[j]; c++; }
    m /= c; const sd = Math.sqrt(Math.max(0, m2 / c - m * m));
    if (v > m + .6 * sd) { let bb = 0; for (let q = 1; q < 4; q++) if (band[q][f] * (1 + q * .15) > band[bb][f] * (1 + bb * .15)) bb = q; peaks.push({t: f / fps + N / 2 / sr, s: v, band: bb, f}); }
  }
  return {bpm, beat: 60 / bpm, beat0: ph / fps + N / 2 / sr, peaks, rms, fps, len: buf.duration};
}
function rhChartImport(a, diff) {
  const sub = {facile: 1, normal: 2, difficile: 4, expert: 4}[diff], nps = {facile: 1.1, normal: 2, difficile: 3.1, expert: 4.4}[diff], gap = {facile: .42, normal: .24, difficile: .14, expert: .1}[diff];
  const slot = a.beat / sub, cands = new Map();
  for (const p of a.peaks) {  // each onset snaps to the nearest slot of the grid, if it is close enough
    const j = Math.round((p.t - a.beat0) / slot), t = a.beat0 + j * slot;
    if (Math.abs(p.t - t) > slot * .4 || t < 1 || t > a.len - .6) continue;
    const s = p.s * (j % sub === 0 ? 1.3 : 1), o = cands.get(j);
    if (!o || s > o.s) cands.set(j, {j, t, s, band: p.band, f: p.f});
  }
  const sorted = [...cands.values()].sort((x, y) => y.s - x.s), want = Math.min(sorted.length, Math.round(nps * a.len)), picked = [];
  const taken = new Set(), cell = t => Math.floor(t / gap);
  for (const c of sorted) {
    if (picked.length >= want) break;
    const z = cell(c.t); let ok = true;
    for (const q of [z - 1, z, z + 1]) for (const o of taken.has(q) ? picked.filter(p => cell(p.t) === q) : []) if (Math.abs(o.t - c.t) < gap) ok = false;
    if (ok) { picked.push(c); taken.add(z); }
  }
  picked.sort((x, y) => x.t - y.t);
  const strong = [...picked].sort((x, y) => y.s - x.s)[Math.floor(picked.length * .12)]?.s ?? Infinity, notes = [];
  let last = -1, lastT = -9;
  picked.forEach((c, i) => {
    let lane = c.band;  // low sounds on the left, high ones on the right
    if (lane === last && c.t - lastT < .3) lane = (lane + (i % 2 ? 1 : 3)) % 4;
    const next = picked[i + 1]?.t ?? a.len, room = next - c.t, f2 = Math.round(c.f + a.fps * a.beat), held = a.rms[f2] >= a.rms[c.f] * .6;
    const len = diff !== 'expert' && room >= a.beat * (diff === 'facile' ? 2 : 1.5) && held ? Math.min(room - a.beat * .3, a.beat * 3) * .9 : 0;
    notes.push({t: c.t, lane, len});
    if (diff === 'expert' && c.s >= strong) notes.push({t: c.t, lane: (lane + 2) % 4, len: 0});
    last = lane; lastT = c.t;
  });
  return notes.map(n => ({...n, judged: false, held: false}));
}
const rhImports = () => gstore('neothaImports', []);
const rhAnalysed = new Map();  // id -> {a, buffer}, for this session (recomputed from the sound: same notes on every PC)
async function rhLoadImport(imp) {
  if (rhAnalysed.has(imp.id)) return rhAnalysed.get(imp.id);
  const has = imp.file && (await neo.musicExists([imp.file]))[imp.file];
  const src = has ? 'neoplugin://neobase.music/file/' + encodeURIComponent(imp.file) : imp.url ? 'neoplugin://neobase.music/stream/?u=' + encodeURIComponent(imp.url) : '';
  if (!src) throw new Error('le fichier de cette musique n\'est pas sur ce PC');
  rhAudio();
  const buffer = await rhCtx.decodeAudioData(await (await fetch(src)).arrayBuffer()), a = rhAnalyse(buffer), r = {a, buffer};
  rhAnalysed.set(imp.id, r);
  if (imp.bpm !== a.bpm || !imp.len) { imp.bpm = a.bpm; imp.len = Math.round(a.len); saveGames(); }
  return r;
}
async function rhAddImport(imp) {
  const list = rhImports();
  if (!list.some(x => x.id === imp.id)) list.push(imp);
  saveGames(); rhTab = 'mine'; rhList();
  $('rhImpMsg').textContent = 'Analyse de « ' + imp.name + ' »…';
  try { const {a} = await rhLoadImport(imp); $('rhImpMsg').textContent = '« ' + imp.name + ' » : ' + a.bpm + ' BPM, niveaux prêts.'; await rhSelect(imp.id, 'normal'); }
  catch (e) { $('rhImpMsg').textContent = 'Impossible de lire « ' + imp.name + ' » : ' + e.message; }
  rhList();
}

const RH_LEN = [];
let rh = null, rhCtx = null, rhNoise = null, rhOut = null, rhTab = 'songs';
function rhAudio() {
  rhCtx ??= new AudioContext();
  if (!rhNoise) { rhNoise = rhCtx.createBuffer(1, rhCtx.sampleRate, rhCtx.sampleRate); const d = rhNoise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  if (!rhOut) { rhOut = rhCtx.createGain(); rhOut.connect(rhCtx.destination); }
  rhOut.gain.value = +$('rhVol').value / 100 * .6;
}
function rhSound(e, when) {
  const c = rhCtx, g = c.createGain(); g.connect(rhOut);
  const env = (a, d, v) => { g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(v, when + a); g.gain.exponentialRampToValueAtTime(.0001, when + d); };
  if (e.k === 'kick') { const o = c.createOscillator(); o.frequency.setValueAtTime(150, when); o.frequency.exponentialRampToValueAtTime(40, when + .12); env(.002, .22, .9 * e.v); o.connect(g); o.start(when); o.stop(when + .25); }
  else if (e.k === 'snare' || e.k === 'hat') {
    const n = c.createBufferSource(), f = c.createBiquadFilter(); n.buffer = rhNoise;
    f.type = e.k === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = e.k === 'hat' ? 7000 : 1800;
    env(.001, e.k === 'hat' ? .045 : .17, (e.k === 'hat' ? .25 : .55) * e.v); n.connect(f).connect(g); n.start(when, Math.random() * .5); n.stop(when + .2);
  } else {
    const o = c.createOscillator(); o.type = e.k === 'lead' ? e.w || 'square' : 'triangle'; o.frequency.value = e.f;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(e.v * (e.k === 'lead' ? .55 : 1), when + .006); g.gain.setValueAtTime(e.v * (e.k === 'lead' ? .4 : .7), when + Math.min(e.d, .08)); g.gain.exponentialRampToValueAtTime(.0001, when + e.d + .04);
    o.connect(g); o.start(when); o.stop(when + e.d + .06);
  }
}
// i: index of a song of the game, or the id of an imported music
async function rhSelect(i, diff) {
  let info, c, notes;
  if (typeof i === 'number') { const song = RH_SONGS[i] || RH_SONGS[0]; c = rhCompose(song); notes = rhChart(c, diff); info = {name: song.name, bpm: song.bpm, key: 'rh' + RH_SONGS.indexOf(song) + diff}; }
  else {
    const imp = rhImports().find(x => x.id === i); if (!imp) return rhSelect(0, diff);
    const {a, buffer} = await rhLoadImport(imp);
    c = {events: [], lead: [], len: a.len, step: a.beat / 4, buffer}; notes = rhChartImport(a, diff); info = {name: imp.name, bpm: a.bpm, key: 'rhx' + imp.id + diff};
  }
  notes = thCells(notes, info.name.length * 977 + Math.round(info.bpm * 10));
  try { rh?.src?.stop(); } catch {}
  rh = rh || {raf: 0};
  Object.assign(rh, {g: $('rhCanvas').getContext('2d'), mode: 'ready', tick: 0, song: i, diff, c, info, notes, src: null, ev: 0, t0: 0, score: 0, combo: 0, maxCombo: 0, counts: {PARFAIT: 0, BIEN: 0, OK: 0, RATÉ: 0}, judge: null, mx: 192, my: 116, trail: [], sparks: [], done: false});
  games.neothaLast = {song: i, diff}; rhList();
  gameLoop(rh, 'neodyme:neotha', rhUpdate, rhDraw);
}
const rhLatency = () => (rhCtx?.outputLatency || 0) + (rhCtx?.baseLatency || 0) + +$('rhOffset').value / 1000;
const rhNow = () => rhCtx.currentTime - rh.t0 - rhLatency();
function rhBegin() {
  rhAudio(); rhCtx.resume(); rh.t0 = rhCtx.currentTime + 2; rh.ev = 0; rh.mode = 'play';
  if (rh.c.buffer) { try { rh.src?.stop(); } catch {} rh.src = rhCtx.createBufferSource(); rh.src.buffer = rh.c.buffer; rh.src.connect(rhOut); rh.src.start(rh.t0); }  // your own music, in time with the notes
}
function rhPress() {
  if (!rh) return;
  if (rh.mode === 'ready') return rhBegin();
  if (rh.mode === 'pause') { rh.mode = 'play'; rhCtx.resume(); return; }
  if (rh.mode === 'over') rhSelect(rh.song, rh.diff);
}
/* ---------- NeoTha : gameplay à la Rhythia — les notes arrivent dans un tunnel sur une grille 3×3, il faut avoir le curseur dessus quand elles arrivent ---------- */
const TH = {W: 384, H: 216, CX: 192, CY: 116, CELL: 46, HALF: 17, PAD: [.03, .12], GRADES: [[.35, 'PARFAIT', 300, '#ffd07a'], [.7, 'BIEN', 200, '#8ee8a0'], [9, 'OK', 100, '#7fe0ee']]};
const thPos = c => [TH.CX + (c % 3 - 1) * TH.CELL, TH.CY + (Math.floor(c / 3) - 1) * TH.CELL];
function thCells(notes, seed) {  // où chaque note tombe : un saut de 1 à 5 cases selon la voie, jamais deux notes simultanées au même endroit
  const r = seeded(seed | 0); let cell = 4;
  return notes.map(n => { cell = (cell + [1, 2, 4, 5][n.lane] + (r() < .25 ? 1 : 0)) % 9; return {...n, len: 0, cell}; });
}
function rhJudge(n, d) {  // d : distance du curseur au centre de la note, en cases
  const w = TH.GRADES.find(w => d <= w[0]);
  n.judged = true; rh.combo++; rh.maxCombo = Math.max(rh.maxCombo, rh.combo); rh.counts[w[1]]++;
  rh.score += Math.round(w[2] * (1 + Math.min(rh.combo, 100) / 100));
  rh.judge = {text: w[1], color: w[3], t: 30};
  const [x, y] = thPos(n.cell);
  for (let i = 0; i < 8; i++) rh.sparks.push({x, y, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, life: 18, color: RH.COLORS[n.cell % 4]});
}
function rhMiss(n) { n.judged = true; n.missed = true; rh.combo = 0; rh.counts['RATÉ']++; rh.judge = {text: 'RATÉ', color: '#ff4f6d', t: 30}; }
function rhUpdate() {
  const now = rhNow(), ahead = rhCtx.currentTime + .15;
  while (rh.ev < rh.c.events.length && rh.t0 + rh.c.events[rh.ev].t < ahead) { const e = rh.c.events[rh.ev++], when = rh.t0 + e.t; if (when >= rhCtx.currentTime - .02) rhSound(e, Math.max(when, rhCtx.currentTime)); }
  for (const n of rh.notes) {
    if (n.judged || now < n.t - TH.PAD[0]) continue;
    const [x, y] = thPos(n.cell), dx = Math.abs(rh.mx - x), dy = Math.abs(rh.my - y);
    if (dx <= TH.HALF && dy <= TH.HALF) rhJudge(n, Math.max(dx, dy) / TH.HALF * .8);
    else if (now > n.t + TH.PAD[1]) rhMiss(n);
  }
  for (const s of rh.sparks) { s.x += s.vx; s.y += s.vy; s.life--; } rh.sparks = rh.sparks.filter(s => s.life > 0);
  rh.trail.push([rh.mx, rh.my]); if (rh.trail.length > 6) rh.trail.shift();
  if (rh.judge && --rh.judge.t <= 0) rh.judge = null;
  if (now > rh.c.len + 1.5) {
    rh.mode = 'over'; try { rh.src?.stop(); } catch {}
    const n = rh.notes.length, acc = n ? (rh.counts.PARFAIT * 300 + rh.counts.BIEN * 200 + rh.counts.OK * 100) / (n * 300) : 0;
    rh.acc = acc; rh.grade = acc >= .95 ? 'S' : acc >= .9 ? 'A' : acc >= .8 ? 'B' : acc >= .7 ? 'C' : 'D';
    const k = rh.info.key, res = gstore('neotha', {}); rh.record = best(k, rh.score);
    if (rh.record || !res[k]) res[k] = {score: rh.score, acc: Math.round(acc * 1000) / 10, grade: rh.grade, combo: rh.maxCombo};
    saveGames(); sfx('SAB'.includes(rh.grade) ? 'launch' : 'notify'); rhList();
  }
}
function rhDraw() {
  const g = rh.g, {W, H, CX, CY, CELL, HALF} = TH, now = rhCtx && rh.mode !== 'ready' ? rhNow() : -2, appr = 2.4 / +$('rhSpeed').value;
  const beat = 60 / rh.info.bpm, pulse = now > 0 ? Math.max(0, 1 - (now % beat) / beat * 2) : 0;
  g.fillStyle = '#07021a'; g.fillRect(0, 0, W, H);
  // tunnel : des cadres qui s'éloignent vers le centre, au rythme de la musique
  for (let k = 0; k < 6; k++) {
    const s = 1 - ((k + (now > 0 ? (now / beat) % 1 : 0)) / 6), w = 150 * 3.4 * s * s + 8; if (s <= 0) continue;
    g.strokeStyle = `rgba(${k % 2 ? '90,70,190' : '255,90,217'},${.05 + s * .1 + pulse * .08})`; g.strokeRect(Math.round(CX - w / 2) + .5, Math.round(CY - w * .3) + .5, Math.round(w), Math.round(w * .6));
  }
  for (let c = 0; c < 9; c++) { const [x, y] = thPos(c); g.strokeStyle = `rgba(143,123,184,${.35 + pulse * .3})`; g.strokeRect(x - HALF + .5, y - HALF + .5, HALF * 2, HALF * 2); }
  // les notes : elles grossissent en venant du fond et se posent sur leur case à l'heure exacte
  const vis = rh.notes.filter(n => !n.judged && n.t - now < appr && n.t - now > -.2).sort((a, b) => b.t - a.t);
  for (const n of vis) {
    const z = Math.max(0, (n.t - now) / appr), s = 1 - z * .85, [x, y] = thPos(n.cell), px0 = CX + (x - CX) * s, py0 = CY + (y - CY) * s, w = Math.max(3, HALF * 2 * s);
    g.globalAlpha = Math.min(1, 1.4 - z);
    px(g, '#05010b', px0 - w / 2 - 1, py0 - w / 2 - 1, w + 2, w + 2); px(g, RH.COLORS[n.cell % 4], px0 - w / 2, py0 - w / 2, w, w); px(g, 'rgba(255,255,255,.55)', px0 - w / 2 + 1, py0 - w / 2 + 1, Math.max(1, w - 2), 2);
    g.globalAlpha = 1;
  }
  for (const s of rh.sparks) px(g, s.color, s.x, s.y, 2, 2);
  rh.trail.forEach(([x, y], i) => px(g, `rgba(255,255,255,${(i + 1) / 14})`, x - 1, y - 1, 3, 3));
  px(g, '#05010b', rh.mx - 4, rh.my - 4, 9, 9); px(g, '#ffffff', rh.mx - 3, rh.my - 3, 7, 7); px(g, '#ff5ad9', rh.mx - 1, rh.my - 1, 3, 3);
  px(g, 'rgba(11,3,28,.85)', 0, 0, W, 16);
  pxFont(g, String(rh.score).padStart(7, '0'), 4, 11, '#ffffff', 7);
  const title = rh.info.name.length > 30 ? rh.info.name.slice(0, 29) + '…' : rh.info.name;
  pxFont(g, title, W - 4, 11, '#d9c6ff', 6, 'right');
  px(g, '#2a1d52', 0, 16, W, 2); px(g, '#ff5ad9', 0, 16, Math.max(0, Math.min(1, now / rh.c.len)) * W, 2);
  if (rh.combo >= 5) pxFont(g, rh.combo + ' COMBO', CX, 40, '#ffffff', 10, 'center');
  if (rh.judge) pxFont(g, rh.judge.text, CX, 192 - (30 - rh.judge.t) / 3, rh.judge.color, 9, 'center');
  if (rh.mode === 'play' && now < 0) pxFont(g, String(Math.ceil(-now)), CX, 40, '#ffd07a', 16, 'center');
  if (rh.mode === 'ready') gameText(g, W, [[title.toUpperCase(), '#ff5ad9', 8], [RH_DIFFS[rh.diff] + ' · ' + rh.notes.length + ' notes', '#d9c6ff'], ['Espace ou clic : jouer', '#ffd07a'], ['Survole les notes avec la souris', '#8f7bb8']], 90);
  if (rh.mode === 'pause') gameText(g, W, [['PAUSE', '#ffffff', 12], ['Espace : reprendre', '#d9c6ff']], 100);
  if (rh.mode === 'over') gameText(g, W, [['NOTE ' + rh.grade, rh.grade === 'S' ? '#ffd07a' : '#ff5ad9', 14], [rh.score + ' points', '#ffffff'], ['Précision ' + (rh.acc * 100).toFixed(1) + ' %', '#d9c6ff'], ['Combo max ' + rh.maxCombo, '#d9c6ff'], ['P ' + rh.counts.PARFAIT + ' · B ' + rh.counts.BIEN + ' · OK ' + rh.counts.OK + ' · X ' + rh.counts['RATÉ'], '#8f7bb8'], [rh.record ? 'NOUVEAU RECORD !' : 'Espace : rejouer', '#ffd07a']], 60);
}

function rhDiffRow(key, sel, play) {
  const res = games?.neotha || {}, row = el('div', 'row');
  for (const [d, label] of Object.entries(RH_DIFFS)) {
    const r = res[key + d], b = el('button', 'btn px' + (sel && rh?.diff === d ? ' main' : ''), label + (r ? ' · ' + r.grade : ''));
    if (r) b.title = r.score + ' points · ' + r.acc + ' % · combo ' + r.combo;
    b.onclick = () => play(d); row.append(b);
  }
  return row;
}
function rhList() {
  $('rhTabSongs').classList.toggle('on', rhTab === 'songs'); $('rhTabMine').classList.toggle('on', rhTab === 'mine');
  $('rhTabMine').textContent = 'MES MUSIQUES · ' + rhImports().length;
  $('rhImport').style.display = rhTab === 'mine' ? '' : 'none';
  if (rhTab === 'mine' && !$('rhMuList').options.length) rhFillNeoMusic();
  if (rhTab === 'songs') {
    const res = games?.neotha || {}, done = RH_SONGS.filter((_, i) => Object.keys(RH_DIFFS).some(d => res['rh' + i + d])).length;
    $('rhTabSongs').textContent = 'CHANSONS · ' + done + ' / ' + RH_SONGS.length;
    const order = RH_SONGS.map((s, i) => i).sort((a, b) => RH_SONGS[a].bpm - RH_SONGS[b].bpm);  // from the calmest to the fastest
    return $('rhSongs').replaceChildren(...order.map((i, rank) => {
      const s = RH_SONGS[i], c = el('div', 'sysCard px rhSong' + (rh?.song === i ? ' on' : '')), mins = (RH_LEN[i] ??= s.len ?? rhCompose(s).len);
      c.append(el('b', '', (rank + 1) + '. ' + s.name), el('span', 'hint', (s.style ? s.style + ' · ' : '') + s.bpm + ' BPM · ' + clock(mins) + ' · ' + '★'.repeat(Math.max(1, 1 + Math.min(4, Math.floor((s.bpm - 88) / 22))))), rhDiffRow('rh' + i, rh?.song === i, d => rhSelect(i, d)));
      return c;
    }));
  }
  const list = rhImports();
  $('rhSongs').replaceChildren(...(list.length ? list.map(imp => {
    const c = el('div', 'sysCard px rhSong' + (rh?.song === imp.id ? ' on' : '')), x = el('button', 'rhDel', '×');
    x.title = 'Retirer ce niveau (la musique reste dans NeoMusic)';
    x.onclick = () => { games.neothaImports = list.filter(o => o !== imp); rhAnalysed.delete(imp.id); saveGames(); rhList(); };
    c.append(x, el('b', '', imp.name), el('span', 'hint', (imp.bpm ? imp.bpm + ' BPM · ' + clock(imp.len || 0) : 'pas encore analysée') + (imp.url ? ' · YouTube' : ' · fichier'))),
      rhDiffRow('rhx' + imp.id, rh?.song === imp.id, d => { $('rhImpMsg').textContent = 'Préparation du niveau…'; rhSelect(imp.id, d).then(() => $('rhImpMsg').textContent = '', e => $('rhImpMsg').textContent = 'Impossible : ' + e.message); });
    return c;
  }) : [el('span', 'hint', 'Importe un fichier audio, ou choisis une musique de NeoMusic : le jeu trouve son tempo et ses temps forts et en fait 4 niveaux.')]));
}
async function rhFillNeoMusic() {  // the songs of NeoMusic's library, to make a level from one
  try { await muLoad(); } catch {}
  const seen = new Set(), songs = (typeof mu === 'object' && mu ? mu.playlists.flatMap(p => p.tracks) : []).filter(t => (t.file || t.url) && !seen.has(muId(t)) && seen.add(muId(t)));
  $('rhMuList').replaceChildren(...(songs.length ? songs.map(t => { const o = el('option', '', (t.display_title || t.file).slice(0, 70)); o.value = muId(t); return o; }) : [el('option', '', 'Aucune musique dans NeoMusic')]));
  $('rhMuList')._songs = songs; $('rhMuBtn').disabled = !songs.length;
}
$('rhTabSongs').onclick = () => { rhTab = 'songs'; rhList(); };
$('rhTabMine').onclick = () => { rhTab = 'mine'; rhList(); rhFillNeoMusic(); };
$('rhFileBtn').onclick = () => $('rhFile').click();
$('rhFile').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const file = await neo.musicAddFile(neo.pathOf(f)); rhAddImport({id: 'f:' + file, name: f.name.replace(/\.[^.]+$/, ''), file}); }
  catch (err) { $('rhImpMsg').textContent = 'Import impossible : ' + err.message; }
};
$('rhMuBtn').onclick = () => { const t = $('rhMuList')._songs?.find(x => muId(x) === $('rhMuList').value); if (t) rhAddImport({id: muId(t), name: t.display_title || t.file, file: t.file || '', url: t.url || ''}); };
setInterval(() => { if (rhCtx?.state === 'running' && (!view.classList.contains('on') || rh?.mode !== 'play')) rhCtx.suspend(); }, 200);  // the music stops with the game
const thAim = e => { if (!rh) return; const r = $('rhCanvas').getBoundingClientRect(); rh.mx = Math.max(0, Math.min(TH.W, (e.clientX - r.left) / r.width * TH.W)); rh.my = Math.max(0, Math.min(TH.H, (e.clientY - r.top) / r.height * TH.H)); };
$('rhCanvas').onpointermove = thAim;
$('rhCanvas').onpointerdown = e => { thAim(e); if (rh && rh.mode !== 'play') rhPress(); };
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || !view.classList.contains('on') || !rh) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === ' ') { e.preventDefault(); if (!e.repeat && rh.mode !== 'play') rhPress(); }
  if ((k === 'p' || k === 'Escape') && rh.mode === 'play') { rh.mode = 'pause'; rhCtx?.suspend(); }
});

$('rhVol').oninput = () => { if (rhOut) rhOut.gain.value = +$('rhVol').value / 100 * .6; };
for (const id of ['rhVol', 'rhSpeed', 'rhOffset']) $(id).addEventListener('change', () => { gstore('neothaPrefs', {})[id] = $(id).value; saveGames(); });
function rhOpen() {
  const p = games.neothaPrefs || {}; for (const id of ['rhVol', 'rhSpeed', 'rhOffset']) if (p[id] != null) $(id).value = p[id];
  if (rh) { rhList(); return gameLoop(rh, 'neodyme:neotha', rhUpdate, rhDraw); }
  const last = games.neothaLast || {song: 0, diff: 'normal'}; rhSelect(last.song, last.diff).catch(() => rhSelect(0, 'normal'));  // an imported music may be missing on this PC
}  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { rhOpen(); });
}
