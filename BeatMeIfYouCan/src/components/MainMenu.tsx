import { useState } from 'react';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Maximize2,
  Minimize2,
  Play,
  ShoppingBag,
  Coins,
  Tv,
} from 'lucide-react';
import type { GameProgress } from '../hooks/useGameProgress';
import { getBoardTheme, getSoundPack } from '../data/shop';
import { asmrAudio } from '../engine/asmrAudio';
import type { Player } from '../engine/solver';
import type { FxController } from './GameCanvasFX';
import { PieceGlyph } from './PieceGlyph';
import { CartoonBot } from './CartoonBot';

interface MainMenuProps {
  progress: GameProgress;
  firstTurn: Player;
  needsAdToPlay: boolean;
  ambientOn: boolean;
  isFullscreen: boolean;
  fxRef: React.MutableRefObject<FxController | null>;
  onChangeFirstTurn: (player: Player) => void;
  onToggleSound: () => void;
  onToggleAmbient: () => void;
  onToggleFullscreen: () => void;
  onStartGame: () => void;
  onOpenShop: () => void;
}

const INITIAL_DEMO: ('X' | 'O' | null)[] = ['X', null, 'O', null, 'X', null, 'O', null, null];

export function MainMenu({
  progress,
  firstTurn,
  needsAdToPlay,
  ambientOn,
  isFullscreen,
  fxRef,
  onChangeFirstTurn,
  onToggleSound,
  onToggleAmbient,
  onToggleFullscreen,
  onStartGame,
  onOpenShop,
}: MainMenuProps) {
  const [demoBoard, setDemoBoard] = useState<('X' | 'O' | null)[]>(INITIAL_DEMO);
  const [nextDemoSymbol, setNextDemoSymbol] = useState<'X' | 'O'>('O');

  const boardTheme = getBoardTheme(progress.equippedBoardTheme);
  const soundPack = getSoundPack(progress.equippedSoundPack);

  const handleDemoTap = (idx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (demoBoard[idx] !== null) {
      asmrAudio.playLift(demoBoard[idx] === 'O', progress.equippedSoundPack);
      fxRef.current?.burst(cx, cy, progress.equippedSoundPack, 'soft');
      setDemoBoard((prev) => {
        const next = prev.slice();
        next[idx] = null;
        return next;
      });
      return;
    }

    const sym = nextDemoSymbol;
    asmrAudio.playPlace(sym === 'O', progress.equippedSoundPack);
    fxRef.current?.burst(cx, cy, progress.equippedSoundPack, 'normal');
    setDemoBoard((prev) => {
      const next = prev.slice();
      next[idx] = sym;
      return next;
    });
    setNextDemoSymbol((s) => (s === 'X' ? 'O' : 'X'));
  };

  return (
    <div className="cartoon-bg-dots relative flex h-full w-full flex-col justify-between overflow-hidden">
      {/* Decorative sunlit cartoon vector shapes */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
      >
        <circle cx="110" cy="820" r="190" fill="#BAE6FD" />
        <circle cx="1360" cy="110" r="175" fill="#FDE68A" />
        <circle cx="1320" cy="830" r="140" fill="#FBCFE8" />
      </svg>

      {/* Top Cartoon Game HUD Bar */}
      <div className="relative z-10 flex shrink-0 items-center justify-between px-3.5 py-2.5 sm:px-7 sm:py-3.5 short:py-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#1E293B] bg-[#FDE047] px-3 py-1 font-mono text-xs font-extrabold tabular-nums text-[#1E293B] shadow-[0_3px_0_#1E293B] sm:px-3.5 sm:py-1.5 sm:text-sm">
            <Coins className="h-3.5 w-3.5 text-[#B45309] sm:h-4 sm:w-4" aria-hidden="true" />
            <span>{progress.tokens}</span>
          </div>

          <div className="hidden items-center gap-2.5 rounded-2xl border-[3px] border-[#1E293B] bg-white px-3 py-1 font-mono text-[11px] font-bold tabular-nums text-[#475569] shadow-[0_3px_0_#1E293B] sm:flex sm:text-xs">
            <span>
              LOSSES <strong className="text-[#EF4444]">{progress.totalLosses}</strong>
            </span>
            <span className="text-[#CBD5E1]">|</span>
            <span>
              BEST <strong className="text-[#2563EB]">{progress.bestSurvivalTurns}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={progress.soundEnabled ? 'Mute sound' : 'Enable sound'}
            title={progress.soundEnabled ? 'ASMR Sound On' : 'ASMR Sound Muted'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-[#1E293B] shadow-[0_3px_0_#1E293B] transition-transform active:translate-y-[2px] active:shadow-none sm:h-10 sm:w-10 sm:rounded-2xl cursor-pointer ${
              progress.soundEnabled ? 'bg-[#38BDF8] text-[#1E293B]' : 'bg-[#E2E8F0] text-[#64748B]'
            }`}
          >
            {progress.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleAmbient}
            aria-label={ambientOn ? 'Disable rain ambience' : 'Enable rain ambience'}
            title={ambientOn ? 'Rain Ambience On' : 'Rain Ambience Off'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-[#1E293B] shadow-[0_3px_0_#1E293B] transition-transform active:translate-y-[2px] active:shadow-none sm:h-10 sm:w-10 sm:rounded-2xl cursor-pointer ${
              ambientOn ? 'bg-[#A7F3D0] text-[#1E293B]' : 'bg-white text-[#64748B]'
            }`}
          >
            <CloudRain className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title="Fullscreen"
            className="flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-[#1E293B] bg-white text-[#1E293B] shadow-[0_3px_0_#1E293B] transition-transform active:translate-y-[2px] active:shadow-none sm:h-10 sm:w-10 sm:rounded-2xl cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Center Stage: Dynamically stacks in Portrait & aligns side-by-side in Landscape */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[960px] flex-1 items-center justify-center px-4 py-1 sm:px-6">
        <div className="flex w-full flex-col items-center justify-center gap-[clamp(0.85rem,2.6dvh,1.75rem)] landscape:flex-row landscape:gap-[clamp(1.25rem,4.5vw,3.5rem)]">
          {/* Brand + Buttons Column */}
          <div className="flex w-full max-w-[380px] flex-col items-center text-center landscape:w-auto landscape:max-w-[400px] landscape:items-start landscape:text-left">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-[clamp(52px,8.5dvh,80px)] w-[clamp(52px,8.5dvh,80px)] shrink-0 items-center justify-center rounded-2xl border-[3px] border-[#1E293B] bg-[#FFFDF5] p-1 shadow-[0_5px_0_#1E293B] sm:rounded-3xl">
                <CartoonBot mood="smug" className="h-full w-full" />
              </div>
              <div className="text-left">
                <p className="font-mono text-[10px] font-extrabold tracking-wider text-[#2563EB] sm:text-xs">
                  ENDLESS ASMR TIC-TAC-TOE
                </p>
                <h1
                  className="font-display text-[clamp(1.5rem,5.2vw,2.85rem)] font-bold leading-[1.06] tracking-tight text-[#1E293B] landscape:text-[clamp(1.7rem,3.6vw,3rem)]"
                  style={{ textShadow: '0 3px 0 #FDE047' }}
                >
                  Beat Me If You Can
                </h1>
              </div>
            </div>

            {/* Chunky Cel-Shaded Arcade Buttons */}
            <div className="mt-[clamp(0.85rem,2.4dvh,1.5rem)] flex w-full flex-col gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  asmrAudio.playPlace(false, progress.equippedSoundPack);
                  fxRef.current?.burst(
                    r.left + r.width / 2,
                    r.top + r.height / 2,
                    progress.equippedSoundPack,
                    'normal'
                  );
                  onStartGame();
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-[3px] border-[#1E293B] bg-[#22C55E] px-6 py-[clamp(0.65rem,1.8dvh,1rem)] font-display text-[clamp(1rem,2.4dvh,1.25rem)] font-bold tracking-wide text-white shadow-[0_6px_0_#1E293B] transition-all duration-100 hover:bg-[#16A34A] active:translate-y-[4px] active:shadow-[0_2px_0_#1E293B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E293B] whitespace-nowrap cursor-pointer"
              >
                {needsAdToPlay ? (
                  <>
                    <Tv className="h-5 w-5 shrink-0" aria-hidden="true" />
                    AD · PLAY TRY #{progress.attemptCount}
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current shrink-0" aria-hidden="true" />
                    PLAY · TRY #{progress.attemptCount}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  asmrAudio.playUiTap();
                  onOpenShop();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E293B] bg-[#FDE047] px-5 py-[clamp(0.55rem,1.5dvh,0.85rem)] font-display text-[clamp(0.95rem,2.1dvh,1.12rem)] font-bold text-[#1E293B] shadow-[0_5px_0_#1E293B] transition-all duration-100 hover:bg-[#FACC15] active:translate-y-[3px] active:shadow-[0_2px_0_#1E293B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E293B] whitespace-nowrap cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 text-[#1E293B] shrink-0" aria-hidden="true" />
                SHOP
                <span className="font-mono text-xs tabular-nums text-[#B45309] sm:text-sm">
                  ({progress.tokens})
                </span>
              </button>

              {/* First Move Toggle: You First vs Bot First */}
              <div
                role="group"
                aria-label="Choose who moves first"
                className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border-[3px] border-[#1E293B] bg-white p-1 shadow-[0_4px_0_#1E293B]"
              >
                <button
                  type="button"
                  aria-pressed={firstTurn === 'X'}
                  onClick={() => {
                    asmrAudio.playUiTap();
                    onChangeFirstTurn('X');
                  }}
                  className={`rounded-xl py-1.5 font-display text-xs font-bold transition-colors whitespace-nowrap cursor-pointer sm:text-sm ${
                    firstTurn === 'X'
                      ? 'border-[2px] border-[#1E293B] bg-[#FF5A5F] text-white'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  YOU FIRST (X)
                </button>
                <button
                  type="button"
                  aria-pressed={firstTurn === 'O'}
                  onClick={() => {
                    asmrAudio.playUiTap();
                    onChangeFirstTurn('O');
                  }}
                  className={`rounded-xl py-1.5 font-display text-xs font-bold transition-colors whitespace-nowrap cursor-pointer sm:text-sm ${
                    firstTurn === 'O'
                      ? 'border-[2px] border-[#1E293B] bg-[#38BDF8] text-[#1E293B]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  BOT FIRST (O)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Cartoon ASMR Fidget Board — Dynamically sized by BOTH vw & dvh */}
          <div className="flex shrink-0 flex-col items-center">
            <div
              className={`aspect-square w-[min(74vw,35dvh,300px)] landscape:w-[min(42vw,62dvh,330px)] rounded-3xl border-[4px] border-[#1E293B] p-[clamp(0.5rem,1.4vmin,0.9rem)] ${boardTheme.trayBg} ${boardTheme.trayShadow}`}
            >
              <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-[clamp(0.4rem,1.2vmin,0.65rem)]">
                {demoBoard.map((cell, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Test ASMR tile ${idx + 1}`}
                    onClick={(e) => handleDemoTap(idx, e)}
                    onMouseEnter={() => asmrAudio.playHover(progress.equippedSoundPack)}
                    className={`flex h-full w-full items-center justify-center rounded-xl sm:rounded-2xl border-[2.5px] sm:border-[3px] border-[#1E293B] shadow-[inset_0_4px_0_rgba(30,41,59,0.1)] transition-transform duration-100 active:scale-95 cursor-pointer ${boardTheme.wellBg} ${boardTheme.wellHoverBg}`}
                  >
                    {cell && (
                      <div className="animate-piece-slam h-[68%] w-[68%]">
                        <PieceGlyph player={cell} styleId={progress.equippedPieceStyle} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2.5 font-mono text-[10px] font-extrabold text-[#475569] sm:text-xs short:mt-1.5">
              TAP TO TEST ASMR · {soundPack.name.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Subtle bottom strip */}
      <div className="relative z-10 flex shrink-0 items-center justify-center pb-2.5 text-[11px] font-bold text-[#64748B] short:hidden">
        <span>Master Bot Win Rate: 100%</span>
        <span className="mx-2.5 text-[#CBD5E1]" aria-hidden="true">·</span>
        <span>Keys 1–9 Supported</span>
      </div>
    </div>
  );
}
