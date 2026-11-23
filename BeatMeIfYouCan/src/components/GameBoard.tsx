import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Maximize2,
  Minimize2,
  Home,
  RotateCcw,
  ShoppingBag,
  Coins,
  Tv,
} from 'lucide-react';
import {
  applyMove,
  boardToStateKey,
  checkWinner,
  countPieces,
  getBestBotMove,
  isPositionForcedBotWin,
  type BoardState,
  type Player,
  type WinCheck,
} from '../engine/solver';
import { asmrAudio } from '../engine/asmrAudio';
import { crazyGamesSdk } from '../engine/crazyGamesSdk';
import { getBoardTheme } from '../data/shop';
import { getLiveWhisper, getLossRemark } from '../data/taunts';
import type { GameProgress } from '../hooks/useGameProgress';
import type { FxController } from './GameCanvasFX';
import { PieceGlyph } from './PieceGlyph';
import { CartoonBot, type BotMood } from './CartoonBot';

interface GameBoardProps {
  progress: GameProgress;
  firstTurn: Player;
  needsAdToPlay: boolean;
  ambientOn: boolean;
  isFullscreen: boolean;
  fxRef: React.MutableRefObject<FxController | null>;
  onToggleSound: () => void;
  onToggleAmbient: () => void;
  onToggleFullscreen: () => void;
  onRecordLoss: (turnsSurvived: number) => number;
  onTryAgain: () => void;
  onOpenShop: () => void;
  onMainMenu: () => void;
}

const EMPTY_BOARD: BoardState = Array(9).fill(null);

function cellCenterSvg(idx: number): { x: number; y: number } {
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  return { x: col * 100 + 50, y: row * 100 + 50 };
}

/**
 * Crisp cartoon vector pointing hand for the 5-second idle tutorial hint.
 */
function CartoonFingerIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="drop-shadow-[0_4px_0_rgba(30,41,59,0.45)]"
    >
      {/* Pointing index finger + cartoon hand */}
      <path
        d="M27 8C24 8 22 10.2 22 13V31L17.5 27.5C15 25.6 11.4 26.2 9.8 28.8C8.3 31.3 9 34.6 11.3 36.4L23.5 47.5C26.5 50.2 30.4 52 34.6 52H41C47.6 52 53 46.6 53 40V27C53 24.2 50.8 22 48 22C46.7 22 45.5 22.5 44.6 23.3C44.2 21 42.2 19.3 39.8 19.3C38.3 19.3 37 20 36.1 21C35.5 18.8 33.6 17.2 31.2 17.2C30.4 17.2 29.7 17.4 29 17.7V13C29 10.2 29.8 8 27 8Z"
        fill="#FDE68A"
        stroke="#1E293B"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Knuckle details */}
      <path d="M36 24V31M44 26V32" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" />
      {/* Tap ring sparkle near fingertip */}
      <circle cx="25" cy="9" r="5" stroke="#FF5A5F" strokeWidth="3" strokeDasharray="4 4" />
    </svg>
  );
}

