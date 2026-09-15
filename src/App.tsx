import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, Users, Undo2 } from 'lucide-react';
import { Player, PlayerStatus } from './types';
import { StatusSection } from './components/StatusSection';
import { PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEY = 'team_bench_tracker_roster_v2';

const INITIAL_ROSTER: Player[] = [
  { id: '1', name: 'Camden S.', number: '99', status: 'playing', benchCount: 0 },
  { id: '2', name: 'William R.', number: '67', status: 'playing', benchCount: 0 },
  { id: '3', name: 'Bryson D.', number: '88', status: 'playing', benchCount: 0 },
  { id: '4', name: 'Colt C.', number: '77', status: 'playing', benchCount: 0 },
  { id: '5', name: 'Barrett G.', number: '2', status: 'playing', benchCount: 0 },
  { id: '6', name: 'Nathan B.', number: '17', status: 'playing', benchCount: 0 },
  { id: '7', name: 'Weston H.', number: '22', status: 'playing', benchCount: 0 },
  { id: '8', name: 'Jackson M.', number: '11', status: 'playing', benchCount: 0 },
  { id: '9', name: 'Atlas R.', number: '0', status: 'playing', benchCount: 0 },
];

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_ROSTER;
  });

  const [newPlayerName, setNewPlayerName] = useState('');
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<{ player: Player; index: number } | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch {
      // ignore
    }
  }, [players]);

  // Dismiss undo notification after 4.5 seconds
  useEffect(() => {
    if (!recentlyDeleted) return;
    const timer = setTimeout(() => {
      setRecentlyDeleted(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [recentlyDeleted]);

  // Move player up or down sections
  const handleMovePlayer = (id: string, direction: 'up' | 'down') => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== id) return player;

        let nextStatus: PlayerStatus = player.status;
        if (direction === 'up') {
          if (player.status === 'unavailable') {
            nextStatus = 'bench';
          } else if (player.status === 'bench') {
            nextStatus = 'playing';
          }
        } else if (direction === 'down') {
          if (player.status === 'playing') {
            nextStatus = 'bench';
          } else if (player.status === 'bench') {
            nextStatus = 'unavailable';
          }
        }

        if (nextStatus === player.status) return player;

        // Increment count when moving into the bench
        const shouldIncrementBench = nextStatus === 'bench' && player.status !== 'bench';

        return {
          ...player,
          status: nextStatus,
          benchCount: shouldIncrementBench ? player.benchCount + 1 : player.benchCount,
        };
      })
    );
  };

  // Adjust Bench count manually
  const handleAdjustBenchCount = (id: string, delta: number) => {
    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== id) return player;
        return {
          ...player,
          benchCount: Math.max(0, player.benchCount + delta),
        };
      })
    );
  };

  // Add new player
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    let name = trimmed;
    let number: string | undefined;

    // Check if input format contains "#<number>" or " <number>" at the end
    const match = trimmed.match(/^(.*?)(?:\s+#?(\d+))$/);
    if (match) {
      name = match[1].trim();
      number = match[2];
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      number,
      status: 'playing',
      benchCount: 0,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setNewPlayerName('');
  };

  // Remove player (via swipe-to-delete)
  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx !== -1) {
        setRecentlyDeleted({ player: prev[idx], index: idx });
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  // Restore player if Undo is tapped
  const handleUndoDelete = () => {
    if (!recentlyDeleted) return;
    setPlayers((prev) => {
      const copy = [...prev];
      copy.splice(recentlyDeleted.index, 0, recentlyDeleted.player);
      return copy;
    });
    setRecentlyDeleted(null);
  };

  // New Game: Resets all players to playing and bench count to 0
  const handleConfirmNewGame = () => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        status: 'playing',
        benchCount: 0,
      }))
    );
    setShowNewGameModal(false);
  };

  const playingPlayers = players.filter((p) => p.status === 'playing');
  const benchPlayers = players.filter((p) => p.status === 'bench');
  const unavailablePlayers = players.filter((p) => p.status === 'unavailable');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                Team Bench Tracker
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Use arrows to rotate • Swipe left to delete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              id="new-game-btn"
              type="button"
              onClick={() => setShowNewGameModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-300/80 rounded-lg transition-colors shadow-xs active:scale-98 cursor-pointer"
              title="Start a new game: reset all to Playing at 0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>New Game</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3.5 sm:p-6 flex flex-col gap-4 sm:gap-6">
        {/* Simple Add Player Form */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handleAddPlayer} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              id="player-name-input"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Add player (e.g. Liam T. #23)..."
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
            />
            <button
              id="add-player-btn"
              type="submit"
              disabled={!newPlayerName.trim()}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 rounded-lg transition shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="text-xs text-slate-500 flex items-center gap-2.5 self-center sm:self-auto">
            <span>
              Total: <strong className="text-slate-800">{players.length}</strong>
            </span>
            <span>•</span>
            <span>
              Playing: <strong className="text-emerald-700">{playingPlayers.length}</strong>
            </span>
            <span>•</span>
            <span>
              Bench: <strong className="text-amber-700">{benchPlayers.length}</strong>
            </span>
          </div>
        </div>

        {/* Status Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 flex-1 items-start">
          {/* 1. Playing Section */}
          <StatusSection
            id="section-playing"
            status="playing"
            title="Playing"
            badgeColor="bg-emerald-500"
            players={playingPlayers}
            onRemovePlayer={handleRemovePlayer}
            onMovePlayer={handleMovePlayer}
            onAdjustBenchCount={handleAdjustBenchCount}
            emptyMessage="No players currently playing"
          />

          {/* 2. On The Bench Section */}
          <StatusSection
            id="section-bench"
            status="bench"
            title="On The Bench"
            badgeColor="bg-amber-500"
            players={benchPlayers}
            onRemovePlayer={handleRemovePlayer}
            onMovePlayer={handleMovePlayer}
            onAdjustBenchCount={handleAdjustBenchCount}
            emptyMessage="No players on the bench"
          />

          {/* 3. Unavailable Section */}
          <StatusSection
            id="section-unavailable"
            status="unavailable"
            title="Unavailable"
            badgeColor="bg-slate-400"
            players={unavailablePlayers}
            onRemovePlayer={handleRemovePlayer}
            onMovePlayer={handleMovePlayer}
            onAdjustBenchCount={handleAdjustBenchCount}
            emptyMessage="No unavailable players"
          />
        </div>
      </main>

      {/* Undo Toast Notification */}
      {recentlyDeleted && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>Deleted {recentlyDeleted.player.name}</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 ml-1 cursor-pointer transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* New Game Confirmation Modal */}
      {showNewGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Start New Game?</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              This will set all players to <strong>Playing</strong> and reset all bench counts to <strong>0</strong>.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="cancel-new-game-btn"
                onClick={() => setShowNewGameModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-new-game-btn"
                onClick={handleConfirmNewGame}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs cursor-pointer"
              >
                Start New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
