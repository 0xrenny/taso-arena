export const xpForNext = (level) => 80 + level * 40;
export const MAX_LEVEL = 50;

export function addXp(player, amount) {
  player.xp += amount;
  let levelsGained = 0;
  while (player.level < MAX_LEVEL && player.xp >= xpForNext(player.level)) {
    player.xp -= xpForNext(player.level);
    player.level += 1;
    levelsGained += 1;
  }
  if (player.level >= MAX_LEVEL) player.xp = Math.min(player.xp, xpForNext(player.level));
  return levelsGained;
}

export function matchXp(outcome, playerFlips, perfects = 0) {
  const base = outcome === 'win' ? 60 : outcome === 'draw' ? 30 : 15;
  return base + playerFlips * 8 + perfects * 5;
}
