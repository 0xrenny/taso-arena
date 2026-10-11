// Prosedürel SVG taso çizimleri – hiçbir dış görsel kullanılmaz.
import { ELEMENTS, RARITIES } from '../data/creatures.js';

let gid = 0;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function bodyPath(shape) {
  switch (shape) {
    case 'wide': return '<ellipse cx="100" cy="112" rx="46" ry="31"/>';
    case 'tall': return '<ellipse cx="100" cy="106" rx="31" ry="41"/>';
    case 'drop': return '<path d="M100 58 C120 84 136 100 136 118 C136 138 120 148 100 148 C80 148 64 138 64 118 C64 100 80 84 100 58Z"/>';
    case 'star': return '<path d="M100 64 L110 84 L132 78 L124 98 L142 112 L122 120 L126 142 L106 134 L94 150 L84 132 L62 138 L70 116 L56 102 L78 96 L74 74 L92 82Z" stroke-linejoin="round"/>';
    default: return '<ellipse cx="100" cy="108" rx="38" ry="35"/>';
  }
}

function bodyTop(shape) {
  return { wide: 82, tall: 66, drop: 66, star: 70, round: 74 }[shape] ?? 74;
}

function ears(dna, top) {
  const m = dna.main, a = dna.accent, d = shade(m, -40);
  const y = top + 8;
  switch (dna.ears) {
    case 'pointy': return `<path d="M72 ${y + 6} L64 ${y - 26} L90 ${y - 2}Z" fill="${m}" stroke="${d}" stroke-width="3"/><path d="M128 ${y + 6} L136 ${y - 26} L110 ${y - 2}Z" fill="${m}" stroke="${d}" stroke-width="3"/><path d="M73 ${y} L68 ${y - 16} L83 ${y - 2}Z" fill="${a}"/><path d="M127 ${y} L132 ${y - 16} L117 ${y - 2}Z" fill="${a}"/>`;
    case 'round': return `<circle cx="72" cy="${y - 4}" r="13" fill="${m}" stroke="${d}" stroke-width="3"/><circle cx="128" cy="${y - 4}" r="13" fill="${m}" stroke="${d}" stroke-width="3"/><circle cx="72" cy="${y - 4}" r="6" fill="${a}"/><circle cx="128" cy="${y - 4}" r="6" fill="${a}"/>`;
    case 'horns': return `<path d="M80 ${y} Q66 ${y - 18} 74 ${y - 34} Q82 ${y - 18} 92 ${y - 4}Z" fill="${a}" stroke="${shade(a, -60)}" stroke-width="3"/><path d="M120 ${y} Q134 ${y - 18} 126 ${y - 34} Q118 ${y - 18} 108 ${y - 4}Z" fill="${a}" stroke="${shade(a, -60)}" stroke-width="3"/>`;
    case 'leaf': return `<path d="M100 ${y - 2} Q86 ${y - 30} 102 ${y - 42} Q116 ${y - 24} 100 ${y - 2}Z" fill="#51cf66" stroke="#2b8a3e" stroke-width="3"/><path d="M100 ${y - 4} L101 ${y - 34}" stroke="#2b8a3e" stroke-width="2"/>`;
    case 'flame': return `<path d="M100 ${y} Q80 ${y - 20} 94 ${y - 44} Q96 ${y - 26} 106 ${y - 30} Q104 ${y - 16} 116 ${y - 22} Q118 ${y - 6} 100 ${y}Z" fill="#ffa94d" stroke="#e8590c" stroke-width="3"/><path d="M100 ${y - 4} Q92 ${y - 16} 99 ${y - 28} Q104 ${y - 14} 108 ${y - 14} Q108 ${y - 6} 100 ${y - 4}Z" fill="#ffe066"/>`;
    case 'fins': return `<path d="M62 ${y + 30} Q40 ${y + 16} 48 ${y - 4} Q62 ${y + 10} 70 ${y + 18}Z" fill="${a}" stroke="${d}" stroke-width="3"/><path d="M138 ${y + 30} Q160 ${y + 16} 152 ${y - 4} Q138 ${y + 10} 130 ${y + 18}Z" fill="${a}" stroke="${d}" stroke-width="3"/>`;
    default: return '';
  }
}

function wings(dna) {
  if (!dna.wings) return '';
  const a = dna.accent, d = shade(a, -70);
  return `<path d="M70 104 Q34 70 30 104 Q40 112 36 124 Q54 118 70 122Z" fill="${a}" stroke="${d}" stroke-width="3" opacity=".95"/><path d="M130 104 Q166 70 170 104 Q160 112 164 124 Q146 118 130 122Z" fill="${a}" stroke="${d}" stroke-width="3" opacity=".95"/>`;
}

