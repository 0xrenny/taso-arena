import './styles.css';
import { CREATURES, ELEMENTS, RARITIES, ADVANTAGES, getCreature } from './data/creatures.js';
import { makeRng, clamp } from './logic/rng.js';
import { tasoLevel, nextLevelAt, effectiveStats, discoveredCount, pickStake, addTaso } from './logic/collection.js';
import { resolveHit, botQuality, PERFECT_THRESHOLD } from './logic/battle.js';
import { xpForNext } from './logic/progression.js';
import { leaderboard, levelFromPoints, expectedScore } from './logic/ranking.js';
import { newSave, chooseStarter, STARTERS, openPackFor, startMatch, applyMatch, slammerOf, needsFreePack, STAKE_SIZE } from './logic/game.js';
import { loadSave, writeSave, clearSave } from './logic/storage.js';
import { tasoSVG, tasoBackSVG } from './ui/art.js';
import { sfx, setSound } from './ui/audio.js';

const rng = makeRng((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
let save = loadSave() || newSave(rng);
setSound(save.settings.sound);
let screen = save.started ? 'home' : 'starter';
let battle = null;
let albumFilter = 'hepsi';

const app = document.getElementById('app');
const modalRoot = document.getElementById('modal');
const persist = () => writeSave(save);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lvlOf = (id) => tasoLevel(save.collection[id]?.total || 1);
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function taso(id, { level = 1, size = 'md', silhouette = false, cls = '' } = {}) {
  return `<div class="taso ${size} ${cls}" data-id="${id}">${tasoSVG(getCreature(id), { level, silhouette })}</div>`;
}
function flipTaso(t, cls = '') {
  return `<div class="taso stack ${cls}" data-uid="${t.uid}"><div class="taso-inner down"><div class="face front">${tasoSVG(getCreature(t.id), { level: t.level })}</div><div class="face back">${tasoBackSVG()}</div></div></div>`;
}
function statBars(id, lvl) {
  const s = effectiveStats(id, lvl);
  const row = (k, label, v, max) => `<div class="stat"><span>${label}</span><div class="bar"><i class="${k}" style="width:${Math.min(100, (v / max) * 100)}%"></i></div><b>${v}</b></div>`;
  return `<div class="stats">${row('guc', 'Güç', s.guc, 120)}${row('agirlik', 'Ağırlık', s.agirlik, 110)}${row('sans', 'Şans', s.sans, 30)}</div>`;
}
const rarityTag = (c) => `<span class="tag r-${c.rarity}">${RARITIES[c.rarity].name}</span>`;
const elementTag = (c) => `<span class="tag el" style="--c:${ELEMENTS[c.element].color}">${ELEMENTS[c.element].icon} ${ELEMENTS[c.element].name}</span>`;

/* ---------------- Ekranlar ---------------- */
function header() {
  const p = save.player;
  const need = xpForNext(p.level);
  return `<header class="topbar">
    <div class="lvl" title="Oyuncu seviyesi">Sv ${p.level}</div>
    <div class="xpbar" title="Deneyim"><i style="width:${(p.xp / need) * 100}%"></i><span>${p.xp}/${need} XP</span></div>
    <div class="chip" title="Sıralama puanı">🏆 ${p.points}</div>
    <div class="chip" title="Cips paketi">🍟 ${p.packs}</div>
  </header>`;
}
function nav() {
  const items = [['home', '🏠', 'Ana Sayfa'], ['arena', '⚔️', 'Arena'], ['album', '📒', 'Albüm'], ['ranking', '🏆', 'Sıralama']];
  return `<nav class="nav">${items.map(([s, i, l]) => `<button data-act="nav" data-screen="${s}" class="${screen === s ? 'on' : ''}"><span>${i}</span>${l}</button>`).join('')}</nav>`;
}

function starterScreen() {
  return `<section class="starter">
    <h1 class="logo">TASO<span>ARENA</span></h1>
    <p class="lead">Teneffüs zili çaldı! Cips paketlerinden çıkan tasolarla mahallenin en iyi tasocusu ol.</p>
    <h2>İlk tasonu seç</h2>
    <div class="starter-row">${STARTERS.map((id) => {
      const c = getCreature(id);
      return `<button class="starter-pick" data-act="starter" data-id="${id}">${taso(id, { size: 'lg', cls: 'float' })}<b>${c.name}</b>${elementTag(c)}<small>${esc(c.desc)}</small></button>`;
    }).join('')}</div>
  </section>`;
}

function homeScreen() {
  const p = save.player;
  const sl = getCreature(save.slammerId);
  const lv = lvlOf(sl.id);
  const free = needsFreePack(save);
  return `<section class="home">
    <h1 class="logo small">TASO<span>ARENA</span></h1>
    <div class="card slammer-card">
      ${taso(sl.id, { level: lv, size: 'lg', cls: 'spin' })}
      <div class="info">
        <div class="label">Vurucu tason</div>
        <h3>${sl.name} <small>Sv ${lv}</small></h3>
        <div class="tags">${elementTag(sl)}${rarityTag(sl)}</div>
        ${statBars(sl.id, lv)}
        <button class="btn small ghost" data-act="nav" data-screen="album">Vurucuyu değiştir</button>
      </div>
    </div>
    <button class="btn big primary" data-act="nav" data-screen="arena">⚔️ Maça Başla</button>
    <button class="btn big pack" data-act="openPack" ${p.packs ? '' : 'disabled'}>🍟 Cips Paketi Aç <b>(${p.packs})</b></button>
    ${free ? `<button class="btn big ghost" data-act="freePack">🎁 Bedava paket al</button>` : ''}
    <div class="stat-grid">
      <div><b>${p.wins}</b><span>Galibiyet</span></div>
      <div><b>${p.losses}</b><span>Mağlubiyet</span></div>
      <div><b>${p.draws}</b><span>Beraberlik</span></div>
      <div><b>${discoveredCount(save.collection)}/${CREATURES.length}</b><span>Albüm</span></div>
    </div>
    <details class="card howto">
      <summary>Nasıl oynanır?</summary>
      <ol>
        <li>İki oyuncu da ortaya ${STAKE_SIZE}'er taso koyar, tasolar ters çevrilip üst üste dizilir.</li>
        <li>Güç metresindeki ibreyi <b>yeşil bölgede</b> durdur ve vurucu tasonla yığına vur. Parlak çizgi = <b>MÜKEMMEL</b> vuruş!</li>
        <li>Yüzü yukarı dönen her taso senin olur. Rakip de sırayla vurur.</li>
        <li>Element avantajı (🔥 &gt; 🍃, 🌊 &gt; 🔥, ⚡ &gt; 🌊 …) çevirme şansını artırır. Ağır tasolar zor döner.</li>
        <li>Kazandıkça XP ve cips paketi kazan, aynı tasodan topladıkça tason seviye atlar (⭐).</li>
      </ol>
      <div class="adv">${Object.entries(ADVANTAGES).map(([a, list]) => `<span>${ELEMENTS[a].icon} ›› ${list.map((x) => ELEMENTS[x].icon).join(' ')}</span>`).join('')}</div>
    </details>
    <div class="card settings">
      <button class="btn small ghost" data-act="sound">${save.settings.sound ? '🔊 Ses: Açık' : '🔇 Ses: Kapalı'}</button>
      <button class="btn small ghost" data-act="rename">✏️ İsim: ${esc(p.name)}</button>
      <button class="btn small danger" data-act="reset">🗑️ Sıfırla</button>
    </div>
  </section>`;
}

function arenaScreen() {
  const stake = pickStake(save.collection, save.slammerId, STAKE_SIZE, () => 0.5);
  const bots = [...save.bots].sort((a, b) => a.points - b.points);
  return `<section class="arena-list">
    <h2>Rakibini seç</h2>
    <div class="card stake-preview">
      <div class="label">Ortaya koyacağın tasolar <small>(önce fazla kopyalar seçilir)</small></div>
      <div class="mini-row">${stake.length ? stake.map((id) => taso(id, { size: 'sm', level: lvlOf(id) })).join('') : '<em>Ortaya koyacak tason yok — paket aç!</em>'}</div>
    </div>
    ${bots.map((b) => {
      const lv = levelFromPoints(b.points);
      const chance = expectedScore(save.player.points, b.points);
      const diff = chance > 0.65 ? ['Kolay', 'easy'] : chance > 0.4 ? ['Dengeli', 'mid'] : chance > 0.2 ? ['Zor', 'hard'] : ['Çok zor', 'vhard'];
      return `<div class="card opp">
        ${taso(b.avatar, { size: 'sm' })}
        <div class="who"><b>${esc(b.name)}</b><small>Sv ${lv} • 🏆 ${b.points}</small></div>
        <span class="diff ${diff[1]}">${diff[0]}</span>
        <button class="btn small primary" data-act="challenge" data-bot="${b.id}" ${stake.length ? '' : 'disabled'}>Meydan oku</button>
      </div>`;
    }).join('')}
  </section>`;
}

function albumScreen() {
  const found = discoveredCount(save.collection);
  const list = CREATURES.filter((c) => albumFilter === 'hepsi' || (albumFilter === 'metal' ? c.rarity === 'metal' : c.element === albumFilter));
  return `<section class="album">
    <h2>Albüm <small>${found}/${CREATURES.length} bulundu</small></h2>
    <div class="progress"><i style="width:${(found / CREATURES.length) * 100}%"></i></div>
    <div class="filters">
      <button data-act="filter" data-f="hepsi" class="${albumFilter === 'hepsi' ? 'on' : ''}">Hepsi</button>
      ${Object.values(ELEMENTS).map((e) => `<button data-act="filter" data-f="${e.id}" class="${albumFilter === e.id ? 'on' : ''}">${e.icon} ${e.name}</button>`).join('')}
      <button data-act="filter" data-f="metal" class="${albumFilter === 'metal' ? 'on' : ''}">🛡️ Metal</button>
    </div>
    <div class="grid">${list.map((c) => {
      const e = save.collection[c.id];
      const has = e && e.total > 0;
      return `<button class="slot ${has ? '' : 'missing'} ${save.slammerId === c.id ? 'current' : ''}" data-act="detail" data-id="${c.id}">
        ${taso(c.id, { size: 'md', level: has ? tasoLevel(e.total) : 1, silhouette: !has })}
        ${has ? `<span class="count">x${e.copies}</span>` : ''}
        ${save.slammerId === c.id ? '<span class="cur">Vurucu</span>' : ''}
      </button>`;
    }).join('')}</div>
  </section>`;
}

function rankingScreen() {
  const rows = leaderboard(save.player, save.bots);
  const medal = (r) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r);
  return `<section class="ranking">
    <h2>Sıralama</h2>
    <table class="card">
      <thead><tr><th>#</th><th>Oyuncu</th><th>Sv</th><th>Puan</th><th></th></tr></thead>
      <tbody>${rows.map((r) => `<tr class="${r.isPlayer ? 'me' : ''}">
        <td class="rank">${medal(r.rank)}</td>
        <td>${esc(r.name)}${r.isPlayer && r.name !== 'Sen' ? ' <small>(sen)</small>' : ''}</td>
        <td>${r.level}</td><td><b>${r.points}</b></td>
        <td>${r.isPlayer ? '' : `<button class="btn tiny" data-act="challenge" data-bot="${r.id}">⚔️</button>`}</td>
      </tr>`).join('')}</tbody>
    </table>
    <p class="note">Sıralama bu cihazda saklanır. Rakipler yapay zekâ botlarıdır ve kendi aralarında da maç yaparlar.</p>
  </section>`;
}

function battleScreen() {
  const { bot, botLevel, match } = battle.ctx;
  const ps = getCreature(match.slammers.player.id);
  const bs = getCreature(match.slammers.bot.id);
  return `<section class="battle">
    <div class="side opp-side">
      ${taso(bs.id, { size: 'sm', level: match.slammers.bot.level })}
      <div class="who"><b>${esc(bot.name)}</b><small>Sv ${botLevel} • ${bs.name}</small></div>
      <div class="score" id="botScore">${match.won.bot.length}</div>
    </div>
    <div class="pile" id="botPile"></div>
    <div class="field" id="field">
      <div class="mat"></div>
      ${match.stack.map((t) => flipTaso(t)).join('')}
      <div class="popup" id="popup"></div>
    </div>
    <div class="pile" id="playerPile"></div>
    <div class="side me-side">
      ${taso(ps.id, { size: 'sm', level: match.slammers.player.level })}
      <div class="who"><b>${esc(save.player.name)}</b><small>Vurucu: ${ps.name}</small></div>
      <div class="score" id="playerScore">${match.won.player.length}</div>
    </div>
    <div class="turn-info"><span id="turnLabel">Sıra sende!</span><span id="turnsLeft">Kalan atış: ${match.turnsLeft}</span></div>
    <div class="meter" id="meter"><div class="zone"></div><div class="perfect"></div><div class="needle"></div></div>
    <div class="battle-actions">
      <button class="btn big primary" id="hitBtn" data-act="hit">VUR! 💥</button>
      <button class="btn small ghost" data-act="forfeit">Pes et</button>
    </div>
  </section>`;
}

function render() {
  const screens = { starter: starterScreen, home: homeScreen, arena: arenaScreen, album: albumScreen, ranking: rankingScreen, battle: battleScreen };
  const showChrome = screen !== 'starter' && screen !== 'battle';
  app.className = 'app scr-' + screen;
  app.innerHTML = (showChrome ? header() : '') + `<main class="screen">${screens[screen]()}</main>` + (showChrome ? nav() : '');
  if (screen === 'battle') setupBattle();
  window.scrollTo(0, 0);
}
function go(s) { screen = s; render(); }

/* ---------------- Modal ---------------- */
function showModal(html, cls = '') {
  modalRoot.innerHTML = `<div class="backdrop" data-act="closeModal"></div><div class="modal ${cls}">${html}</div>`;
  modalRoot.classList.add('open');
}
function closeModal() { modalRoot.classList.remove('open'); modalRoot.innerHTML = ''; }

function detailModal(id) {
  const c = getCreature(id);
  const e = save.collection[id];
  if (!e || e.total === 0) {
    showModal(`${taso(id, { size: 'xl', silhouette: true })}<h3>#${String(c.no).padStart(2, '0')} ???</h3><p>Bu taso henüz bulunmadı.</p><p class="hint">İpucu: ${ELEMENTS[c.element].icon} ${ELEMENTS[c.element].name} elementi, ${RARITIES[c.rarity].name}. Cips paketlerinde ya da rakiplerden kazanarak bulabilirsin.</p><button class="btn primary" data-act="closeModal">Tamam</button>`);
    return;
  }
  const lv = tasoLevel(e.total);
  const next = nextLevelAt(e.total);
  showModal(`${taso(id, { size: 'xl', level: lv, cls: c.rarity === 'metal' ? 'spin' : 'float' })}
    <h3>${c.name} <small>#${String(c.no).padStart(2, '0')}</small></h3>
    <div class="tags">${elementTag(c)}${rarityTag(c)}<span class="tag">Sv ${lv}</span></div>
    <p class="desc">${esc(c.desc)}</p>
    ${statBars(id, lv)}
    <p class="hint">Elinde: <b>${e.copies}</b> • Toplam bulunan: <b>${e.total}</b>${next ? ` • Sonraki seviye: ${next} kopya` : ' • Maksimum seviye!'}</p>
    <p class="hint">Güçlü olduğu: ${ADVANTAGES[c.element].map((x) => ELEMENTS[x].icon + ' ' + ELEMENTS[x].name).join(', ')}</p>
    <div class="row">
      ${save.slammerId === id ? '<span class="tag on">✔ Vurucu tason</span>' : e.copies > 0 ? `<button class="btn primary" data-act="setSlammer" data-id="${id}">Vurucu yap</button>` : '<span class="tag">Elinde kopyası yok</span>'}
      <button class="btn ghost" data-act="closeModal">Kapat</button>
    </div>`);
}

async function packModal() {
  const res = openPackFor(save, rng);
  if (!res) return;
  persist();
  const c = getCreature(res.id);
  showModal(`<div class="pack-stage">
      <div class="bag" id="bag"><div class="bag-top"></div><div class="bag-label">ÇITIR<br><b>CİPS</b><small>içinden taso çıkar!</small></div></div>
      <div class="reveal hidden" id="reveal">
        <div class="glow r-${c.rarity}"></div>
        <div class="taso xl flip-in"><div class="taso-inner"><div class="face front">${tasoSVG(c, { level: res.level })}</div><div class="face back">${tasoBackSVG()}</div></div></div>
      </div>
    </div>
    <div class="pack-info hidden" id="packInfo">
      <h3>${res.isNew ? '<span class="new">YENİ!</span> ' : ''}${c.name}</h3>
      <div class="tags">${elementTag(c)}${rarityTag(c)}</div>
      <p class="hint">${res.isNew ? 'Albümüne eklendi!' : res.leveledUp ? `Tason seviye atladı! ⭐ Sv ${res.level}` : 'Kopya eklendi.'} +${res.xp} XP${res.levels ? ` • 🎉 Seviye atladın! (Sv ${save.player.level})` : ''}</p>
      <div class="row">
        ${save.player.packs > 0 ? `<button class="btn pack" data-act="openPack">🍟 Bir tane daha (${save.player.packs})</button>` : ''}
        <button class="btn ghost" data-act="closeModal">Kapat</button>
      </div>
    </div>`, 'pack-modal');
  sfx.pack();
  await sleep(900);
  document.getElementById('bag')?.classList.add('torn');
  await sleep(350);
  document.getElementById('reveal')?.classList.remove('hidden');
  sfx.flip(0); sfx.flip(1);
  if (RARITIES[c.rarity].order >= 2) setTimeout(() => sfx.perfect(), 400);
  if (res.levels) setTimeout(() => sfx.levelUp(), 700);
  await sleep(600);
  document.getElementById('packInfo')?.classList.remove('hidden');
  if (screen === 'home') render();
}

/* ---------------- Maç ---------------- */
let meterRAF = 0;
const meter = { pos: 0, center: 0.7, running: false, t0: 0, speed: 1 };

function setupBattle() {
  const field = document.getElementById('field');
  battle.ctx.match.stack.forEach((t, depth) => {
    const el = field.querySelector(`[data-uid="${t.uid}"]`);
    const dx = (rng() - 0.5) * 14, dy = (rng() - 0.5) * 10 - depth * 5;
    const rot = (rng() - 0.5) * 30;
    el.style.zIndex = String(100 - depth);
    el.style.transform = `translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${rot}deg)`;
    el.dataset.base = el.style.transform;
  });
  newMeterTarget();
  startMeter();
}

function newMeterTarget() {
  meter.center = 0.55 + rng() * 0.3;
  meter.speed = 0.75 + Math.min(0.6, save.player.level * 0.02);
  const m = document.getElementById('meter');
  if (!m) return;
  const w = 0.4;
  m.querySelector('.zone').style.cssText = `left:${(meter.center - 0.16) * 100}%;width:${32}%`;
  const pw = (1 - PERFECT_THRESHOLD) * w;
  m.querySelector('.perfect').style.cssText = `left:${(meter.center - pw) * 100}%;width:${pw * 200}%`;
}

function startMeter() {
  meter.running = true;
  meter.t0 = performance.now();
  const needle = document.querySelector('#meter .needle');
  cancelAnimationFrame(meterRAF);
  const loop = (now) => {
    if (!meter.running) return;
    const ph = ((now - meter.t0) / 1000) * meter.speed;
    const tri = ph % 2; meter.pos = tri < 1 ? tri : 2 - tri;
    if (needle) needle.style.left = meter.pos * 100 + '%';
    meterRAF = requestAnimationFrame(loop);
  };
  meterRAF = requestAnimationFrame(loop);
}
const meterQuality = (pos) => clamp(1 - Math.abs(pos - meter.center) / 0.4, 0, 1);

function setTurnUI(text, canHit) {
  const l = document.getElementById('turnLabel'); if (l) l.textContent = text;
  const b = document.getElementById('hitBtn'); if (b) b.disabled = !canHit;
  const t = document.getElementById('turnsLeft'); if (t && battle) t.textContent = `Kalan atış: ${battle.ctx.match.turnsLeft}`;
}

function popup(text, cls = '') {
  const p = document.getElementById('popup'); if (!p) return;
  p.className = 'popup show ' + cls; p.innerHTML = text;
  p.getAnimations().forEach((a) => a.cancel());
  p.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.75 }, { transform: 'translate(-50%,-90%) scale(.9)', opacity: 0 }], { duration: 1300, easing: 'ease-out', fill: 'forwards' });
}

