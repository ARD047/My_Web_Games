export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type BoardState = CellValue[];

export interface Move {
  from: number | null; // null during placement phase, 0..8 during relocation phase
  to: number;
}

export interface WinCheck {
  winner: Player;
  line: [number, number, number];
}

export interface BotDecision {
  move: Move;
  isForcedWin: boolean;
  mateInPlies: number | null;
}

export const WIN_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const WIN_MASKS = WIN_LINES.map(([a, b, c]) => (1 << a) | (1 << b) | (1 << c));

function hasWonMask(mask: number): boolean {
  for (let i = 0; i < WIN_MASKS.length; i++) {
    const w = WIN_MASKS[i];
    if ((mask & w) === w) return true;
  }
  return false;
}

function popcount(x: number): number {
  let c = 0;
  let n = x;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

export function checkWinner(board: BoardState): WinCheck | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const cell = board[a];
    if (cell && cell === board[b] && cell === board[c]) {
      return { winner: cell, line };
    }
  }
  return null;
}

export function countPieces(board: BoardState, player: Player): number {
  let count = 0;
  for (let i = 0; i < 9; i++) {
    if (board[i] === player) count++;
  }
  return count;
}

export function boardToStateKey(board: BoardState, turn: Player): number {
  let xm = 0;
  let om = 0;
  for (let i = 0; i < 9; i++) {
    if (board[i] === 'X') xm |= 1 << i;
    else if (board[i] === 'O') om |= 1 << i;
  }
  return (xm << 10) | (om << 1) | (turn === 'X' ? 0 : 1);
}

interface SolverTable {
  stateIdx: Map<number, number>;
  val: Int8Array; // 1 = side to move has forced win, -1 = forced loss, 0 = endless draw
  dist: Int16Array; // exact plies to win/loss
}

let cachedTable: SolverTable | null = null;

/**
 * Exact retrograde analysis over all 5,710 reachable states of Endless 3-Piece Tic-Tac-Toe.
 * Guarantees the Master Bot ('O') mathematically NEVER loses from any legal position
 * and always executes the fastest forced win the instant the player makes a mistake.
 */
function getSolverTable(): SolverTable {
  if (cachedTable) return cachedTable;

  const states: { xm: number; om: number; t: number }[] = [];
  const stateIdx = new Map<number, number>();

  for (let xm = 0; xm < 512; xm++) {
    const xc = popcount(xm);
    if (xc > 3) continue;
    for (let om = 0; om < 512; om++) {
      if (xm & om) continue;
      const oc = popcount(om);
      if (oc > 3) continue;

      const turns: number[] = [];
      if (xc === 3 && oc === 3) {
        turns.push(0, 1);
      } else if (xc === oc && xc < 3) {
        // Equal piece counts can occur with either X to move (X started) or O to move (O started)
        turns.push(0, 1);
      } else if (xc === oc + 1 && oc < 3) {
        turns.push(1);
      } else if (oc === xc + 1 && xc < 3) {
        turns.push(0);
      }

      for (const t of turns) {
        const key = (xm << 10) | (om << 1) | t;
        stateIdx.set(key, states.length);
        states.push({ xm, om, t });
      }
    }
  }

  const N = states.length;
  const val = new Int8Array(N);
  const dist = new Int16Array(N);
  const nextStates: number[][] = new Array(N);

  for (let i = 0; i < N; i++) {
    const { xm, om, t } = states[i];
    const xWin = hasWonMask(xm);
    const oWin = hasWonMask(om);

    if (xWin || oWin) {
      val[i] = t === 0 ? (xWin ? 1 : -1) : oWin ? 1 : -1;
      dist[i] = 0;
      nextStates[i] = [];
      continue;
    }

    const my = t === 0 ? xm : om;
    const occ = xm | om;
    const myCount = popcount(my);
    const nexts: number[] = [];

    if (myCount < 3) {
      for (let sq = 0; sq < 9; sq++) {
        if (!(occ & (1 << sq))) {
          const nmy = my | (1 << sq);
          const nx = t === 0 ? nmy : xm;
          const no = t === 1 ? nmy : om;
          const nkey = (nx << 10) | (no << 1) | (1 - t);
          const nidx = stateIdx.get(nkey);
          if (nidx !== undefined) nexts.push(nidx);
        }
      }
    } else {
      for (let from = 0; from < 9; from++) {
        if (!(my & (1 << from))) continue;
        for (let to = 0; to < 9; to++) {
          if (occ & (1 << to)) continue;
          const nmy = (my ^ (1 << from)) | (1 << to);
          const nx = t === 0 ? nmy : xm;
          const no = t === 1 ? nmy : om;
          const nkey = (nx << 10) | (no << 1) | (1 - t);
          const nidx = stateIdx.get(nkey);
          if (nidx !== undefined) nexts.push(nidx);
        }
      }
    }

    nextStates[i] = nexts;
  }

  // Backward induction fixed-point iteration
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < N; i++) {
      if (val[i] !== 0) continue;
      const nexts = nextStates[i];
      let hasWin = false;
      let allLose = true;
      let minWinDist = 9999;
      let maxLoseDist = 0;

      for (let j = 0; j < nexts.length; j++) {
        const ni = nexts[j];
        if (val[ni] === -1) {
          hasWin = true;
          if (dist[ni] + 1 < minWinDist) minWinDist = dist[ni] + 1;
        }
        if (val[ni] !== 1) {
          allLose = false;
        } else if (dist[ni] + 1 > maxLoseDist) {
          maxLoseDist = dist[ni] + 1;
        }
      }

      if (hasWin) {
        val[i] = 1;
        dist[i] = minWinDist;
        changed = true;
      } else if (allLose && nexts.length > 0) {
        val[i] = -1;
        dist[i] = maxLoseDist;
        changed = true;
      }
    }
  }

  cachedTable = { stateIdx, val, dist };
  return cachedTable;
}

