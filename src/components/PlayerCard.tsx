import React, { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onRemovePlayer: (id: string) => void;
  onMovePlayer: (id: string, direction: 'up' | 'down') => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  isBeingDragged?: boolean;
}

const BUTTON_WIDTH = 72; // px per action button

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onRemovePlayer,
  onMovePlayer,
  onDragStart,
  onDragEnd,
  isBeingDragged,
}) => {
  const isUnavailable = player.status === 'unavailable';
  const isPlaying = player.status === 'playing';
  const isBench = player.status === 'bench';

  // Number of options: 3 for Bench (Play, Remove, Delete), 2 for Playing (Bench, Delete) and Unavailable (Bench, Delete)
  const revealWidth = isBench ? BUTTON_WIDTH * 3 : BUTTON_WIDTH * 2;

  // Mobile Touch Swipe-to-action states (Swipe Left reveals the options; NO swipe-to-delete)
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  // Parse name and number cleanly
  let displayName = player.name;
  let displayNumber = player.number ? String(player.number).replace(/^#/, '') : '';

  if (!displayNumber) {
    const match = player.name.match(/^(.*?)(?:\s+#(\d+))$/);
    if (match) {
      displayName = match[1].trim();
      displayNumber = match[2];
    }
  } else {
    displayName = displayName.replace(/\s+#?\d+$/, '').trim();
  }

  // Delete is only triggered by explicitly tapping the Delete button
  const triggerDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onRemovePlayer(player.id);
    }, 200);
  };

  // --- Mobile Touch Swipe Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentOffsetRef.current = offsetX;
    isHorizontalSwipeRef.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = startXRef.current - touchX;
    const deltaY = startYRef.current - touchY;

    // Detect gesture orientation on initial movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    // If vertical scrolling, don't hijack touch
    if (isHorizontalSwipeRef.current === false) return;

    // Swiping left means deltaX > 0 (finger moves to left)
    const rawOffset = currentOffsetRef.current + deltaX;

    if (rawOffset < 0) {
      // Small resistance when pulling right
      setOffsetX(rawOffset * 0.2);
    } else if (rawOffset > revealWidth) {
      // Elastic resistance past reveal width so it never deletes automatically
      setOffsetX(revealWidth + (rawOffset - revealWidth) * 0.15);
    } else {
      setOffsetX(rawOffset);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    isHorizontalSwipeRef.current = null;

    // Snap to reveal options or snap back closed (NO swipe to delete)
    if (offsetX > 35) {
      setOffsetX(revealWidth);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div
      ref={cardRef}
      id={`player-card-container-${player.id}`}
      className={`relative overflow-hidden rounded-xl select-none transition-all duration-200 ${
        isDeleting ? 'max-h-0 opacity-0 my-0 py-0 overflow-hidden' : 'max-h-24 opacity-100'
      }`}
    >
      {/* Revealed Action Bar behind Mobile Swipe: Up-to-three options */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch rounded-xl overflow-hidden z-0"
        style={{ width: `${Math.max(offsetX, 0)}px` }}
      >
        <div
          className="flex items-stretch ml-auto h-full"
          style={{ width: `${revealWidth}px` }}
        >
          {/* OPTION 1: PLAY (Only for ON THE BENCH - Up to Playing -> Green) */}
          {isBench && (
            <button
              type="button"
              id={`action-play-${player.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMovePlayer(player.id, 'up');
                setOffsetX(0);
              }}
              className="w-[72px] flex flex-col items-center justify-center gap-0.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-colors cursor-pointer"
              title="Move to Playing"
              aria-label="Move player to Playing"
            >
              <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[11px] font-bold tracking-tight leading-none">
                Play
              </span>
            </button>
          )}

          {/* OPTION 2: BENCH (Down from PLAYING -> Yellow, or Up from UNAVAILABLE -> Yellow) */}
          {isPlaying && (
            <button
              type="button"
              id={`action-bench-${player.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMovePlayer(player.id, 'down');
                setOffsetX(0);
              }}
              className="w-[72px] flex flex-col items-center justify-center gap-0.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold transition-colors cursor-pointer"
              title="Move to On The Bench"
              aria-label="Move player to Bench"
            >
              <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[11px] font-bold tracking-tight leading-none">
                Bench
              </span>
            </button>
          )}

          {isUnavailable && (
            <button
              type="button"
              id={`action-bench-${player.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMovePlayer(player.id, 'up');
                setOffsetX(0);
              }}
              className="w-[72px] flex flex-col items-center justify-center gap-0.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold transition-colors cursor-pointer"
              title="Move to On The Bench"
              aria-label="Move player to Bench"
            >
              <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[11px] font-bold tracking-tight leading-none">
                Bench
              </span>
            </button>
          )}

          {/* OPTION 3: REMOVE (Only for ON THE BENCH - Down to Unavailable -> Gray) */}
          {isBench && (
            <button
              type="button"
              id={`action-remove-${player.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMovePlayer(player.id, 'down');
                setOffsetX(0);
              }}
              className="w-[72px] flex flex-col items-center justify-center gap-0.5 bg-slate-500 hover:bg-slate-400 active:bg-slate-600 text-white transition-colors cursor-pointer"
              title="Move to Unavailable"
              aria-label="Move player to Unavailable"
            >
              <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-[11px] font-bold tracking-tight leading-none">
                Remove
              </span>
            </button>
          )}

          {/* OPTION: DELETE (Always available on swipe - Red) */}
          <button
            type="button"
            id={`action-delete-${player.id}`}
            onClick={(e) => {
              e.stopPropagation();
              triggerDelete();
            }}
            className="w-[72px] flex flex-col items-center justify-center gap-0.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white transition-colors cursor-pointer"
            title="Delete player"
            aria-label="Delete player"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-[11px] font-bold tracking-tight leading-none">
              Delete
            </span>
          </button>
        </div>
      </div>

      {/* Main Foreground Card (Draggable on Desktop) */}
      <div
        id={`player-card-${player.id}`}
        draggable
        onDragStart={(e) => onDragStart && onDragStart(e, player.id)}
        onDragEnd={onDragEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={() => {
          if (offsetX > 0) setOffsetX(0);
        }}
        style={{
          transform: `translateX(-${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`relative z-10 flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
          isBeingDragged
            ? 'opacity-40 scale-98 border-dashed border-slate-400 bg-slate-100'
            : isUnavailable
            ? 'bg-slate-50/90 border-slate-200 text-slate-400 opacity-70 hover:border-slate-300'
            : isPlaying
            ? 'bg-white border-slate-200/90 text-slate-800 shadow-xs hover:border-emerald-300 hover:shadow-sm'
            : 'bg-white border-slate-200/90 text-slate-800 shadow-xs hover:border-amber-300 hover:shadow-sm'
        }`}
      >
        {/* Left: Full Player Name with Number */}
        <div
          className="min-w-0 flex-1 flex items-baseline gap-1.5"
          title={`${displayName}${displayNumber ? ` #${displayNumber}` : ''}`}
        >
          <span
            className={`truncate font-medium text-sm sm:text-base leading-snug text-slate-900 ${
              isUnavailable ? 'line-through text-slate-400' : ''
            }`}
          >
            {displayName}
          </span>
          {displayNumber && (
            <span
              className={`shrink-0 font-mono text-xs sm:text-sm font-semibold tracking-tight ${
                isUnavailable ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              #{displayNumber}
            </span>
          )}
        </div>

        {/* Right: Number of Times Benched (All the way right, no container, bold, matches player name size) */}
        <div className="shrink-0 text-right select-none pl-3">
          {isUnavailable ? (
            <span
              className="font-bold text-sm sm:text-base leading-snug text-slate-400"
              title="Unavailable"
            >
              —
            </span>
          ) : (
            <span
              className="font-bold text-sm sm:text-base leading-snug text-slate-900 tabular-nums"
              title={`Times on bench: ${player.benchCount}`}
            >
              {player.benchCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
