import { describe, it, expect } from 'vitest';
import { makeRng } from '../src/logic/rng.js';
import { createBots, eloDelta, expectedScore, applyResult, leaderboard, simulateBots, levelFromPoints } from '../src/logic/ranking.js';

describe('sıralama', () => {
  it('botlar isimli ve farklı puanlarla oluşturulur', () => {
    const bots = createBots(makeRng(1));
    expect(bots.length).toBeGreaterThanOrEqual(10);
    expect(new Set(bots.map((b) => b.name)).size).toBe(bots.length);
    expect(Math.max(...bots.map((b) => b.points))).toBeGreaterThan(Math.min(...bots.map((b) => b.points)) + 500);
  });
  it('Elo: güçlü rakibi yenmek daha çok puan kazandırır, toplam puan korunur', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5);
    expect(eloDelta(1000, 1400, 1)).toBeGreaterThan(eloDelta(1000, 800, 1));
    expect(eloDelta(1000, 1000, 0)).toBeLessThan(0);
    const p = { points: 1000 }, b = { points: 1200 };
    const d = applyResult(p, b, 'win');
    expect(d).toBeGreaterThan(0);
    expect(p.points + b.points).toBe(2200);
  });
  it('liderlik tablosu puana göre sıralı ve oyuncu dahil', () => {
    const bots = createBots(makeRng(2));
    const rows = leaderboard({ name: 'Ben', points: 1300, level: 4 }, bots);
    expect(rows).toHaveLength(bots.length + 1);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].points).toBeGreaterThanOrEqual(rows[i].points);
    expect(rows.filter((r) => r.isPlayer)).toHaveLength(1);
    expect(rows.map((r) => r.rank)).toEqual(rows.map((_, i) => i + 1));
  });
  it('bot simülasyonu toplam puanı korur', () => {
    const bots = createBots(makeRng(3));
    const sum = () => bots.reduce((s, b) => s + b.points, 0);
    const before = sum();
    simulateBots(bots, makeRng(4), 50);
    expect(sum()).toBe(before);
  });
  it('puana göre bot seviyesi 1-50 arasında', () => {
    expect(levelFromPoints(0)).toBe(1);
    expect(levelFromPoints(99999)).toBe(50);
    expect(levelFromPoints(1500)).toBeGreaterThan(levelFromPoints(900));
  });
});
