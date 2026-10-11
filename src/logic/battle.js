import { ADVANTAGES, getCreature } from '../data/creatures.js';
import { effectiveStats } from './collection.js';
import { clamp, gaussian, shuffle } from './rng.js';

export const PERFECT_THRESHOLD = 0.93;

export function typeMultiplier(attackerEl, defenderEl) {
  if (ADVANTAGES[attackerEl]?.includes(defenderEl)) return 1.3;
  if (ADVANTAGES[defenderEl]?.includes(attackerEl)) return 0.8;
  return 1;
}

// quality: 0..1 güç metresinin isabeti (1 = tam ortası)
export function hitPower(slammer, quality, rng) {
  const s = effectiveStats(slammer.id, slammer.level || 1);
  const q = clamp(quality, 0, 1);
  const perfect = q >= PERFECT_THRESHOLD;
  const lucky = rng() < s.sans / 100;
  let power = s.guc * (0.35 + 0.65 * q);
  if (perfect) power *= 1.15;
  if (lucky) power *= 1.25;
  return { power, perfect, lucky };
}

export function flipChance(power, slammerId, taso, depth) {
  const sl = getCreature(slammerId);
  const t = getCreature(taso.id);
  const weight = effectiveStats(taso.id, taso.level || 1).agirlik;
  const eff = power * typeMultiplier(sl.element, t.element) * (1 - 0.07 * depth);
  return clamp(1 / (1 + Math.exp(-(eff - weight - 12) / 7)), 0.02, 0.95);
}

export function botQuality(level, rng) {
  const mean = Math.min(0.85, 0.42 + 0.012 * level);
  return clamp(mean + gaussian(rng) * 0.18, 0, 1);
}

let uidCounter = 0;
export function createMatch({ playerSlammer, botSlammer, playerStake, botStake, rng, maxTurns = 8, playerTasoLevels = {} }) {
  const stack = shuffle(rng, [
    ...playerStake.map((id) => ({ uid: ++uidCounter, id, owner: 'player', level: playerTasoLevels[id] || 1 })),
    ...botStake.map((id) => ({ uid: ++uidCounter, id, owner: 'bot', level: 1 })),
  ]);
  return {
    stack,
    slammers: { player: playerSlammer, bot: botSlammer },
    turn: 'player',
    turnsLeft: maxTurns,
    won: { player: [], bot: [] },
    log: [],
    over: false,
  };
}

// Bir vuruşu çözümler. state'i günceller ve vuruş sonucunu döndürür.
export function resolveHit(state, quality, rng) {
  if (state.over) throw new Error('Maç bitti');
  const who = state.turn;
  const slammer = state.slammers[who];
  const { power, perfect, lucky } = hitPower(slammer, quality, rng);
  const flipped = [];
  const remaining = [];
  state.stack.forEach((taso, depth) => {
    const p = flipChance(power, slammer.id, taso, depth);
    if (rng() < p) flipped.push(taso);
    else remaining.push(taso);
  });
  state.stack = remaining;
  state.won[who].push(...flipped);
  state.turnsLeft -= 1;
  const result = { who, quality, power, perfect, lucky, flipped };
  state.log.push(result);
  if (state.stack.length === 0 || state.turnsLeft <= 0) state.over = true;
  else state.turn = who === 'player' ? 'bot' : 'player';
  return result;
}

// Maç sonucu: kalan tasolar sahiplerine döner.
export function finishMatch(state) {
  const p = state.won.player.length;
  const b = state.won.bot.length;
  const returned = { player: [], bot: [] };
  for (const t of state.stack) returned[t.owner].push(t);
  const outcome = p > b ? 'win' : p < b ? 'lose' : 'draw';
  // Oyuncunun elde ettiği / kaybettiği tasolar
  const gained = state.won.player.filter((t) => t.owner === 'bot').map((t) => t.id);
  const lost = state.won.bot.filter((t) => t.owner === 'player').map((t) => t.id);
  return { outcome, playerFlips: p, botFlips: b, gained, lost, returned };
}
