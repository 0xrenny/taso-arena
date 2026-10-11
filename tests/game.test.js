import { describe, it, expect } from 'vitest';
import { makeRng } from '../src/logic/rng.js';
import { newSave, chooseStarter, startMatch, applyMatch, openPackFor, STAKE_SIZE } from '../src/logic/game.js';
import { resolveHit } from '../src/logic/battle.js';
import { ownedCount } from '../src/logic/collection.js';
import { loadSave, writeSave, clearSave, SAVE_KEY } from '../src/logic/storage.js';

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('oyun akışı', () => {
  it('başlangıç tasosu seçilince koleksiyon, vurucu ve paketler hazır', () => {
    const s = newSave(makeRng(1));
    expect(s.started).toBe(false);
    chooseStarter(s, 'damlacik', makeRng(2));
    expect(s.slammerId).toBe('damlacik');
    expect(s.collection.damlacik.copies).toBe(2);
    expect(ownedCount(s.collection)).toBe(5);
    expect(s.player.packs).toBe(2);
    expect(() => chooseStarter(newSave(makeRng(1)), 'gunesejder', makeRng(1))).toThrow();
  });
  it('paket açmak taso ekler, paket azaltır, XP verir', () => {
    const s = chooseStarter(newSave(makeRng(1)), 'filizik', makeRng(1));
    const before = ownedCount(s.collection);
    const r = openPackFor(s, makeRng(3));
    expect(r.id).toBeTruthy();
    expect(ownedCount(s.collection)).toBe(before + 1);
    expect(s.player.packs).toBe(1 + r.levels);
    s.player.packs = 0;
    expect(openPackFor(s, makeRng(3))).toBe(null);
  });
  it('tam maç: taso sayısı korunur, XP/puan/istatistik güncellenir', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = makeRng(seed);
      const s = chooseStarter(newSave(rng), 'kivilcik', rng);
      const before = ownedCount(s.collection);
      const pts = s.player.points;
      const ctx = startMatch(s, 'bot3', rng);
      expect(ctx.stake).toHaveLength(STAKE_SIZE);
      expect(ownedCount(s.collection)).toBe(before - STAKE_SIZE);
      while (!ctx.match.over) resolveHit(ctx.match, rng(), rng);
      const r = applyMatch(s, ctx, rng);
      expect(ownedCount(s.collection)).toBe(before + r.gained.length - r.lost.length);
      expect(s.player.points - pts).toBe(r.delta);
      expect(s.player.wins + s.player.losses + s.player.draws).toBe(1);
      if (r.outcome === 'win') expect(r.delta).toBeGreaterThan(0);
      if (r.outcome === 'lose') expect(r.delta).toBeLessThan(0);
      expect(s.stats.matches).toBe(1);
      expect(s.collection.kivilcik.copies).toBeGreaterThanOrEqual(1); // vurucu asla kaybedilmez
    }
  });
  it('kayıt localStorage benzeri depoya yazılıp okunur, bozuk kayıt reddedilir', () => {
    const st = memStorage();
    const s = chooseStarter(newSave(makeRng(1)), 'kivilcik', makeRng(1));
    expect(writeSave(s, st)).toBe(true);
    expect(loadSave(st)).toEqual(s);
    st.setItem(SAVE_KEY, '{bozuk');
    expect(loadSave(st)).toBe(null);
    st.setItem(SAVE_KEY, JSON.stringify({ v: 999 }));
    expect(loadSave(st)).toBe(null);
    clearSave(st);
    expect(loadSave(st)).toBe(null);
  });
});
