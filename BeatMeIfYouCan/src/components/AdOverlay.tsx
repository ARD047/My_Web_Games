import { useEffect, useState } from 'react';
import { Tv } from 'lucide-react';

interface AdOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

/**
 * Local/preview midgame ad break simulator.
 * When hosted on CrazyGames, the real CrazyGames SDK v3 ad player runs automatically instead.
 */
export function AdOverlay({ visible, onComplete }: AdOverlayProps) {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(3);

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          window.setTimeout(onComplete, 180);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ad break"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/85 p-5 backdrop-blur-sm"
    >
      <div className="animate-boss-pop flex w-full max-w-[380px] flex-col items-center rounded-[28px] border-[4px] border-[#1E293B] bg-white p-6 text-center shadow-[0_10px_0_#1E293B]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-[#1E293B] bg-[#38BDF8] text-[#1E293B] shadow-[0_4px_0_#1E293B]">
          <Tv className="h-8 w-8" aria-hidden="true" />
        </div>

        <p className="mt-4 font-mono text-xs font-extrabold tracking-wider text-[#2563EB]">
          CRAZYGAMES MIDGAME AD
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[#1E293B]">
          Short Ad Break
        </h2>
        <p className="mt-2 text-xs font-semibold text-[#64748B]">
          Audio muted automatically during ad playback.
        </p>

        <div className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl border-[3px] border-[#1E293B] bg-[#FEF08A] font-mono text-sm font-extrabold tabular-nums text-[#1E293B]">
          {secondsLeft > 0 ? `Resuming in ${secondsLeft}s...` : 'Returning to game...'}
        </div>
      </div>
    </div>
  );
}
