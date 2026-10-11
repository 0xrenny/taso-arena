import { CREATURES } from '../data/creatures.js';
import { pick, randInt, shuffle } from './rng.js';

export const BOT_NAMES = [
  'Tasocu Kerem', 'Metal Murat', 'Cipsçi Elif', 'Şampiyon Selin', 'Mahallenin Ali’si',
  'Çevirmen Can', 'Albümcü Ayşe', 'Fırlatan Fatma', 'Usta Umut', 'Sekiz Bit Berk',
  'Bakkal Bora', 'Teneffüs Tuğçe', 'Kral Kaan', 'Zıpzıp Zeynep', 'Efsane Emre',
];

export const START_POINTS = 1000;
export const levelFromPoints = (pts) => Math.max(1, Math.min(50, Math.round((pts - 600) / 45)));

export function createBots(rng) {
  return BOT_NAMES.map((name, i) => {
    const points = 700 + Math.round((i / (BOT_NAMES.length - 1)) * 1100) + randInt(rng, -40, 40);
    return { id: 'bot' + i, name, points, wins: 0, losses: 0, avatar: pick(rng, CREATURES).id };
  });
}

export function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

// score: 1 kazanma, 0.5 beraberlik, 0 kaybetme. Dönüş: oyuncunun puan değişimi
export function eloDelta(a, b, score, k = 32) {
  return Math.round(k * (score - expectedScore(a, b)));
}

export function applyResult(playerObj, bot, outcome) {
  const score = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  const d = eloDelta(playerObj.points, bot.points, score);
  playerObj.points = Math.max(0, playerObj.points + d);
  bot.points = Math.max(0, bot.points - d);
  return d;
}

// Botlar kendi aralarında da oynar: tablo canlı kalır.
export function simulateBots(bots, rng, games = 3) {
  for (let g = 0; g < games; g++) {
    const [a, b] = shuffle(rng, bots);
    const pa = expectedScore(a.points, b.points);
    const score = rng() < pa ? 1 : 0;
    const d = eloDelta(a.points, b.points, score, 16);
    a.points += d; b.points -= d;
    if (score) { a.wins++; b.losses++; } else { b.wins++; a.losses++; }
  }
}

export function leaderboard(player, bots) {
  const rows = [
    { id: 'me', name: player.name, points: player.points, level: player.level, isPlayer: true },
    ...bots.map((b) => ({ id: b.id, name: b.name, points: b.points, level: levelFromPoints(b.points), avatar: b.avatar, isPlayer: false })),
  ];
  rows.sort((x, y) => y.points - x.points || (x.isPlayer ? -1 : 1));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
