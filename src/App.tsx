import { useEffect, useRef, useState } from 'react';

import { Board } from './components/Board';
import { Confetti } from './components/Confetti';
import { Icon } from './components/Icon';
import { NewGame, SettingsView } from './components/Menu';
import {
  initialSettings,
  initialStats,
  newGame,
  recordWin,
  withPaths,
  type Game,
  type Settings,
  type Stats,
} from './lib/game';
import { COLOURS } from './lib/colours';
import { STRINGS, detectLang } from './lib/i18n';
import {
  allConnected,
  begin,
  dragTo,
  emptyCells,
  generate,
  isConnected,
  type Difficulty,
  type Paths,
} from './lib/pairs';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'new' | 'settings';

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [store, setStore] = useStoredState<{ game?: Game }>('pairs', {});
  const { game } = store;
  const [settings, setSettings] = useStoredState<Settings>(
    'pairs-settings',
    initialSettings
  );
  const [stats, setStats] = useStoredState<Stats>('pairs-stats', initialStats);
  const [view, setView] = useState<View>(game ? 'play' : 'new');
  const [history, setHistory] = useState<Paths[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  // The colour being drawn, the lines from before this stroke, and the
  // lines now. Moves can come faster than renders, so each one builds on
  // these lines rather than on the last render's.
  const stroke = useRef<{ colour: number; before: Paths; paths: Paths }>(
    undefined
  );
  useWakeLock();

  const lang = settings.language === 'auto' ? detectLang() : settings.language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  const update = (paths: Paths) => {
    if (!game) return;
    const next = withPaths(game, paths);
    if (next === game) return;
    if (next.solved) {
      // The stroke is over: moves after the win would rub lines out.
      stroke.current = undefined;
      setStats(recordWin(stats, next));
      setCelebrating(true);
    }
    setStore({ game: next });
  };

  const start = (difficulty: Difficulty) => {
    // The last level, if it was the same size, so the new one isn't alike.
    const previous =
      game?.level.difficulty === difficulty ? game.level : undefined;
    setStore({ game: newGame(generate(difficulty, Math.random, previous)) });
    setHistory([]);
    setView('play');
  };

  const down = (cell: number) => {
    if (!game || game.solved) return;
    const { paths, colour } = begin(game.level, game.paths, cell);
    if (colour < 0) return;
    stroke.current = { colour, before: game.paths, paths };
    update(paths);
  };

  const move = (cell: number) => {
    const s = stroke.current;
    if (!game || !s) return;
    const paths = dragTo(game.level, s.paths, s.colour, cell);
    if (paths === s.paths) return;
    s.paths = paths;
    update(paths);
  };

  const up = () => {
    const s = stroke.current;
    stroke.current = undefined;
    if (s && s.before !== s.paths) {
      setHistory((h) => [...h, s.before]);
    }
  };

  const undo = () => {
    if (!game || game.solved || !history.length) return;
    setStore({ game: { ...game, paths: history.at(-1)! } });
    setHistory((h) => h.slice(0, -1));
  };

  const clear = () => {
    if (!game || game.solved) return;
    setHistory((h) => [...h, game.paths]);
    setStore({ game: newGame(game.level) });
  };

  const drawn = !!game?.paths.some((p) => p.length);
  // Every pair is joined but squares are left: show which ones, or the
  // kid can't tell why the level isn't done.
  const holes =
    game && !game.solved && allConnected(game.level, game.paths)
      ? emptyCells(game.level, game.paths)
      : [];

  return (
    <main className={view === 'play' && game ? 'app app--play' : 'app'}>
      <header className='header'>
        <h1>{t.title}</h1>
        <div className='header__actions'>
          {view === 'play' ? (
            <>
              <button
                className='button button--small'
                onClick={() => setView('new')}
              >
                {t.newGame}
              </button>
              <button
                className='button button--small'
                onClick={() => setView('settings')}
              >
                {t.settings}
              </button>
            </>
          ) : (
            game && (
              <button
                className='button button--small'
                onClick={() => setView('play')}
              >
                {view === 'new' ? t.cancel : t.done}
              </button>
            )
          )}
        </div>
      </header>

      {view === 'new' && <NewGame onStart={start} t={t} />}
      {view === 'settings' && (
        <SettingsView
          settings={settings}
          setSettings={setSettings}
          stats={stats}
          t={t}
        />
      )}

      {view === 'play' && game && (
        <>
          <div className='stage'>
            <Board
              level={game.level}
              paths={game.paths}
              holes={holes}
              onDown={down}
              onMove={move}
              onUp={up}
            />
          </div>

          {game.solved ? (
            <section className='card solved'>
              <h2>{t.solved}</h2>
              <div className='solved__actions'>
                <button
                  className='button'
                  onClick={() => start(game.level.difficulty)}
                >
                  {t.next}
                </button>
                <button
                  className='button button--secondary'
                  onClick={() => setView('new')}
                >
                  {t.changeLevel}
                </button>
              </div>
            </section>
          ) : (
            <div className='bar'>
              <ul className='pairs'>
                {game.level.ends.map((_, k) => {
                  const joined = isConnected(game.level, game.paths, k);
                  return (
                    <li
                      key={k}
                      className={joined ? 'pair pair--joined' : 'pair'}
                      style={{ color: COLOURS[k] }}
                      aria-label={`${t.colours[k]}: ${joined ? t.joined : t.notJoined}`}
                    />
                  );
                })}
              </ul>
              <div className='tools'>
                <button
                  className='tool'
                  onClick={undo}
                  disabled={!history.length}
                  aria-label={t.undo}
                >
                  <Icon name='undo' />
                </button>
                <button
                  className='tool'
                  onClick={clear}
                  disabled={!drawn}
                  aria-label={t.clear}
                >
                  <Icon name='clear' />
                </button>
              </div>
              {holes.length > 0 && <p className='hint'>{t.fillBoard}</p>}
            </div>
          )}
        </>
      )}

      {view === 'settings' && (
        <footer className='footer'>
          <a href='https://github.com/mardesnic/des-pairs'>{t.source}</a>
        </footer>
      )}
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}
