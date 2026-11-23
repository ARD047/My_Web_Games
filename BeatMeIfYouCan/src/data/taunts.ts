export interface PreGameTaunt {
  headline: string;
  subline: string;
  acceptLabel: string;
  declineLabel: string;
  embarrassmentTier: string;
}

const FIXED_TAUNTS: Omit<PreGameTaunt, 'embarrassmentTier'>[] = [
  {
    headline: 'Ready, loser?',
    subline: 'First attempt on the board. Enjoy your confidence while it still exists.',
    acceptLabel: 'Yes, start match',
    declineLabel: 'Back out',
  },
  {
    headline: 'Back already? Did the first beating not sink in?',
    subline: 'You literally just lost to nine squares. Bold move coming back for seconds.',
    acceptLabel: 'I want a rematch',
    declineLabel: 'Retreat quietly',
  },
  {
    headline: 'Third attempt. Still convinced you can beat me?',
    subline: 'Two losses in and your strategy still looks like guessing with your eyes closed.',
    acceptLabel: 'Third time is mine',
    declineLabel: 'Save my pride',
  },
  {
    headline: 'Wait — are you actually trying, or just donating losses?',
    subline: 'Four attempts deep and you have not even made me break a sweat.',
    acceptLabel: 'I am actually trying',
    declineLabel: 'Give up for now',
  },
  {
    headline: 'Five tries, zero wins. Should I start playing blindfolded?',
    subline: 'Honestly, it feels a little unfair watching you walk straight into every trap.',
    acceptLabel: 'No mercy, play me',
    declineLabel: 'Walk away',
  },
  {
    headline: 'Honestly, this is getting awkward to watch. Continue anyway?',
    subline: 'Six attempts. Most people would have quietly closed the game by now.',
    acceptLabel: 'Humble me again',
    declineLabel: 'Spare myself',
  },
  {
    headline: 'Should we call someone to stop you, or do you want loss #7?',
    subline: 'You keep tapping the squares like a magic winning move is hiding underneath.',
    acceptLabel: 'Bring on loss #7',
    declineLabel: 'Touch grass',
  },
  {
    headline: 'A houseplant would have lasted longer by doing nothing. Ready?',
    subline: 'Eight attempts of voluntary humiliation. At least the clicks sound nice.',
    acceptLabel: 'I enjoy the clicks',
    declineLabel: 'Leave in shame',
  },
  {
    headline: 'Nine attempts — one for every square you still do not understand.',
    subline: 'You do realize I am mathematically incapable of losing, right?',
    acceptLabel: 'Prove it again',
    declineLabel: 'Accept defeat',
  },
  {
    headline: 'Double digits of humiliation. Do you actually enjoy losing?',
    subline: 'Ten attempts. Zero victories. A truly historic commitment to getting crushed.',
    acceptLabel: 'Yes, crush me',
    declineLabel: 'Close the board',
  },
  {
    headline: 'Eleven tries. I am not even thinking anymore, just vibing to the ASMR.',
    subline: 'Your losses are basically my favorite background sleep noise at this point.',
    acceptLabel: 'Let me try anyway',
    declineLabel: 'Back to menu',
  },
  {
    headline: 'Twelve attempts in. Have you considered retiring from Tic-Tac-Toe?',
    subline: 'Maybe try a simpler hobby. Like staring at a wall. The wall might still win.',
    acceptLabel: 'Never retiring',
    declineLabel: 'Retire gracefully',
  },
];

