'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { calculateFloatingPosition } from '@/lib/calendar';

export function FloatingPopover({
  anchorRef,
  open,
  onClose,
  children,
  estimatedHeight = 360,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  estimatedHeight?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const position = calculateFloatingPosition(
        rect,
        { width: window.innerWidth, height: window.innerHeight },
        panelRef.current?.offsetHeight || estimatedHeight,
      );
      setStyle({
        position: 'fixed',
        zIndex: 100,
        left: position.left,
        top: position.top,
        width: position.width,
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        onCloseRef.current();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    updatePosition();
    const animationFrame = window.requestAnimationFrame(updatePosition);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, estimatedHeight, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={panelRef} style={style ?? { visibility: 'hidden' }}>
      {children}
    </div>,
    document.body,
  );
}
