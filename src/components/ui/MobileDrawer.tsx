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
 * Mobile bottom drawer with 3 snap points (closed / peek / half).
 *
 * Drag gesture uses Pointer Events so the same code path covers touch and
 * mouse. We distinguish a tap from a drag by tracking movement vs. a small
 * threshold — taps toggle peek↔half, drags snap based on velocity/position.
 * Drag and tap both work anywhere on the handle bar or peek content.
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

  const drag = useRef({
    active: false,
    moved: false,           // crossed the tap/drag threshold at least once
    pointerId: -1,
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

  const TAP_THRESHOLD = 6;     // px — smaller than this = tap
  const VELOCITY_THRESHOLD = 60; // px of displacement = "fast" drag

  const setBottom = useCallback((bottom: number, animate: boolean) => {
    if (!sheetRef.current) return;
    drag.current.currentBottom = bottom;
    sheetRef.current.style.transition = animate
      ? 'bottom 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
      : 'none';
    sheetRef.current.style.bottom = `${bottom}px`;
  }, []);

  // `onClose` only fires for user-initiated closes (drag-to-dismiss). When
  // the parent flips `isOpen` to false (e.g. because the URL changed), the
  // drawer quietly collapses without telling the parent — otherwise we get a
  // feedback loop: URL change → drawer closes → onClose → parent navigates
  // back → URL change again. That was the source of the "zoom out bounces
  // me to the previous page" bug.
  const userInitiatedCloseRef = useRef(false);

  const snapTo = useCallback((target: 'closed' | 'peek' | 'half') => {
    setSnap(target);
    setBottom(snapValues[target], true);
    if (target === 'closed') {
      const wasUser = userInitiatedCloseRef.current;
      userInitiatedCloseRef.current = false;
      setTimeout(() => {
        setShow(false);
        if (wasUser) onClose();
      }, 350);
    }
  }, [snapValues, setBottom, onClose]);

  // Open / close in response to parent state
  useEffect(() => {
    if (isOpen && !show) {
      setShow(true);
      setBottom(snapValues.closed, false);
      setTimeout(() => snapTo('peek'), 20);
    } else if (!isOpen && show && snap !== 'closed') {
      // Parent-driven close — don't notify the parent back.
      userInitiatedCloseRef.current = false;
      snapTo('closed');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pointer-event drag handlers ────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore right/middle click
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current.active = true;
    drag.current.moved = false;
    drag.current.pointerId = e.pointerId;
    drag.current.startY = e.clientY;
    drag.current.startBottom = drag.current.currentBottom;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active || e.pointerId !== drag.current.pointerId) return;
    const dy = drag.current.startY - e.clientY; // positive = dragging up
    if (!drag.current.moved && Math.abs(dy) > TAP_THRESHOLD) {
      drag.current.moved = true;
    }
    let newBottom = drag.current.startBottom + dy;
    const min = snapValues.closed;
    const max = snapValues.half + 40;
    if (newBottom > max) newBottom = max + (newBottom - max) * 0.15;
    if (newBottom < min) newBottom = min;
    drag.current.currentBottom = newBottom;
    if (sheetRef.current) sheetRef.current.style.bottom = `${newBottom}px`;
  }, [snapValues]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return;
    if (drag.current.pointerId !== e.pointerId) return;
    drag.current.active = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* released */ }

    // Any gesture-driven snapTo('closed') counts as user-initiated; flag
    // before calling so the subsequent onClose actually fires.
    const userSnap = (target: 'closed' | 'peek' | 'half') => {
      if (target === 'closed') userInitiatedCloseRef.current = true;
      snapTo(target);
    };

    // Tap (no significant movement) → toggle peek / half
    if (!drag.current.moved) {
      userSnap(snap === 'peek' ? 'half' : 'peek');
      return;
    }

    const b = drag.current.currentBottom;
    const displacement = b - drag.current.startBottom;

    if (displacement > VELOCITY_THRESHOLD) {
      userSnap(snap === 'closed' ? 'peek' : 'half');
      return;
    }
    if (displacement < -VELOCITY_THRESHOLD) {
      userSnap(snap === 'half' ? 'peek' : 'closed');
      return;
    }

    // Small movement → snap to nearest
    let nearest: 'closed' | 'peek' | 'half' = 'peek';
    let minDist = Infinity;
    for (const [key, val] of Object.entries(snapValues) as ['closed' | 'peek' | 'half', number][]) {
      const dist = Math.abs(b - val);
      if (dist < minDist) { minDist = dist; nearest = key; }
    }
    userSnap(nearest);
  }, [snap, snapValues, snapTo]);

  if (!show) return null;

  const isExpanded = snap === 'half';

  return (
    <>
      {/* Backdrop — tap to collapse to peek */}
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

        {/* Drag target: pill + peek content. A single pointer handler here
            distinguishes tap from drag so onClick doesn't compete. */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative z-10 shrink-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="flex justify-center pt-[10px] pb-[6px]">
            <div className="w-9 h-[5px] rounded-full bg-[var(--sg-navy)]/15" />
          </div>

          {peekContent && <div className="px-5 pb-3">{peekContent}</div>}
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
