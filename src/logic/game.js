import { getCreature, RARITIES } from '../data/creatures.js';
import { addTaso, removeTaso, tasoLevel, rollCreature, pickStake, openPack } from './collection.js';
import { addXp, matchXp } from './progression.js';
import { createBots, applyResult, simulateBots, levelFromPoints, START_POINTS } from './ranking.js';
import { createMatch, finishMatch } from './battle.js';
import { pick } from './rng.js';

export const STARTERS = ['kivilcik', 'damlacik', 'filizik'];
export const STAKE_SIZE = 3;

export function newSave(rng, name = 'Sen') {
  return {
    v: 1,
    started: false,
    player: { name, level: 1, xp: 0, points: START_POINTS, wins: 0, losses: 0, draws: 0, packs: 0 },
    collection: {},
    slammerId: null,
    bots: createBots(rng),
    settings: { sound: true },
    stats: { perfects: 0, flips: 0, matches: 0 },
  };
}

export function chooseStarter(save, starterId, rng) {
  if (!STARTERS.includes(starterId)) throw new Error('Geçersiz başlangıç tasosu');
  addTaso(save.collection, starterId);
  addTaso(save.collection, starterId);
  const commons = ['kozcuk', 'kopukbas', 'yosuncuk', 'cizirti', 'cakilcik', 'esintik'];
  for (let i = 0; i < 3; i++) addTaso(save.collection, pick(rng, commons));
  save.slammerId = starterId;
  save.player.packs = 2;
  save.started = true;
  return save;
}

export const slammerOf = (save) => ({
  id: save.slammerId,
  level: tasoLevel(save.collection[save.slammerId]?.total || 1),
});

export function needsFreePack(save) {
  return save.started && save.player.packs === 0 &&
    pickStake(save.collection, save.slammerId, 1, Math.random).length === 0;
}

export function openPackFor(save, rng) {
  if (save.player.packs <= 0) return null;
  save.player.packs -= 1;
  const id = openPack(rng);
  const res = addTaso(save.collection, id);
  const xp = res.isNew ? RARITIES[getCreature(id).rarity].xp : 5;
  const levels = addXp(save.player, xp);
  save.player.packs += levels;
  return { id, ...res, xp, levels };
}

export function botLoadout(bot, rng) {
  const level = levelFromPoints(bot.points);
  const bonus = level / 25;
  return {
    level,
    slammer: { id: rollCreature(rng, bonus * 1.5), level: 1 + Math.floor(level / 12) },
    stake: Array.from({ length: STAKE_SIZE }, () => rollCreature(rng, bonus)),
  };
}

export function startMatch(save, botId, rng) {
  const bot = save.bots.find((b) => b.id === botId);
  if (!bot) throw new Error('Rakip yok');
  const stake = pickStake(save.collection, save.slammerId, STAKE_SIZE, rng);
  if (stake.length === 0) throw new Error('Ortaya koyacak tasonuz yok');
  const lo = botLoadout(bot, rng);
  const levels = Object.fromEntries(stake.map((id) => [id, tasoLevel(save.collection[id].total)]));
  // Ortaya konan tasolar koleksiyondan çıkar, sonuçta geri döner veya kaybedilir
  stake.forEach((id) => removeTaso(save.collection, id));
  const match = createMatch({
    playerSlammer: slammerOf(save), botSlammer: lo.slammer,
    playerStake: stake, botStake: lo.stake, rng, playerTasoLevels: levels,
  });
  return { bot, botLevel: lo.level, match, stake };
}

// Maç bitince kaydı günceller ve özet döndürür.
export function applyMatch(save, ctx, rng) {
  const res = finishMatch(ctx.match);
  const { match, bot } = ctx;
  // Oyuncunun kendi çevirdiği her taso (kendi veya rakibin) + kendi dönen tasoları koleksiyona
  const discoveries = [];
  const tasoLevelUps = [];
  for (const t of match.won.player) {
    if (t.owner === 'player') { save.collection[t.id].copies += 1; continue; }
    const r = addTaso(save.collection, t.id);
    if (r.isNew) discoveries.push(t.id);
    if (r.leveledUp) tasoLevelUps.push({ id: t.id, level: r.level });
  }
  for (const t of res.returned.player) save.collection[t.id].copies += 1;

  const perfects = match.log.filter((l) => l.who === 'player' && l.perfect).length;
  let xp = matchXp(res.outcome, res.playerFlips, perfects);
  xp += discoveries.reduce((s, id) => s + RARITIES[getCreature(id).rarity].xp, 0);
  const levels = addXp(save.player, xp);

  const delta = applyResult(save.player, bot, res.outcome);
  if (res.outcome === 'win') { save.player.wins++; bot.losses++; }
  else if (res.outcome === 'lose') { save.player.losses++; bot.wins++; }
  else save.player.draws++;

  const packs = levels + (res.outcome === 'win' ? 1 : 0);
  save.player.packs += packs;
  save.stats.perfects += perfects;
  save.stats.flips += res.playerFlips;
  save.stats.matches += 1;
  simulateBots(save.bots, rng, 3);
  return { ...res, xp, levels, delta, packs, discoveries, tasoLevelUps };
}