async function playerHit() {
  if (!battle || battle.busy || battle.ctx.match.turn !== 'player' || battle.ctx.match.over) return;
  battle.busy = true;
  meter.running = false;
  const q = meterQuality(meter.pos);
  setTurnUI('Vuruyorsun…', false);
  await doHit(q);
}

async function botTurn() {
  if (!battle) return;
  setTurnUI(`${battle.ctx.bot.name} nişan alıyor…`, false);
  newMeterTarget();
  startMeter();
  await sleep(700 + rng() * 700);
  if (!battle) return;
  meter.running = false;
  const q = botQuality(battle.ctx.botLevel, rng);
  const pos = clamp(meter.center + (rng() < 0.5 ? -1 : 1) * (1 - q) * 0.4, 0, 1);
  meter.pos = pos;
  const needle = document.querySelector('#meter .needle'); if (needle) needle.style.left = pos * 100 + '%';
  await sleep(250);
  await doHit(meterQuality(pos));
}

async function doHit(q) {
  const ctx = battle.ctx;
  const res = resolveHit(ctx.match, q, rng);
  await animateHit(res);
  if (!battle) return;
  document.getElementById('playerScore').textContent = ctx.match.won.player.length;
  document.getElementById('botScore').textContent = ctx.match.won.bot.length;
  if (ctx.match.over) { await sleep(500); return endMatch(); }
  await sleep(450);
  if (ctx.match.turn === 'bot') return botTurn();
  battle.busy = false;
  newMeterTarget(); startMeter();
  setTurnUI('Sıra sende!', true);
}