export function getPreGameTaunt(
  attemptNumber: number,
  totalLosses: number,
  bestTurns: number
): PreGameTaunt {
  const tier =
    attemptNumber === 1
      ? 'Opening Roast'
      : attemptNumber <= 3
        ? 'Mild Humiliation'
        : attemptNumber <= 6
          ? 'Public Embarrassment'
          : attemptNumber <= 10
            ? 'Rock Bottom'
            : 'Certified Glutton for Defeat';

  if (attemptNumber <= FIXED_TAUNTS.length) {
    return {
      ...FIXED_TAUNTS[attemptNumber - 1],
      embarrassmentTier: tier,
    };
  }

  const lateTaunts: Omit<PreGameTaunt, 'embarrassmentTier'>[] = [
    {
      headline: `Attempt #${attemptNumber}. Still pretending today is the day?`,
      subline: `${totalLosses} losses on record and a peak of ${bestTurns} moves. Truly inspiring delusion.`,
      acceptLabel: `Accept humiliation #${attemptNumber}`,
      declineLabel: 'Save what is left',
    },
    {
      headline: `You stepped up ${attemptNumber} times and won zero. Ready for more?`,
      subline: 'Scientists should study this level of stubbornness. The board is waiting.',
      acceptLabel: 'I learn nothing, play',
      declineLabel: 'Step away',
    },
    {
      headline: `Attempt #${attemptNumber} — hoping my code forgets how to play?`,
      subline: `Spoiler: it never forgets. Your ${totalLosses}-loss streak is completely safe.`,
      acceptLabel: 'Maybe it will glitch',
      declineLabel: 'Back to menu',
    },
    {
      headline: `Still here on try #${attemptNumber}? Even the board feels sorry for you.`,
      subline: 'At least you are farming shop coins for every beatdown you endure.',
      acceptLabel: 'Take my pride',
      declineLabel: 'Enough for today',
    },
  ];

  const chosen = lateTaunts[(attemptNumber - FIXED_TAUNTS.length - 1) % lateTaunts.length];
  return {
    ...chosen,
    embarrassmentTier: tier,
  };
}

/**
 * Pure comedic insults on every defeat — zero compliments!
 */
export function getLossRemark(turnsSurvived: number, totalLosses: number): string {
  const quickInsults = [
    'Speedrunning embarrassment? That was over before it even started.',
    'Did you close your eyes, or was that your actual strategy?',
    'A goldfish tapping the screen randomly would have put up more of a fight.',
    'Folded in seconds. Honestly, I feel bad taking credit for that one.',
  ];

  const midInsults = [
    `All that thinking for ${turnsSurvived} moves just to walk face-first into a trap. Embarrassing.`,
    `${turnsSurvived} moves of pure panic and still zero clue what you are doing.`,
    `You stalled for ${turnsSurvived} moves and still got cooked like an amateur.`,
    `Honestly, watching you blunder on move ${turnsSurvived} was comedy gold.`,
  ];

  const longInsults = [
    `You sweated for ${turnsSurvived} moves only to choke anyway. Peak clown behavior.`,
    `${turnsSurvived} moves of delaying the inevitable — and you STILL fell for it. Loss #${totalLosses}.`,
    `All that hard work for literally nothing. Another L stamped right on your forehead.`,
    `Imagine surviving ${turnsSurvived} moves just to hand me the win on a silver platter.`,
  ];

  if (turnsSurvived <= 6) {
    return quickInsults[(totalLosses - 1) % quickInsults.length];
  }
  if (turnsSurvived <= 16) {
    return midInsults[(totalLosses - 1) % midInsults.length];
  }
  return longInsults[(totalLosses - 1) % longInsults.length];
}

/**
 * Short, punchy live whispers that never get cut off with "..." on any screen width.
 */
export function getLiveWhisper(params: {
  phase: 'placement' | 'relocation';
  turnCount: number;
  isBotTurn: boolean;
  isForcedBotWin: boolean;
  selectedPiece: number | null;
}): string {
  if (params.isForcedBotWin) {
    return 'You just stepped into a forced loss. Watch closely.';
  }
  if (params.isBotTurn) {
    return params.phase === 'relocation'
      ? 'Master is sliding a piece...'
      : 'Master is placing a piece...';
  }
  if (params.phase === 'placement') {
    if (params.turnCount === 0) {
      return 'Tap any open tile to place your X.';
    }
    return 'Place your X. No ties allowed here.';
  }
  if (params.selectedPiece !== null) {
    return 'Piece lifted! Tap any blank tile to drop.';
  }
  if (params.turnCount <= 7) {
    return 'Tap one of your X pieces, then move it to a blank tile.';
  }
  if (params.turnCount >= 16) {
    return 'Still panicking? One wrong lift and you are done.';
  }
  return 'Pick up any of your X pieces and move it.';
}
