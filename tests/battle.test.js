import { describe, it, expect } from 'vitest';
import { makeRng } from '../src/logic/rng.js';
import { typeMultiplier, hitPower, flipChance, createMatch, resolveHit, finishMatch, botQuality, PERFECT_THRESHOLD } from '../src/logic/battle.js';

const constRng = (v) => () => v;

describe('element avantajı', () => {
  it('alev yaprağa karşı güçlü, dalgaya karşı zayıf', () => {
    expect(typeMultiplier('alev', 'yaprak')).toBeGreaterThan(1);
    expect(typeMultiplier('alev', 'dalga')).toBeLessThan(1);
    expect(typeMultiplier('alev', 'golge')).toBe(1);
  });
});

describe('vuruş gücü', () => {
  it('isabet arttıkça güç artar, mükemmel vuruş bonus verir', () => {
    const sl = { id: 'kivilcik', level: 1 };
    const low = hitPower(sl, 0.2, constRng(0.99)).power;
    const mid = hitPower(sl, 0.7, constRng(0.99)).power;
    const perfect = hitPower(sl, 1, constRng(0.99));
    expect(mid).toBeGreaterThan(low);
    expect(perfect.perfect).toBe(true);
    expect(hitPower(sl, PERFECT_THRESHOLD - 0.01, constRng(0.99)).perfect).toBe(false);
  });
  it('şanslı vuruş gücü artırır', () => {
    const sl = { id: 'parilti', level: 1 };
    const normal = hitPower(sl, 0.5, constRng(0.99));
    const lucky = hitPower(sl, 0.5, constRng(0.0));
    expect(lucky.lucky).toBe(true);
    expect(lucky.power).toBeGreaterThan(normal.power);
  });
  it('seviye yüksek vurucu daha güçlü', () => {
    expect(hitPower({ id: 'kivilcik', level: 5 }, 0.8, constRng(0.99)).power)
      .toBeGreaterThan(hitPower({ id: 'kivilcik', level: 1 }, 0.8, constRng(0.99)).power);
  });
});

describe('çevirme şansı', () => {
  it('yığının altındaki ve ağır tasolar daha zor döner, avantaj şansı artırır', () => {
    const p = 60;
    const top = flipChance(p, 'kivilcik', { id: 'filizik' }, 0);
    const deep = flipChance(p, 'kivilcik', { id: 'filizik' }, 5);
    expect(top).toBeGreaterThan(deep);
    expect(flipChance(p, 'kivilcik', { id: 'cakilcik' }, 0)).toBeLessThan(flipChance(p, 'kivilcik', { id: 'cizirti' }, 0));
    expect(flipChance(p, 'kivilcik', { id: 'filizik' }, 0)).toBeGreaterThan(flipChance(p, 'kivilcik', { id: 'damlacik' }, 0));
  });
  it('olasılık her zaman [0.02, 0.95] aralığında', () => {
    for (const pw of [0, 10, 50, 200, 1000]) {
      const v = flipChance(pw, 'celikdev', { id: 'kopukbas' }, 0);
      expect(v).toBeGreaterThanOrEqual(0.02);
      expect(v).toBeLessThanOrEqual(0.95);
    }
  });
});

describe('maç akışı', () => {
  const setup = (seed) => createMatch({
    playerSlammer: { id: 'tuncejder', level: 3 }, botSlammer: { id: 'kozcuk', level: 1 },
    playerStake: ['kivilcik', 'filizik', 'damlacik'], botStake: ['kozcuk', 'yosuncuk', 'cakilcik'], rng: makeRng(seed),
  });
  it('sıra oyuncu ve bot arasında değişir, taso sayısı korunur', () => {
    const m = setup(1);
    expect(m.stack).toHaveLength(6);
    expect(m.turn).toBe('player');
    const rng = makeRng(2);
    resolveHit(m, 0.1, rng);
    if (!m.over) expect(m.turn).toBe('bot');
    while (!m.over) resolveHit(m, 0.8, rng);
    expect(m.stack.length + m.won.player.length + m.won.bot.length).toBe(6);
    expect(() => resolveHit(m, 1, rng)).toThrow();
  });
  it('maksimum atış sayısında maç biter', () => {
    const m = setup(3);
    const rng = constRng(0.999); // hiçbir taso dönmez
    let n = 0;
    while (!m.over) { resolveHit(m, 0, rng); n++; }
    expect(n).toBe(8);
    const r = finishMatch(m);
    expect(r.outcome).toBe('draw');
    expect(r.returned.player).toHaveLength(3);
    expect(r.returned.bot).toHaveLength(3);
  });
  it('hepsi bir vuruşta dönerse oyuncu kazanır ve rakibin tasolarını alır', () => {
    const m = setup(4);
    resolveHit(m, 1, constRng(0.0));
    expect(m.over).toBe(true);
    const r = finishMatch(m);
    expect(r.outcome).toBe('win');
    expect(r.gained.sort()).toEqual(['cakilcik', 'kozcuk', 'yosuncuk']);
    expect(r.lost).toEqual([]);
  });
  it('iyi zamanlama ortalamada daha çok kazandırır', () => {
    const play = (q) => {
      const rng = makeRng(99); let flips = 0;
      for (let i = 0; i < 300; i++) {
        const m = createMatch({
          playerSlammer: { id: 'kivilcik', level: 1 }, botSlammer: { id: 'kozcuk', level: 1 },
          playerStake: ['kivilcik', 'filizik', 'damlacik'], botStake: ['kozcuk', 'yosuncuk', 'cakilcik'], rng: makeRng(i),
        });
        while (!m.over) { const r = resolveHit(m, m.turn === 'player' ? q : 0.5, rng); if (r.who === 'player') flips += r.flipped.length; }
      }
      return flips;
    };
    expect(play(1)).toBeGreaterThan(play(0.3) * 1.5);
  });
  it('bot isabeti seviyeyle artar ve 0-1 arasında kalır', () => {
    const avg = (lvl) => { const rng = makeRng(5); let s = 0; for (let i = 0; i < 2000; i++) { const q = botQuality(lvl, rng); expect(q).toBeGreaterThanOrEqual(0); expect(q).toBeLessThanOrEqual(1); s += q; } return s / 2000; };
    expect(avg(30)).toBeGreaterThan(avg(1));
  });
});
