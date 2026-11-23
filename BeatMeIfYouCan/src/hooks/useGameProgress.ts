import { useCallback, useEffect, useState } from 'react';
import type { SoundPackId } from '../engine/asmrAudio';
import {
  BOARD_THEMES,
  PIECE_STYLES,
  SOUND_PACKS,
  type BoardThemeId,
  type PieceStyleId,
} from '../data/shop';

export interface GameProgress {
  attemptCount: number;
  totalLosses: number;
  lossesSinceLastAd: number;
  bestSurvivalTurns: number;
  tokens: number;
  ownedSoundPacks: SoundPackId[];
  ownedBoardThemes: BoardThemeId[];
  ownedPieceStyles: PieceStyleId[];
  equippedSoundPack: SoundPackId;
  equippedBoardTheme: BoardThemeId;
  equippedPieceStyle: PieceStyleId;
  soundEnabled: boolean;
}

const STORAGE_KEY = 'silent_clack_progress_v2';

const DEFAULT_PROGRESS: GameProgress = {
  attemptCount: 1,
  totalLosses: 0,
  lossesSinceLastAd: 0,
  bestSurvivalTurns: 0,
  tokens: 25,
  ownedSoundPacks: ['walnut'],
  ownedBoardThemes: ['sunny-wood'],
  ownedPieceStyles: ['classic-pop'],
  equippedSoundPack: 'walnut',
  equippedBoardTheme: 'sunny-wood',
  equippedPieceStyle: 'classic-pop',
  soundEnabled: true,
};

const VALID_SOUNDS = new Set(SOUND_PACKS.map((s) => s.id));
const VALID_BOARDS = new Set(BOARD_THEMES.map((b) => b.id));
const VALID_PIECES = new Set(PIECE_STYLES.map((p) => p.id));

function loadProgress(): GameProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<GameProgress>;

    const ownedSounds = (parsed.ownedSoundPacks ?? []).filter((id): id is SoundPackId =>
      VALID_SOUNDS.has(id)
    );
    const ownedBoards = (parsed.ownedBoardThemes ?? []).filter((id): id is BoardThemeId =>
      VALID_BOARDS.has(id)
    );
    const ownedPieces = (parsed.ownedPieceStyles ?? []).filter((id): id is PieceStyleId =>
      VALID_PIECES.has(id)
    );

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      lossesSinceLastAd:
        typeof parsed.lossesSinceLastAd === 'number' && parsed.lossesSinceLastAd >= 0
          ? parsed.lossesSinceLastAd
          : 0,
      ownedSoundPacks: ownedSounds.length > 0 ? ownedSounds : DEFAULT_PROGRESS.ownedSoundPacks,
      ownedBoardThemes: ownedBoards.length > 0 ? ownedBoards : DEFAULT_PROGRESS.ownedBoardThemes,
      ownedPieceStyles: ownedPieces.length > 0 ? ownedPieces : DEFAULT_PROGRESS.ownedPieceStyles,
      equippedSoundPack:
        parsed.equippedSoundPack && VALID_SOUNDS.has(parsed.equippedSoundPack)
          ? parsed.equippedSoundPack
          : DEFAULT_PROGRESS.equippedSoundPack,
      equippedBoardTheme:
        parsed.equippedBoardTheme && VALID_BOARDS.has(parsed.equippedBoardTheme)
          ? parsed.equippedBoardTheme
          : DEFAULT_PROGRESS.equippedBoardTheme,
      equippedPieceStyle:
        parsed.equippedPieceStyle && VALID_PIECES.has(parsed.equippedPieceStyle)
          ? parsed.equippedPieceStyle
          : DEFAULT_PROGRESS.equippedPieceStyle,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage quota errors
    }
  }, [progress]);

  const recordMatchLoss = useCallback((turnsSurvived: number) => {
    const tokensEarned = 15 + turnsSurvived * 4;
    setProgress((prev) => ({
      ...prev,
      attemptCount: prev.attemptCount + 1,
      totalLosses: prev.totalLosses + 1,
      lossesSinceLastAd: prev.lossesSinceLastAd + 1,
      bestSurvivalTurns: Math.max(prev.bestSurvivalTurns, turnsSurvived),
      tokens: prev.tokens + tokensEarned,
    }));
    return tokensEarned;
  }, []);

  const clearAdGate = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      lossesSinceLastAd: 0,
    }));
  }, []);

  const buyOrEquipSoundPack = useCallback((id: SoundPackId, price: number): boolean => {
    let success = false;
    setProgress((prev) => {
      if (prev.ownedSoundPacks.includes(id)) {
        success = true;
        return { ...prev, equippedSoundPack: id };
      }
      if (prev.tokens < price) return prev;
      success = true;
      return {
        ...prev,
        tokens: prev.tokens - price,
        ownedSoundPacks: [...prev.ownedSoundPacks, id],
        equippedSoundPack: id,
      };
    });
    return success;
  }, []);

  const buyOrEquipBoardTheme = useCallback((id: BoardThemeId, price: number): boolean => {
    let success = false;
    setProgress((prev) => {
      if (prev.ownedBoardThemes.includes(id)) {
        success = true;
        return { ...prev, equippedBoardTheme: id };
      }
      if (prev.tokens < price) return prev;
      success = true;
      return {
        ...prev,
        tokens: prev.tokens - price,
        ownedBoardThemes: [...prev.ownedBoardThemes, id],
        equippedBoardTheme: id,
      };
    });
    return success;
  }, []);

  const buyOrEquipPieceStyle = useCallback((id: PieceStyleId, price: number): boolean => {
    let success = false;
    setProgress((prev) => {
      if (prev.ownedPieceStyles.includes(id)) {
        success = true;
        return { ...prev, equippedPieceStyle: id };
      }
      if (prev.tokens < price) return prev;
      success = true;
      return {
        ...prev,
        tokens: prev.tokens - price,
        ownedPieceStyles: [...prev.ownedPieceStyles, id],
        equippedPieceStyle: id,
      };
    });
    return success;
  }, []);

  const toggleSound = useCallback(() => {
    setProgress((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  return {
    progress,
    recordMatchLoss,
    clearAdGate,
    buyOrEquipSoundPack,
    buyOrEquipBoardTheme,
    buyOrEquipPieceStyle,
    toggleSound,
  };
}
