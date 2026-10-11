// Tamamen özgün yaratıklar. Hiçbir telifli karakter/isim kullanılmaz.

export const ELEMENTS = {
  alev:   { id: 'alev',   name: 'Alev',   icon: '🔥', color: '#ff6b35', bg: ['#ffd29a', '#ff7a3d'] },
  dalga:  { id: 'dalga',  name: 'Dalga',  icon: '🌊', color: '#2f8cff', bg: ['#bfe3ff', '#3a8dff'] },
  yaprak: { id: 'yaprak', name: 'Yaprak', icon: '🍃', color: '#3cb44b', bg: ['#d8f7c2', '#46b34f'] },
  simsek: { id: 'simsek', name: 'Şimşek', icon: '⚡', color: '#f5c400', bg: ['#fff6b0', '#f2b600'] },
  kaya:   { id: 'kaya',   name: 'Kaya',   icon: '🪨', color: '#a0785a', bg: ['#eadbc8', '#9a7254'] },
  ruzgar: { id: 'ruzgar', name: 'Rüzgar', icon: '🌪️', color: '#5fd3c6', bg: ['#e2fffb', '#58c9bd'] },
  golge:  { id: 'golge',  name: 'Gölge',  icon: '🌑', color: '#6c4ab6', bg: ['#cdb8ff', '#4b2f8f'] },
  isik:   { id: 'isik',   name: 'Işık',   icon: '✨', color: '#ffb6e1', bg: ['#fffbe6', '#ffc6ea'] },
};

// Avantaj tablosu: anahtar element, listedeki elementlere karşı güçlüdür.
export const ADVANTAGES = {
  alev:   ['yaprak', 'ruzgar'],
  dalga:  ['alev', 'kaya'],
  yaprak: ['dalga', 'kaya'],
  simsek: ['dalga', 'ruzgar'],
  kaya:   ['alev', 'simsek'],
  ruzgar: ['yaprak', 'golge'],
  golge:  ['simsek', 'yaprak'],
  isik:   ['golge', 'alev'],
};

export const RARITIES = {
  siradan:  { id: 'siradan',  name: 'Sıradan',  order: 0, color: '#9aa4b2', dropWeight: 58, xp: 10 },
  nadir:    { id: 'nadir',    name: 'Nadir',    order: 1, color: '#3d8bff', dropWeight: 26, xp: 20 },
  epik:     { id: 'epik',     name: 'Epik',     order: 2, color: '#b04dff', dropWeight: 10, xp: 40 },
  efsanevi: { id: 'efsanevi', name: 'Efsanevi', order: 3, color: '#ffb300', dropWeight: 4,  xp: 80 },
  metal:    { id: 'metal',    name: 'Metal',    order: 4, color: '#c9d3dc', dropWeight: 2,  xp: 120 },
};

// Temel statlar: guc (vuruş gücü), agirlik (çevrilmeye direnç), sans (kritik/şans)
const BASE = {
  siradan:  { guc: 40, agirlik: 30, sans: 8 },
  nadir:    { guc: 50, agirlik: 38, sans: 10 },
  epik:     { guc: 60, agirlik: 46, sans: 12 },
  efsanevi: { guc: 72, agirlik: 55, sans: 15 },
  metal:    { guc: 85, agirlik: 70, sans: 12 },
};