export function GameBoard({
  progress,
  firstTurn,
  needsAdToPlay,
  ambientOn,
  isFullscreen,
  fxRef,
  onToggleSound,
  onToggleAmbient,
  onToggleFullscreen,
  onRecordLoss,
  onTryAgain,
  onOpenShop,
  onMainMenu,
}: GameBoardProps) {
  const [board, setBoard] = useState<BoardState>(EMPTY_BOARD);
  const [turn, setTurn] = useState<Player>(firstTurn);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [botLiftedCell, setBotLiftedCell] = useState<number | null>(null);
  const [lastPlacedCell, setLastPlacedCell] = useState<number | null>(null);
  const [slamCounter, setSlamCounter] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const [recentKeys, setRecentKeys] = useState<number[]>([]);
  const [winInfo, setWinInfo] = useState<WinCheck | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [tokensEarned, setTokensEarned] = useState<number | null>(null);
  const [forcedBotWin, setForcedBotWin] = useState(false);
  const [shakeMode, setShakeMode] = useState<'none' | 'sm' | 'lg'>('none');
  const [showIdleHint, setShowIdleHint] = useState(false);

  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const matchRecordedRef = useRef(false);
  const activeAttemptRef = useRef(progress.attemptCount);

  const boardTheme = getBoardTheme(progress.equippedBoardTheme);
  const playerPieceCount = countPieces(board, 'X');
  const botPieceCount = countPieces(board, 'O');
  const phase: 'placement' | 'relocation' =
    playerPieceCount >= 3 && botPieceCount >= 3 ? 'relocation' : 'placement';

  const isPlayerTurn = turn === 'X' && !winInfo;
  const isBotTurn = turn === 'O' && !winInfo;

  const botMood: BotMood = winInfo
    ? 'laughing'
    : forcedBotWin
      ? 'evil'
      : isBotTurn
        ? 'thinking'
        : 'smug';

  // Wait 5 seconds on the player's turn; if no move yet, show the animated cartoon finger guide
  useEffect(() => {
    setShowIdleHint(false);
    if (!isPlayerTurn) return;

    const idleTimer = window.setTimeout(() => {
      setShowIdleHint(true);
    }, 5000);

    return () => {
      window.clearTimeout(idleTimer);
    };
  }, [isPlayerTurn, turnCount, selectedPiece]);

  // Compute which square the 5-second idle finger should point to
  let hintCellIdx: number | null = null;
  let hintBadgeLabel = 'TAP';
  if (showIdleHint && isPlayerTurn) {
    if (playerPieceCount < 3) {
      hintCellIdx = board[4] === null ? 4 : board.findIndex((c) => c === null);
      hintBadgeLabel = 'TAP';
    } else if (selectedPiece === null) {
      hintCellIdx = board.findIndex((c) => c === 'X');
      hintBadgeLabel = 'TAP & MOVE';
    } else {
      hintCellIdx = board.findIndex((c) => c === null);
      hintBadgeLabel = 'DROP HERE';
    }
    if (hintCellIdx === -1) hintCellIdx = null;
  }

  const triggerShake = useCallback((mode: 'sm' | 'lg') => {
    setShakeMode('none');
    window.requestAnimationFrame(() => {
      setShakeMode(mode);
      window.setTimeout(() => setShakeMode('none'), mode === 'lg' ? 340 : 160);
    });
  }, []);

  const burstAtCell = useCallback(
    (
      idx: number,
      intensity: 'soft' | 'normal' | 'heavy',
      colorOverride?: string,
      floatLabel?: string
    ) => {
      const el = cellRefs.current[idx];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      fxRef.current?.burst(cx, cy, progress.equippedSoundPack, intensity, colorOverride);
      if (floatLabel) {
        fxRef.current?.floatText(cx, cy - 20, floatLabel, '#FBBF24');
      }
    },
    [fxRef, progress.equippedSoundPack]
  );

  const finalizeMatch = useCallback(
    (result: WinCheck, finalTurns: number, winningCellIdx: number) => {
      setWinInfo(result);
      setSelectedPiece(null);
      setBotLiftedCell(null);
      setShowIdleHint(false);
      triggerShake('lg');
      burstAtCell(winningCellIdx, 'heavy', '#FF5A5F');
      crazyGamesSdk.gameplayStop();

      if (!matchRecordedRef.current) {
        matchRecordedRef.current = true;
        asmrAudio.playDefeatChord();
        const earned = onRecordLoss(finalTurns);
        setTokensEarned(earned);
        window.setTimeout(() => {
          setShowEndModal(true);
        }, 680);
      }
    },
    [onRecordLoss, triggerShake, burstAtCell]
  );

  // Master Bot automated turn with visible lift -> slam cadence
  useEffect(() => {
    if (turn !== 'O' || winInfo) return;

    const decision = getBestBotMove(board, recentKeys);
    if (!decision) return;

    if (decision.isForcedWin) {
      setForcedBotWin(true);
    }

    let dropTimer: number | undefined;
    const isRelocationMove = decision.move.from !== null;

    const executeDrop = () => {
      const nextBoard = applyMove(board, decision.move, 'O');
      const nextTurns = turnCount + 1;
      const nextKey = boardToStateKey(nextBoard, 'X');

      setBotLiftedCell(null);
      setBoard(nextBoard);
      setLastPlacedCell(decision.move.to);
      setSlamCounter((c) => c + 1);
      setTurnCount(nextTurns);
      setRecentKeys((prev) => [...prev.slice(-11), nextKey]);
      asmrAudio.playPlace(true);

      const winner = checkWinner(nextBoard);
      if (winner) {
        finalizeMatch(winner, nextTurns, decision.move.to);
      } else {
        triggerShake('sm');
        burstAtCell(decision.move.to, 'normal');
        setTurn('X');
      }
    };

    if (isRelocationMove && decision.move.from !== null) {
      const fromCell = decision.move.from;
      const liftTimer = window.setTimeout(() => {
        setBotLiftedCell(fromCell);
        asmrAudio.playLift(true);
        burstAtCell(fromCell, 'soft', '#38BDF8');
        dropTimer = window.setTimeout(executeDrop, 380);
      }, 340);

      return () => {
        window.clearTimeout(liftTimer);
        if (dropTimer !== undefined) window.clearTimeout(dropTimer);
      };
    }

    const placeTimer = window.setTimeout(executeDrop, 480);
    return () => {
      window.clearTimeout(placeTimer);
    };
  }, [turn, winInfo, board, recentKeys, turnCount, finalizeMatch, triggerShake, burstAtCell]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (!isPlayerTurn) return;
      setShowIdleHint(false);

      // Phase 1: Placement
      if (playerPieceCount < 3) {
        if (board[index] !== null) return;
        const nextBoard = applyMove(board, { from: null, to: index }, 'X');
        const nextTurns = turnCount + 1;
        const nextKey = boardToStateKey(nextBoard, 'O');

        setBoard(nextBoard);
        setLastPlacedCell(index);
        setSlamCounter((c) => c + 1);
        setTurnCount(nextTurns);
        setRecentKeys((prev) => [...prev.slice(-11), nextKey]);
        asmrAudio.playPlace(false);
        triggerShake('sm');
        burstAtCell(index, 'normal', undefined, '+4');

        const winner = checkWinner(nextBoard);
        if (winner) {
          finalizeMatch(winner, nextTurns, index);
          return;
        }
        if (isPositionForcedBotWin(nextBoard)) {
          setForcedBotWin(true);
        }
        setTurn('O');
        return;
      }

      // Phase 2: Endless Relocation
      if (board[index] === 'X') {
        if (selectedPiece === index) {
          setSelectedPiece(null);
          asmrAudio.playHover();
        } else {
          setSelectedPiece(index);
          asmrAudio.playLift(false);
          burstAtCell(index, 'soft');
        }
        return;
      }

      if (board[index] === null && selectedPiece !== null) {
        const nextBoard = applyMove(board, { from: selectedPiece, to: index }, 'X');
        const nextTurns = turnCount + 1;
        const nextKey = boardToStateKey(nextBoard, 'O');

        setSelectedPiece(null);
        setBoard(nextBoard);
        setLastPlacedCell(index);
        setSlamCounter((c) => c + 1);
        setTurnCount(nextTurns);
        setRecentKeys((prev) => [...prev.slice(-11), nextKey]);
        asmrAudio.playPlace(false);
        triggerShake('sm');
        burstAtCell(index, 'normal', undefined, '+4');

        const winner = checkWinner(nextBoard);
        if (winner) {
          finalizeMatch(winner, nextTurns, index);
          return;
        }
        if (isPositionForcedBotWin(nextBoard)) {
          setForcedBotWin(true);
        }
        setTurn('O');
      }
    },
    [
      isPlayerTurn,
      playerPieceCount,
      board,
      selectedPiece,
      turnCount,
      finalizeMatch,
      triggerShake,
      burstAtCell,
    ]
  );

  // Keyboard 1-9 & Escape support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPiece !== null) {
        setSelectedPiece(null);
        asmrAudio.playHover();
        return;
      }
      if (e.key >= '1' && e.key <= '9') {
        handleCellClick(Number(e.key) - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCellClick, selectedPiece]);

  const liveWhisper = getLiveWhisper({
    phase,
    turnCount,
    isBotTurn,
    isForcedBotWin: forcedBotWin,
    selectedPiece,
  });

  const isCellWinning = (idx: number) => winInfo?.line.includes(idx) ?? false;
  const winStart = winInfo ? cellCenterSvg(winInfo.line[0]) : null;
  const winEnd = winInfo ? cellCenterSvg(winInfo.line[2]) : null;

  const phaseInstruction =
    phase === 'placement'
      ? 'TAP ANY TILE TO PLACE YOUR X'
      : selectedPiece !== null
        ? 'TAP ANY BLANK TILE TO DROP!'
        : 'ENDLESS · TAP YOUR X TO LIFT & MOVE';

  return (
    <div
      className={`cartoon-bg-dots relative flex h-full w-full flex-col justify-between overflow-hidden ${
        shakeMode === 'lg' ? 'animate-shake-lg' : shakeMode === 'sm' ? 'animate-shake-sm' : ''
      }`}
    >
      {/* Decorative sunlit cartoon circles */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
      >
        <circle cx="80" cy="140" r="150" fill="#BAE6FD" />
        <circle cx="1370" cy="790" r="180" fill="#FDE68A" />
      </svg>

      {/* Compact Top Cartoon HUD */}
      <div className="relative z-10 flex shrink-0 items-center justify-between px-3.5 py-2.5 sm:px-7 sm:py-3 short:py-2">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              asmrAudio.playUiTap();
              onMainMenu();
            }}
            aria-label="Return to main menu"
            className="flex h-9 items-center gap-1.5 rounded-xl border-[3px] border-[#1E293B] bg-white px-2.5 text-xs font-extrabold text-[#1E293B] shadow-[0_3px_0_#1E293B] transition-transform active:translate-y-[2px] active:shadow-none sm:h-10 sm:rounded-2xl sm:px-3.5 cursor-pointer"
          >
            <Home className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
            <span className="hidden sm:inline">MENU</span>
          </button>

          <div className="flex items-center gap-2 rounded-xl border-[3px] border-[#1E293B] bg-white px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-[#475569] shadow-[0_3px_0_#1E293B] sm:rounded-2xl sm:px-3.5 sm:py-1.5 sm:text-xs">
            <span>
              TRY <strong className="text-[#1E293B]">#{activeAttemptRef.current}</strong>
            </span>
            <span className="text-[#CBD5E1]">|</span>
            <span>
              MOVE <strong className="text-[#FF5A5F]">{turnCount}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="mr-1 hidden items-center gap-1.5 rounded-2xl border-[3px] border-[#1E293B] bg-[#FDE047] px-3 py-1.5 font-mono text-xs font-bold tabular-nums text-[#1E293B] shadow-[0_3px_0_#1E293B] sm:flex">
            <Coins className="h-3.5 w-3.5 text-[#B45309]" aria-hidden="true" />
            <span>{progress.tokens}</span>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={progress.soundEnabled ? 'Mute sound' : 'Enable sound'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-[#1E293B] shadow-[0_3px_0_#1E293B] transition-transform active:translate-y-[2px] active:shadow-none sm:h-10 sm:w-10 sm:rounded-2xl cursor-pointer ${
              progress.soundEnabled ? 'bg-[#38BDF8] text-[#1E293B]' : 'bg-[#E2E8F0] text-[#64748B]'
            }`}
          >
            {progress.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onToggleAmbient}
            aria-label={ambientOn ? 'Disable rain' : 'Enable rain'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-[#1E293B] shadow-[0_3px_0_#1E293B] transition-transform active:translate-y-[2px] active:shadow-none sm:h-10 sm:w-10 sm:rounded-2xl cursor-pointer ${
              ambientOn ? 'bg-[#A7F3D0] text-[#1E293B]' : 'bg-white text-[#64748B]'
            }`}
          >
            <CloudRain className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label="Toggle fullscreen"
            className="flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-[#1E293B] bg-white text-[#1E293B] shadow-[0_3px_0_#1E293B] transition-transform active:translate-y-[2px] active:shadow-none sm:h-10 sm:w-10 sm:rounded-2xl cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[960px] flex-1 items-center justify-center px-3.5 pb-2 sm:px-6">
        <div className="flex w-full flex-col items-center justify-center gap-[clamp(0.55rem,1.8dvh,1.1rem)] short-landscape:flex-row short-landscape:gap-[clamp(1rem,4vw,2.75rem)]">
          {/* Master Bot Live Dialogue Panel — NO TRUNCATE, full crisp text wrapping! */}
          <div className="flex w-full max-w-[min(92vw,58dvh,436px)] flex-col items-center short-landscape:w-[min(40vw,285px)] short-landscape:items-stretch">
            <div
              className={`flex w-full items-center gap-3 rounded-2xl sm:rounded-3xl border-[3px] border-[#1E293B] px-3 py-2 shadow-[0_4px_0_#1E293B] transition-colors short-landscape:flex-col short-landscape:p-4 short-landscape:text-center ${
                forcedBotWin ? 'bg-[#FEE2E2]' : 'bg-white'
              }`}
            >
              <div
                className={`flex h-12 w-12 sm:h-14 sm:w-14 short-landscape:h-16 short-landscape:w-16 items-center justify-center rounded-2xl border-[3px] border-[#1E293B] p-0.5 shrink-0 ${
                  forcedBotWin ? 'bg-[#FCA5A5]' : 'bg-[#FEF08A]'
                }`}
              >
                <CartoonBot mood={botMood} className="h-full w-full" />
              </div>

              <div className="min-w-0 flex-1 short-landscape:w-full">
                <div className="flex items-center justify-between gap-2 short-landscape:flex-col short-landscape:gap-0.5">
                  <span
                    className={`font-mono text-[10px] sm:text-[11px] font-extrabold tracking-wider ${
                      forcedBotWin
                        ? 'text-[#DC2626]'
                        : isBotTurn
                          ? 'text-[#2563EB]'
                          : 'text-[#16A34A]'
                    }`}
                  >
                    {isBotTurn
                      ? 'MASTER BOT · MOVING'
                      : isPlayerTurn
                        ? 'YOUR TURN (X)'
                        : 'YOU LOST!'}
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold tabular-nums text-[#64748B]">
                    {phase === 'placement' ? `PLACE ${playerPieceCount}/3` : 'ENDLESS'}
                  </span>
                </div>
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-0.5 text-xs font-bold leading-snug sm:text-sm short-landscape:mt-1.5 ${
                    forcedBotWin ? 'text-[#B91C1C]' : 'text-[#1E293B]'
                  }`}
                >
                  {winInfo ? 'Too easy. Ready to lose again?' : liveWhisper}
                </p>
              </div>
            </div>

            {/* Phase caption OR instant On-Screen Retry Button in short landscape */}
            {winInfo ? (
              <button
                type="button"
                onClick={() => {
                  asmrAudio.playPlace(false, progress.equippedSoundPack);
                  onTryAgain();
                }}
                className="mt-3 hidden w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E293B] bg-[#22C55E] px-4 py-2.5 font-display text-sm font-bold text-white shadow-[0_4px_0_#1E293B] active:translate-y-[2px] active:shadow-none short-landscape:inline-flex cursor-pointer"
              >
                {needsAdToPlay ? (
                  <>
                    <Tv className="h-4 w-4" aria-hidden="true" />
                    WATCH AD &amp; RETRY
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    RETRY · TRY #{progress.attemptCount}
                  </>
                )}
              </button>
            ) : (
              <p className="mt-3 hidden text-center font-mono text-[11px] font-extrabold tracking-wide text-[#475569] short-landscape:block">
                {phaseInstruction}
              </p>
            )}
          </div>

          {/* 3x3 Chunky Cel-Shaded Game Board */}
          <div className="flex shrink-0 flex-col items-center">
            <div
              className={`relative aspect-square w-[min(90vw,54dvh,430px)] short-landscape:w-[min(48vw,74dvh,396px)] rounded-[24px] sm:rounded-[30px] border-[4px] border-[#1E293B] p-[clamp(0.6rem,1.7vmin,1.2rem)] ${boardTheme.trayBg} ${boardTheme.trayShadow}`}
              role="grid"
              aria-label="Endless Tic-Tac-Toe 3 by 3 board"
            >
              <div className="relative grid h-full w-full grid-cols-3 grid-rows-3 gap-[clamp(0.45rem,1.35vmin,0.8rem)]">
                {board.map((cell, idx) => {
                  const isLiftedByPlayer = selectedPiece === idx;
                  const isLiftedByBot = botLiftedCell === idx;
                  const isWinningSquare = isCellWinning(idx);
                  const isJustPlaced = lastPlacedCell === idx && cell !== null;
                  const isHintCell = hintCellIdx === idx;

                  const canSelectToLift =
                    isPlayerTurn && playerPieceCount === 3 && cell === 'X';
                  const canDropHere =
                    isPlayerTurn &&
                    cell === null &&
                    (playerPieceCount < 3 || selectedPiece !== null);

                  const interactive = canSelectToLift || canDropHere;

                  return (
                    <button
                      key={idx}
                      ref={(el) => {
                        cellRefs.current[idx] = el;
                      }}
                      type="button"
                      disabled={!interactive}
                      aria-label={`Well ${idx + 1} ${cell ?? 'empty'}`}
                      onClick={() => handleCellClick(idx)}
                      onMouseEnter={() => {
                        if (interactive) asmrAudio.playHover();
                      }}
                      className={`group relative flex h-full w-full items-center justify-center rounded-xl sm:rounded-2xl border-[3px] border-[#1E293B] shadow-[inset_0_4px_0_rgba(30,41,59,0.09)] transition-all duration-120 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
                        isWinningSquare
                          ? 'bg-[#FECACA]'
                          : isLiftedByPlayer
                            ? `${boardTheme.wellSelectedBg} ring-4 ring-[#F59E0B]/50`
                            : isLiftedByBot
                              ? 'bg-[#DBEAFE] ring-4 ring-[#38BDF8]/60'
                              : isHintCell
                                ? 'bg-[#FEF9C3] ring-4 ring-[#FF5A5F]/55'
                                : canDropHere && selectedPiece !== null
                                  ? `${boardTheme.wellBg} hover:bg-[#DCFCE7]`
                                  : `${boardTheme.wellBg} ${interactive ? boardTheme.wellHoverBg : ''}`
                      } ${interactive ? 'cursor-pointer active:scale-[0.95]' : 'cursor-default'}`}
                    >
                      {/* Inviting drop target ring when player holds a lifted piece */}
                      {canDropHere && selectedPiece !== null && cell === null && (
                        <span
                          aria-hidden="true"
                          className="h-[22%] w-[22%] rounded-full border-[3px] border-[#1E293B] bg-[#4ADE80] transition-transform duration-150 group-hover:scale-125"
                        />
                      )}

                      {/* Fluidly scaled Piece Glyph */}
                      {cell && (
                        <div
                          key={isJustPlaced ? `slam-${idx}-${slamCounter}` : `piece-${idx}`}
                          className={`h-[68%] w-[68%] ${isJustPlaced ? 'animate-piece-slam' : ''} ${
                            isLiftedByPlayer || isLiftedByBot
                              ? 'animate-lifted-bob drop-shadow-[0_8px_0_rgba(30,41,59,0.22)]'
                              : ''
                          }`}
                        >
                          <PieceGlyph
                            player={cell}
                            styleId={progress.equippedPieceStyle}
                            isWinning={isWinningSquare}
                          />
                        </div>
                      )}

                      {/* 5-Second Idle Animated Cartoon Finger Pointer */}
                      {isHintCell && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-2 -right-2 z-20 flex flex-col items-center"
                        >
                          <span className="mb-0.5 rounded-lg border-[2px] border-[#1E293B] bg-[#FF5A5F] px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-white shadow-[0_2px_0_#1E293B] whitespace-nowrap">
                            {hintBadgeLabel}
                          </span>
                          <div className="animate-finger-tap">
                            <CartoonFingerIcon />
                          </div>
                        </div>
                      )}

                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-1 right-2 font-mono text-[9px] font-bold text-[#94A3B8] sm:text-[10px]"
                      >
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}

                {/* Bold Comic Strike-Through Beam on Checkmate */}
                {winStart && winEnd && (
                  <svg
                    viewBox="0 0 300 300"
                    className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                    aria-hidden="true"
                  >
                    <line
                      x1={winStart.x}
                      y1={winStart.y}
                      x2={winEnd.x}
                      y2={winEnd.y}
                      stroke="#1E293B"
                      strokeWidth="18"
                      strokeLinecap="round"
                      className="animate-strike-draw"
                    />
                    <line
                      x1={winStart.x}
                      y1={winStart.y}
                      x2={winEnd.x}
                      y2={winEnd.y}
                      stroke="#FF5A5F"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="animate-strike-draw"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* On-Screen Direct Retry Button on Loss OR Phase Instruction while playing */}
            {winInfo ? (
              <button
                type="button"
                onClick={() => {
                  asmrAudio.playPlace(false, progress.equippedSoundPack);
                  onTryAgain();
                }}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E293B] bg-[#22C55E] px-6 py-2.5 font-display text-base font-bold text-white shadow-[0_5px_0_#1E293B] transition-all hover:bg-[#16A34A] active:translate-y-[3px] active:shadow-[0_2px_0_#1E293B] short-landscape:hidden cursor-pointer"
              >
                {needsAdToPlay ? (
                  <>
                    <Tv className="h-4 w-4" aria-hidden="true" />
                    WATCH AD &amp; RETRY · TRY #{progress.attemptCount}
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    RETRY · TRY #{progress.attemptCount}
                  </>
                )}
              </button>
            ) : (
              <p className="mt-3 text-center font-mono text-[11px] font-extrabold tracking-wide text-[#475569] sm:text-xs short-landscape:hidden">
                {phaseInstruction}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Compact, Zero-Clip Cartoon Game Over Roast Overlay */}
      {showEndModal && winInfo && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0F172A]/45 p-3.5 backdrop-blur-xs">
          <div className="animate-boss-pop flex max-h-[92dvh] w-full max-w-[420px] flex-col items-center overflow-y-auto rounded-[28px] border-[4px] border-[#1E293B] bg-white p-5 text-center shadow-[0_10px_0_#1E293B] sm:p-6 short-landscape:max-w-[580px] short-landscape:flex-row short-landscape:gap-5 short-landscape:p-4 short-landscape:text-left">
            <div className="flex flex-col items-center shrink-0">
              <div className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-2xl border-[3px] border-[#1E293B] bg-[#FECACA] p-1 shadow-[0_4px_0_#1E293B]">
                <CartoonBot mood="laughing" className="h-full w-full" />
              </div>
              <p className="mt-2 font-mono text-[11px] font-extrabold tracking-wider text-[#EF4444]">
                DEFEAT · TRY #{activeAttemptRef.current}
              </p>
            </div>

            <div className="flex w-full flex-col items-center short-landscape:items-stretch">
              <h2 className="mt-1 font-display text-2xl font-bold text-[#1E293B] sm:text-3xl short-landscape:mt-0">
                Master Bot Wins!
              </h2>
              <p className="mt-1.5 text-xs font-bold leading-relaxed text-[#475569] sm:text-sm">
                {getLossRemark(turnCount, progress.totalLosses)}
              </p>

              {/* Score & Coins Summary */}
              <div className="mt-3.5 grid w-full grid-cols-3 gap-2 rounded-2xl border-[3px] border-[#1E293B] bg-[#FFF7E8] p-2.5 text-center">
                <div>
                  <p className="font-mono text-[10px] font-bold text-[#64748B]">MOVES</p>
                  <p className="font-mono text-lg font-extrabold tabular-nums text-[#1E293B]">
                    {turnCount}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold text-[#64748B]">COINS</p>
                  <p className="font-mono text-lg font-extrabold tabular-nums text-[#D97706]">
                    +{tokensEarned ?? 0}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold text-[#64748B]">LOSSES</p>
                  <p className="font-mono text-lg font-extrabold tabular-nums text-[#EF4444]">
                    {progress.totalLosses}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex w-full flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    asmrAudio.playPlace(false, progress.equippedSoundPack);
                    onTryAgain();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E293B] bg-[#22C55E] px-5 py-3 font-display text-base font-bold text-white shadow-[0_5px_0_#1E293B] transition-all duration-100 hover:bg-[#16A34A] active:translate-y-[3px] active:shadow-[0_2px_0_#1E293B] sm:text-lg whitespace-nowrap cursor-pointer"
                >
                  {needsAdToPlay ? (
                    <>
                      <Tv className="h-5 w-5 shrink-0" aria-hidden="true" />
                      WATCH AD &amp; RETRY · #{progress.attemptCount}
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden="true" />
                      RETRY · TRY #{progress.attemptCount}
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      asmrAudio.playUiTap();
                      onOpenShop();
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border-[3px] border-[#1E293B] bg-[#FDE047] px-3 py-2.5 font-display text-sm font-bold text-[#1E293B] shadow-[0_4px_0_#1E293B] transition-all duration-100 hover:bg-[#FACC15] active:translate-y-[2px] active:shadow-[0_2px_0_#1E293B] cursor-pointer"
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    SHOP
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      asmrAudio.playUiTap();
                      onMainMenu();
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border-[3px] border-[#1E293B] bg-[#F1F5F9] px-3 py-2.5 font-display text-sm font-bold text-[#334155] shadow-[0_4px_0_#1E293B] transition-all duration-100 hover:bg-[#E2E8F0] active:translate-y-[2px] active:shadow-[0_2px_0_#1E293B] cursor-pointer"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    MENU
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
