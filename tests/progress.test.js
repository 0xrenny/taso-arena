import { describe, it, expect } from 'vitest';
import { makeRng } from '../src/logic/rng.js';
import { addXp, xpForNext, matchXp } from '../src/logic/progression.js';
import { tasoLevel, addTaso, removeTaso, pickStake, discoveredCount, effectiveStats, openPack, nextLevelAt } from '../src/logic/collection.js';
import { CREATURES, RARITIES, getCreature } from '../src/data/creatures.js';

describe('oyuncu seviyesi', () => {
  it('XP biriktikçe seviye atlar, artan XP birden fazla seviye atlatabilir', () => {
    const p = { level: 1, xp: 0 };
    expect(addXp(p, xpForNext(1) - 1)).toBe(0);
    expect(p.level).toBe(1);
    expect(addXp(p, 1)).toBe(1);
    expect(p).toEqual({ level: 2, xp: 0 });
    expect(addXp(p, xpForNext(2) + xpForNext(3) + 5)).toBe(2);
    expect(p).toEqual({ level: 4, xp: 5 });
  });
  it('maç XP: galibiyet > beraberlik > mağlubiyet, çevirmeler bonus', () => {
    expect(matchXp('win', 0)).toBeGreaterThan(matchXp('draw', 0));
    expect(matchXp('draw', 0)).toBeGreaterThan(matchXp('lose', 0));
    expect(matchXp('lose', 3)).toBeGreaterThan(matchXp('lose', 0));
  });
});

describe('koleksiyon ve taso seviyesi', () => {
  it('kopya topladıkça taso seviye atlar', () => {
    expect([1, 2, 3, 5, 6, 10, 15, 99].map(tasoLevel)).toEqual([1, 1, 2, 2, 3, 4, 5, 5]);
    expect(nextLevelAt(4)).toBe(6);
    expect(nextLevelAt(15)).toBe(null);
    const col = {};
    expect(addTaso(col, 'kivilcik').isNew).toBe(true);
    expect(addTaso(col, 'kivilcik')).toMatchObject({ isNew: false, leveledUp: false });
    expect(addTaso(col, 'kivilcik')).toMatchObject({ leveledUp: true, level: 2 });
    expect(col.kivilcik).toEqual({ copies: 3, total: 3 });
  });
  it('kaybedilen taso kopyayı azaltır ama toplam/seviye düşmez', () => {
    const col = {};
    for (let i = 0; i < 3; i++) addTaso(col, 'filizik');
    expect(removeTaso(col, 'filizik')).toBe(true);
    expect(col.filizik).toEqual({ copies: 2, total: 3 });
    expect(removeTaso(col, 'yok')).toBe(false);
    expect(discoveredCount(col)).toBe(1);
  });
  it('bilinmeyen taso eklenemez', () => {
    expect(() => addTaso({}, 'sahte')).toThrow();
  });
  it('seviye statları artırır', () => {
    const a = effectiveStats('kivilcik', 1), b = effectiveStats('kivilcik', 5);
    expect(b.guc).toBeGreaterThan(a.guc);
    expect(b.agirlik).toBeGreaterThan(a.agirlik);
  });
  it('ortaya konacak tasolar: vurucunun son kopyası ve tekil tasolar korunur, önce fazlalar', () => {
    const col = {};
    addTaso(col, 'kivilcik'); // vurucu, tek
    addTaso(col, 'filizik'); addTaso(col, 'filizik'); addTaso(col, 'filizik');
    addTaso(col, 'gunesejder');
    const stake = pickStake(col, 'kivilcik', 3, makeRng(1));
    expect(stake).not.toContain('kivilcik');
    expect(stake.slice(0, 2)).toEqual(['filizik', 'filizik']);
    expect(stake).toHaveLength(3);
    expect(pickStake({ kivilcik: { copies: 1, total: 1 } }, 'kivilcik', 3, makeRng(1))).toEqual([]);
  });
  it('paket nadirlik dağılımı ağırlıklara uygun', () => {
    const rng = makeRng(7); const counts = {};
    for (let i = 0; i < 20000; i++) { const r = getCreature(openPack(rng)).rarity; counts[r] = (counts[r] || 0) + 1; }
    expect(counts.siradan).toBeGreaterThan(counts.nadir);
    expect(counts.nadir).toBeGreaterThan(counts.epik);
    expect(counts.epik).toBeGreaterThan(counts.efsanevi);
    expect(counts.metal).toBeGreaterThan(0);
    const totalW = Object.values(RARITIES).reduce((s, r) => s + r.dropWeight, 0);
    expect(Math.abs(counts.siradan / 20000 - RARITIES.siradan.dropWeight / totalW)).toBeLessThan(0.02);
    expect(CREATURES.length).toBeGreaterThan(0);
  });
});
