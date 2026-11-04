const HTML = `<div class="appWrap wide">
  <div class="agHead"><span class="label">NeoTha</span><span class="hint">Souris : touche chaque note quand elle arrive · espace : jouer · P : pause · Échap : libère la souris</span></div>
  <div class="rhMain"><div class="thBox"><canvas id="rhCanvas" width="768" height="432"></canvas><button class="btn px rhFs" id="rhFs">PLEIN ÉCRAN</button></div>
    <div class="rhSide"><div class="rhTabs"><button class="tab px on" id="rhTabSongs">CHANSONS</button><button class="tab px" id="rhTabMine">MES MUSIQUES</button></div>
      <div class="sysCard px rhImport" id="rhImport" style="display:none"><div class="row"><button class="btn main px" id="rhFileBtn">IMPORTER UN FICHIER AUDIO</button><input type="file" id="rhFile" accept="audio/*,.mp3,.m4a,.ogg,.opus,.wav,.flac,.webm" hidden></div>
        <div class="row"><select class="f gSel" id="rhMuList"></select><button class="btn px" id="rhMuBtn">CRÉER LE NIVEAU</button></div>
        <div class="row"><label>Difficulté du niveau <select class="f gSel" id="rhStars"><option value="1">★</option><option value="2">★★</option><option value="3" selected>★★★</option><option value="4">★★★★</option><option value="5">★★★★★</option><option value="6">★★★★★★</option><option value="7">★★★★★★★</option><option value="8">★★★★★★★★</option><option value="9">★★★★★★★★★</option><option value="10">★★★★★★★★★★</option></select></label></div><span class="hint" id="rhImpMsg">Depuis un fichier ou une musique de NeoMusic : 4 niveaux sont créés à partir de son tempo et de ses temps forts.</span></div>
      <div id="rhSongs"></div>
      <div class="sysCard px rhOpts"><label>Volume <input type="range" id="rhVol" min="0" max="100" value="70"></label>
        
        <label>Décalage audio <select class="f gSel" id="rhOffset"><option value="-120">-120 ms</option><option value="-80">-80 ms</option><option value="-40">-40 ms</option><option value="0" selected>0 ms</option><option value="40">+40 ms</option><option value="80">+80 ms</option><option value="120">+120 ms</option></select></label>
        <label>Curseur <select class="f gSel" id="thCur"><option value="dot" selected>Point</option><option value="ring">Cercle</option><option value="square">Carré</option></select></label></div></div></div>
  <div class="hint">Comme Rhythia : les notes arrivent du fond du tunnel, partout dans le champ, parfois en longues séries. Passe le curseur dessus à l'instant où elles arrivent ; plus tu es au centre, meilleure est la note. La souris est capturée pendant la partie.</div>
</div>`;
const CSS = `.thBox{position:relative}
.rhFs{position:absolute;top:14px;right:14px;opacity:.85}
.thBox:fullscreen .rhFs{display:none}
.thBox:fullscreen{padding:0}
.thBox:fullscreen canvas{width:min(100vw,177.78vh)}
.thBox{display:grid;place-items:center;padding:10px;background:#05010b;box-shadow:0 0 0 3px var(--line2);flex:2;min-width:360px}
.thBox canvas{width:100%;aspect-ratio:384/216;cursor:none}
.gSel{appearance:none;-webkit-appearance:none;width:auto;font:inherit;font-size:13px;padding:7px 28px 7px 10px;margin-right:8px;color:#d9c6ff;background:#100830 url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27%3E%3Cpath d=%27M0 0h10L5 6z%27 fill=%27%23ff5ad9%27/%3E%3C/svg%3E") no-repeat right 9px center;border:2px solid #2a1d52;border-radius:0;cursor:pointer}
.gSel:focus{outline:none;border-color:#ff5ad9}
.gSel option{background:#100830;color:#d9c6ff}
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
/* ---------- l'habillage pixel art, dessiné à la main : police bitmap (accents compris), cadres, boutons, icônes ----------
   Tout est en pixels pleins, agrandis par 2 sans lissage : aucun dégradé, aucune ombre floue. */
const PXK = (() => {
  // chaque lettre : ses lignes, de haut en bas, à partir de la ligne 2 de la case (0-1 : accents des majuscules, 9-10 : jambages)
  const S = {
    A: '.###. #...# #...# ##### #...# #...# #...#', B: '####. #...# #...# ####. #...# #...# ####.', C: '.###. #...# #.... #.... #.... #...# .###.',
    D: '####. #...# #...# #...# #...# #...# ####.', E: '##### #.... #.... ####. #.... #.... #####', F: '##### #.... #.... ####. #.... #.... #....',
    G: '.###. #...# #.... #.### #...# #...# .####', H: '#...# #...# #...# ##### #...# #...# #...#', I: '### .#. .#. .#. .#. .#. ###',
    J: '..### ...#. ...#. ...#. #..#. #..#. .##..', K: '#...# #..#. #.#.. ##... #.#.. #..#. #...#', L: '#.... #.... #.... #.... #.... #.... #####',
    M: '#...# ##.## #.#.# #.#.# #...# #...# #...#', N: '#...# ##..# #.#.# #..## #...# #...# #...#', O: '.###. #...# #...# #...# #...# #...# .###.',
    P: '####. #...# #...# ####. #.... #.... #....', Q: '.###. #...# #...# #...# #.#.# #..#. .##.#', R: '####. #...# #...# ####. #.#.. #..#. #...#',
    S: '.#### #.... #.... .###. ....# ....# ####.', T: '##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..', U: '#...# #...# #...# #...# #...# #...# .###.',
    V: '#...# #...# #...# #...# #...# .#.#. ..#..', W: '#...# #...# #...# #.#.# #.#.# ##.## #...#', X: '#...# #...# .#.#. ..#.. .#.#. #...# #...#',
    Y: '#...# #...# .#.#. ..#.. ..#.. ..#.. ..#..', Z: '##### ....# ...#. ..#.. .#... #.... #####',
    a: '..... ..... .###. ....# .#### #...# .####', b: '#.... #.... ####. #...# #...# #...# ####.', c: '..... ..... .###. #.... #.... #.... .###.',
    d: '....# ....# .#### #...# #...# #...# .####', e: '..... ..... .###. #...# ##### #.... .###.', f: '..## .#.. #### .#.. .#.. .#.. .#..',
    g: '..... ..... .#### #...# #...# #...# .#### ....# .###.', h: '#.... #.... ####. #...# #...# #...# #...#', i: '.#. ... ##. .#. .#. .#. ###',
    'ı': '... ... ##. .#. .#. .#. ###', j: '...# .... ..## ...# ...# ...# ...# #..# .##.', k: '#... #... #..# #.#. ##.. #.#. #..#',
    l: '##. .#. .#. .#. .#. .#. ###', m: '..... ..... ##.#. #.#.# #.#.# #.#.# #...#', n: '..... ..... ####. #...# #...# #...# #...#',
    o: '..... ..... .###. #...# #...# #...# .###.', p: '..... ..... ####. #...# #...# #...# ####. #.... #....', q: '..... ..... .#### #...# #...# #...# .#### ....# ....#',
    r: '.... .... #.## ##.. #... #... #...', s: '..... ..... .#### #.... .###. ....# ####.', t: '.#.. .#.. #### .#.. .#.. .#.. ..##',
    u: '..... ..... #...# #...# #...# #..## .##.#', v: '..... ..... #...# #...# #...# .#.#. ..#..', w: '..... ..... #...# #...# #.#.# #.#.# .#.#.',
    x: '..... ..... #...# .#.#. ..#.. .#.#. #...#', y: '..... ..... #...# #...# #...# #...# .#### ....# .###.', z: '..... ..... ##### ...#. ..#.. .#... #####',
    0: '.###. #...# #..## #.#.# ##..# #...# .###.', 1: '..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.', 2: '.###. #...# ....# ...#. ..#.. .#... #####',
    3: '####. ....# ....# .###. ....# ....# ####.', 4: '...#. ..##. .#.#. #..#. ##### ...#. ...#.', 5: '##### #.... ####. ....# ....# #...# .###.',
    6: '.###. #.... #.... ####. #...# #...# .###.', 7: '##### ....# ...#. ..#.. .#... .#... .#...', 8: '.###. #...# #...# .###. #...# #...# .###.',
    9: '.###. #...# #...# .#### ....# ....# .###.',
    '.': '. . . . . . #', ',': '.. .. .. .. .. .# .# #.', ':': '. . # . . . #', ';': '.. .. .# .. .. .# .# #.', '!': '# # # # # . #',
    '?': '.###. #...# ....# ...#. ..#.. ..... ..#..', "'": '# # . . . . .', '"': '#.# #.# ... ... ... ... ...', '-': '... ... ... ### ... ... ...',
    '+': '..... ..#.. ..#.. ##### ..#.. ..#.. .....', '/': '....# ...#. ...#. ..#.. .#... .#... #....', '(': '.# #. #. #. #. #. .#', ')': '#. .# .# .# .# .# #.',
    '%': '##..# ##.#. ...#. ..#.. .#... .#.## #..##', '·': '. . . # . . .', '×': '..... ..... #...# .#.#. ..#.. .#.#. #...#',
    '<': '...# ..#. .#.. #... .#.. ..#. ...#', '>': '#... .#.. ..#. ...# ..#. .#.. #...', '=': '.... .... #### .... #### .... ....',
    '_': '..... ..... ..... ..... ..... ..... #####', '#': '.#.#. .#.#. ##### .#.#. ##### .#.#. .#.#.', '&': '.##.. #..#. #.#.. .#... #.#.# #..#. .##.#',
    '…': '..... ..... ..... ..... ..... ..... #.#.#', '«': '..... ..#.# .#.#. #.#.. .#.#. ..#.# .....', '»': '..... #.#.. .#.#. ..#.# .#.#. #.#.. .....',
    '◀': '...# ..## .### #### .### ..## ...#', '▶': '#... ##.. ###. #### ###. ##.. #...', '→': '..... ..#.. ...#. ##### ...#. ..#.. .....',
    '←': '..... ..#.. .#... ##### .#... ..#.. .....', '↑': '..#.. .###. #.#.# ..#.. ..#.. ..#.. ..#..', '↓': '..#.. ..#.. ..#.. ..#.. #.#.# .###. ..#..',
    '*': '..... #.#.# .###. ##### .###. #.#.# .....', '[': '## #. #. #. #. #. ##', ']': '## .# .# .# .# .# ##', '|': '# # # # # # #',
    '@': '.###. #...# #.### #.#.# #.### #.... .###.', '€': '..### .#... ####. .#... ####. .#... ..###', '$': '..#.. .#### #.#.. .###. ..#.# ####. ..#..',
    '°': '.#. #.# .#. ... ... ... ...', '~': '..... ..... .#..# #.##. ..... ..... .....', '♪': '..##. ..#.# ..#.. ..#.. .##.. ###.. .#...',
  };
  const ACC = { a: ['..#', '.#.'], g: ['#..', '.#.'], c: ['.#.', '#.#'], d: ['...', '#.#'], t: ['.#.#', '#.#.'], z: ['.#.', '##.'] };  // aigu, grave, circonflexe, tréma, tilde, cédille
  const COMP = { é: 'ea', è: 'eg', ê: 'ec', ë: 'ed', á: 'aa', à: 'ag', â: 'ac', ä: 'ad', í: 'ıa', ì: 'ıg', î: 'ıc', ï: 'ıd', ó: 'oa', ò: 'og', ô: 'oc', ö: 'od',
    ú: 'ua', ù: 'ug', û: 'uc', ü: 'ud', ÿ: 'yd', ñ: 'nt', ç: 'cz', É: 'Ea', È: 'Eg', Ê: 'Ec', Ë: 'Ed', Á: 'Aa', À: 'Ag', Â: 'Ac', Ä: 'Ad', Í: 'Ia', Î: 'Ic', Ï: 'Id',
    Ó: 'Oa', Ô: 'Oc', Ö: 'Od', Ú: 'Ua', Ù: 'Ug', Û: 'Uc', Ü: 'Ud', Ñ: 'Nt', Ç: 'Cz' };
  const SUB = { 'œ': 'oe', 'Œ': 'OE', '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', ' ': ' ', ' ': ' ', '•': '·', '✓': 'v', 'ᐸ': '<', 'ᐳ': '>', '＜': '<', '＞': '>', '｜': '|', '／': '/', '！': '!', '？': '?', '（': '(', '）': ')', '：': ':', '　': ' ' };  // ᐸ ᐳ : les < > des titres YouTube
  const H = 11, glyphs = new Map(); let raster;
  function glyph(ch) {
    let g = glyphs.get(ch); if (g) return g;
    const px = [], add = (rows, ox, oy) => rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') px.push([ox + x, oy + y]); });
    const c = COMP[ch], src = S[c ? c[0] : ch]; let w = 3;
    if (src) {
      const rows = src.split(' '); w = Math.max(...rows.map(r => r.length)); add(rows, 0, 2);
      if (c) { const a = ACC[c[1]]; add(a, Math.floor((w - a[0].length) / 2), c[1] === 'z' ? 9 : /[A-Z]/.test(c[0]) ? 0 : 1); }
    } else if (ch !== ' ') {  // japonais, emoji… : la lettre du système, réduite à des pixels nets (sans lissage) sur la même hauteur que la police
      const q = (raster ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })), RW = 16;
      q.canvas.width = RW; q.canvas.height = H; q.font = '11px "MS Gothic", "Yu Gothic UI", Meiryo, "Segoe UI Symbol", sans-serif'; q.fillStyle = '#000'; q.fillText(ch, 0, 10);
      const d = q.getImageData(0, 0, RW, H).data; let mx = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < RW; x++) if (d[(y * RW + x) * 4 + 3] > 110) { px.push([x, y]); mx = Math.max(mx, x + 1); }
      w = mx || 3;
      if (!px.length) { w = 5; add(['#####', '#...#', '#...#', '#...#', '#...#', '#...#', '#####'], 0, 2); }  // vraiment inconnue : une petite case
    }
    g = { w, px }; glyphs.set(ch, g); return g;
  }
  function layout(text) {
    let x = 0; const items = [];
    for (const ch of String(text)) for (const c of SUB[ch] ?? ch) { const g = glyph(c); items.push([g, x]); x += g.w + 1; }
    return { w: Math.max(0, x - 1), items };
  }
  function draw(g, text, x, y, color, s = 1) {  // (x, y) : coin haut gauche de la case
    const L = layout(text); g.fillStyle = color;
    for (const [gl, ox] of L.items) for (const [px, py] of gl.px) g.fillRect(x + (ox + px) * s, y + py * s, s, s);
    return L.w * s;
  }
  const bmp = new Map();
  function sprite(text, color, s = 1) {  // le texte tout prêt, gardé pour les images suivantes du jeu
    const k = text + '|' + color + '|' + s; let c = bmp.get(k); if (c) return c;
    c = document.createElement('canvas'); c.width = Math.max(1, layout(text).w * s); c.height = H * s; draw(c.getContext('2d'), text, 0, 0, color, s);
    if (bmp.size > 400) bmp.delete(bmp.keys().next().value);
    bmp.set(k, c); return c;
  }
  // comme fillText : (x, y) sur la ligne de base, aligné à gauche, au centre ou à droite
  function fill(g, text, x, y, color, s = 1, align = 'left') {
    const c = sprite(String(text), color, s), dx = align === 'center' ? -c.width / 2 : align === 'right' ? -c.width : 0;
    g.drawImage(c, Math.round(x + dx), Math.round(y - 9 * s));
  }
  const scale = size => Math.max(1, Math.round((size || 8) / 8));
  function art(rows, pal, s = 1) {  // un dessin en lignes de caractères, chaque caractère une couleur de la palette (« . » : transparent)
    const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)) * s; c.height = rows.length * s;
    const g = c.getContext('2d');
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = pal[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x * s, y * s, s, s); } } });
    return c;
  }
  return { H, layout, draw, sprite, fill, scale, art };
})();

// les pièces de l'interface, pixel par pixel (K : contour, les autres lettres : la palette du jeu)
const PX_PANEL = ['..KKKKKKKKKKKK..', '.KAAAAAAAAAAAAK.', 'KALAAAAAAAAAALSK', 'KAAKKKKKKKKKKSSK', 'KAAKHHHHHHHHKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK',
  'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKHDDDDDDDKSSK', 'KAAKKKKKKKKKKSSK', 'KALSSSSSSSSSSLSK', '.KSSSSSSSSSSSSK.', '..KKKKKKKKKKKK..'];
const PX_CARD = ['.KKKKKKKKKK.', 'KFFFFFFFFFFK', 'KFHHHHHHHHFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFHDDDDDDDFK', 'KFSSSSSSSSFK', 'KFFFFFFFFFFK', '.KKKKKKKKKK.'];
const PX_BTN = ['.KKKKKKKKKK.', 'KWWWWWWWWWWK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KWMMMMMMMMBK', 'KBBBBBBBBBBK', 'KKKKKKKKKKKK', 'KDDDDDDDDDDK', '.KKKKKKKKKK.'];
const PX_BTN_DOWN = ['............', '............', '.KKKKKKKKKK.', 'KBBBBBBBBBBK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KBMMMMMMMMWK', 'KWWWWWWWWWWK', '.KKKKKKKKKK.'];
const PX_TRACK = ['.KKKKKKKKKK.', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KDDDDDDDDDDK', 'KHHHHHHHHHHK', '.KKKKKKKKKK.'];
const PX_KNOB = ['.KKKKK.', 'KWWWWWK', 'KWAAABK', 'KWAAABK', 'KKKKKKK', 'KWAAABK', 'KWAAABK', 'KBBBBBK', 'KDDDDDK', '.KKKKK.'];
const PX_RAIL = ['KDDDDDDK', 'KDDDDDDK', 'KDDDDDDK', 'KDDHHDDK'];
const PX_ICONS = {
  play: ['kk......', 'kakk....', 'kaaakk..', 'kaaaaakk', 'kaaaaaak', 'kaaaaakk', 'kaaakk..', 'kakk....', 'kk......'],
  full: ['www...www', 'w.......w', 'w.......w', '.........', '....a....', '.........', 'w.......w', 'w.......w', 'www...www'],
  note: ['...aaaaaa', '...aaaaaa', '...a....a', '...a....a', '...a....a', '.aaa..aaa', 'aaaa.aaaa', 'aaaa.aaaa', '.aa...aa.'],
  star: ['....g....', '....g....', '...ggg...', 'ggggwgggg', '.ggwwwgg.', '..ggggg..', '..oo.oo..', '.oo...oo.', '.o.....o.'],
  crown: ['g...g...g', 'gg.ggg.gg', 'ggggggggg', 'grgggggrg', 'ggggggggg', 'ooooooooo'],
  folder: ['oooo.....', 'oggoooooo', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ggggggggg', 'ooooooooo'],
  vol: ['....w....', '...ww..b.', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', 'wwwww.b.b', '...ww..b.', '....w....'],
  clock: ['..wwwww..', '.w.....w.', 'w...a...w', 'w...a...w', 'w...aaa.w', 'w.......w', 'w.......w', '.w.....w.', '..wwwww..'],
  cursor: ['....a....', '..aaaaa..', '.a..a..a.', '.a.....a.', 'aaa.w.aaa', '.a.....a.', '.a..a..a.', '..aaaaa..', '....a....'],
  plus: ['...b...', '...b...', '...b...', 'bbbbbbb', '...b...', '...b...', '...b...'],
  down: ['wwwwwww', '.wwwww.', '..www..', '...w...'],
};

/* habille la page du jeu : root = son conteneur, T = sa palette, icons = [motif du texte, icône] pour les boutons et libellés */
function pxSkin(root, { T, icons = [], emblem, title }) {
  root.classList.add('pxk'); const s = 2, url = c => c.toDataURL();
  const btnPal = (M, W, B, D) => ({ K: T.k, W, M, B, D });
  const BN = btnPal(T.btn, T.btnHi, T.btnLo, T.k2), BH = btnPal(T.btnHov, T.btnHovHi, T.btnLo, T.k2);
  const BA = btnPal(T.acc, T.accL, T.accS, T.accD), BAH = btnPal(T.accL, '#ffffff', T.acc, T.accD);
  const img = { panel: PXK.art(PX_PANEL, { K: T.k, A: T.acc, S: T.accS, L: T.rivet, H: T.hl, D: T.fill }, s),
    card: PXK.art(PX_CARD, { K: T.k, F: T.line, H: T.hl, D: T.fill, S: T.k2 }, s), cardOn: PXK.art(PX_CARD, { K: T.k, F: T.acc, H: T.accS, D: T.fillOn, S: T.accD }, s),
    btn: PXK.art(PX_BTN, BN, s), btnH: PXK.art(PX_BTN, BH, s), btnD: PXK.art(PX_BTN_DOWN, BH, s),
    main: PXK.art(PX_BTN, BA, s), mainH: PXK.art(PX_BTN, BAH, s), mainD: PXK.art(PX_BTN_DOWN, BA, s),
    track: PXK.art(PX_TRACK, { K: T.k, D: T.k2, H: T.line }, s), knob: PXK.art(PX_KNOB, { K: T.k, W: T.accL, A: T.acc, B: T.accS, D: T.accD }, s),
    rail: PXK.art(PX_RAIL, { K: T.k, D: T.k2, H: T.line }, s), tile: PXK.art(T.tile, { x: T.bgDot, ':': T.bgDot2, '+': T.spark, '*': T.spark2 }, s) };
  const u = Object.fromEntries(Object.entries(img).map(([k, c]) => [k, url(c)]));
  const nine = (k, sl) => `border-style:solid;border-width:${sl * s}px;border-image:url(${u[k]}) ${sl * s} fill / ${sl * s}px stretch`;
  const IP = { k: T.k, w: T.text, a: T.acc, b: T.acc2, g: T.gold, o: T.orange, r: T.red, n: T.green, N: T.green2, m: T.muted, s: T.accS };
  const iconUrl = new Map(), icon = name => {
    let v = iconUrl.get(name); if (!v) { const c = PXK.art(PX_ICONS[name] || emblem, IP, s); v = { u: url(c), w: c.width, h: c.height }; iconUrl.set(name, v); }
    const b = document.createElement('b'); b.className = 'pxI'; b.setAttribute('aria-hidden', 'true'); b.style.cssText = `width:${v.w}px;height:${v.h}px;background-image:url(${v.u})`; return b;
  };
  const R = '.pxk.pxk';
  const css = document.createElement('style');
  css.textContent = `html,html body{background:${T.bg} url(${u.tile}) 0 0/${img.tile.width}px ${img.tile.height}px repeat!important}
