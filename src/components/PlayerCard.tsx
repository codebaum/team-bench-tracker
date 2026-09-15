import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Player } from '../types';

interface PlayerCardProps {
  player: Player;
  onRemovePlayer: (id: string) => void;
  onMovePlayer: (id: string, direction: 'up' | 'down') => void;
  onAdjustBenchCount?: (id: string, delta: number) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onRemovePlayer,
  onMovePlayer,
  onAdjustBenchCount,
}) => {
  const isUnavailable = player.status === 'unavailable';
  const isPlaying = player.status === 'playing';

  // Swipe-to-delete states (iOS style: Swipe Left)
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

  const triggerDelete = () => {
    setIsDeleting(true);
    setOffsetX(350); // slide all the way left
    setTimeout(() => {
      onRemovePlayer(player.id);
    }, 200);
  };

  // --- Touch Swipe Handlers (iOS Native Swipe Left) ---
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
    const newOffset = currentOffsetRef.current + deltaX;

    // Apply resistance if trying to swipe right beyond 0
    if (newOffset < 0) {
      setOffsetX(newOffset * 0.2);
    } else {
      setOffsetX(newOffset);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    isHorizontalSwipeRef.current = null;

    const cardWidth = cardRef.current?.offsetWidth || 300;

    // iOS Full swipe to delete threshold: > 45% of card width or > 150px
    if (offsetX > Math.min(150, cardWidth * 0.45)) {
      triggerDelete();
    } else if (offsetX > 60) {
      // Snap open to reveal Delete button (80px)
      setOffsetX(80);
    } else {
      // Snap back closed
      setOffsetX(0);
    }
  };

  // --- Mouse Swipe Support (for desktop testing) ---
  const mouseStartXRef = useRef<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle primary mouse button
    if (e.button !== 0) return;
    mouseStartXRef.current = e.clientX;
    currentOffsetRef.current = offsetX;
    setIsSwiping(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseStartXRef.current === null) return;
      const deltaX = mouseStartXRef.current - e.clientX;
      const newOffset = currentOffsetRef.current + deltaX;
      if (newOffset < 0) {
        setOffsetX(newOffset * 0.2);
      } else {
        setOffsetX(newOffset);
      }
    };

    const handleMouseUp = () => {
      if (mouseStartXRef.current === null) return;
      mouseStartXRef.current = null;
      setIsSwiping(false);

      if (offsetX > 140) {
        triggerDelete();
      } else if (offsetX > 55) {
        setOffsetX(80);
      } else {
        setOffsetX(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [offsetX]);

  const isUpDisabled = isPlaying;
  const isDownDisabled = isUnavailable;

  return (
    <div
      ref={cardRef}
      id={`player-card-container-${player.id}`}
      className={`relative overflow-hidden rounded-xl select-none transition-all duration-200 ${
        isDeleting ? 'max-h-0 opacity-0 my-0 py-0 overflow-hidden' : 'max-h-24 opacity-100'
      }`}
    >
      {/* iOS Red Delete Background (Revealed when swiping left) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end bg-rose-600 text-white font-medium text-xs rounded-xl overflow-hidden cursor-pointer"
        style={{ width: `${Math.max(offsetX, offsetX > 0 ? 80 : 0)}px` }}
        onClick={triggerDelete}
        title="Tap to delete player"
      >
        <button
          type="button"
          className="flex flex-col sm:flex-row items-center justify-center gap-1 w-20 h-full text-white font-semibold text-xs active:bg-rose-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>

      {/* Main Foreground Card */}
      <div
        id={`player-card-${player.id}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          transform: `translateX(-${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className={`relative flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border ${
          isUnavailable
            ? 'bg-slate-50/90 border-slate-200 text-slate-400 opacity-70'
            : isPlaying
            ? 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
            : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
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

        {/* Right: Bench Count Badge & Up/Down Movement Arrows */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 shrink-0"
          onMouseDown={(e) => e.stopPropagation()} // don't trigger swipe drag when clicking controls
        >
          {/* Times Benched Number Badge */}
          {isUnavailable ? (
            <span
              className="font-mono text-base font-semibold text-slate-400 px-2 py-0.5 select-none"
              title="Unavailable"
            >
              —
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <span
                className="inline-flex items-center justify-center min-w-7 h-7 px-2 text-xs sm:text-sm font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs"
                title={`Times on bench: ${player.benchCount}`}
              >
                {player.benchCount}
              </span>

              {/* Subtle +/- adjust on desktop hover */}
              {onAdjustBenchCount && (
                <div className="hidden sm:flex items-center gap-0.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustBenchCount(player.id, -1);
                    }}
                    disabled={player.benchCount <= 0}
                    className="w-4 h-5 flex items-center justify-center text-[11px] hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Decrement count"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdjustBenchCount(player.id, 1);
                    }}
                    className="w-4 h-5 flex items-center justify-center text-[11px] hover:text-slate-700 cursor-pointer"
                    title="Increment count"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Up and Down Arrows (Directly to the right of number of times benched) */}
          <div className="flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              id={`move-up-${player.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMovePlayer(player.id, 'up');
              }}
              disabled={isUpDisabled}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
                isUpDisabled
                  ? 'opacity-20 text-slate-400 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs active:bg-slate-200 cursor-pointer'
              }`}
              title={isUpDisabled ? 'Already at top (Playing)' : 'Move up a section'}
              aria-label="Move player up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            <button
              type="button"
              id={`move-down-${player.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onMovePlayer(player.id, 'down');
              }}
              disabled={isDownDisabled}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${
                isDownDisabled
                  ? 'opacity-20 text-slate-400 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs active:bg-slate-200 cursor-pointer'
              }`}
              title={isDownDisabled ? 'Already at bottom (Unavailable)' : 'Move down a section'}
              aria-label="Move player down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
