export const DIFFICULTIES = ['tiny', 'easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type Level = {
  difficulty: Difficulty;
  size: number;
  ends: [number, number][]; // the two dots of each colour
  solution: number[][]; // one way to fill the board, for tests
};

// Each colour's line, starting at the dot it was drawn from. Empty when
// that colour has not been drawn yet.
export type Paths = number[][];

export const adjacent = (size: number, a: number, b: number) => {
  const dr = Math.abs(Math.floor(a / size) - Math.floor(b / size));
  const dc = Math.abs((a % size) - (b % size));
  return dr + dc === 1;
};

const neighbours = (size: number, cell: number) => {
  const r = Math.floor(cell / size);
  const c = cell % size;
  const out: number[] = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
};

// The colour whose dot is on this cell, or -1.
export const dotAt = (level: Level, cell: number) =>
  level.ends.findIndex((e) => e.includes(cell));

export const isConnected = (level: Level, paths: Paths, colour: number) => {
  const path = paths[colour];
  const [a, b] = level.ends[colour];
  return (
    path.length >= 2 &&
    ((path[0] === a && path.at(-1) === b) ||
      (path[0] === b && path.at(-1) === a))
  );
};

export const allConnected = (level: Level, paths: Paths) =>
  level.ends.every((_, k) => isConnected(level, paths, k));

// Cells no line goes through.
export function emptyCells(level: Level, paths: Paths) {
  const used = new Set(paths.flat());
  for (const e of level.ends) e.forEach((c) => used.add(c));
  const cells = level.size * level.size;
  return Array.from({ length: cells }, (_, i) => i).filter((i) => !used.has(i));
}

export const isSolved = (level: Level, paths: Paths) =>
  allConnected(level, paths) && emptyCells(level, paths).length === 0;

// Starts drawing at a cell. On a dot, that colour starts over from it. On
// a line, the line is cut back to that cell and goes on from there.
// Returns the colour being drawn, or -1 when there is nothing to draw.
export function begin(
  level: Level,
  paths: Paths,
  cell: number
): { paths: Paths; colour: number } {
  const dot = dotAt(level, cell);
  if (dot >= 0) {
    return { paths: paths.with(dot, [cell]), colour: dot };
  }
  const colour = paths.findIndex((p) => p.includes(cell));
  if (colour < 0) return { paths, colour };
  const path = paths[colour];
  return {
    paths: paths.with(colour, path.slice(0, path.indexOf(cell) + 1)),
    colour,
  };
}

// Moves the end of a colour's line one cell, to a neighbour. Going back
// over the line rubs it out; going over another colour's line cuts that
// line. Other dots, and anything past the colour's own second dot, block.
// Returns the same paths when the move is not allowed.
export function extend(
  level: Level,
  paths: Paths,
  colour: number,
  cell: number
): Paths {
  const path = paths[colour];
  const head = path.at(-1);
  if (head === undefined || !adjacent(level.size, head, cell)) return paths;

  const back = path.indexOf(cell);
  if (back >= 0) return paths.with(colour, path.slice(0, back + 1));

  if (isConnected(level, paths, colour)) return paths;
  const dot = dotAt(level, cell);
  if (dot >= 0 && dot !== colour) return paths;

  return paths.map((p, k) => {
    if (k === colour) return [...p, cell];
    const at = p.indexOf(cell);
    return at < 0 ? p : p.slice(0, at);
  });
}

// Moves the end of a line toward a cell that may be several cells away,
// one step at a time, as when a finger moves fast. Each step goes along
// the longer way first and tries the other way when that is blocked, so a
// finger cutting a corner still gets round it. Stops when both are blocked.
export function dragTo(
  level: Level,
  paths: Paths,
  colour: number,
  cell: number
): Paths {
  const { size } = level;
  for (let n = 0; n < size * 2; n++) {
    const head = paths[colour].at(-1);
    if (head === undefined || head === cell) break;
    const dr = Math.floor(cell / size) - Math.floor(head / size);
    const dc = (cell % size) - (head % size);
    const down = dr ? head + Math.sign(dr) * size : undefined;
    const across = dc ? head + Math.sign(dc) : undefined;
    const tries =
      Math.abs(dr) >= Math.abs(dc) ? [down, across] : [across, down];
    let moved = paths;
    for (const next of tries) {
      if (next !== undefined && moved === paths) {
        moved = extend(level, paths, colour, next);
      }
    }
    if (moved === paths) break;
    paths = moved;
  }
  return paths;
}

