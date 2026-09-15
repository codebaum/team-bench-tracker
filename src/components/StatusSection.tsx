import React from 'react';
import { Player, PlayerStatus } from '../types';
import { PlayerCard } from './PlayerCard';

interface StatusSectionProps {
  id: string;
  status: PlayerStatus;
  title: string;
  badgeColor: string;
  players: Player[];
  onRemovePlayer: (id: string) => void;
  onMovePlayer: (id: string, direction: 'up' | 'down') => void;
  onAdjustBenchCount: (id: string, delta: number) => void;
  emptyMessage: string;
}

export const StatusSection: React.FC<StatusSectionProps> = ({
  id,
  status,
  title,
  badgeColor,
  players,
  onRemovePlayer,
  onMovePlayer,
  onAdjustBenchCount,
  emptyMessage,
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col rounded-2xl border p-3.5 sm:p-4 min-h-[220px] transition-colors ${
        status === 'unavailable'
          ? 'bg-slate-100/50 border-slate-200'
          : 'bg-white border-slate-200/90 shadow-xs'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${badgeColor}`} />
          <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800 uppercase">
            {title}
          </h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
          {players.length}
        </span>
      </div>

      {/* Players List */}
      <div className="flex flex-col gap-2 flex-1">
        {players.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl text-xs sm:text-sm text-center text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onRemovePlayer={onRemovePlayer}
              onMovePlayer={onMovePlayer}
              onAdjustBenchCount={onAdjustBenchCount}
            />
          ))
        )}
      </div>
    </div>
  );
};
