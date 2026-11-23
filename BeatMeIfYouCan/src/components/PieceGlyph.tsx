import { getPieceStyle, type PieceStyleId } from '../data/shop';
import type { Player } from '../engine/solver';

interface PieceGlyphProps {
  player: Player;
  styleId: PieceStyleId;
  size?: number;
  className?: string;
  isWinning?: boolean;
}

/**
 * Chunky cel-shaded vector cartoon X and O pieces that scale fluidly via className or fixed size.
 */
export function PieceGlyph({
  player,
  styleId,
  size,
  className = 'w-full h-full',
  isWinning = false,
}: PieceGlyphProps) {
  const style = getPieceStyle(styleId);
  const fill =
    isWinning && player === 'O' ? '#FF5A5F' : player === 'X' ? style.playerFill : style.botFill;
  const hi =
    isWinning && player === 'O'
      ? '#FCA5A5'
      : player === 'X'
        ? style.playerHighlight
        : style.botHighlight;

  const sizeProps = size ? { width: size, height: size } : {};

  if (player === 'X') {
    if (styleId === 'star-gem') {
      return (
        <svg
          {...sizeProps}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          className={className}
        >
          <path
            d="M17 11L32 23L47 11L53 17L41 32L53 47L47 53L32 41L17 53L11 47L23 32L11 17L17 11Z"
            fill={fill}
            stroke="#1E293B"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <path
            d="M19 16L27 23M45 16L37 23"
            stroke="white"
            strokeOpacity="0.7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="32" cy="32" r="4.5" fill={hi} stroke="#1E293B" strokeWidth="2.5" />
        </svg>
      );
    }

    return (
      <svg
        {...sizeProps}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <path
          d="M16 16L48 48M48 16L16 48"
          stroke="#1E293B"
          strokeWidth="17"
          strokeLinecap="round"
        />
        <path
          d="M16 16L48 48M48 16L16 48"
          stroke={fill}
          strokeWidth="9.5"
          strokeLinecap="round"
        />
        <path
          d="M17 15L25 23M47 15L39 23"
          stroke={hi}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Bot 'O' piece
  if (styleId === 'star-gem') {
    return (
      <svg
        {...sizeProps}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <polygon
          points="32,8 53,20 53,44 32,56 11,44 11,20"
          fill={fill}
          stroke="#1E293B"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <polygon
          points="32,20 42,26 42,38 32,44 22,38 22,26"
          fill="#FFFDF5"
          stroke="#1E293B"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M21 17L32 11L43 17"
          stroke="white"
          strokeOpacity="0.7"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      {...sizeProps}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="32" cy="32" r="19" stroke="#1E293B" strokeWidth="16.5" />
      <circle cx="32" cy="32" r="19" stroke={fill} strokeWidth="9" />
      <path
        d="M20 22A16 16 0 0 1 35 14"
        stroke={hi}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