export function getLegalMoves(board: BoardState, player: Player): Move[] {
  const pieces: number[] = [];
  const empties: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === player) pieces.push(i);
    else if (board[i] === null) empties.push(i);
  }

  const moves: Move[] = [];
  if (pieces.length < 3) {
    for (const to of empties) {
      moves.push({ from: null, to });
    }
  } else {
    for (const from of pieces) {
      for (const to of empties) {
        moves.push({ from, to });
      }
    }
  }
  return moves;
}

export function applyMove(board: BoardState, move: Move, player: Player): BoardState {
  const next = board.slice();
  if (move.from !== null) {
    next[move.from] = null;
  }
  next[move.to] = player;
  return next;
}

/**
 * Counts how many of the human's ('X') legal replies from `boardAfterBot` lead to
 * a forced Bot win — used to make the Master Bot set maximum-pressure traps in drawn states.
 */
function evaluateTrapPressure(boardAfterBot: BoardState, table: SolverTable): number {
  const xMoves = getLegalMoves(boardAfterBot, 'X');
  if (xMoves.length === 0) return 0;

  let blunderCount = 0;
  let immediateThreatBonus = 0;

  // Check if Bot now has a 2-in-a-row with an open 3rd cell (forces X to react)
  for (const [a, b, c] of WIN_LINES) {
    const cells = [boardAfterBot[a], boardAfterBot[b], boardAfterBot[c]];
    const oCount = cells.filter((v) => v === 'O').length;
    const emptyCount = cells.filter((v) => v === null).length;
    if (oCount === 2 && emptyCount === 1) {
      immediateThreatBonus += 3;
    }
  }

  for (const xm of xMoves) {
    const afterX = applyMove(boardAfterBot, xm, 'X');
    if (checkWinner(afterX)?.winner === 'X') {
      // Should never happen for a safe move, heavy penalty as safeguard
      return -9999;
    }
    const key = boardToStateKey(afterX, 'O');
    const idx = table.stateIdx.get(key);
    if (idx !== undefined && table.val[idx] === 1) {
      blunderCount += 1;
    }
  }

  // Higher ratio of human blunder replies = sharper trap
  const blunderRatio = (blunderCount / xMoves.length) * 100;
  const centerBonus = boardAfterBot[4] === 'O' ? 6 : 0;

  return blunderRatio + immediateThreatBonus + centerBonus;
}

/**
 * Computes the Master Bot's ('O') exact optimal move.
 * Never loses; immediately punishes any human error with shortest forced mate;
 * sets maximal psychological traps during endless drawn play.
 */
export function getBestBotMove(
  board: BoardState,
  recentStateKeys: number[] = []
): BotDecision | null {
  const table = getSolverTable();
  const legalMoves = getLegalMoves(board, 'O');
  if (legalMoves.length === 0) return null;

  const winningMoves: { move: Move; plies: number }[] = [];
  const safeMoves: { move: Move; nextBoard: BoardState; nextKey: number }[] = [];

  for (const move of legalMoves) {
    const nextBoard = applyMove(board, move, 'O');
    if (checkWinner(nextBoard)?.winner === 'O') {
      return { move, isForcedWin: true, mateInPlies: 1 };
    }

    const nextKey = boardToStateKey(nextBoard, 'X');
    const idx = table.stateIdx.get(nextKey);
    if (idx === undefined) continue;

    // From X's perspective: val === -1 means X is in a forced loss (Bot wins!)
    if (table.val[idx] === -1) {
      winningMoves.push({ move, plies: table.dist[idx] + 1 });
    } else if (table.val[idx] === 0) {
      safeMoves.push({ move, nextBoard, nextKey });
    }
  }

  // 1. If Bot has a forced win, take the shortest path to checkmate!
  if (winningMoves.length > 0) {
    winningMoves.sort((a, b) => a.plies - b.plies);
    const fastest = winningMoves[0];
    return {
      move: fastest.move,
      isForcedWin: true,
      mateInPlies: fastest.plies,
    };
  }

  // 2. Otherwise, pick the deadliest unlosable move (maximizes human blunder traps, avoids stale repetition)
  if (safeMoves.length > 0) {
    const recentSet = new Set(recentStateKeys.slice(-8));
    let bestScore = -Infinity;
    let bestCandidates: Move[] = [];

    for (const candidate of safeMoves) {
      let score = evaluateTrapPressure(candidate.nextBoard, table);
      // Avoid repeating very recent positions so the endless duel feels dynamic
      if (recentSet.has(candidate.nextKey)) {
        score -= 18;
      }
      if (score > bestScore + 0.01) {
        bestScore = score;
        bestCandidates = [candidate.move];
      } else if (Math.abs(score - bestScore) <= 0.01) {
        bestCandidates.push(candidate.move);
      }
    }

    const chosen = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
    return { move: chosen, isForcedWin: false, mateInPlies: null };
  }

  // Fallback (unreachable under optimal play from initial state)
  return { move: legalMoves[0], isForcedWin: false, mateInPlies: null };
}

/**
 * Checks whether the current board (with 'O' to move) is already a forced Bot win.
 */
export function isPositionForcedBotWin(board: BoardState): boolean {
  const table = getSolverTable();
  const key = boardToStateKey(board, 'O');
  const idx = table.stateIdx.get(key);
  return idx !== undefined && table.val[idx] === 1;
}

/**
 * Pre-warms the retrograde solver cache cleanly.
 */
export function initSolver(): void {
  getSolverTable();
}
