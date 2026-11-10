import type { Language } from './i18n';
import { isSolved, type Difficulty, type Level, type Paths } from './pairs';

export type Game = {
  level: Level;
  paths: Paths;
  solved: boolean;
};

export type Settings = { language: Language; sound: boolean };

export const initialSettings: Settings = { language: 'auto', sound: true };

export type Stats = { [D in Difficulty]: { solved: number } };

export const initialStats: Stats = {
  tiny: { solved: 0 },
  easy: { solved: 0 },
  medium: { solved: 0 },
  hard: { solved: 0 },
};

export const newGame = (level: Level): Game => ({
  level,
  paths: level.ends.map(() => []),
  solved: false,
});

export const withPaths = (game: Game, paths: Paths): Game =>
  game.solved || paths === game.paths
    ? game
    : { ...game, paths, solved: isSolved(game.level, paths) };

export const recordWin = (stats: Stats, game: Game): Stats => ({
  ...stats,
  [game.level.difficulty]: { solved: stats[game.level.difficulty].solved + 1 },
});
