import type { Difficulty } from './pairs';

export const LANGS = ['en', 'hr'] as const;
export type Lang = (typeof LANGS)[number];
export type Language = 'auto' | Lang;

// Each language's name in that language, for the picker.
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  hr: 'Hrvatski',
};

export function detectLang(): Lang {
  const preferred = navigator.languages ?? [navigator.language];
  return preferred.some((l) => l.toLowerCase().startsWith('hr')) ? 'hr' : 'en';
}

const en = {
  title: 'Pairs',
  newGame: 'New game',
  settings: 'Settings',
  cancel: 'Cancel',
  done: 'Done',
  levels: {
    tiny: 'Very easy',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  } as Record<Difficulty, string>,
  colours: ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink'],
  joined: 'joined',
  notJoined: 'not joined',
  undo: 'Undo',
  clear: 'Start over',
  fillAll: 'Now fill every empty square!',
  solved: 'Well done!',
  next: 'Next level',
  changeLevel: 'Change level',
  language: 'Language',
  automatic: 'Automatic',
  sound: 'Sound and vibration',
  on: 'On',
  off: 'Off',
  statistics: 'Statistics',
  solvedColumn: 'Solved',
  allGames: 'All games',
  source: 'Source',
};

export type Strings = typeof en;

const hr: Strings = {
  title: 'Parovi',
  newGame: 'Nova igra',
  settings: 'Postavke',
  cancel: 'Odustani',
  done: 'Gotovo',
  levels: {
    tiny: 'Vrlo lagano',
    easy: 'Lagano',
    medium: 'Srednje',
    hard: 'Teško',
  },
  colours: [
    'Crvena',
    'Plava',
    'Zelena',
    'Žuta',
    'Narančasta',
    'Ljubičasta',
    'Ružičasta',
  ],
  joined: 'spojena',
  notJoined: 'nije spojena',
  undo: 'Vrati',
  clear: 'Ispočetka',
  fillAll: 'Sad popuni sva prazna polja!',
  solved: 'Bravo!',
  next: 'Sljedeća razina',
  changeLevel: 'Promijeni razinu',
  language: 'Jezik',
  automatic: 'Automatski',
  sound: 'Zvuk i vibracija',
  on: 'Uključeno',
  off: 'Isključeno',
  statistics: 'Statistika',
  solvedColumn: 'Riješeno',
  allGames: 'Sve igre',
  source: 'Izvorni kod',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
