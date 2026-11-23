import { ArrowLeft, Swords, Tv } from 'lucide-react';
import { getPreGameTaunt } from '../data/taunts';
import { asmrAudio, type SoundPackId } from '../engine/asmrAudio';
import type { Player } from '../engine/solver';
import type { FxController } from './GameCanvasFX';
import { CartoonBot } from './CartoonBot';

interface PreGameTauntProps {
  attemptNumber: number;
  totalLosses: number;
  bestSurvivalTurns: number;
  firstTurn: Player;
  needsAdToPlay: boolean;
  soundPack: SoundPackId;
  fxRef: React.MutableRefObject<FxController | null>;
  onChangeFirstTurn: (player: Player) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function PreGameTaunt({
  attemptNumber,
  totalLosses,
  bestSurvivalTurns,
  firstTurn,
  needsAdToPlay,
  soundPack,
  fxRef,
  onChangeFirstTurn,
  onAccept,
  onDecline,
}: PreGameTauntProps) {
  const taunt = getPreGameTaunt(attemptNumber, totalLosses, bestSurvivalTurns);
  const botMood = attemptNumber >= 6 ? 'laughing' : 'smug';

  return (
    <div className="cartoon-bg-dots relative flex h-full w-full items-center justify-center overflow-hidden p-3 sm:p-6">
      <svg
        aria-hidden="true"
        viewBox="0 0 800 800"
        className="pointer-events-none absolute h-[130vmax] w-[130vmax] opacity-30"
      >
        <circle cx="400" cy="400" r="340" fill="#FDE68A" />
        <circle cx="400" cy="400" r="240" fill="#BAE6FD" />
      </svg>

      <div className="animate-boss-pop relative z-10 flex max-h-[94dvh] w-full max-w-[580px] flex-col items-center rounded-[28px] border-[4px] border-[#1E293B] bg-white p-5 text-center shadow-[0_10px_0_#1E293B] sm:p-8 short-landscape:max-w-[700px] short-landscape:flex-row short-landscape:gap-6 short-landscape:p-5 short-landscape:text-left">
        {/* Cartoon Master Bot */}
        <div className="flex h-[clamp(74px,14dvh,112px)] w-[clamp(74px,14dvh,112px)] shrink-0 items-center justify-center rounded-3xl border-[4px] border-[#1E293B] bg-[#FEF08A] p-1.5 shadow-[0_5px_0_#1E293B]">
          <CartoonBot mood={botMood} className="h-full w-full" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center short-landscape:items-start">
          <p className="mt-3 font-mono text-[11px] font-extrabold tracking-wider text-[#2563EB] sm:text-xs short-landscape:mt-0">
            ATTEMPT #{attemptNumber} · {taunt.embarrassmentTier.toUpperCase()}
          </p>

          <h1 className="mt-2 font-display text-[clamp(1.35rem,4.5vw,2.25rem)] font-bold leading-tight text-[#1E293B] short-landscape:text-[clamp(1.25rem,3.4vw,1.9rem)]">
            &ldquo;{taunt.headline}&rdquo;
          </h1>

          <p className="mt-2 max-w-[44ch] text-xs font-semibold leading-relaxed text-[#475569] sm:text-sm">
            {taunt.subline}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] font-bold tabular-nums text-[#64748B] short-landscape:justify-start">
            <span>YOUR WINS: 0</span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="text-[#EF4444]">BOT WINS: {totalLosses}</span>
          </div>

          <div
            role="group"
            aria-label="Choose who moves first"
            className="mt-3.5 inline-flex gap-1 rounded-2xl border-[3px] border-[#1E293B] bg-[#FFF7E8] p-1 shadow-[0_3px_0_#1E293B]"
          >
            <button
              type="button"
              aria-pressed={firstTurn === 'X'}
              onClick={() => {
                asmrAudio.playUiTap();
                onChangeFirstTurn('X');
              }}
              className={`rounded-xl px-3 py-1 font-display text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                firstTurn === 'X'
                  ? 'border-[2px] border-[#1E293B] bg-[#FF5A5F] text-white'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              You Go First
            </button>
            <button
              type="button"
              aria-pressed={firstTurn === 'O'}
              onClick={() => {
                asmrAudio.playUiTap();
                onChangeFirstTurn('O');
              }}
              className={`rounded-xl px-3 py-1 font-display text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                firstTurn === 'O'
                  ? 'border-[2px] border-[#1E293B] bg-[#38BDF8] text-[#1E293B]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Let Bot Start First
            </button>
          </div>

          <div className="mt-5 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-center short-landscape:mt-4 short-landscape:flex-row short-landscape:justify-start">
            <button
              type="button"
              onClick={() => {
                asmrAudio.playUiTap();
                onDecline();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E293B] bg-[#F1F5F9] px-4 py-2.5 font-display text-sm font-bold text-[#334155] shadow-[0_4px_0_#1E293B] transition-all duration-100 hover:bg-[#E2E8F0] active:translate-y-[3px] active:shadow-[0_1px_0_#1E293B] sm:px-5 sm:py-3 sm:text-base whitespace-nowrap cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {taunt.declineLabel}
            </button>

            <button
              type="button"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                asmrAudio.playPlace(false, soundPack);
                fxRef.current?.burst(
                  r.left + r.width / 2,
                  r.top + r.height / 2,
                  soundPack,
                  'normal'
                );
                onAccept();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E293B] bg-[#FF5A5F] px-5 py-2.5 font-display text-sm font-bold text-white shadow-[0_5px_0_#1E293B] transition-all duration-100 hover:bg-[#F43F5E] active:translate-y-[3px] active:shadow-[0_2px_0_#1E293B] sm:px-7 sm:py-3 sm:text-base whitespace-nowrap cursor-pointer"
            >
              {needsAdToPlay ? (
                <>
                  <Tv className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  Watch Ad &amp; {taunt.acceptLabel}
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  {taunt.acceptLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
