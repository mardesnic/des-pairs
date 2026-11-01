import { useRef } from 'react';

import { COLOURS } from '../lib/colours';
import { isConnected, type Level, type Paths } from '../lib/pairs';

// The board is drawn in board units: each cell is 1×1, so a cell's centre
// is at its column and row plus a half.
export function Board({
  level,
  paths,
  onDown,
  onMove,
  onUp,
}: {
  level: Level;
  paths: Paths;
  onDown: (cell: number) => void;
  onMove: (cell: number) => void;
  onUp: () => void;
}) {
  const { size } = level;
  const ref = useRef<SVGSVGElement>(null);
  const last = useRef(-1);

  const cellAt = (e: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const c = Math.floor(((e.clientX - box.left) / box.width) * size);
    const r = Math.floor(((e.clientY - box.top) / box.height) * size);
    if (r < 0 || r >= size || c < 0 || c >= size) return -1;
    return r * size + c;
  };

  const x = (cell: number) => (cell % size) + 0.5;
  const y = (cell: number) => Math.floor(cell / size) + 0.5;

  return (
    <svg
      ref={ref}
      className='board'
      viewBox={`0 0 ${size} ${size}`}
      onPointerDown={(e) => {
        const cell = cellAt(e);
        if (cell < 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        last.current = cell;
        onDown(cell);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const cell = cellAt(e);
        if (cell < 0 || cell === last.current) return;
        last.current = cell;
        onMove(cell);
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {Array.from({ length: size * size }, (_, cell) => (
        <rect
          key={cell}
          className='cell'
          x={x(cell) - 0.46}
          y={y(cell) - 0.46}
          width={0.92}
          height={0.92}
          rx={0.14}
        />
      ))}

      {paths.map((path, k) =>
        path.map((cell) => (
          <rect
            key={`${k}-${cell}`}
            className='fill'
            x={x(cell) - 0.46}
            y={y(cell) - 0.46}
            width={0.92}
            height={0.92}
            rx={0.14}
            fill={COLOURS[k]}
          />
        ))
      )}

      {paths.map(
        (path, k) =>
          path.length > 1 && (
            <polyline
              key={k}
              className='line'
              points={path.map((c) => `${x(c)},${y(c)}`).join(' ')}
              stroke={COLOURS[k]}
            />
          )
      )}

      {level.ends.map((ends, k) =>
        ends.map((cell) => (
          <g
            key={cell}
            className={isConnected(level, paths, k) ? 'dot dot--joined' : 'dot'}
            style={{ transformOrigin: `${x(cell)}px ${y(cell)}px` }}
          >
            <circle cx={x(cell)} cy={y(cell)} r={0.34} fill={COLOURS[k]} />
            <circle
              className='dot__shine'
              cx={x(cell) - 0.1}
              cy={y(cell) - 0.11}
              r={0.08}
            />
          </g>
        ))
      )}
    </svg>
  );
}
