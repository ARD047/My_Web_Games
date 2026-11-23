import { useState } from 'react';
import { ArrowLeft, Volume2, Check, Lock, Coins, Play, Tv } from 'lucide-react';
import {
  BOARD_THEMES,
  PIECE_STYLES,
  SOUND_PACKS,
  type BoardThemeId,
  type PieceStyleId,
} from '../data/shop';
import { asmrAudio, type SoundPackId } from '../engine/asmrAudio';
import type { GameProgress } from '../hooks/useGameProgress';
import type { FxController } from './GameCanvasFX';
import { PieceGlyph } from './PieceGlyph';

type ShopTab = 'sounds' | 'boards' | 'pieces';

interface ShopViewProps {
  progress: GameProgress;
  needsAdToPlay: boolean;
  fxRef: React.MutableRefObject<FxController | null>;
  onBuyOrEquipSound: (id: SoundPackId, price: number) => boolean;
  onBuyOrEquipBoard: (id: BoardThemeId, price: number) => boolean;
  onBuyOrEquipPiece: (id: PieceStyleId, price: number) => boolean;
  onBack: () => void;
  onPlayNow: () => void;
}

export function ShopView({
  progress,
  needsAdToPlay,
  fxRef,
  onBuyOrEquipSound,
  onBuyOrEquipBoard,
  onBuyOrEquipPiece,
  onBack,
  onPlayNow,
}: ShopViewProps) {
  const [tab, setTab] = useState<ShopTab>('sounds');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2000);
  };

  const burstBtn = (e: React.MouseEvent<HTMLButtonElement>, pack: SoundPackId, heavy = false) => {
    const r = e.currentTarget.getBoundingClientRect();
    fxRef.current?.burst(
      r.left + r.width / 2,
      r.top + r.height / 2,
      pack,
      heavy ? 'heavy' : 'normal'
    );
  };

  const handleSound = (
    id: SoundPackId,
    name: string,
    price: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const owned = progress.ownedSoundPacks.includes(id);
    if (owned) {
      onBuyOrEquipSound(id, price);
      asmrAudio.setPack(id);
      asmrAudio.playPlace(false, id);
      burstBtn(e, id);
      showToast(`${name} equipped!`);
      return;
    }
    if (progress.tokens < price) {
      asmrAudio.playUiTap();
      showToast(`Need ${price - progress.tokens} more coins!`);
      return;
    }
    if (onBuyOrEquipSound(id, price)) {
      asmrAudio.setPack(id);
      asmrAudio.playShopUnlock();
      burstBtn(e, id, true);
      showToast(`Unlocked ${name}!`);
    }
  };

  const handleBoard = (
    id: BoardThemeId,
    name: string,
    price: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const owned = progress.ownedBoardThemes.includes(id);
    if (owned) {
      onBuyOrEquipBoard(id, price);
      asmrAudio.playUiTap();
      burstBtn(e, progress.equippedSoundPack);
      showToast(`${name} equipped!`);
      return;
    }
    if (progress.tokens < price) {
      asmrAudio.playUiTap();
      showToast(`Need ${price - progress.tokens} more coins!`);
      return;
    }
    if (onBuyOrEquipBoard(id, price)) {
      asmrAudio.playShopUnlock();
      burstBtn(e, progress.equippedSoundPack, true);
      showToast(`Unlocked ${name}!`);
    }
  };

  const handlePiece = (
    id: PieceStyleId,
    name: string,
    price: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const owned = progress.ownedPieceStyles.includes(id);
    if (owned) {
      onBuyOrEquipPiece(id, price);
      asmrAudio.playUiTap();
      burstBtn(e, progress.equippedSoundPack);
      showToast(`${name} equipped!`);
      return;
    }
    if (progress.tokens < price) {
      asmrAudio.playUiTap();
      showToast(`Need ${price - progress.tokens} more coins!`);
      return;
    }
    if (onBuyOrEquipPiece(id, price)) {
      asmrAudio.playShopUnlock();
      burstBtn(e, progress.equippedSoundPack, true);
      showToast(`Unlocked ${name}!`);
    }
  };

  return (
    <div className="cartoon-bg-dots relative flex h-full w-full flex-col overflow-hidden">
      {/* Compact Cartoon Shop Top Bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b-[3px] border-[#1E293B] bg-white px-3.5 py-2.5 sm:px-7 sm:py-3.5 short:py-2">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            type="button"
            onClick={() => {
              asmrAudio.playUiTap();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border-[3px] border-[#1E293B] bg-[#F1F5F9] px-3 py-1.5 font-display text-xs font-bold text-[#1E293B] shadow-[0_3px_0_#1E293B] transition-all hover:bg-[#E2E8F0] active:translate-y-[2px] active:shadow-none sm:rounded-2xl sm:px-3.5 sm:py-2 sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            BACK
          </button>

          <h1 className="font-display text-xl font-bold text-[#1E293B] sm:text-2xl">Shop</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {toast && (
            <span role="status" className="hidden text-xs font-extrabold text-[#2563EB] md:inline">
              {toast}
            </span>
          )}
          <div className="flex items-center gap-1.5 rounded-xl border-[3px] border-[#1E293B] bg-[#FDE047] px-2.5 py-1 font-mono text-xs font-extrabold tabular-nums text-[#1E293B] shadow-[0_3px_0_#1E293B] sm:rounded-2xl sm:px-3.5 sm:py-1.5 sm:text-sm">
            <Coins className="h-3.5 w-3.5 text-[#B45309] sm:h-4 sm:w-4" aria-hidden="true" />
            <span>{progress.tokens}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              asmrAudio.playPlace(false, progress.equippedSoundPack);
              onPlayNow();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border-[3px] border-[#1E293B] bg-[#22C55E] px-3 py-1.5 font-display text-xs font-bold text-white shadow-[0_3px_0_#1E293B] hover:bg-[#16A34A] active:translate-y-[2px] active:shadow-none sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm whitespace-nowrap cursor-pointer"
          >
            {needsAdToPlay ? (
              <>
                <Tv className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                AD · PLAY
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" aria-hidden="true" />
                PLAY
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cartoon Category Switcher */}
      <div className="flex shrink-0 items-center justify-center px-3 pt-3 short:pt-2">
        <div
          role="tablist"
          className="inline-flex gap-1.5 rounded-2xl border-[3px] border-[#1E293B] bg-white p-1 shadow-[0_4px_0_#1E293B] sm:gap-2 sm:p-1.5"
        >
          {(
            [
              { id: 'sounds', label: 'Sounds' },
              { id: 'boards', label: 'Boards' },
              { id: 'pieces', label: 'Pieces' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => {
                asmrAudio.playUiTap();
                setTab(item.id);
              }}
              className={`rounded-xl px-4 py-1.5 font-display text-xs font-bold tracking-wide transition-colors whitespace-nowrap cursor-pointer sm:px-5 sm:py-2 sm:text-sm ${
                tab === item.id
                  ? 'border-[2px] border-[#1E293B] bg-[#38BDF8] text-[#1E293B]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile toast line */}
      {toast && (
        <p role="status" className="mt-2 text-center text-xs font-extrabold text-[#2563EB] md:hidden">
          {toast}
        </p>
      )}

      {/* Scrollable Shop Grid */}
      <div className="mx-auto min-h-0 w-full max-w-[980px] flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-5">
        {tab === 'sounds' && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {SOUND_PACKS.map((pack) => {
              const owned = progress.ownedSoundPacks.includes(pack.id);
              const equipped = progress.equippedSoundPack === pack.id;
              const canAfford = progress.tokens >= pack.price;

              return (
                <div
                  key={pack.id}
                  className={`flex flex-col justify-between rounded-3xl border-[3px] border-[#1E293B] p-4 shadow-[0_5px_0_#1E293B] sm:p-5 ${
                    equipped ? 'bg-[#FEF9C3]' : 'bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-base font-bold text-[#1E293B] sm:text-lg">
                        {pack.name}
                      </h2>
                      <span className="font-mono text-xs font-extrabold tabular-nums text-[#D97706]">
                        {owned ? (equipped ? 'ACTIVE' : 'OWNED') : `${pack.price}`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-bold text-[#2563EB] sm:text-xs">
                      {pack.acousticProfile}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#475569]">
                      {pack.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        asmrAudio.playPackPreview(pack.id);
                        burstBtn(e, pack.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border-[2.5px] border-[#1E293B] bg-[#E0F2FE] px-3 py-1.5 text-xs font-extrabold text-[#1E293B] shadow-[0_3px_0_#1E293B] hover:bg-[#BAE6FD] active:translate-y-[2px] active:shadow-none cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
                      Test
                    </button>

                    <button
                      type="button"
                      disabled={equipped}
                      onClick={(e) => handleSound(pack.id, pack.name, pack.price, e)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border-[2.5px] border-[#1E293B] px-3.5 py-1.5 text-xs font-extrabold transition-all whitespace-nowrap ${
                        equipped
                          ? 'bg-[#DCFCE7] text-[#15803D] cursor-default'
                          : owned
                            ? 'bg-[#38BDF8] text-[#1E293B] shadow-[0_3px_0_#1E293B] hover:bg-[#0EA5E9] active:translate-y-[2px] active:shadow-none cursor-pointer'
                            : canAfford
                              ? 'bg-[#22C55E] text-white shadow-[0_3px_0_#1E293B] hover:bg-[#16A34A] active:translate-y-[2px] active:shadow-none cursor-pointer'
                              : 'bg-[#F1F5F9] text-[#64748B] cursor-pointer'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Equipped
                        </>
                      ) : owned ? (
                        'Equip'
                      ) : (
                        <>
                          {!canAfford && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                          Buy · {pack.price}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'boards' && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {BOARD_THEMES.map((theme) => {
              const owned = progress.ownedBoardThemes.includes(theme.id);
              const equipped = progress.equippedBoardTheme === theme.id;
              const canAfford = progress.tokens >= theme.price;

              return (
                <div
                  key={theme.id}
                  className={`flex items-center justify-between gap-3 rounded-3xl border-[3px] border-[#1E293B] p-4 shadow-[0_5px_0_#1E293B] sm:p-5 ${
                    equipped ? 'bg-[#FEF9C3]' : 'bg-white'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div
                      className={`grid grid-cols-3 gap-1 rounded-2xl border-[3px] border-[#1E293B] p-1.5 shrink-0 ${theme.trayBg}`}
                    >
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-3.5 w-3.5 rounded border border-[#1E293B]/60 ${theme.wellBg}`}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-bold text-[#1E293B] sm:text-lg">
                        {theme.name}
                      </h2>
                      <p className="mt-0.5 text-xs font-semibold text-[#475569]">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={equipped}
                    onClick={(e) => handleBoard(theme.id, theme.name, theme.price, e)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border-[2.5px] border-[#1E293B] px-3.5 py-2 text-xs font-extrabold whitespace-nowrap shrink-0 transition-all ${
                      equipped
                        ? 'bg-[#DCFCE7] text-[#15803D] cursor-default'
                        : owned
                          ? 'bg-[#38BDF8] text-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-[2px] active:shadow-none cursor-pointer'
                          : canAfford
                            ? 'bg-[#22C55E] text-white shadow-[0_3px_0_#1E293B] active:translate-y-[2px] active:shadow-none cursor-pointer'
                            : 'bg-[#F1F5F9] text-[#64748B] cursor-pointer'
                    }`}
                  >
                    {equipped ? 'Equipped' : owned ? 'Equip' : `Buy · ${theme.price}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'pieces' && (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {PIECE_STYLES.map((style) => {
              const owned = progress.ownedPieceStyles.includes(style.id);
              const equipped = progress.equippedPieceStyle === style.id;
              const canAfford = progress.tokens >= style.price;

              return (
                <div
                  key={style.id}
                  className={`flex items-center justify-between gap-3 rounded-3xl border-[3px] border-[#1E293B] p-4 shadow-[0_5px_0_#1E293B] sm:p-5 ${
                    equipped ? 'bg-[#FEF9C3]' : 'bg-white'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="flex items-center gap-1.5 rounded-2xl border-[3px] border-[#1E293B] bg-[#FFF7E8] p-2 shrink-0">
                      <PieceGlyph player="X" styleId={style.id} size={30} />
                      <PieceGlyph player="O" styleId={style.id} size={30} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-base font-bold text-[#1E293B] sm:text-lg">
                        {style.name}
                      </h2>
                      <p className="mt-0.5 text-xs font-semibold text-[#475569]">
                        {style.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={equipped}
                    onClick={(e) => handlePiece(style.id, style.name, style.price, e)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border-[2.5px] border-[#1E293B] px-3.5 py-2 text-xs font-extrabold whitespace-nowrap shrink-0 transition-all ${
                      equipped
                        ? 'bg-[#DCFCE7] text-[#15803D] cursor-default'
                        : owned
                          ? 'bg-[#38BDF8] text-[#1E293B] shadow-[0_3px_0_#1E293B] active:translate-y-[2px] active:shadow-none cursor-pointer'
                          : canAfford
                            ? 'bg-[#22C55E] text-white shadow-[0_3px_0_#1E293B] active:translate-y-[2px] active:shadow-none cursor-pointer'
                            : 'bg-[#F1F5F9] text-[#64748B] cursor-pointer'
                    }`}
                  >
                    {equipped ? 'Equipped' : owned ? 'Equip' : `Buy · ${style.price}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
