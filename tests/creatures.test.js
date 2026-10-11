import { describe, it, expect } from 'vitest';
import { CREATURES, ELEMENTS, RARITIES, ADVANTAGES } from '../src/data/creatures.js';
import { tasoSVG, tasoBackSVG } from '../src/ui/art.js';

describe('yaratık verisi', () => {
  it('20-30 arası özgün yaratık var ve id/isimler benzersiz', () => {
    expect(CREATURES.length).toBeGreaterThanOrEqual(20);
    expect(CREATURES.length).toBeLessThanOrEqual(30);
    expect(new Set(CREATURES.map((c) => c.id)).size).toBe(CREATURES.length);
    expect(new Set(CREATURES.map((c) => c.name)).size).toBe(CREATURES.length);
  });
  it('her yaratığın geçerli elementi, nadirliği ve pozitif statları var', () => {
    for (const c of CREATURES) {
      expect(ELEMENTS[c.element]).toBeTruthy();
      expect(RARITIES[c.rarity]).toBeTruthy();
      for (const v of Object.values(c.stats)) expect(v).toBeGreaterThan(0);
    }
  });
  it('tüm nadirlik seviyeleri (metal dahil) temsil ediliyor', () => {
    for (const r of Object.keys(RARITIES)) expect(CREATURES.some((c) => c.rarity === r)).toBe(true);
  });
  it('avantaj tablosu tutarlı: hiçbir element kendine avantajlı değil, karşılıklı avantaj yok', () => {
    for (const [a, list] of Object.entries(ADVANTAGES)) {
      expect(list).not.toContain(a);
      for (const b of list) {
        expect(ELEMENTS[b]).toBeTruthy();
        expect(ADVANTAGES[b]).not.toContain(a);
      }
    }
  });
  it('telifli isim içermez', () => {
    const banned = /poke|pokémon|pikachu|nintendo|charizard|bulbasaur|squirtle|digimon/i;
    for (const c of CREATURES) expect(banned.test(c.name + c.desc + c.id)).toBe(false);
  });
  it('SVG çizimleri üretiliyor', () => {
    for (const c of CREATURES) {
      const s = tasoSVG(c, { level: 3 });
      expect(s.startsWith('<svg')).toBe(true);
      expect(s).toContain(c.name.toLocaleUpperCase('tr-TR'));
    }
    expect(tasoSVG(CREATURES[0], { silhouette: true })).toContain('Bilinmeyen taso');
    expect(tasoBackSVG()).toContain('TASO');
  });
});
