import { useCallback, useEffect, useRef, useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { PreGameTaunt } from './components/PreGameTaunt';
import { GameBoard } from './components/GameBoard';
import { ShopView } from './components/ShopView';
import { AdOverlay } from './components/AdOverlay';
import { GameCanvasFX, type FxController } from './components/GameCanvasFX';
import { useGameProgress } from './hooks/useGameProgress';
import { asmrAudio } from './engine/asmrAudio';
import { crazyGamesSdk } from './engine/crazyGamesSdk';
import { initSolver, type Player } from './engine/solver';

type GameScreen = 'MENU' | 'SHOP' | 'TAUNT' | 'PLAYING';

export default function App() {
  const {
    progress,
    recordMatchLoss,
    clearAdGate,
    buyOrEquipSoundPack,
    buyOrEquipBoardTheme,
    buyOrEquipPieceStyle,
    toggleSound,
  } = useGameProgress();

  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [matchKey, setMatchKey] = useState(0);
  const [firstTurn, setFirstTurn] = useState<Player>('X');
  const [ambientOn, setAmbientOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sdkMuted, setSdkMuted] = useState(false);
  const [adMuted, setAdMuted] = useState(false);
  const [fallbackAdOpen, setFallbackAdOpen] = useState(false);

  const fxRef = useRef<FxController | null>(null);
  const fallbackAdDoneRef = useRef<(() => void) | null>(null);
  const screenRef = useRef<GameScreen>('MENU');
  const adOpenRef = useRef(false);

  // Every 2 losses requires watching a CrazyGames midgame ad before playing again — even via Main Menu!
  const needsAdToPlay = progress.lossesSinceLastAd >= 2;

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    adOpenRef.current = fallbackAdOpen || adMuted;
  }, [fallbackAdOpen, adMuted]);

  // Pre-warm exact retrograde Master Bot solver & initialize CrazyGames SDK v3
  useEffect(() => {
    initSolver();
    crazyGamesSdk.init((mutedByPortal) => {
      setSdkMuted(mutedByPortal);
    });
    crazyGamesSdk.registerFallbackAdHandler((onDone) => {
      fallbackAdDoneRef.current = onDone;
      setFallbackAdOpen(true);
    });
    return () => {
      crazyGamesSdk.registerFallbackAdHandler(null);
      crazyGamesSdk.gameplayStop();
    };
  }, []);

  // Sync audio preferences + CrazyGames ad/portal mute state
  useEffect(() => {
    asmrAudio.setEnabled(progress.soundEnabled);
    asmrAudio.setPack(progress.equippedSoundPack);
    asmrAudio.setExternalMuted(sdkMuted || adMuted);
  }, [progress.soundEnabled, progress.equippedSoundPack, sdkMuted, adMuted]);

  // CrazyGames gameplayStart / gameplayStop lifecycle
  useEffect(() => {
    if (screen === 'PLAYING' && !fallbackAdOpen && !adMuted) {
      crazyGamesSdk.gameplayStart();
    } else {
      crazyGamesSdk.gameplayStop();
    }
  }, [screen, fallbackAdOpen, adMuted]);

  // Helper to navigate with History API push so mobile hardware/gesture Back works seamlessly
  const navigateTo = useCallback((next: GameScreen) => {
    setScreen((prev) => {
      if (prev === next) return prev;
      try {
        if (next === 'MENU') {
          window.history.replaceState({ screen: 'MENU' }, '');
        } else {
          window.history.pushState({ screen: next }, '');
        }
      } catch {
        // ignore sandboxed iframe history restrictions
      }
      return next;
    });
  }, []);

  // Mobile Back button (popstate) + Escape back navigation handler
  useEffect(() => {
    try {
      window.history.replaceState({ screen: 'MENU' }, '');
    } catch {
      // ignore if restricted
    }

    const onPopState = (e: PopStateEvent) => {
      // Keep player safely on screen if an ad is playing
      if (adOpenRef.current) {
        try {
          window.history.pushState({ screen: screenRef.current }, '');
        } catch {
          // ignore
        }
        return;
      }

      const target = (e.state?.screen as GameScreen | undefined) ?? 'MENU';
      if (screenRef.current !== 'MENU') {
        asmrAudio.playUiTap();
        crazyGamesSdk.gameplayStop();
        setScreen(target === 'PLAYING' ? 'MENU' : target);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !adOpenRef.current) {
        if (screenRef.current === 'SHOP' || screenRef.current === 'TAUNT') {
          asmrAudio.playUiTap();
          navigateTo('MENU');
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navigateTo]);

  // Listen for browser fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    asmrAudio.playUiTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleToggleAmbient = () => {
    const next = !ambientOn;
    setAmbientOn(next);
    asmrAudio.toggleAmbient(next);
  };

  // Unified entry point to start/retry a match — enforces CrazyGames midgame ad after every 2 losses
  // regardless of whether the player clicks Retry OR returns to Main Menu / Shop first!
  const handleStartOrRetry = useCallback(() => {
    if (progress.lossesSinceLastAd >= 2) {
      crazyGamesSdk.requestMidgameAd({
        onAudioMute: (muted) => setAdMuted(muted),
        onComplete: () => {
          clearAdGate();
          navigateTo('TAUNT');
        },
      });
      return;
    }
    navigateTo('TAUNT');
  }, [progress.lossesSinceLastAd, clearAdGate, navigateTo]);

  const handleAcceptTaunt = useCallback(() => {
    // Double-check safeguard in case state changed while on Taunt screen
    if (progress.lossesSinceLastAd >= 2) {
      crazyGamesSdk.requestMidgameAd({
        onAudioMute: (muted) => setAdMuted(muted),
        onComplete: () => {
          clearAdGate();
          setMatchKey((k) => k + 1);
          navigateTo('PLAYING');
        },
      });
      return;
    }
    setMatchKey((k) => k + 1);
    navigateTo('PLAYING');
  }, [progress.lossesSinceLastAd, clearAdGate, navigateTo]);

  const handleFallbackAdComplete = useCallback(() => {
    setFallbackAdOpen(false);
    const done = fallbackAdDoneRef.current;
    fallbackAdDoneRef.current = null;
    done?.();
  }, []);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative h-[100dvh] w-[100dvw] overflow-hidden bg-[#FFF7E8] text-[#1E293B] select-none"
    >
      {/* Shared 60fps Canvas FX Layer (ripples, pack particles, floating +4 coins) */}
      <GameCanvasFX controllerRef={fxRef} />

      {/* Local/Preview CrazyGames Midgame Ad Overlay */}
      <AdOverlay visible={fallbackAdOpen} onComplete={handleFallbackAdComplete} />

      {screen === 'MENU' && (
        <MainMenu
          progress={progress}
          firstTurn={firstTurn}
          needsAdToPlay={needsAdToPlay}
          ambientOn={ambientOn}
          isFullscreen={isFullscreen}
          fxRef={fxRef}
          onChangeFirstTurn={setFirstTurn}
          onToggleSound={toggleSound}
          onToggleAmbient={handleToggleAmbient}
          onToggleFullscreen={handleToggleFullscreen}
          onStartGame={handleStartOrRetry}
          onOpenShop={() => navigateTo('SHOP')}
        />
      )}

      {screen === 'TAUNT' && (
        <PreGameTaunt
          attemptNumber={progress.attemptCount}
          totalLosses={progress.totalLosses}
          bestSurvivalTurns={progress.bestSurvivalTurns}
          firstTurn={firstTurn}
          needsAdToPlay={needsAdToPlay}
          soundPack={progress.equippedSoundPack}
          fxRef={fxRef}
          onChangeFirstTurn={setFirstTurn}
          onAccept={handleAcceptTaunt}
          onDecline={() => navigateTo('MENU')}
        />
      )}

      {screen === 'PLAYING' && (
        <GameBoard
          key={matchKey}
          progress={progress}
          firstTurn={firstTurn}
          needsAdToPlay={needsAdToPlay}
          ambientOn={ambientOn}
          isFullscreen={isFullscreen}
          fxRef={fxRef}
          onToggleSound={toggleSound}
          onToggleAmbient={handleToggleAmbient}
          onToggleFullscreen={handleToggleFullscreen}
          onRecordLoss={recordMatchLoss}
          onTryAgain={handleStartOrRetry}
          onOpenShop={() => navigateTo('SHOP')}
          onMainMenu={() => navigateTo('MENU')}
        />
      )}

      {screen === 'SHOP' && (
        <ShopView
          progress={progress}
          needsAdToPlay={needsAdToPlay}
          fxRef={fxRef}
          onBuyOrEquipSound={buyOrEquipSoundPack}
          onBuyOrEquipBoard={buyOrEquipBoardTheme}
          onBuyOrEquipPiece={buyOrEquipPieceStyle}
          onBack={() => navigateTo('MENU')}
          onPlayNow={handleStartOrRetry}
        />
      )}
    </div>
  );
}
