import { describe, expect, it } from 'vitest';

import {
  adjacent,
  begin,
  DIFFICULTIES,
  dragTo,
  extend,
  generate,
  isConnected,
  isSolved,
  type Level,
} from './pairs';

// Deterministic stand-in for Math.random.
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// A 4×4 board with cells numbered
//    0  1  2  3
//    4  5  6  7
//    8  9 10 11
//   12 13 14 15
// red joins 0 and 3 along the top, blue 4 and 15 the long way round.
const sample: Level = {
  difficulty: 'tiny',
  size: 4,
  ends: [
    [0, 3],
    [4, 15],
  ],
  solution: [
    [0, 1, 2, 3],
    [4, 5, 6, 7, 11, 10, 9, 8, 12, 13, 14, 15],
  ],
};

const none = () => sample.ends.map(() => [] as number[]);

const draw = (cells: number[], colour = 0) => {
  let { paths } = begin(sample, none(), cells[0]);
  for (const cell of cells.slice(1))
    paths = extend(sample, paths, colour, cell);
  return paths;
};

describe('drawing', () => {
  it('starts a line on a dot', () => {
    expect(begin(sample, none(), 3)).toEqual({ paths: [[3], []], colour: 0 });
  });

  it('does nothing on an empty cell', () => {
    expect(begin(sample, none(), 5).colour).toBe(-1);
  });

  it('cuts a line back to where it is picked up', () => {
    const { paths, colour } = begin(sample, draw([0, 1, 2]), 1);
    expect(colour).toBe(0);
    expect(paths[0]).toEqual([0, 1]);
  });

  it('only moves to a neighbour', () => {
    expect(draw([0, 2])[0]).toEqual([0]);
    expect(draw([0, 5])[0]).toEqual([0]);
  });

  it('rubs out when going back', () => {
    expect(draw([0, 1, 2, 1])[0]).toEqual([0, 1]);
  });

  it('is blocked by another colour’s dot', () => {
    expect(draw([0, 4])[0]).toEqual([0]);
  });

  it('stops at its own second dot', () => {
    const paths = draw([0, 1, 2, 3, 7]);
    expect(paths[0]).toEqual([0, 1, 2, 3]);
    expect(isConnected(sample, paths, 0)).toBe(true);
  });

  it('cuts through another colour’s line', () => {
    let { paths } = begin(sample, none(), 4);
    paths = extend(sample, paths, 1, 5);
    paths = extend(sample, paths, 1, 6);
    paths = begin(sample, paths, 0).paths;
    paths = extend(sample, paths, 0, 1);
    paths = extend(sample, paths, 0, 5);
    expect(paths).toEqual([[0, 1, 5], [4]]);
  });

  it('walks a fast drag one cell at a time', () => {
    const { paths } = begin(sample, none(), 0);
    expect(dragTo(sample, paths, 0, 3)[0]).toEqual([0, 1, 2, 3]);
  });

  it('gets round a corner the finger cut', () => {
    // From 5 toward 10: down is red's dot on 9, so it goes right to 6.
    let { paths } = begin(sample, none(), 4);
    paths = extend(sample, paths, 1, 5);
    paths = [[0, 1, 2, 3, 7, 11, 10, 9], paths[1]];
    const moved = dragTo(
      {
        ...sample,
        ends: [
          [0, 9],
          [4, 15],
        ],
      },
      paths,
      1,
      10
    );
    expect(moved[1]).toEqual([4, 5, 6, 10]);
  });

  it('stops a fast drag at the first block', () => {
    const { paths } = begin(sample, none(), 0);
    expect(dragTo(sample, paths, 0, 12)[0]).toEqual([0]);
  });
});

describe('winning', () => {
  it('is won once every pair is joined, with empty cells left', () => {
    const paths = [
      [0, 1, 2, 3],
      [4, 5, 6, 7, 11, 15],
    ];
    expect(isSolved(sample, paths)).toBe(true);
  });

  it('is not won while a pair is apart', () => {
    expect(
      isSolved(sample, [
        [0, 1, 2, 3],
        [4, 5],
      ])
    ).toBe(false);
  });

  it('counts a line drawn from either dot', () => {
    const paths = [[3, 2, 1, 0], [...sample.solution[1]].reverse()];
    expect(isSolved(sample, paths)).toBe(true);
  });
});

describe('generate', () => {
  const levels = DIFFICULTIES.flatMap((d) =>
    Array.from({ length: 40 }, (_, n) => generate(d, seeded(n + 1)))
  );

  it('grows from 4×4 to 7×7', () => {
    expect(DIFFICULTIES.map((d) => generate(d, seeded()).size)).toEqual([
      4, 5, 6, 7,
    ]);
  });

  it('makes levels its own solution wins', () => {
    for (const level of levels) {
      expect(isSolved(level, level.solution)).toBe(true);
      for (const line of level.solution) {
        line.slice(1).forEach((c, i) => {
          expect(adjacent(level.size, line[i], c)).toBe(true);
        });
      }
    }
  });

  it('never puts a pair of dots side by side', () => {
    for (const level of levels) {
      for (const [a, b] of level.ends) {
        expect(adjacent(level.size, a, b)).toBe(false);
      }
    }
  });

  it('never makes a line shorter than three cells', () => {
    for (const level of levels) {
      for (const line of level.solution) {
        expect(line.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('never has the same dots as the level before', () => {
    for (const d of DIFFICULTIES) {
      const rng = seeded(3);
      let level = generate(d, rng);
      for (let n = 0; n < 100; n++) {
        const next = generate(d, rng, level);
        expect(next.ends).not.toEqual(level.ends);
        level = next;
      }
    }
  });
});