function pattern(dna) {
  const a = dna.accent;
  switch (dna.pattern) {
    case 'belly': return `<ellipse cx="100" cy="124" rx="22" ry="17" fill="${a}" opacity=".9"/>`;
    case 'spots': return `<circle cx="78" cy="122" r="5" fill="${a}" opacity=".8"/><circle cx="122" cy="124" r="6" fill="${a}" opacity=".8"/><circle cx="112" cy="138" r="4" fill="${a}" opacity=".8"/><circle cx="86" cy="138" r="3.5" fill="${a}" opacity=".8"/>`;
    case 'stripes': return `<path d="M84 ${82} q4 8 0 14 M100 ${78} q4 8 0 14 M116 ${82} q4 8 0 14" stroke="${shade(dna.main, -55)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    default: return '';
  }
}

function face(dna) {
  const ey = 100;
  let eyes = '';
  switch (dna.eyes) {
    case 'sleepy':
      eyes = `<path d="M78 ${ey} q8 7 16 0" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M106 ${ey} q8 7 16 0" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>`; break;
    case 'angry':
      eyes = `<circle cx="86" cy="${ey}" r="8" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="114" cy="${ey}" r="8" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="88" cy="${ey + 1}" r="4.5" fill="#222"/><circle cx="112" cy="${ey + 1}" r="4.5" fill="#222"/><path d="M76 ${ey - 13} L95 ${ey - 6} M124 ${ey - 13} L105 ${ey - 6}" stroke="#222" stroke-width="4" stroke-linecap="round"/>`; break;
    case 'one':
      eyes = `<circle cx="100" cy="${ey - 2}" r="14" fill="#fff" stroke="#222" stroke-width="2.5"/><circle cx="102" cy="${ey}" r="7.5" fill="#222"/><circle cx="105" cy="${ey - 4}" r="2.6" fill="#fff"/>`; break;
    default:
      eyes = `<circle cx="85" cy="${ey}" r="10" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="115" cy="${ey}" r="10" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="87" cy="${ey + 1}" r="6" fill="#222"/><circle cx="113" cy="${ey + 1}" r="6" fill="#222"/><circle cx="89" cy="${ey - 2}" r="2.2" fill="#fff"/><circle cx="115" cy="${ey - 2}" r="2.2" fill="#fff"/>`;
  }
  let mouth = '';
  const my = 116;
  switch (dna.mouth) {
    case 'fang': mouth = `<path d="M88 ${my} q12 9 24 0" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M92 ${my + 2} l3 7 l3 -5Z M108 ${my + 2} l-3 7 l-3 -5Z" fill="#fff" stroke="#222" stroke-width="1"/>`; break;
    case 'o': mouth = `<ellipse cx="100" cy="${my + 2}" rx="5" ry="6" fill="#5c1a1a" stroke="#222" stroke-width="2"/>`; break;
    default: mouth = `<path d="M90 ${my} q10 10 20 0" stroke="#222" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
  const blush = `<ellipse cx="72" cy="112" rx="6" ry="3.5" fill="#ff8787" opacity=".55"/><ellipse cx="128" cy="112" rx="6" ry="3.5" fill="#ff8787" opacity=".55"/>`;
  return eyes + mouth + blush;
}

export function creatureSVGInner(c) {
  const dna = c.dna;
  const top = bodyTop(dna.body);
  const dark = shade(dna.main, -45);
  return `
    <g class="creature">
      ${wings(dna)}
      ${ears(dna, top)}
      <ellipse cx="84" cy="150" rx="11" ry="6" fill="${dark}"/><ellipse cx="116" cy="150" rx="11" ry="6" fill="${dark}"/>
      <g fill="${dna.main}" stroke="${dark}" stroke-width="3.5">${bodyPath(dna.body)}</g>
      ${pattern(dna)}
      ${face(dna)}
    </g>`;
}

function stars(level) {
  let s = '';
  for (let i = 0; i < level; i++) {
    const x = 100 + (i - (level - 1) / 2) * 13;
    s += `<path transform="translate(${x} 24) scale(.55)" d="M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3Z" fill="#ffe066" stroke="#7a5a00" stroke-width="2"/>`;
  }
  return s;
}

export function tasoSVG(c, opts = {}) {
  const { level = 1, silhouette = false, showName = true } = opts;
  const id = 't' + (++gid);
  const el = ELEMENTS[c.element];
  const rar = RARITIES[c.rarity];
  const metal = c.rarity === 'metal';
  const rimA = metal ? '#f8f9fa' : shade(rar.color, 40);
  const rimB = metal ? shade(c.dna.main, -10) : shade(rar.color, -30);
  let rays = '';
  for (let i = 0; i < 16; i++) {
    const a1 = (i / 16) * Math.PI * 2, a2 = a1 + Math.PI / 16;
    rays += `<path d="M100 100 L${100 + 90 * Math.cos(a1)} ${100 + 90 * Math.sin(a1)} L${100 + 90 * Math.cos(a2)} ${100 + 90 * Math.sin(a2)}Z"/>`;
  }
  const art = silhouette
    ? `<g opacity=".9" filter="url(#${id}sil)">${creatureSVGInner(c)}</g><text x="100" y="118" text-anchor="middle" font-size="54" font-weight="900" fill="#fff" opacity=".8" font-family="system-ui">?</text>`
    : creatureSVGInner(c);
  const name = showName && !silhouette ? c.name.toLocaleUpperCase('tr-TR') : (silhouette ? '? ? ?' : '');
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="taso-svg ${metal ? 'metal' : ''}" role="img" aria-label="${silhouette ? 'Bilinmeyen taso' : c.name}">
    <defs>
      <radialGradient id="${id}bg" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="${silhouette ? '#ced4da' : el.bg[0]}"/><stop offset="1" stop-color="${silhouette ? '#495057' : el.bg[1]}"/></radialGradient>
      <linearGradient id="${id}rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${rimA}"/><stop offset=".5" stop-color="${rimB}"/><stop offset="1" stop-color="${rimA}"/></linearGradient>
      <linearGradient id="${id}shine" x1="0" y1="0" x2="1" y2="1"><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="${id}sil"><feColorMatrix type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.15  0 0 0 0 0.2  0 0 0 1 0"/></filter>
      <path id="${id}arc" d="M30 112 A70 70 0 0 0 170 112"/>
      <clipPath id="${id}clip"><circle cx="100" cy="100" r="80"/></clipPath>
    </defs>
    <circle cx="100" cy="100" r="98" fill="url(#${id}rim)"/>
    <circle cx="100" cy="100" r="90" fill="none" stroke="${metal ? '#495057' : '#fff'}" stroke-width="2" stroke-dasharray="4 5" opacity=".7"/>
    <circle cx="100" cy="100" r="82" fill="url(#${id}bg)" stroke="${shade(rimB, -30)}" stroke-width="3"/>
    <g clip-path="url(#${id}clip)">
      <g fill="#fff" opacity=".18">${rays}</g>
      <g transform="translate(0 -8)">${art}</g>
      ${metal ? `<rect class="shine" x="-200" y="0" width="400" height="200" fill="url(#${id}shine)"/>` : ''}
    </g>
    ${name ? `<path d="M34 150 A78 78 0 0 0 166 150 L166 180 L34 180Z" fill="none"/><text font-size="15" font-weight="900" font-family="system-ui,Segoe UI,Arial" fill="#fff" stroke="#222" stroke-width="3.5" paint-order="stroke" letter-spacing="1"><textPath href="#${id}arc" startOffset="50%" text-anchor="middle">${name}</textPath></text>` : ''}
    <circle cx="35" cy="56" r="14" fill="#fff" stroke="${el.color}" stroke-width="3"/><text x="35" y="61" font-size="14" text-anchor="middle">${silhouette ? '' : el.icon}</text>
    <text x="165" y="61" font-size="13" text-anchor="middle" font-weight="900" font-family="system-ui" fill="#fff" stroke="#222" stroke-width="3" paint-order="stroke">#${String(c.no).padStart(2, '0')}</text>
    ${silhouette ? '' : stars(level)}
  </svg>`;
}

export function tasoBackSVG() {
  const id = 'b' + (++gid);
  let swirl = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360;
    swirl += `<path transform="rotate(${a} 100 100)" d="M100 100 Q130 70 100 22" stroke="${i % 2 ? '#ffd43b' : '#ff6b6b'}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="taso-svg back" aria-hidden="true">
    <defs><radialGradient id="${id}g"><stop offset="0" stop-color="#4c6ef5"/><stop offset="1" stop-color="#1b2a7a"/></radialGradient></defs>
    <circle cx="100" cy="100" r="98" fill="#ffd43b"/>
    <circle cx="100" cy="100" r="88" fill="url(#${id}g)" stroke="#fff" stroke-width="3"/>
    <g opacity=".85">${swirl}</g>
    <circle cx="100" cy="100" r="34" fill="#fff" stroke="#1b2a7a" stroke-width="4"/>
    <text x="100" y="108" font-size="22" font-weight="900" text-anchor="middle" font-family="system-ui" fill="#e03131">TASO</text>
  </svg>`;
}
