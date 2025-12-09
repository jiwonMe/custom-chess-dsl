'use client';

import { cn } from '@/lib/utils/cn';

interface MoveIndicatorProps {
  isCapture?: boolean;
}

export function MoveIndicator({ isCapture = false }: MoveIndicatorProps) {
  if (isCapture) {
    // Show ring for capture squares
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-1 rounded-full border-4 border-board-legal opacity-70" />
      </div>
    );
  }

  // Show dot for empty squares
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-3 h-3 rounded-full bg-board-legal opacity-70" />
    </div>
  );
}
