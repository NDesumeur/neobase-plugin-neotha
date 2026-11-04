// lancé par le test « local » de NeoDex : plein écran, touches tapées alors que NeoDex a le clavier, puis fluidité en jeu
module.exports = async ({ pj, js, sleep }) => {
  await pj(`document.querySelector('#rhSongs .rhSong .btn')?.click(), 0`); await sleep(9000);  // un morceau intégré (son rendu prend quelques secondes)
  await pj(`document.getElementById('rhFs').click(), 0`); await sleep(1200);
  const fs = await pj(`!!document.fullscreenElement`);
  await pj(`document.exitFullscreen?.().catch(() => {}), 0`); await sleep(800);
  if (!fs) throw new Error('le plein écran ne s\'ouvre pas');
  const shot = () => pj(`(() => { const c = document.getElementById('rhCanvas'), g = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < g.length; i += 397) h = (h * 31 + g[i]) | 0; return h; })()`);
  // la page NeoDex reprend le clavier, puis espace : la partie doit démarrer quand même
  await js(`document.activeElement?.blur(), document.body.focus(), document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true })), 0`);
  await sleep(3000); const a = await shot(); await sleep(600); const b = await shot();
  if (a === b) throw new Error('espace tapé dans NeoDex n\'a pas lancé la partie');
  const muts = await pj(`new Promise(ok => { let n = 0; const o = new MutationObserver(m => { n += m.length; }); o.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true }); setTimeout(() => { o.disconnect(); ok(n); }, 2000); })`);
  if (muts > 20) throw new Error('la page change ' + muts + ' fois en 2 s pendant le jeu (le rendu en pixels repasse sur toute la page)');
  const r = await pj(`new Promise(ok => { const d = []; let l = performance.now(), n = 0; const f = t => { d.push(t - l); l = t; if (++n < 240) requestAnimationFrame(f); else ok(d); }; requestAnimationFrame(f); })`);
  const s = [...r].sort((x, y) => x - y), avg = r.reduce((x, y) => x + y, 0) / r.length, p95 = s[Math.floor(s.length * .95)], slow = r.filter(x => x > 25).length;
  if (1000 / avg < 50 || slow > 12) throw new Error('saccades : ' + Math.round(1000 / avg) + ' i/s, ' + slow + ' images lentes');
  return 'plein écran ok, souris capturée ' + await pj(`(document.getElementById('rhCanvas').requestPointerLock(), new Promise(ok => setTimeout(() => ok(!!document.pointerLockElement), 600)))`) + ', touche depuis NeoDex ok, ' + Math.round(1000 / avg) + ' i/s en jeu, 95e centile ' + p95.toFixed(1) + ' ms';
};
