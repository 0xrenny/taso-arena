import { CREATURES, RARITIES, getCreature } from '../data/creatures.js';
import { weightedPick, pick } from './rng.js';

// Taso seviyesi: toplam kaç kopya toplandığına göre (kaybedilse bile toplam düşmez)
export const TASO_LEVEL_THRESHOLDS = [1, 3, 6, 10, 15]; // seviye 1..5
export const MAX_TASO_LEVEL = TASO_LEVEL_THRESHOLDS.length;

export function tasoLevel(total) {
  let lvl = 0;
  for (const t of TASO_LEVEL_THRESHOLDS) if (total >= t) lvl++;
  return Math.max(1, lvl);
}
export function nextLevelAt(total) {
  return TASO_LEVEL_THRESHOLDS.find((t) => t > total) ?? null;
}
export const levelMultiplier = (lvl) => 1 + 0.08 * (lvl - 1);

export function effectiveStats(creatureId, lvl = 1) {
  const c = getCreature(creatureId);
  const m = levelMultiplier(lvl);
  return {
    guc: Math.round(c.stats.guc * m),
    agirlik: Math.round(c.stats.agirlik * m),
    sans: Math.round(c.stats.sans * m),
  };
}

export function addTaso(collection, id) {
  if (!getCreature(id)) throw new Error('Bilinmeyen taso: ' + id);
  const entry = collection[id] || { copies: 0, total: 0 };
  const isNew = entry.total === 0;
  const before = tasoLevel(entry.total);
  entry.copies += 1;
  entry.total += 1;
  collection[id] = entry;
  const after = tasoLevel(entry.total);
  return { isNew, leveledUp: !isNew && after > before, level: after };
}

export function removeTaso(collection, id) {
  const entry = collection[id];
  if (!entry || entry.copies <= 0) return false;
  entry.copies -= 1;
  return true;
}

export const ownedCount = (collection) =>
  Object.values(collection).reduce((s, e) => s + e.copies, 0);
export const discoveredCount = (collection) =>
  CREATURES.filter((c) => (collection[c.id]?.total || 0) > 0).length;

export function rollRarity(rng, bonus = 0) {
  // bonus > 0 daha nadir sonuçlar verir (bot seviyesi/özel paket)
  return weightedPick(
    rng,
    Object.values(RARITIES).map((r) => [r.id, r.dropWeight * (1 + bonus * r.order)])
  );
}

export function rollCreature(rng, bonus = 0) {
  const rarity = rollRarity(rng, bonus);
  return pick(rng, CREATURES.filter((c) => c.rarity === rarity)).id;
}

// Cips paketi: 1 taso
export const openPack = (rng) => rollCreature(rng, 0);

// Maça konacak tasoları otomatik seç: önce fazla kopyalar, sonra düşük nadirlik.
export function pickStake(collection, slammerId, n, rng) {
  const units = [];
  for (const [id, e] of Object.entries(collection)) {
    let copies = e.copies - (id === slammerId ? 1 : 0);
    for (let k = 0; k < copies; k++) {
      units.push({ id, extra: k < copies - 1 || (id === slammerId) || false, order: RARITIES[getCreature(id).rarity].order, r: rng() });
    }
  }
  // kopya fazlası olanlar (extra) önce; aynı grupta düşük nadirlik önce
  units.sort((a, b) => (b.extra - a.extra) || (a.order - b.order) || (a.r - b.r));
  return units.slice(0, n).map((u) => u.id);
}
