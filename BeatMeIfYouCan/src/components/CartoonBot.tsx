export type BotMood = 'smug' | 'thinking' | 'evil' | 'laughing';

interface CartoonBotProps {
  mood?: BotMood;
  size?: number;
  className?: string;
}

/**
 * Hand-crafted cel-shaded vector cartoon Master Bot mascot with live facial expressions.
 */
export function CartoonBot({ mood = 'smug', size, className = '' }: CartoonBotProps) {
  const isEvil = mood === 'evil';
  const isLaughing = mood === 'laughing';
  const isThinking = mood === 'thinking';
  const sizeProps = size ? { width: size, height: size } : {};

  return (
    <svg
      {...sizeProps}
      viewBox="0 0 120 120"
      fill="none"
      aria-label="Master Bot cartoon character"
      className={className}
    >
      {/* Floating Golden Crown */}
      <g className="animate-bot-float">
        <path
          d="M37 29L43 12L55 21L60 9L65 21L77 12L83 29H37Z"
          fill="#FBBF24"
          stroke="#1E293B"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <circle cx="60" cy="22" r="3" fill="#FF5A5F" stroke="#1E293B" strokeWidth="2" />
      </g>

      {/* Side Ears / Headphones */}
      <rect
        x="11"
        y="52"
        width="13"
        height="28"
        rx="6"
        fill="#38BDF8"
        stroke="#1E293B"
        strokeWidth="4.5"
      />
      <rect
        x="96"
        y="52"
        width="13"
        height="28"
        rx="6"
        fill="#38BDF8"
        stroke="#1E293B"
        strokeWidth="4.5"
      />

      {/* Main Robot Head */}
      <rect
        x="21"
        y="31"
        width="78"
        height="72"
        rx="24"
        fill={isEvil ? '#FCA5A5' : '#60A5FA'}
        stroke="#1E293B"
        strokeWidth="5"
      />

      {/* Cel-Shaded Top Shine */}
      <path
        d="M35 39H85"
        stroke="white"
        strokeOpacity="0.65"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Dark Visor Screen */}
      <rect
        x="31"
        y="46"
        width="58"
        height="34"
        rx="14"
        fill="#1E293B"
        stroke="#0F172A"
        strokeWidth="3"
      />

      {/* Visor Glass Glint */}
      <path
        d="M38 52L46 52"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Live Eyes */}
      {isLaughing ? (
        <>
          <path
            d="M41 64Q48 55 55 64"
            stroke="#FDE047"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M65 64Q72 55 79 64"
            stroke="#FDE047"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </>
      ) : isEvil ? (
        <>
          <path d="M41 58L55 63L43 68Z" fill="#FF5A5F" />
          <path d="M79 58L65 63L77 68Z" fill="#FF5A5F" />
        </>
      ) : isThinking ? (
        <>
          <circle cx="49" cy="63" r="5.5" fill="#7DD3FC" />
          <circle cx="73" cy="63" r="5.5" fill="#7DD3FC" />
          <path d="M40 54L56 56" stroke="#7DD3FC" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M64 56L80 54" stroke="#7DD3FC" strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : (
        /* Smug default expression */
        <>
          <circle cx="47" cy="63" r="5.5" fill="#38BDF8" />
          <circle cx="49" cy="61" r="2" fill="white" />
          <circle cx="73" cy="63" r="5.5" fill="#38BDF8" />
          <circle cx="75" cy="61" r="2" fill="white" />
          {/* Cocky slanted brow */}
          <path d="M39 55L55 57" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M65 55Q73 51 81 55" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}

      {/* Rosy Cheeks */}
      <circle cx="33" cy="87" r="4.5" fill="#FB7185" fillOpacity="0.65" />
      <circle cx="87" cy="87" r="4.5" fill="#FB7185" fillOpacity="0.65" />

      {/* Expressive Mouth */}
      {isLaughing ? (
        <path
          d="M46 85H74C74 94 67 98 60 98C53 98 46 94 46 85Z"
          fill="#FF5A5F"
          stroke="#1E293B"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      ) : isEvil ? (
        <path
          d="M45 88Q60 97 75 86"
          stroke="#1E293B"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      ) : isThinking ? (
        <path
          d="M52 90H68"
          stroke="#1E293B"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      ) : (
        /* Smug smirk */
        <path
          d="M48 90Q61 95 73 86"
          stroke="#1E293B"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
