import React, { useState } from 'react';
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
  onDropPlayer: (status: PlayerStatus) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  draggedPlayerId: string | null;
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
  onDropPlayer,
  onDragStart,
  onDragEnd,
  draggedPlayerId,
  emptyMessage,
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    onDropPlayer(status);
  };

  return (
    <div
      id={id}
      data-status-section={status}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl border p-3.5 sm:p-4 min-h-[220px] transition-all duration-150 ${
        isOver
          ? 'bg-slate-100 border-slate-500 ring-2 ring-slate-400/30 shadow-md'
          : status === 'unavailable'
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
          <div
            className={`flex flex-1 items-center justify-center p-6 border-2 border-dashed rounded-xl text-xs sm:text-sm text-center transition-colors ${
              isOver
                ? 'border-slate-400 text-slate-700 bg-slate-100/80 font-medium'
                : 'border-slate-200 text-slate-400'
            }`}
          >
            {isOver ? 'Drop player here' : emptyMessage}
          </div>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onRemovePlayer={onRemovePlayer}
              onMovePlayer={onMovePlayer}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isBeingDragged={draggedPlayerId === player.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