type Config = {
  size: number;
  colours: [number, number];
  shortest: number; // fewest cells in one colour's line
};

const CONFIG: Record<Difficulty, Config> = {
  tiny: { size: 4, colours: [3, 3], shortest: 3 },
  easy: { size: 5, colours: [4, 5], shortest: 3 },
  medium: { size: 6, colours: [5, 6], shortest: 4 },
  hard: { size: 7, colours: [6, 7], shortest: 4 },
};

type Rng = () => number;

// A path through every cell of the board, shuffled by "backbite" moves:
// the path's end steps onto a neighbour that is already on the path, and
// the loop this makes is opened up on the other side. Starting from a
// zigzag, many such moves give a random-looking winding path.
function winding(size: number, rng: Rng) {
  const path: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      path.push(r * size + (r % 2 ? size - 1 - c : c));
    }
  }
  for (let n = size * size * 30; n > 0; n--) {
    if (rng() < 0.5) path.reverse();
    const end = path[path.length - 1];
    const options = neighbours(size, end).filter(
      (c) => c !== path[path.length - 2]
    );
    const to = options[Math.floor(rng() * options.length)];
    const at = path.indexOf(to);
    const tail = path.splice(at + 1).reverse();
    path.push(...tail);
  }
  return path;
}

const between = ([lo, hi]: [number, number], rng: Rng) =>
  lo + Math.floor(rng() * (hi - lo + 1));

function attempt(difficulty: Difficulty, rng: Rng): Level | undefined {
  const cfg = CONFIG[difficulty];
  const { size } = cfg;
  const path = winding(size, rng);
  const colours = between(cfg.colours, rng);

  // Cut the path into pieces, each at least `shortest` long.
  const spare = path.length - colours * cfg.shortest;
  if (spare < 0) return undefined;
  const cuts = Array.from({ length: colours - 1 }, () =>
    Math.floor(rng() * (spare + 1))
  ).sort((a, b) => a - b);
  const lengths = [...cuts, spare].map(
    (c, k) => c - (k ? cuts[k - 1] : 0) + cfg.shortest
  );

  const solution: number[][] = [];
  let at = 0;
  for (const length of lengths) {
    solution.push(path.slice(at, at + length));
    at += length;
  }

  // A colour whose dots touch could be joined in one step, leaving holes
  // the kid can't explain. A line that never bends is too easy to see.
  // A very long line is mostly a blob of zigzags, which is no fun to fill.
  for (const line of solution) {
    if (line.length > size * 2) return undefined;
    if (adjacent(size, line[0], line.at(-1)!)) return undefined;
    const row = (x: number) => Math.floor(x / size);
    const col = (x: number) => x % size;
    const straight =
      line.every((x) => row(x) === row(line[0])) ||
      line.every((x) => col(x) === col(line[0]));
    if (straight && line.length > 3) return undefined;
  }

  return {
    difficulty,
    size,
    ends: solution.map((line) => [line[0], line.at(-1)!]),
    solution,
  };
}

const sameDots = (a: Level, b: Level) =>
  a.ends.length === b.ends.length &&
  a.ends.every((e) => b.ends.some((f) => f.includes(e[0])));

// Makes a random level that can always be solved, since it is cut from a
// path that fills the whole board. The kid's answer doesn't have to match
// it: any lines that join every pair and fill the board win. A level with
// the same dots as `previous` is thrown away, so the next level never
// looks like the one just played.
export function generate(
  difficulty: Difficulty,
  rng: Rng,
  previous?: Level
): Level {
  for (;;) {
    const level = attempt(difficulty, rng);
    if (level && !(previous && sameDots(level, previous))) return level;
  }
}