// [id, ad, element, nadirlik, stat-ayarı [guc, agirlik, sans], dna, açıklama]
const RAW = [
  ['kivilcik',   'Kıvılcık',    'alev',   'siradan',  [2, -2, 2],  { body: 'round', ears: 'flame',  eyes: 'big',    mouth: 'smile', pattern: 'belly',   main: '#ff7b39', accent: '#ffd166' }, 'Kuyruğundaki kıvılcımla geceleri yolunu bulur.'],
  ['kozcuk',     'Közcük',      'alev',   'siradan',  [-1, 3, 0],  { body: 'wide',  ears: 'round',  eyes: 'sleepy', mouth: 'smile', pattern: 'spots',   main: '#d9480f', accent: '#ffa94d' }, 'Mangal közünde uyumayı çok sever.'],
  ['alazkurt',   'Alazkurt',    'alev',   'nadir',    [4, -2, 1],  { body: 'tall',  ears: 'pointy', eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#f03e3e', accent: '#ffe066' }, 'Bozkırda alev izi bırakarak koşar.'],
  ['kordag',     'Kordağ',      'alev',   'epik',     [3, 3, 0],   { body: 'wide',  ears: 'horns',  eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#a61e4d', accent: '#ff922b' }, 'Sırtındaki küçük yanardağ öfkelenince püskürür.'],
  ['damlacik',   'Damlacık',    'dalga',  'siradan',  [0, 0, 3],   { body: 'drop',  ears: 'none',   eyes: 'big',    mouth: 'o',     pattern: 'belly',   main: '#4dabf7', accent: '#d0ebff' }, 'Yağmur sonrası su birikintilerinde zıplar.'],
  ['kopukbas',   'Köpükbaş',    'dalga',  'siradan',  [-2, 4, 1],  { body: 'round', ears: 'fins',   eyes: 'sleepy', mouth: 'smile', pattern: 'spots',   main: '#1c7ed6', accent: '#e7f5ff' }, 'Başındaki köpükleri asla patlamaz.'],
  ['girdapci',   'Girdapçı',    'dalga',  'nadir',    [3, 0, 1],   { body: 'tall',  ears: 'fins',   eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#1864ab', accent: '#74c0fc' }, 'Dönerek küçük girdaplar yaratır.'],
  ['derinkral',  'Derinkral',   'dalga',  'efsanevi', [2, 4, 1],   { body: 'wide',  ears: 'horns',  eyes: 'one',    mouth: 'fang',  pattern: 'belly',   main: '#0b3d91', accent: '#63e6be', wings: true }, 'Okyanusun en dibinde hüküm süren kadim kral.'],
  ['filizik',    'Filizik',     'yaprak', 'siradan',  [1, -1, 2],  { body: 'round', ears: 'leaf',   eyes: 'big',    mouth: 'smile', pattern: 'none',    main: '#69db7c', accent: '#d3f9d8' }, 'Başındaki filiz güneşe döner.'],
  ['yosuncuk',   'Yosuncuk',    'yaprak', 'siradan',  [-2, 3, 2],  { body: 'wide',  ears: 'round',  eyes: 'sleepy', mouth: 'o',     pattern: 'spots',   main: '#2b8a3e', accent: '#a9e34b' }, 'Nemli taşların üstünde saatlerce uyur.'],
  ['dikenli',    'Dikenli',     'yaprak', 'nadir',    [2, 2, 0],   { body: 'star',  ears: 'pointy', eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#37b24d', accent: '#ffd43b' }, 'Dikenleriyle kendini korur, aslında çok utangaçtır.'],
  ['ormanata',   'Ormanata',    'yaprak', 'epik',     [0, 5, 1],   { body: 'tall',  ears: 'horns',  eyes: 'sleepy', mouth: 'smile', pattern: 'belly',   main: '#2f9e44', accent: '#8ce99a' }, 'Boynuzlarında kuşlar yuva yapar.'],
  ['cizirti',    'Cızırtı',     'simsek', 'siradan',  [3, -3, 3],  { body: 'round', ears: 'pointy', eyes: 'big',    mouth: 'smile', pattern: 'stripes', main: '#ffd43b', accent: '#fff3bf' }, 'Dokunanı hafifçe çarpar, sonra kıkırdar.'],
  ['sarjor',     'Şarjör',      'simsek', 'nadir',    [4, -1, 2],  { body: 'drop',  ears: 'horns',  eyes: 'angry',  mouth: 'o',     pattern: 'spots',   main: '#fab005', accent: '#495057' }, 'Kendini fırtına bulutlarında şarj eder.'],
  ['yildirimkus','Yıldırımkuş', 'simsek', 'epik',     [5, -2, 2],  { body: 'tall',  ears: 'pointy', eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#f59f00', accent: '#4dabf7', wings: true }, 'Kanat çırptığında gökyüzü gürler.'],
  ['cakilcik',   'Çakılcık',    'kaya',   'siradan',  [-1, 4, 0],  { body: 'wide',  ears: 'none',   eyes: 'sleepy', mouth: 'smile', pattern: 'spots',   main: '#a9917a', accent: '#e9ddd0' }, 'Dere yatağında yuvarlanarak gezer.'],
  ['kayabas',    'Kayabaş',     'kaya',   'nadir',    [1, 5, -1],  { body: 'round', ears: 'horns',  eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#7d5a44', accent: '#c0a58f' }, 'Kafa atmayı çok sever, hiç başı ağrımaz.'],
  ['dagdelen',   'Dağdelen',    'kaya',   'epik',     [4, 4, -1],  { body: 'wide',  ears: 'horns',  eyes: 'one',    mouth: 'fang',  pattern: 'belly',   main: '#5c4033', accent: '#ffa94d' }, 'Tek gözüyle dağların içini görebilir.'],
  ['esintik',    'Esintik',     'ruzgar', 'siradan',  [1, -3, 4],  { body: 'drop',  ears: 'leaf',   eyes: 'big',    mouth: 'o',     pattern: 'none',    main: '#63e6be', accent: '#e6fcf5', wings: true }, 'Bahar esintisiyle şehir şehir dolaşır.'],
  ['firtinakanat','Fırtınakanat','ruzgar','nadir',    [3, -2, 3],  { body: 'tall',  ears: 'pointy', eyes: 'angry',  mouth: 'smile', pattern: 'stripes', main: '#20c997', accent: '#ffffff', wings: true }, 'Kanatlarıyla küçük hortumlar çıkarır.'],
  ['golgecik',   'Gölgecik',    'golge',  'nadir',    [2, 0, 4],   { body: 'drop',  ears: 'pointy', eyes: 'one',    mouth: 'fang',  pattern: 'none',    main: '#7048e8', accent: '#e5dbff' }, 'Senin gölgene saklanıp seni takip eder.'],
  ['gecepence',  'Gecepençe',   'golge',  'epik',     [5, 0, 2],   { body: 'tall',  ears: 'pointy', eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#5f3dc4', accent: '#ff6b6b' }, 'Ay doğduğunda pençeleri parlar.'],
  ['ayboga',     'Ayboğa',      'golge',  'efsanevi', [4, 2, 3],   { body: 'wide',  ears: 'horns',  eyes: 'angry',  mouth: 'fang',  pattern: 'belly',   main: '#3b2a6b', accent: '#e9ecef', wings: true }, 'Hilal boynuzlu, gecenin efsanevi bekçisi.'],
  ['parilti',    'Parıltı',     'isik',   'nadir',    [0, 0, 6],   { body: 'star',  ears: 'none',   eyes: 'big',    mouth: 'smile', pattern: 'none',    main: '#ffd8a8', accent: '#fff9db' }, 'Mutlu olunca etrafa yıldız tozu saçar.'],
  ['safakkus',   'Şafakkuş',    'isik',   'epik',     [2, 0, 5],   { body: 'round', ears: 'leaf',   eyes: 'sleepy', mouth: 'o',     pattern: 'belly',   main: '#fcc2d7', accent: '#fff3bf', wings: true }, 'Her sabah güneşi ilk o selamlar.'],
  ['gunesejder', 'Güneşejder',  'isik',   'efsanevi', [6, 2, 2],   { body: 'tall',  ears: 'horns',  eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#ffa94d', accent: '#fff3bf', wings: true }, 'Pullarında güneş ışığı saklayan efsanevi ejder.'],
  ['tuncejder',  'Tunç Ejder',  'alev',   'metal',    [4, 2, 0],   { body: 'wide',  ears: 'horns',  eyes: 'angry',  mouth: 'fang',  pattern: 'stripes', main: '#b0703c', accent: '#ffd8a8', wings: true }, 'Tunçtan dökülmüş, çevirme oyunlarının kâbusu.'],
  ['gumuskanat', 'Gümüş Kanat', 'ruzgar', 'metal',    [6, -2, 2],  { body: 'tall',  ears: 'pointy', eyes: 'big',    mouth: 'smile', pattern: 'none',    main: '#adb5bd', accent: '#f8f9fa', wings: true }, 'Rüzgârı keserek iner, tasoları havaya uçurur.'],
  ['celikdev',   'Çelik Dev',   'kaya',   'metal',    [0, 8, 0],   { body: 'round', ears: 'horns',  eyes: 'one',    mouth: 'fang',  pattern: 'belly',   main: '#6c757d', accent: '#dee2e6' }, 'Kıpırdatması neredeyse imkânsız çelik taso.'],
];

export const CREATURES = RAW.map(([id, name, element, rarity, adj, dna, desc], i) => {
  const b = BASE[rarity];
  return {
    id, no: i + 1, name, element, rarity, dna, desc,
    stats: { guc: b.guc + adj[0], agirlik: b.agirlik + adj[1], sans: b.sans + adj[2] },
  };
});

export const CREATURE_MAP = Object.fromEntries(CREATURES.map((c) => [c.id, c]));
export const getCreature = (id) => CREATURE_MAP[id];
