import type { SoundPackId } from '../engine/asmrAudio';

export type BoardThemeId = 'sunny-wood' | 'sky-cloud' | 'mint-picnic' | 'peach-arcade';
export type PieceStyleId = 'classic-pop' | 'candy-mint' | 'sun-grape' | 'star-gem';

export interface SoundPackItem {
  id: SoundPackId;
  name: string;
  description: string;
  acousticProfile: string;
  accentColor: string;
  price: number;
}

export interface BoardThemeItem {
  id: BoardThemeId;
  name: string;
  description: string;
  price: number;
  trayBg: string;
  trayShadow: string;
  wellBg: string;
  wellHoverBg: string;
  wellSelectedBg: string;
  swatchPrimary: string;
  swatchSecondary: string;
}

export interface PieceStyleItem {
  id: PieceStyleId;
  name: string;
  description: string;
  price: number;
  playerFill: string;
  playerHighlight: string;
  botFill: string;
  botHighlight: string;
}

export const SOUND_PACKS: SoundPackItem[] = [
  {
    id: 'walnut',
    name: 'Wooden Blocks',
    description: 'Warm chunky toy-wood knocks with a satisfying double tap.',
    acousticProfile: 'Warm · Toy Wood Clack',
    accentColor: '#F59E0B',
    price: 0,
  },
  {
    id: 'mechanical',
    name: 'Poppy Keycaps',
    description: 'Snappy tactile keyboard switch clicks with a bouncy thock.',
    acousticProfile: 'Crisp · Switch Thock',
    accentColor: '#3B82F6',
    price: 40,
  },
  {
    id: 'stone',
    name: 'Smooth Pebbles',
    description: 'Clean mineral brush on pickup and bright ceramic click on drop.',
    acousticProfile: 'Bright · Stone Clink',
    accentColor: '#10B981',
    price: 65,
  },
  {
    id: 'raindrop',
    name: 'Water Droplets',
    description: 'Juicy blooping water drops with a sparkly glass chime.',
    acousticProfile: 'Bloop · Liquid Pop',
    accentColor: '#0EA5E9',
    price: 90,
  },
  {
    id: 'velvet',
    name: 'Soft Bubble Pop',
    description: 'Cushiony muffled plop with gentle ASMR whisper brush.',
    acousticProfile: 'Soft · Bubble Thump',
    accentColor: '#EC4899',
    price: 120,
  },
];

export const BOARD_THEMES: BoardThemeItem[] = [
  {
    id: 'sunny-wood',
    name: 'Honey Maple',
    description: 'Warm sunlit maple board with buttery cream sockets.',
    price: 0,
    trayBg: 'bg-[#FFE5A3]',
    trayShadow: 'shadow-[0_10px_0_#1E293B]',
    wellBg: 'bg-[#FFFDF5]',
    wellHoverBg: 'hover:bg-[#FFF5D6]',
    wellSelectedBg: 'bg-[#FEF08A]',
    swatchPrimary: '#FFE5A3',
    swatchSecondary: '#FFFDF5',
  },
  {
    id: 'sky-cloud',
    name: 'Sky Cloud',
    description: 'Breezy daylight blue board with frosty cloud wells.',
    price: 50,
    trayBg: 'bg-[#BAE6FD]',
    trayShadow: 'shadow-[0_10px_0_#1E293B]',
    wellBg: 'bg-[#F8FDFF]',
    wellHoverBg: 'hover:bg-[#E0F2FE]',
    wellSelectedBg: 'bg-[#FEF08A]',
    swatchPrimary: '#BAE6FD',
    swatchSecondary: '#F8FDFF',
  },
  {
    id: 'mint-picnic',
    name: 'Mint Garden',
    description: 'Fresh spring-mint tray with crisp pistachio sockets.',
    price: 80,
    trayBg: 'bg-[#A7F3D0]',
    trayShadow: 'shadow-[0_10px_0_#1E293B]',
    wellBg: 'bg-[#F5FFF9]',
    wellHoverBg: 'hover:bg-[#DCFCE7]',
    wellSelectedBg: 'bg-[#FEF08A]',
    swatchPrimary: '#A7F3D0',
    swatchSecondary: '#F5FFF9',
  },
  {
    id: 'peach-arcade',
    name: 'Bubblegum Pop',
    description: 'Sweet coral-pink arcade board with bright cream wells.',
    price: 110,
    trayBg: 'bg-[#FBCFE8]',
    trayShadow: 'shadow-[0_10px_0_#1E293B]',
    wellBg: 'bg-[#FFF9FC]',
    wellHoverBg: 'hover:bg-[#FCE7F3]',
    wellSelectedBg: 'bg-[#FEF08A]',
    swatchPrimary: '#FBCFE8',
    swatchSecondary: '#FFF9FC',
  },
];

export const PIECE_STYLES: PieceStyleItem[] = [
  {
    id: 'classic-pop',
    name: 'Coral & Sky',
    description: 'Punchy coral-red X against electric sky-blue O.',
    price: 0,
    playerFill: '#FF5A5F',
    playerHighlight: '#FFA8AB',
    botFill: '#2563EB',
    botHighlight: '#93C5FD',
  },
  {
    id: 'candy-mint',
    name: 'Berry & Mint',
    description: 'Juicy hot-berry pink crosses vs bright emerald rings.',
    price: 45,
    playerFill: '#EC4899',
    playerHighlight: '#F9A8D4',
    botFill: '#10B981',
    botHighlight: '#6EE7B7',
  },
  {
    id: 'sun-grape',
    name: 'Mango & Grape',
    description: 'Sunny tangerine orange X facing royal violet O.',
    price: 75,
    playerFill: '#F97316',
    playerHighlight: '#FDBA74',
    botFill: '#7C3AED',
    botHighlight: '#C4B5FD',
  },
  {
    id: 'star-gem',
    name: 'Ruby & Aqua Gem',
    description: 'Faceted cartoon ruby cross & aqua crystal hexagon.',
    price: 105,
    playerFill: '#EF4444',
    playerHighlight: '#FCA5A5',
    botFill: '#06B6D4',
    botHighlight: '#A5F3FC',
  },
];

export function getBoardTheme(id: BoardThemeId): BoardThemeItem {
  return BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0];
}

export function getPieceStyle(id: PieceStyleId): PieceStyleItem {
  return PIECE_STYLES.find((p) => p.id === id) ?? PIECE_STYLES[0];
}

export function getSoundPack(id: SoundPackId): SoundPackItem {
  return SOUND_PACKS.find((s) => s.id === id) ?? SOUND_PACKS[0];
}