::-webkit-scrollbar{width:16px;height:16px} ::-webkit-scrollbar-track{background:url(${u.rail}) 0 0/16px 8px repeat-y} ::-webkit-scrollbar-thumb{${nine('main', 4)}} ::-webkit-scrollbar-corner{background:none}
${R}{color:${T.text}}
${R} .px{box-shadow:none;background:none}
${R} .agHead{gap:18px;margin:0}
${R} .agHead .label{display:flex;align-items:center;gap:12px}
${R} .btn,${R} .tab{${nine('btn', 4)};height:auto;min-height:0;padding:0 6px 4px;margin:0;color:${T.text};font:12px/1 monospace;display:inline-flex;align-items:center;gap:6px;filter:none;text-shadow:none;letter-spacing:0;cursor:var(--cp,pointer)}
${R} .btn:hover,${R} .tab:hover{border-image-source:url(${u.btnH})}
${R} .btn:active,${R} .tab:active{border-image-source:url(${u.btnD});padding:4px 6px 0}
${R} .btn.main,${R} .tab.on{border-image-source:url(${u.main});color:${T.k}}
${R} .btn.main:hover,${R} .tab.on:hover{border-image-source:url(${u.mainH})}
${R} .btn.main:active,${R} .tab.on:active{border-image-source:url(${u.mainD})}
${R} .btn:focus-visible,${R} .tab:focus-visible{outline:2px dashed ${T.acc2};outline-offset:2px}
${R} .btn .pxV,${R} .tab .pxV{white-space:nowrap}
${R} .sysCard{${nine('card', 4)};padding:4px 6px;gap:8px;background:none}
${R} .sysCard.on{border-image-source:url(${u.cardOn})}
${R} .sysCard.on>b{color:${T.acc}}
${R} .sysCard>b{color:${T.text}}
${R} .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
${R} .gameBox,${R} .thBox{${nine('panel', 5)};box-shadow:none;background:none;padding:2px;gap:8px;grid-template-rows:auto auto}
${R} .gameBox canvas,${R} .thBox canvas{display:block;background:#05010b}
${R} .gameBox:fullscreen,${R} .thBox:fullscreen{border:0;padding:0;background:#000}
${R} .rhFs{position:static;opacity:1;justify-self:end;margin:0 6px 6px 0}
${R} .rhTabs{gap:8px;flex-wrap:wrap}
${R} .hint{color:${T.muted};line-height:24px}
${R} label{color:${T.muted};display:inline-flex;align-items:center;gap:8px}
${R} .rhDel{color:${T.red};top:6px;right:8px}
${R} input[type=range]{-webkit-appearance:none;appearance:none;background:none;height:20px;width:150px}
${R} input[type=range]::-webkit-slider-runnable-track{height:12px;${nine('track', 2)}}
${R} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:20px;border:0;background:url(${u.knob}) 0 0/100% 100%;margin-top:-8px;cursor:var(--cp,pointer)}
${R} .pxSel{justify-content:space-between;gap:10px;max-width:100%;overflow:hidden}
${R} .rhImport .pxSel{flex:1;min-width:0}
.pxMenu{position:fixed;z-index:50;${nine('card', 4)};padding:2px;max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;color:${T.text}}
.pxMenu button{all:unset;padding:3px 8px;cursor:var(--cp,pointer);white-space:nowrap}
.pxMenu button:hover,.pxMenu button:focus-visible,.pxMenu button.on{background:${T.btnHov};color:${T.text}}
.pxMenu button.on{color:${T.acc}}
.pxT{position:relative;white-space:normal;font:12px/1 monospace;letter-spacing:0;text-transform:none}
.pxT i{display:inline-block;vertical-align:middle;background:currentColor;-webkit-mask:var(--m) 0 0/100% 100% no-repeat;mask:var(--m) 0 0/100% 100% no-repeat;image-rendering:pixelated}
.pxI{display:inline-block;vertical-align:middle;background:0 0/100% 100% no-repeat;image-rendering:pixelated;margin-right:6px}
.pxV>.pxI+.pxI{margin-left:-4px}
.pxSr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`;
  document.head.append(css);
  // un mot = une image (en masque : sa couleur suit celle du texte), une règle par mot pour ne pas répéter l'image
  const words = new Map(), sheet = document.head.appendChild(document.createElement('style')).sheet;
  const word = w => {
    let k = words.get(w);
    if (!k) { const c = PXK.sprite(w, '#fff', s); k = 'pw' + words.size; words.set(w, k); sheet.insertRule(`.${k}{--m:url(${c.toDataURL()});width:${c.width}px;height:${c.height}px}`, sheet.cssRules.length); }
    const i = document.createElement('i'); i.className = k; return i;
  };
  function render(vis, text, lead) {
    const parts = [], ic = lead && icons.find(([re]) => re.test(text.trim()));
    if (ic) parts.push(icon(ic[1]));
    for (const m of text.matchAll(/(★+)|(\s+)|([^\s★]+)/g)) {
      if (m[1]) for (const _ of m[1]) parts.push(icon('star'));
      else if (m[2]) parts.push(document.createTextNode(' '));
      else parts.push(word(m[3]));
    }
    vis.replaceChildren(...parts);
  }
  const lead = node => node.parentElement?.matches('button,label,.tab,.btn') && !node.previousSibling;
  function pixText(node) {  // le texte reste dans la page (lecteur d'écran, copier) ; on voit ses lettres en pixels
    const wrap = document.createElement('span'), sr = document.createElement('span'), vis = document.createElement('span');
    wrap.className = 'pxT'; sr.className = 'pxSr'; vis.className = 'pxV'; vis.setAttribute('aria-hidden', 'true');
    const first = lead(node); node.replaceWith(wrap); sr.append(node); wrap.append(sr, vis); render(vis, node.data, first);
  }
  function pxSelect(sel) {  // une liste déroulante en pixels ; la vraie reste cachée et garde sa valeur et ses événements
    sel.dataset.px = '1'; sel.style.display = 'none';
    const b = document.createElement('button'), lab = document.createElement('span'); b.type = 'button'; b.className = 'btn pxSel'; b.append(lab, icon('down')); sel.after(b);
    const sync = () => { const t = sel.selectedOptions[0]?.textContent || '—'; if (lab.dataset.t !== t) { lab.dataset.t = t; lab.textContent = t; } };
    const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    Object.defineProperty(sel, 'value', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, v); sync(); } });
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true, characterData: true, attributes: true });
    sel.addEventListener('change', sync);
    b.onclick = () => {
      document.querySelector('.pxMenu')?.remove();
      const m = document.createElement('div'), r = b.getBoundingClientRect(); m.className = 'pxMenu'; m.setAttribute('role', 'listbox');
      for (const o of sel.options) {
        const it = document.createElement('button'); it.type = 'button'; it.textContent = o.textContent; it.className = o.selected ? 'on' : ''; it.setAttribute('role', 'option');
        it.onclick = () => { sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); close(); b.focus(); };
        m.append(it);
      }
      root.append(m);
      const below = innerHeight - r.bottom; m.style.minWidth = r.width + 'px'; m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 4) + 'px';
      m.style.top = (below > m.offsetHeight + 8 || below > r.top ? r.bottom + 2 : r.top - m.offsetHeight - 2) + 'px';
      const close = () => { m.remove(); removeEventListener('pointerdown', out, true); removeEventListener('keydown', key, true); removeEventListener('blur', close); };
      const out = e => { if (!m.contains(e.target) && e.target !== b && !b.contains(e.target)) close(); };
      const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); b.focus(); } };
      addEventListener('pointerdown', out, true); addEventListener('keydown', key, true); addEventListener('blur', close);
      (m.querySelector('.on') || m.firstChild)?.focus();
    };
    sync();
  }
  const SKIP = 'select,option,textarea,script,style,canvas,.pxT,[data-pxskip]';
  let queued = false;
  function pass() {
    queued = false;
    root.querySelectorAll('select.gSel:not([data-px])').forEach(pxSelect);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), todo = [];
    for (let n; (n = w.nextNode());) if (n.data.trim() && n.parentElement && !n.parentElement.closest(SKIP)) todo.push(n);
    todo.forEach(pixText);
  }
  new MutationObserver(ms => {
    for (const m of ms) if (m.type === 'characterData') { const wrap = m.target.parentNode?.closest?.('.pxT'); if (wrap) render(wrap.lastChild, m.target.data, false); }
    if (!queued) { queued = true; queueMicrotask(pass); }
  }).observe(root, { childList: true, subtree: true, characterData: true });
  // le titre : grosses lettres à contour, trois tons, et l'emblème du jeu
  const lab = root.querySelector('.agHead .label');
  if (lab) {
    const L = PXK.layout(title), c = document.createElement('canvas'), g = c.getContext('2d'), on = [];
    c.width = L.w + 3; c.height = PXK.H + 3;
    for (const [gl, ox] of L.items) for (const [x, y] of gl.px) on.push([ox + x + 1, y + 1]);
    g.fillStyle = T.k; for (const [x, y] of on) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [2, 2], [1, 2], [2, 1]]) g.fillRect(x + dx, y + dy, 1, 1);
    for (const [x, y] of on) { g.fillStyle = y <= 5 ? T.accL : y <= 7 ? T.acc : T.accS; g.fillRect(x, y, 1, 1); }
    const big = document.createElement('canvas'), z = 4; big.width = c.width * z; big.height = c.height * z;
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height);
    const t = document.createElement('b'); t.className = 'pxI'; t.style.cssText = `width:${big.width}px;height:${big.height}px;background-image:url(${big.toDataURL()})`;
    const e = PXK.art(emblem, IP, 3), em = document.createElement('b'); em.className = 'pxI'; em.style.cssText = `width:${e.width}px;height:${e.height}px;background-image:url(${e.toDataURL()})`;
    const sr = document.createElement('span'); sr.className = 'pxSr'; sr.textContent = lab.textContent;
    lab.dataset.pxskip = '1'; lab.replaceChildren(em, t, sr);
  }
  pass();
}

export default async function (ctx) {
  const view = ctx.view;
  // le côté système de NeoMusic (fichiers, YouTube…) vit dans le main.js de son plugin : « neo.musicXxx » y est redirigé
  const MU_ID = 'neodex.music', MU_EV = { onMusicHotkey: 'music:hotkey', onMusicProgress: 'music:progress' };
  const neo = new Proxy({}, { get: (_, k) => { const n = ctx.neo;  // cible vide : contextBridge fige les propriétés de neo
    if (typeof k !== 'string') return n[k];
    if (MU_EV[k]) return cb => n.onPluginMain(e => { if (e.id === MU_ID && e.name === MU_EV[k]) cb(e.data); });
    const m = /^music([A-Z]\w*)$/.exec(k);
    return m ? (...a) => n.pluginMain(MU_ID, 'music:' + (m[1] === 'ImportMuPlayer' ? 'pickMuPlayer' : m[1][0].toLowerCase() + m[1].slice(1)), ...a) : n[k];
  } });
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx } = host;
  const folder = ctx.folder;
  host.addStyle(CSS);
  view.innerHTML = HTML;
  pxSkin(view.querySelector('.appWrap'), { title: 'NEOTHA', T: { k: '#020914', k2: '#06142a', fill: '#0a1a33', fillOn: '#0f2a4a', hl: '#143457', line: '#1f4a75', acc: '#3fe0ff', accL: '#b5f6ff', accS: '#1a7fa3', accD: '#0b3a52',
    rivet: '#e6fdff', btn: '#14365e', btnHi: '#2a6aa8', btnLo: '#0a1f3a', btnHov: '#1c4a80', btnHovHi: '#3f8ad0', text: '#e9f8ff', muted: '#7fa9cc', acc2: '#ff6ad5', gold: '#ffe066',
    orange: '#ff9a3c', red: '#ff4f6a', green: '#5ef0a8', green2: '#1f9a64', bg: '#040c1c', bgDot: '#123058', bgDot2: '#0b1d3a', spark: '#1f5a8a', spark2: '#b5f6ff',
    tile: ['................', '..:.............', '................', '.........x......', '................', '.....+..........', '................', '...............:',
      '................', '................', '.x..........*...', '................', '................', '.......:........', '................', '.............+..'] }, emblem: ['.....kkkkk.....', '...kkaaaaakk...', '..kaa.....aak..', '.ka..bbbbb..ak.', '.ka.b.....b.ak.', 'ka.b..www..b.ak', 'ka.b.w...w.b.ak', 'ka.b.w.g.w.b.ak', 'ka.b.w...w.b.ak', 'ka.b..www..b.ak', '.ka.b.....b.ak.', '.ka..bbbbb..ak.', '..kaa.....aak..', '...kkaaaaakk...', '.....kkkkk.....'],
    icons: [[/^PLEIN/, 'full'], [/^IMPORTER/, 'folder'], [/^CRÉER/, 'plus'],
    [/^CHANSONS/, 'note'], [/^MES MUSIQUES/, 'folder'], [/^Volume/, 'vol'], [/^Décalage/, 'clock'], [/^Curseur/, 'cursor'], [/^Difficulté/, 'star']] });
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
function gameText(g, w, lines, y0) {  // lignes centrées en police pixel, sur une bande sombre
  g.fillStyle = 'rgba(11,3,28,.72)'; g.fillRect(0, y0 - 14, w, lines.length * 14 + 14);
  lines.forEach(([text, color, size], i) => PXK.fill(g, text, w / 2, y0 + i * 14, color, PXK.scale(size), 'center'));
}
const px = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
function sprite(g, rows, x, y, pal) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(g, c, x + i, y + j); } }); }
  // ---- ton code d'origine ----
const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pxFont = (g, text, x, y, color, size = 8, align = 'left') => { const s = PXK.scale(size); PXK.fill(g, text, x + s, y + s, '#05010b', s, align); PXK.fill(g, text, x, y, color, s, align); };

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
async function rhAnalyse(buf) {
  const Y = () => new Promise(r => setTimeout(r, 0));  // on rend la main à l'écran pendant l'analyse
  const k = Math.max(1, Math.round(buf.sampleRate / 11025)), sr = buf.sampleRate / k, chs = Array.from({length: buf.numberOfChannels}, (_, c) => buf.getChannelData(c));
  const n = Math.floor(buf.length / k), x = new Float32Array(n);
  for (let i = 0; i < n; i++) { if (i % 400000 === 399999) await Y(); let s = 0; for (const ch of chs) for (let j = 0; j < k; j++) s += ch[i * k + j]; x[i] = s / (k * chs.length); }
  const N = 512, H = 128, fps = sr / H, F = Math.max(0, Math.floor((n - N) / H)), hz = sr / N;
  const edges = [30, 150, 500, 2000, 5000].map(f => Math.max(1, Math.min(N / 2, Math.round(f / hz))));
  const win = Float32Array.from({length: N}, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / (N - 1)));
  const flux = new Float32Array(F), band = [0, 1, 2, 3].map(() => new Float32Array(F)), rms = new Float32Array(F), re = new Float32Array(N), im = new Float32Array(N);
  let prev = new Float32Array(N / 2), cur = new Float32Array(N / 2);
  for (let f = 0; f < F; f++) {
    if (f % 250 === 249) await Y();
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
const rhTier = d => { const n = /^S\d+$/.test(d) ? +d.slice(1) : 0; return n ? (n <= 2 ? 'facile' : n <= 4 ? 'normal' : n <= 7 ? 'difficile' : 'expert') : d; };
function rhChartImport(a, diff) {  // diff : facile…expert, ou « S5 » = niveau à 5 étoiles
  const S = /^S\d+$/.test(diff) ? +diff.slice(1) : 0, D = rhTier(diff);
  const sub = S ? (S <= 2 ? 1 : S <= 5 ? 2 : 4) : {facile: 1, normal: 2, difficile: 4, expert: 4}[diff], nps = S ? [1, 1.5, 2.1, 2.8, 3.5, 4.3, 5.1, 6, 7, 8][S - 1] : {facile: 1.1, normal: 2, difficile: 3.1, expert: 4.4}[diff], gap = S ? Math.max(.09, Math.min(.42, .5 - S * .04)) : {facile: .42, normal: .24, difficile: .14, expert: .1}[diff];
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
    const next = picked[i + 1]?.t ?? a.len, room = next - c.t, f2 = Math.round(c.f + a.fps * a.beat), held = a.rms[f2] >= a.rms[c.f] * .4;
    const need = D === 'facile' ? 1.4 : 1.1, len = (D !== 'expert' || room >= a.beat * 2) && room >= a.beat * need && (held || room >= a.beat * 1.8) ? Math.min(room - a.beat * .3, a.beat * 3) * .9 : 0;
    notes.push({t: c.t, lane, len});
    if (D === 'expert' && c.s >= strong) notes.push({t: c.t, lane: (lane + 2) % 4, len: 0});
    last = lane; lastT = c.t;
  });
  return notes.map(n => ({...n, judged: false, held: false}));
}
const rhImports = () => gstore('neothaImports', []);
const rhAnalysed = new Map();  // id -> {a, buffer}, for this session (recomputed from the sound: same notes on every PC)
async function rhLoadImport(imp) {
  if (rhAnalysed.has(imp.id)) return rhAnalysed.get(imp.id);
  const has = imp.file && (await neo.musicExists([imp.file]))[imp.file];
  const src = has ? 'neoplugin://neodex.music/file/' + encodeURIComponent(imp.file) : imp.url ? 'neoplugin://neodex.music/stream/?u=' + encodeURIComponent(imp.url) : '';
  if (!src) throw new Error('le fichier de cette musique n\'est pas sur ce PC');
  rhAudio(); toast('Analyse de la musique…');
  const buffer = await rhCtx.decodeAudioData(await neo.musicBuffer(src)), a = await rhAnalyse(buffer), r = {a, buffer};
  rhAnalysed.set(imp.id, r);
  if (imp.bpm !== a.bpm || !imp.len) { imp.bpm = a.bpm; imp.len = Math.round(a.len); saveGames(); }
  return r;
}
async function rhAddImport(imp) {
  const list = rhImports();
  const old = list.find(x => x.id === imp.id); if (old) old.stars = imp.stars; else list.push(imp);
  saveGames(); rhTab = 'mine'; rhList();
  $('rhImpMsg').textContent = 'Analyse de « ' + imp.name + ' »…';
  try { const {a} = await rhLoadImport(imp); $('rhImpMsg').textContent = '« ' + imp.name + ' » : ' + a.bpm + ' BPM, niveaux prêts.'; await rhSelect(imp.id, imp.stars ? 'S' + imp.stars : 'normal'); }
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
function rhSound(e, when, c = rhCtx, out = rhOut) {
  const g = c.createGain(); g.connect(out);
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
// le morceau est « cuit » d'avance en un seul son (hors temps réel) : plus aucun instrument à créer pendant la partie, donc plus de saccades
const rhRendered = new Map();
async function rhRenderSong(i, c) {  // synthèse faite à la main dans un tableau (le moteur audio hors temps réel mettait plus de 20 s)
  if (rhRendered.has(i)) return rhRendered.get(i);
  toast('Préparation du niveau…'); await new Promise(r => setTimeout(r, 40));
  rhAudio();
  const R = 44100, N = Math.ceil((c.len + 1.5) * R), out = new Float32Array(N), nz = rhNoise.getChannelData(0), TAU = 2 * Math.PI;
  const biquad = (type, f) => { const w = TAU * f / R, al = Math.sin(w) / 2, cw = Math.cos(w), a0 = 1 + al, b = type === 'hp' ? [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2] : [al, 0, -al]; return {b0: b[0] / a0, b1: b[1] / a0, b2: b[2] / a0, a1: -2 * cw / a0, a2: (1 - al) / a0}; };
  const HP = biquad('hp', 7000), BP = biquad('bp', 1800), expo = (a, t, T) => a * Math.pow(.0001 / a, t / T);
  for (const e of c.events) {
    const s0 = Math.floor(e.t * R); if (s0 >= N) continue;
    if (e.k === 'kick') {
      let ph = 0; const L = Math.min(N - s0, Math.floor(.25 * R)), v = .9 * e.v;
      for (let n = 0; n < L; n++) { const t = n / R, f = 150 * Math.pow(40 / 150, Math.min(t, .12) / .12); ph += TAU * f / R; out[s0 + n] += Math.sin(ph) * (t < .002 ? v * t / .002 : expo(v, t - .002, .218)); }
    } else if (e.k === 'snare' || e.k === 'hat') {
      const hat = e.k === 'hat', q = hat ? HP : BP, d = hat ? .045 : .17, v = (hat ? .25 : .55) * e.v, L = Math.min(N - s0, Math.floor((d + .02) * R));
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0, o = Math.floor(Math.random() * nz.length * .5);
      for (let n = 0; n < L; n++) { const t = n / R, x = nz[(o + n) % nz.length], y = q.b0 * x + q.b1 * x1 + q.b2 * x2 - q.a1 * y1 - q.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; out[s0 + n] += y * (t < .001 ? v * t / .001 : t < d ? expo(v, t - .001, d - .001) : 0); }
    } else {
      const lead = e.k === 'lead', w = lead ? e.w || 'square' : 'triangle', v1 = e.v * (lead ? .55 : 1), v2 = e.v * (lead ? .4 : .7), tm = Math.min(e.d, .08), T = e.d + .04, L = Math.min(N - s0, Math.floor((e.d + .06) * R)), inc = e.f / R;
      let ph = 0;
      for (let n = 0; n < L; n++) {
        const t = n / R; ph += inc; if (ph >= 1) ph -= 1;
        const s = w === 'square' ? (ph < .5 ? 1 : -1) : w === 'sawtooth' ? 2 * ph - 1 : w === 'sine' ? Math.sin(TAU * ph) : 1 - 4 * Math.abs(ph - .5);
        out[s0 + n] += s * (t < .006 ? v1 * t / .006 : t < tm ? v1 : t < T ? expo(v2, t - tm, T - tm) : 0);
      }
    }
  }
  for (let n = 0; n < N; n++) out[n] = Math.max(-1, Math.min(1, out[n] * .6));
  const buf = rhCtx.createBuffer(1, N, R); buf.copyToChannel(out, 0); rhRendered.set(i, buf); return buf;
}
let rhTok = 0;
// i: index of a song of the game, or the id of an imported music
async function rhSelect(i, diff) {
  let info, c, notes; const tok = ++rhTok;
  if (typeof i === 'number') { const song = RH_SONGS[i] || RH_SONGS[0]; c = rhCompose(song); notes = rhChart(c, diff); info = {name: song.name, bpm: song.bpm, key: 'rh' + RH_SONGS.indexOf(song) + diff};
    const buffer = await rhRenderSong(RH_SONGS.indexOf(song), c); c = {events: [], lead: [], len: c.len, step: c.step, buffer}; }
  else {
    const imp = rhImports().find(x => x.id === i); if (!imp) return rhSelect(0, diff);
    const {a, buffer} = await rhLoadImport(imp);
    c = {events: [], lead: [], len: a.len, step: a.beat / 4, buffer}; notes = rhChartImport(a, diff); info = {name: imp.name, bpm: a.bpm, key: 'rhx' + imp.id + diff};
  }
  notes = thLayout(thStreams(notes, c, diff), info.name.length * 977 + Math.round(info.bpm * 10));
  if (tok !== rhTok) return;  // un autre niveau a été choisi entre-temps
  const stars = /^S\d+$/.test(diff) ? +diff.slice(1) : Math.max(1, Math.min(10, Math.round(notes.length / Math.max(30, c.len) * 1.25) + (diff === 'expert' ? 1 : 0)));  // la vitesse des notes dépend du niveau : rapide jusqu'à 2★, très rapide au-delà
  try { rh?.src?.stop(); } catch {}
  rh = rh || {raf: 0};
  Object.assign(rh, {g: $('rhCanvas').getContext('2d', {alpha: false, desynchronized: true}), mode: 'ready', stars, speed: stars > 2 ? 3.2 : 2.6, tick: 0, song: i, diff, c, info, notes, src: null, ev: 0, t0: 0, score: 0, combo: 0, maxCombo: 0, counts: {PARFAIT: 0, BIEN: 0, OK: 0, RATÉ: 0}, judge: null, mx: 192, my: 112, vx: 192, vy: 112, trail: [], cp: 0, cm: 0, fx: [], i0: 0, bg: null, rect: null, sparks: [], done: false});
  games.neothaLast = {song: i, diff}; rhList();
  gameLoop(rh, 'neodex:neotha', rhUpdate, rhDraw);
}
let rhOffMs = 0;
const rhLatency = () => (rhCtx?.outputLatency || 0) + (rhCtx?.baseLatency || 0) + rhOffMs / 1000;
// l'horloge audio n'avance que par paquets (~10 ms sous Windows) : sur un écran à 144 ou 165 Hz, elle reste figée une image sur trois
// et les notes avancent par à-coups. On la prolonge avec l'horloge de l'écran entre deux paquets (jamais de plus de 50 ms, jamais en arrière).
const rhCk = {ct: -1, pt: 0, out: 0};
function rhTime() {
  const t = rhCtx.currentTime, p = performance.now();
  if (t !== rhCk.ct) { rhCk.ct = t; rhCk.pt = p; }
  const v = rhCtx.state === 'running' ? t + Math.min(.05, (p - rhCk.pt) / 1000) : t;
  rhCk.out = v < rhCk.out && rhCk.out - v < .06 ? rhCk.out : v;  // un paquet arrivé un peu tôt ne fait pas reculer les notes
  return rhCk.out;
}
const rhNow = () => rhTime() - rh.t0 - rhLatency();
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
/* ---------- NeoTha : gameplay à la Rhythia — des notes creuses arrivent du fond d'un tunnel, positions libres dans un champ 3×3, séries (streams) et sauts ; on les touche avec le curseur ---------- */
const TH = {W: 384, H: 216, CX: 192, CY: 112, K: 46, HALF: 16, LIM: 1.2, DEPTH: 6, PAD: [.035, .12], COL: ['#7fe0ee', '#ff5ad9']};
const thClamp = (v, a, b) => Math.max(a, Math.min(b, v));
function thStreams(notes, c, diff) {  // une note tenue devient une série de notes rapides (à la double-croche en difficile/expert)
  const iv = c.step * {facile: 0, normal: 2, difficile: 1, expert: 1}[rhTier(diff)], out = [];
  for (const n of notes) { out.push(n); if (iv && n.len > iv * 2.5) for (let t = n.t + iv; t < n.t + n.len - iv * .3; t += iv) out.push({...n, t, len: 0, judged: false, held: false, stream: true}); }
  return out.sort((a, b) => a.t - b.t);
}
function thLayout(notes, seed) {  // positions libres, par phrases (deux notes en même temps : côte à côte) : cercle, arc, ligne qui rebondit, zigzag, triangle ou aller-retour ; une même phrase de la musique donne toujours le même motif
  const B = TH.LIM, slots = [], phrases = [], out = [], tri = x => { const m = ((x % 2) + 2) % 2; return m > 1 ? 2 - m : m; };
  for (const n of notes) { const l = slots.at(-1); if (l && n.t - l[0].t < .04) l.push(n); else slots.push([n]); }
  let cur = null; for (const s of slots) { if (cur && s[0].t - cur.at(-1)[0].t <= .5) cur.push(s); else phrases.push(cur = [s]); }
  let ex = 0, ey = 0, lastT = -9, idx = 0;
  for (const p of phrases) {
    const n = p.length, span = p.at(-1)[0].t - p[0][0].t, r = seeded((n * 131 + Math.round(span * 10) * 17 + p[0][0].lane * 7 + (seed | 0)) | 0);
    const gap = n > 1 ? span / (n - 1) : .5, sp = thClamp(gap * 1.5, .24, .85), dense = gap < .2;
    const kinds = dense ? ['circle', 'line', 'arc', 'zig'] : n < 3 ? ['jump'] : ['circle', 'line', 'arc', 'zig', 'jump', 'tri'];
    const kind = kinds[Math.floor(r() * kinds.length)], a0 = r() * 6.283, dir = r() < .5 ? -1 : 1, R = .45 + r() * .45, m = 3 + (r() < .4 ? 1 : 0), pts = [];
    const A = [Math.cos(a0) * .85, Math.sin(a0) * .85], Bp = [-A[0] * (.8 + r() * .4), -A[1] * (.8 + r() * .4)], C = [-Math.sin(a0) * .9, Math.cos(a0) * .9], triple = r() < .3;
    for (let k = 0; k < n; k++) {
      if (kind === 'circle') { const th = a0 + dir * k * sp / R; pts.push([Math.cos(th) * R, Math.sin(th) * R]); }
      else if (kind === 'arc') { const th = a0 + dir * Math.PI * (n > 1 ? k / (n - 1) : 0) * thClamp(sp * (n - 1) / 2.8, .4, 1); pts.push([Math.cos(th) * .9, Math.sin(th) * .9]); }
      else if (kind === 'line' || kind === 'zig') { const s = 2 * tri(k * sp / 2) - 1, o = kind === 'zig' ? (k & 1 ? .4 : -.4) : 0; pts.push([Math.cos(a0) * s - Math.sin(a0) * o, Math.sin(a0) * s + Math.cos(a0) * o]); }
      else if (kind === 'tri') { const th = a0 + 6.283 * (k % m) / m; pts.push([Math.cos(th) * .9, Math.sin(th) * .9]); }
      else pts.push(triple && k % 3 === 2 ? C : k & 1 ? Bp : A);
    }
    for (let k = 1; k < n; k++) {  // jamais plus loin que ce que la souris peut parcourir entre deux notes
      const dx = pts[k][0] - pts[k - 1][0], dy = pts[k][1] - pts[k - 1][1], d = Math.hypot(dx, dy), mx = .3 + (p[k][0].t - p[k - 1][0].t) * 5.5;
      if (d > mx) pts[k] = [pts[k - 1][0] + dx / d * mx, pts[k - 1][1] + dy / d * mx];
    }
    let x0 = 9, x1 = -9, y0 = 9, y1 = -9; for (const q of pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const sc = Math.min(1, 2 * B / Math.max(x1 - x0, y1 - y0, 1e-6)), jd = Math.min(1.6, .6 + (p[0][0].t - lastT) * 1.4), ja = r() * 6.283;
    const tx = thClamp(ex + Math.cos(ja) * jd - pts[0][0] * sc, -B - x0 * sc, B - x1 * sc), ty = thClamp(ey + Math.sin(ja) * jd - pts[0][1] * sc, -B - y0 * sc, B - y1 * sc);
    p.forEach((slot, k) => {
      const x = pts[k][0] * sc + tx, y = pts[k][1] * sc + ty;
      slot.forEach((nt, j) => out.push({...nt, len: 0, col: TH.COL[idx++ & 1], u: j ? x + (x > 0 ? -.55 : .55) * j : x, v: y}));
    });
    ex = pts[n - 1][0] * sc + tx; ey = pts[n - 1][1] * sc + ty; lastT = p.at(-1)[0].t;
  }
  return out;
}
function thSfx(kind) {  // le « pop » d'une note touchée (plus aigu quand c'est précis), un son sourd si elle est ratée
  if (!rhCtx || !rhOut) return;
  const c = rhCtx, t = c.currentTime, g = c.createGain(), o = c.createOscillator(); g.connect(rhOut); o.connect(g);
  if (kind === 'miss') { if (t - (rh.lastMiss || 0) < .12) return; rh.lastMiss = t; o.type = 'triangle'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(55, t + .13); g.gain.setValueAtTime(.4, t); g.gain.exponentialRampToValueAtTime(.0001, t + .15); o.start(t); o.stop(t + .16); return; }
  const f = 1700;
  o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .6, t + .06); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.0001, t + .07); o.start(t); o.stop(t + .08);
  const n = c.createBufferSource(), fl = c.createBiquadFilter(), g2 = c.createGain(); n.buffer = rhNoise; fl.type = 'highpass'; fl.frequency.value = 5000; g2.gain.setValueAtTime(.3, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .03);
  n.connect(fl).connect(g2).connect(rhOut); n.start(t, Math.random() * .5); n.stop(t + .04);
}
let thBg = null;
const thPos = n => [TH.CX + n.u * TH.K, TH.CY + n.v * TH.K];
function rhJudge(n) {  // la note est touchée : réussie, sans nuance
  n.judged = true; rh.combo++; rh.maxCombo = Math.max(rh.maxCombo, rh.combo); rh.counts.PARFAIT++;
  rh.score += Math.round(300 * (1 + Math.min(rh.combo, 100) / 100));
  rh.judge = {text: 'RÉUSSI', color: '#8ee8a0', t: 30}; thSfx('hit'); rh.cp = 1;
  const [x, y] = thPos(n); rh.fx.push({x, y, col: n.col, t: 0, hit: true});
  for (let i = 0; i < 6; i++) rh.sparks.push({x, y, vx: (Math.random() - .5) * 2.5, vy: (Math.random() - .5) * 2.5, life: 16, color: n.col});
}
function rhMiss(n) { n.judged = true; n.missed = true; rh.combo = 0; rh.cm = 1; rh.counts['RATÉ']++; rh.judge = {text: 'RATÉ', color: '#ff4f6d', t: 30}; thSfx('miss'); const [x, y] = thPos(n); rh.fx.push({x, y, col: '#ff4f6d', t: 0, hit: false}); }
function rhUpdate() {
  const now = rhNow(), ahead = rhCtx.currentTime + .15;
  while (rh.ev < rh.c.events.length && rh.t0 + rh.c.events[rh.ev].t < ahead) { const e = rh.c.events[rh.ev++], when = rh.t0 + e.t; if (when >= rhCtx.currentTime - .02) rhSound(e, Math.max(when, rhCtx.currentTime)); }
  while (rh.i0 < rh.notes.length && rh.notes[rh.i0].judged) rh.i0++;
  for (let q = rh.i0; q < rh.notes.length; q++) {
    const n = rh.notes[q]; if (now < n.t - TH.PAD[0]) break; if (n.judged) continue;
    const [x, y] = thPos(n), dx = Math.abs(rh.mx - x), dy = Math.abs(rh.my - y);
    if (dx <= TH.HALF && dy <= TH.HALF) rhJudge(n);
    else if (now > n.t + TH.PAD[1]) rhMiss(n);
  }
  for (const s of rh.sparks) { s.x += s.vx; s.y += s.vy; s.life--; } rh.sparks = rh.sparks.filter(s => s.life > 0);
  for (const f of rh.fx) f.t++; rh.fx = rh.fx.filter(f => f.t < 16);
  rh.trail.push([rh.mx, rh.my]); if (rh.trail.length > 16) rh.trail.shift(); rh.cp *= .86; rh.cm *= .86;
  if (rh.judge && --rh.judge.t <= 0) rh.judge = null;
  if (now > rh.c.len + 1.5) {
    rh.mode = 'over'; try { rh.src?.stop(); } catch {} try { if (document.fullscreenElement) document.exitFullscreen(); } catch {} try { document.exitPointerLock(); } catch {}
    const n = rh.notes.length, acc = n ? rh.counts.PARFAIT / n : 0;
    rh.acc = acc; rh.grade = acc >= .95 ? 'S' : acc >= .9 ? 'A' : acc >= .8 ? 'B' : acc >= .7 ? 'C' : 'D';
    const k = rh.info.key, res = gstore('neotha', {}); rh.record = best(k, rh.score);
    if (rh.record || !res[k]) res[k] = {score: rh.score, acc: Math.round(acc * 1000) / 10, grade: rh.grade, combo: rh.maxCombo};
    saveGames(); sfx('SAB'.includes(rh.grade) ? 'launch' : 'notify'); rhList();
  }
}
function thSquare(g, x, y, h, col, alpha, lw) {  // un carré creux lumineux
  g.globalAlpha = alpha * .25; g.strokeStyle = col; g.lineWidth = lw + 3; g.strokeRect(x - h, y - h, h * 2, h * 2);  // halo sans shadowBlur (trop lent)
  g.globalAlpha = alpha; g.lineWidth = lw; g.strokeRect(x - h, y - h, h * 2, h * 2);
  g.globalAlpha = alpha * .12; g.fillStyle = col; g.fillRect(x - h, y - h, h * 2, h * 2); g.globalAlpha = 1;
}
function rhDraw() {
  const g = rh.g, {W, H, CX, CY, K, HALF, DEPTH} = TH, now = rhCtx && rh.mode !== 'ready' ? rhNow() : -2, appr = 2.4 / rh.speed;
  // la caméra suit doucement le curseur, à chaque image (et pas 60 fois par seconde : à 165 Hz, le tunnel tremblerait)
  const pn = performance.now(), dt = Math.min(.1, (pn - (rh.camT || pn)) / 1000), k = rh.mode === 'play' ? 1 - Math.pow(.92, dt * 60) : 0; rh.camT = pn;
  rh.vx += (TH.CX + (rh.mx - TH.CX) * .3 - rh.vx) * k; rh.vy += (TH.CY + (rh.my - TH.CY) * .3 - rh.vy) * k;
  const beat = 60 / rh.info.bpm, pulse = now > 0 ? Math.max(0, 1 - (now % beat) / beat * 2) : 0, VX = rh.vx, VY = rh.vy, t = now > 0 ? now : 0;
  const cv = g.canvas, tw = Math.min(2560, Math.round((cv.clientWidth || 768) * Math.min(2, devicePixelRatio || 1)));
  if (tw > 200 && Math.abs(cv.width - tw) > 8) { cv.width = tw; cv.height = Math.round(tw * H / W); thBg = null; }  // net à toutes les tailles, plein écran compris
  g.setTransform(cv.width / W, 0, 0, cv.width / W, 0, 0); g.lineJoin = 'round'; g.imageSmoothingEnabled = false;
  if (!thBg) { thBg = document.createElement('canvas'); thBg.width = g.canvas.width; thBg.height = g.canvas.height; const b = thBg.getContext('2d'), gr = b.createRadialGradient(thBg.width / 2, thBg.height * .52, 20, thBg.width / 2, thBg.height * .52, thBg.width * .68); gr.addColorStop(0, '#1c0b40'); gr.addColorStop(.55, '#0b0420'); gr.addColorStop(1, '#020007'); b.fillStyle = gr; b.fillRect(0, 0, thBg.width, thBg.height); }
  g.drawImage(thBg, 0, 0, W, H);  // fond préparé une fois
  if (pulse > 0) { g.globalAlpha = pulse * .07; g.fillStyle = '#ff5ad9'; g.fillRect(VX - 2 * K, VY - 1.2 * K, 4 * K, 2.4 * K); g.globalAlpha = 1; }
  // tunnel : des cadres qui viennent vers toi et des traînées d'étoiles, au rythme de la musique
  for (let k = 0; k < 7; k++) {
    const ph = (((k / 7 - t * .3) % 1) + 1) % 1, s = 1 / (1 + ph * DEPTH * 1.6), h = 2 * K * s * 1.8;
    g.strokeStyle = `rgba(${k % 2 ? '120,100,230' : '255,90,217'},${(1 - ph) * (.1 + pulse * .12)})`; g.lineWidth = .6 + s; g.strokeRect(VX - h * 1.6, VY - h * .9, h * 3.2, h * 1.8);
  }
  for (let i = 0; i < 20; i++) {
    const a = i * 2.399, ph = (((i * .173 - t * .5) % 1) + 1) % 1, r0 = ph * ph * 280, r1 = r0 + ph * 22;
    g.strokeStyle = `rgba(217,198,255,${ph * .45})`; g.lineWidth = .7; g.beginPath(); g.moveTo(VX + Math.cos(a) * r0, VY + Math.sin(a) * r0 * .6); g.lineTo(VX + Math.cos(a) * r1, VY + Math.sin(a) * r1 * .6); g.stroke();
  }
  // le champ de jeu : quatre coins et un repère au centre (pas de cases)
  g.strokeStyle = `rgba(217,198,255,${.28 + pulse * .3})`; g.lineWidth = 1; const F = 1.45 * K;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.moveTo(CX + sx * F, CY + sy * (F - 12)); g.lineTo(CX + sx * F, CY + sy * F); g.lineTo(CX + sx * (F - 12), CY + sy * F); g.stroke(); }
  // les notes, du fond vers l'avant ; une note ratée continue sa route et s'efface
  while (rh.i0 < rh.notes.length && rh.notes[rh.i0].judged) rh.i0++;
  let i1 = rh.i0; while (i1 < rh.notes.length && rh.notes[i1].t - now < appr) i1++;
  for (let q = i1 - 1; q >= rh.i0; q--) {  // du fond vers l'avant, sans trier ni filtrer toute la liste
    const n = rh.notes[q]; if (n.judged || n.t - now < -.2) continue;
    const z = Math.max(0, (n.t - now) / appr), s = 1 / (1 + z * DEPTH), [x, y] = thPos(n), px0 = VX + (x - VX) * s, py0 = VY + (y - VY) * s;
    if (z < .4) { g.globalAlpha = (1 - z / .4) * .35; g.strokeStyle = n.col; g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeRect(x - HALF, y - HALF, HALF * 2, HALF * 2); g.setLineDash([]); g.globalAlpha = 1; }  // où elle va arriver
    thSquare(g, px0, py0, HALF * s, n.col, Math.min(1, (1 - z) * 3), 1 + 1.4 * s);
    if (z < .15) thSquare(g, px0, py0, HALF * s * .55, '#ffffff', 1 - z / .15, 1);  // elle s'allume au moment de la toucher
    if (s > .5) px(g, '#ffffff', px0 - 1, py0 - 1, 2, 2);
  }
  for (const f of rh.fx) { const k = f.t / 16, h = HALF * (1 + k * (f.hit ? .9 : .5)); thSquare(g, f.x, f.y, h, f.hit ? '#ffffff' : f.col, 1 - k, 2 - k * 1.5); if (f.hit) thSquare(g, f.x, f.y, h * .6, f.col, (1 - k) * .8, 1); }
  for (const s of rh.sparks) { g.globalAlpha = s.life / 16; px(g, s.color, s.x, s.y, 2, 2); g.globalAlpha = 1; }
  // le curseur : un réticule (anneau, quatre repères, point central, halo) qui tourne doucement ; il pulse sur une note touchée et devient rouge sur un raté
  const T = rh.trail; g.lineCap = 'round';
  for (let k = 1; k < T.length; k++) { const q = k / T.length; g.strokeStyle = `rgba(255,160,235,${q * .55})`; g.lineWidth = .6 + q * 3.2; g.beginPath(); g.moveTo(T[k - 1][0], T[k - 1][1]); g.lineTo(T[k][0], T[k][1]); g.stroke(); }
  g.lineCap = 'butt';
  const cc = rh.cm > .05 ? '#ff4f6d' : '#ffffff', mx = rh.mx, my = rh.my, pu = rh.cp * 2;  // trois styles au choix (Options)
  if (thCurStyle === 'square') { px(g, 'rgba(255,90,217,.9)', mx - 4, my - 4, 8, 8); g.fillStyle = cc; g.fillRect(mx - 3, my - 3, 6, 6); }
  else if (thCurStyle === 'ring') { g.strokeStyle = cc; g.lineWidth = 1.5; g.beginPath(); g.arc(mx, my, 5 + pu, 0, 6.283); g.stroke(); g.fillStyle = cc; g.beginPath(); g.arc(mx, my, 1.4, 0, 6.283); g.fill(); }
  else { g.fillStyle = cc; g.beginPath(); g.arc(mx, my, 3.2 + pu * .6, 0, 6.283); g.fill(); g.strokeStyle = 'rgba(255,90,217,.9)'; g.lineWidth = 1.2; g.stroke(); }
  // interface
  g.fillStyle = 'rgba(11,3,28,.7)'; g.fillRect(0, 0, W, 16);
  pxFont(g, String(rh.score).padStart(7, '0'), 4, 11, '#ffffff', 7);
  const title = rh.info.name.length > 30 ? rh.info.name.slice(0, 29) + '…' : rh.info.name;
  pxFont(g, title, W - 4, 11, '#d9c6ff', 6, 'right');
  const done = rh.counts.PARFAIT + rh.counts.BIEN + rh.counts.OK + rh.counts['RATÉ'], acc = done ? rh.counts.PARFAIT / done : 1;
  pxFont(g, (acc * 100).toFixed(1) + '%', W / 2, 11, '#8f7bb8', 6, 'center');
  px(g, '#2a1d52', 0, 16, W, 2); px(g, '#ff5ad9', 0, 16, thClamp(now / rh.c.len, 0, 1) * W, 2);
  if (rh.combo >= 5) pxFont(g, rh.combo + 'x', CX, 200, '#ffffff', 10 + Math.min(4, rh.combo / 40) + pulse * 2, 'center');
  if (rh.judge) pxFont(g, rh.judge.text, CX, 36 - (30 - rh.judge.t) / 6, rh.judge.color, 8, 'center');
  if (rh.mode === 'play' && now < 0) pxFont(g, String(Math.ceil(-now)), CX, 40, '#ffd07a', 16, 'center');
  if (rh.mode === 'ready') gameText(g, W, [[title.toUpperCase(), '#ff5ad9', 8], [(RH_DIFFS[rh.diff] || 'Perso') + ' · ' + rh.stars + '★ · ' + rh.notes.length + ' notes', '#d9c6ff'], ['Espace ou clic : jouer', '#ffd07a'], ['Bouge la souris sur les notes', '#8f7bb8']], 90);
  if (rh.mode === 'pause') gameText(g, W, [['PAUSE', '#ffffff', 12], ['Espace ou clic : reprendre', '#d9c6ff']], 100);
  if (rh.mode === 'over') gameText(g, W, [['NOTE ' + rh.grade, rh.grade === 'S' ? '#ffd07a' : '#ff5ad9', 14], [rh.score + ' points', '#ffffff'], ['Précision ' + (rh.acc * 100).toFixed(1) + ' %', '#d9c6ff'], ['Combo max ' + rh.maxCombo, '#d9c6ff'], [rh.counts.PARFAIT + ' réussies · ' + rh.counts['RATÉ'] + ' ratées', '#8f7bb8'], [rh.record ? 'NOUVEAU RECORD !' : 'Espace : rejouer', '#ffd07a']], 60);
}

function rhDiffRow(key, sel, play, imp) {
  const res = games?.neotha || {}, row = el('div', 'row');
  if (imp?.stars) { const d = 'S' + imp.stars, r = res[key + d], b = el('button', 'btn px' + (sel && rh?.diff === d ? ' main' : ''), 'JOUER · ' + imp.stars + '★' + (r ? ' · ' + r.grade : '')); if (r) b.title = r.score + ' points · ' + r.acc + ' % · combo ' + r.combo; b.onclick = () => play(d); row.append(b); return row; }
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
    c.append(x, el('b', '', imp.name), el('span', 'hint', (imp.bpm ? imp.bpm + ' BPM · ' + clock(imp.len || 0) : 'pas encore analysée') + (imp.url ? ' · YouTube' : ' · fichier')),
      rhDiffRow('rhx' + imp.id, rh?.song === imp.id, d => { $('rhImpMsg').textContent = 'Préparation du niveau…'; rhSelect(imp.id, d).then(() => $('rhImpMsg').textContent = '', e => $('rhImpMsg').textContent = 'Impossible : ' + e.message); }, imp));
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
  try { const file = await neo.musicAddFile(await neo.pathOf(f)); rhAddImport({id: 'f:' + file, name: f.name.replace(/\.[^.]+$/, ''), file, stars: +$('rhStars').value}); }
  catch (err) { $('rhImpMsg').textContent = 'Import impossible : ' + err.message; }
};
$('rhMuBtn').onclick = () => { const t = $('rhMuList')._songs?.find(x => muId(x) === $('rhMuList').value); if (t) rhAddImport({id: muId(t), name: t.display_title || t.file, file: t.file || '', url: t.url || '', stars: +$('rhStars').value}); };
setInterval(() => { if (rhCtx?.state === 'running' && (!view.classList.contains('on') || rh?.mode !== 'play')) rhCtx.suspend(); }, 200);  // the music stops with the game
let thCurStyle = 'dot', thRect = null; for (const ev of ['resize', 'scroll', 'fullscreenchange']) addEventListener(ev, () => { thRect = null; }, true);
const thCv = () => $('rhCanvas');
const thLock = () => { try { thCv().requestPointerLock?.()?.catch?.(() => {}); } catch {} };  // comme dans Rhythia : la souris est capturée pendant la partie (Échap pour la libérer)
const thAim = e => {
  if (!rh) return; const r = thRect ||= thCv().getBoundingClientRect();
  if (document.pointerLockElement === thCv()) { rh.mx = thClamp(rh.mx + e.movementX / r.width * TH.W * 1.5, 0, TH.W); rh.my = thClamp(rh.my + e.movementY / r.width * TH.W * 1.5, 0, TH.H); }
  else { rh.mx = thClamp((e.clientX - r.left) / r.width * TH.W, 0, TH.W); rh.my = thClamp((e.clientY - r.top) / r.height * TH.H, 0, TH.H); }
};
thCv().onpointermove = thAim;
thCv().onpointerdown = e => { if (!rh) return; thRect = null; if (document.pointerLockElement !== thCv()) thAim(e); if (rh.mode !== 'play') { rhPress(); if (rh.mode === 'play') thLock(); } };
document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== thCv() && rh?.mode === 'play') { rh.mode = 'pause'; rhCtx?.suspend(); } });
document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || !view.classList.contains('on') || !rh) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === ' ') { e.preventDefault(); if (!e.repeat && rh.mode !== 'play') { rhPress(); if (rh.mode === 'play') thLock(); } }
  if (k === 'p' && rh.mode === 'play') { rh.mode = 'pause'; rhCtx?.suspend(); try { document.exitPointerLock(); } catch {} }
});

$('rhFs').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else $('rhCanvas').parentElement.requestFullscreen?.().catch(() => {}); };  // plein écran jusqu'à la fin de la partie
$('rhOffset').addEventListener('change', () => { rhOffMs = +$('rhOffset').value; });
$('thCur').addEventListener('change', () => { thCurStyle = $('thCur').value; });
$('rhVol').oninput = () => { if (rhOut) rhOut.gain.value = +$('rhVol').value / 100 * .6; };
for (const id of ['rhVol', 'rhOffset', 'thCur']) $(id).addEventListener('change', () => { gstore('neothaPrefs', {})[id] = $(id).value; saveGames(); });
function rhOpen() {
  const p = games.neothaPrefs || {}; for (const id of ['rhVol', 'rhOffset', 'thCur']) if (p[id] != null) $(id).value = p[id];
  rhOffMs = +$('rhOffset').value; thCurStyle = $('thCur').value;
  if (rh) { rhList(); return gameLoop(rh, 'neodex:neotha', rhUpdate, rhDraw); }
  const last = games.neothaLast || {song: 0, diff: 'normal'}; rhSelect(last.song, last.diff).catch(() => rhSelect(0, 'normal'));  // an imported music may be missing on this PC
}  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { rhOpen(); });
}
