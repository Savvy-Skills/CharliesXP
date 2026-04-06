import { useRef, useEffect, useCallback, useState, type ReactNode } from 'react';

interface MobileDrawerProps {
  /** Controls whether drawer is mounted and animates to peek */
  isOpen: boolean;
  /** Called when user drags drawer fully down */
  onClose: () => void;
  /** Content shown in the peek bar (collapsed state) */
  peekContent?: ReactNode;
  /** Scrollable main content */
  children: ReactNode;
  /** Height of peek bar in px */
  peekHeight?: number;
  /** Height of the container (pass parent's clientHeight) */
  containerHeight?: number;
}

/**
 * Production mobile bottom drawer with 3 snap points.
 * Uses absolute positioning (not fixed) so it works inside
 * any positioned parent container.
 *
 * Snap points: peek | half | closed
 * - peek: shows peekHeight from bottom
 * - half: 60% of container height
 * - closed: fully offscreen
 */
export function MobileDrawer({
  isOpen,
  onClose,
  peekContent,
  children,
  peekHeight = 80,
  containerHeight = 800,
}: MobileDrawerProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState<'closed' | 'peek' | 'half'>('closed');
  const [show, setShow] = useState(false);

  // Touch tracking
  const drag = useRef({
    active: false,
    startY: 0,
    startBottom: 0,
    currentBottom: 0,
  });

  const sheetHeight = containerHeight * 0.7;

  const snapValues = {
    closed: -sheetHeight,
    peek: peekHeight - sheetHeight,
    half: 0,
  };

  // Apply bottom position (no animation)
  const setBottom = useCallback((bottom: number, animate: boolean) => {
    if (!sheetRef.current) return;
    drag.current.currentBottom = bottom;
    if (animate) {
      sheetRef.current.style.transition = 'bottom 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
    } else {
      sheetRef.current.style.transition = 'none';
    }
    sheetRef.current.style.bottom = `${bottom}px`;
  }, []);

  const snapTo = useCallback((target: 'closed' | 'peek' | 'half') => {
    setSnap(target);
    setBottom(snapValues[target], true);
    if (target === 'closed') {
      setTimeout(() => {
        setShow(false);
        onClose();
      }, 350);
    }
  }, [snapValues, setBottom, onClose]);

  // Open effect
  useEffect(() => {
    if (isOpen && !show) {
      setShow(true);
      // Start offscreen, animate to peek on next tick
      setBottom(snapValues.closed, false);
      setTimeout(() => snapTo('peek'), 20);
    } else if (!isOpen && show && snap !== 'closed') {
      snapTo('closed');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Touch handlers for the drag handle
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    drag.current.active = true;
    drag.current.startY = e.touches[0].clientY;
    drag.current.startBottom = drag.current.currentBottom;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!drag.current.active) return;
    const dy = drag.current.startY - e.touches[0].clientY; // positive = dragging up
    let newBottom = drag.current.startBottom + dy;
    // Clamp between closed and half (with slight rubber-band past half)
    const min = snapValues.closed;
    const max = snapValues.half + 40;
    if (newBottom > max) newBottom = max + (newBottom - max) * 0.15;
    if (newBottom < min) newBottom = min;
    drag.current.currentBottom = newBottom;
    if (sheetRef.current) sheetRef.current.style.bottom = `${newBottom}px`;
  }, [snapValues]);

  const handleTouchEnd = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;

    const b = drag.current.currentBottom;
    const velocity = b - drag.current.startBottom;

    // Velocity-based snapping
    if (velocity > 60) {
      // Dragged up fast
      snapTo(snap === 'closed' ? 'peek' : 'half');
      return;
    }
    if (velocity < -60) {
      // Dragged down fast
      snapTo(snap === 'half' ? 'peek' : 'closed');
      return;
    }

    // Position-based: find nearest snap
    let nearest: 'closed' | 'peek' | 'half' = 'peek';
    let minDist = Infinity;
    for (const [key, val] of Object.entries(snapValues) as ['closed' | 'peek' | 'half', number][]) {
      const dist = Math.abs(b - val);
      if (dist < minDist) { minDist = dist; nearest = key; }
    }
    snapTo(nearest);
  }, [snap, snapValues, snapTo]);

  if (!show) return null;

  const isExpanded = snap === 'half';

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="absolute inset-0 z-30 bg-black/25"
          onClick={() => snapTo('peek')}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 z-40 flex flex-col"
        style={{
          height: sheetHeight,
          bottom: snapValues.closed,
          willChange: 'bottom',
        }}
      >
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-white/98 backdrop-blur-md rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)]" />

        {/* Drag handle — full width touch target */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative z-10 shrink-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Visual handle pill */}
          <div className="flex justify-center pt-[10px] pb-[6px]">
            <div className="w-9 h-[5px] rounded-full bg-[var(--sg-navy)]/15" />
          </div>

          {/* Peek content */}
          {peekContent && (
            <div
              className="px-5 pb-3"
              onClick={() => snapTo(snap === 'peek' ? 'half' : 'peek')}
            >
              {peekContent}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div
          ref={contentRef}
          className={`relative z-10 flex-1 ${
            isExpanded
              ? 'overflow-y-auto overscroll-contain'
              : 'overflow-hidden pointer-events-none'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