async function animateHit(res) {
  const field = document.getElementById('field');
  if (!field) return;
  const slamId = battle.ctx.match.slammers[res.who].id;
  const sl = document.createElement('div');
  sl.className = 'taso slammer';
  sl.innerHTML = tasoSVG(getCreature(slamId), { level: battle.ctx.match.slammers[res.who].level });
  field.appendChild(sl);
  const fromY = res.who === 'player' ? 260 : -260;
  await sl.animate([
    { transform: `translate(-50%,-50%) translateY(${fromY}px) scale(1.8) rotate(-20deg)`, opacity: 0 },
    { transform: `translate(-50%,-50%) translateY(${fromY / 3}px) scale(1.5) rotate(-5deg)`, opacity: 1, offset: 0.5 },
    { transform: 'translate(-50%,-50%) translateY(-8px) scale(1) rotate(0deg)', opacity: 1 },
  ], { duration: 280, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' }).finished;
  sfx.slam(0.6 + Math.min(1, res.power / 80) * 0.6);
  field.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,4px)' }, { transform: 'translate(5px,-3px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }], { duration: 260 });
  const ring = document.createElement('div'); ring.className = 'shock'; field.appendChild(ring);
  setTimeout(() => ring.remove(), 600);

  if (res.perfect) { popup('MÜKEMMEL! ⭐', 'gold'); sfx.perfect(); }
  else if (res.lucky) popup('ŞANSLI VURUŞ! 🍀', 'green');
  else if (res.flipped.length === 0) popup(res.quality < 0.4 ? 'Iska! 😬' : 'Hiçbiri dönmedi!', 'gray');
  else popup(`${res.flipped.length} TASO ÇEVRİLDİ!`, res.who === 'player' ? 'blue' : 'red');
  if (res.flipped.length && (res.perfect || res.lucky)) setTimeout(() => popup(`${res.flipped.length} TASO ÇEVRİLDİ!`, res.who === 'player' ? 'blue' : 'red'), 900);

  const pile = document.getElementById(res.who === 'player' ? 'playerPile' : 'botPile');
  const flights = res.flipped.map(async (t, i) => {
    const el = field.querySelector(`[data-uid="${t.uid}"]`);
    if (!el) return;
    await sleep(i * 90);
    sfx.flip(i);
    const fr = field.getBoundingClientRect(), pr = pile.getBoundingClientRect();
    const tx = pr.left + pr.width / 2 - (fr.left + fr.width / 2) + (rng() - 0.5) * pr.width * 0.6;
    const ty = pr.top + pr.height / 2 - (fr.top + fr.height / 2);
    const peakX = (rng() - 0.5) * 160;
    el.style.zIndex = '300';
    const inner = el.querySelector('.taso-inner');
    inner.animate([{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(720deg)' }], { duration: 750, easing: 'ease-out', fill: 'forwards' });
    await el.animate([
      { transform: el.dataset.base },
      { transform: `translate(-50%,-50%) translate(${peakX}px,${ty * 0.2 - 90}px) scale(1.5) rotate(${(rng() - 0.5) * 200}deg)`, offset: 0.45 },
      { transform: `translate(-50%,-50%) translate(${tx}px,${ty}px) scale(.42) rotate(0deg)` },
    ], { duration: 750, easing: 'ease-in-out', fill: 'forwards' }).finished;
    el.remove();
    const mini = document.createElement('div');
    mini.className = 'taso xs pop' + (t.owner !== res.who ? ' stolen' : '');
    mini.innerHTML = tasoSVG(getCreature(t.id), { level: t.level, showName: false });
    pile.appendChild(mini);
  });
  // Dönmeyen tasolar sarsılır
  field.querySelectorAll('.taso.stack').forEach((el) => {
    if (res.flipped.some((t) => String(t.uid) === el.dataset.uid)) return;
    el.animate([{ transform: el.dataset.base }, { transform: el.dataset.base + ' translateY(-10px) rotate(6deg)' }, { transform: el.dataset.base }], { duration: 300, easing: 'ease-out' });
  });
  await Promise.all(flights);
  await sl.animate([{ opacity: 1 }, { opacity: 0, transform: 'translate(-50%,-50%) scale(1.2)' }], { duration: 250, fill: 'forwards' }).finished;
  sl.remove();
}

function endMatch() {
  const ctx = battle.ctx;
  const r = applyMatch(save, ctx, rng);
  persist();
  battle = null;
  const titles = { win: ['KAZANDIN! 🎉', 'win'], lose: ['KAYBETTİN 😢', 'lose'], draw: ['BERABERE 🤝', 'draw'] };
  const [title, cls] = titles[r.outcome];
  r.outcome === 'win' ? sfx.win() : r.outcome === 'lose' ? sfx.lose() : sfx.click();
  if (r.levels) setTimeout(() => sfx.levelUp(), 700);
  const minis = (ids, mark) => ids.length ? ids.map((id) => `<div class="mini-wrap">${taso(id, { size: 'sm', level: lvlOf(id) })}${mark && r.discoveries.includes(id) ? '<span class="new">YENİ</span>' : ''}</div>`).join('') : '<em>—</em>';
  screen = 'home';
  render();
  showModal(`<h2 class="res-title ${cls}">${title}</h2>
    <p class="score-line">${esc(save.player.name)} <b>${r.playerFlips}</b> – <b>${r.botFlips}</b> ${esc(ctx.bot.name)}</p>
    <div class="label">Rakipten kazandığın tasolar</div><div class="mini-row">${minis(r.gained, true)}</div>
    <div class="label">Kaybettiğin tasolar</div><div class="mini-row">${minis(r.lost, false)}</div>
    <div class="rewards">
      <span>+${r.xp} XP</span>
      <span class="${r.delta >= 0 ? 'up' : 'down'}">🏆 ${r.delta >= 0 ? '+' : ''}${r.delta}</span>
      ${r.packs ? `<span>🍟 +${r.packs}</span>` : ''}
    </div>
    ${r.levels ? `<div class="levelup">🎉 SEVİYE ATLADIN! Artık Sv ${save.player.level}</div>` : ''}
    ${r.tasoLevelUps.map((u) => `<div class="levelup small">⭐ ${getCreature(u.id).name} Sv ${u.level} oldu!</div>`).join('')}
    <div class="row">
      <button class="btn primary" data-act="challenge" data-bot="${ctx.bot.id}">🔁 Rövanş</button>
      <button class="btn ghost" data-act="nav" data-screen="arena">Arena</button>
      <button class="btn ghost" data-act="closeModal">Ana sayfa</button>
    </div>`, 'result-modal');
}

function beginBattle(botId) {
  closeModal();
  if (pickStake(save.collection, save.slammerId, 1, rng).length === 0) {
    showModal('<h3>Ortaya koyacak tason yok!</h3><p>Önce cips paketi aç.</p><button class="btn primary" data-act="closeModal">Tamam</button>');
    return;
  }
  battle = { ctx: startMatch(save, botId, rng), busy: false };
  go('battle');
  setTurnUI('Sıra sende! İbreyi yeşilde durdur.', true);
}

/* ---------------- Olaylar ---------------- */
const actions = {
  nav: (t) => { closeModal(); sfx.click(); go(t.dataset.screen); },
  starter: (t) => { chooseStarter(save, t.dataset.id, rng); persist(); sfx.levelUp(); go('home'); },
  openPack: () => packModal(),
  freePack: () => { save.player.packs += 1; persist(); packModal(); },
  challenge: (t) => { sfx.click(); beginBattle(t.dataset.bot); },
  hit: () => playerHit(),
  forfeit: () => {
    if (!battle || battle.busy) return;
    if (!confirm('Pes edersen yığındaki tasolar rakibe gider. Emin misin?')) return;
    const m = battle.ctx.match; m.won.bot.push(...m.stack); m.stack = []; m.over = true; meter.running = false;
    endMatch();
  },
  detail: (t) => { sfx.click(); detailModal(t.dataset.id); },
  setSlammer: (t) => { save.slammerId = t.dataset.id; persist(); sfx.click(); closeModal(); render(); },
  filter: (t) => { albumFilter = t.dataset.f; render(); },
  closeModal: () => { closeModal(); if (screen === 'battle') return; render(); },
  sound: () => { save.settings.sound = !save.settings.sound; setSound(save.settings.sound); persist(); render(); },
  rename: () => {
    const n = prompt('Oyuncu adın:', save.player.name);
    if (n && n.trim()) { save.player.name = n.trim().slice(0, 18); persist(); render(); }
  },
  reset: () => {
    if (!confirm('Tüm ilerlemen silinecek. Emin misin?')) return;
    clearSave(); save = newSave(rng); screen = 'starter'; render();
  },
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (!t || t.disabled) return;
  actions[t.dataset.act]?.(t);
});
document.addEventListener('keydown', (e) => {
  if (screen === 'battle' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); playerHit(); }
  if (e.code === 'Escape') closeModal();
});
// Mobilde sahaya dokunarak da vurulabilir
document.addEventListener('pointerdown', (e) => {
  if (screen === 'battle' && e.target.closest('#field, #meter')) playerHit();
});

render();
// Test / debug için
window.__taso = { get save() { return save; }, addTaso: (id) => { addTaso(save.collection, id); persist(); render(); } };
