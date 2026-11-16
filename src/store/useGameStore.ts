import { create } from 'zustand';
import { GameType, GameStateStatus, TicTacToeState, RPSState, PlayerSlot } from '../types';

interface GameStore {
  activeGame: GameType | null;
  status: GameStateStatus;
  isLocalProposer: boolean;

  ticTacToe: TicTacToeState;
  rps: RPSState;

  proposeGame: (game: GameType) => void;
  receiveGameProposal: (game: GameType) => void;
  acceptGame: () => void;
  declineGame: () => void;
  makeTicTacToeMove: (index: number, isLocalPlayer: boolean) => boolean;
  makeRPSChoice: (choice: 'rock' | 'paper' | 'scissors', isLocalPlayer: boolean) => void;
  resetTicTacToe: () => void;
  resetRPS: () => void;
  endGame: () => void;
}

const initialTicTacToe: TicTacToeState = {
  board: Array(9).fill(null),
  currentTurn: 'proposer', // Proposer is 'X' and plays first
  winner: null,
  scores: { me: 0, opponent: 0, ties: 0 },
};

const initialRPS: RPSState = {
  round: 1,
  myChoice: null,
  opponentChoice: null,
  roundWinner: null,
  scores: { me: 0, opponent: 0, ties: 0 },
};

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkTicTacToeWinner(board: Array<'X' | 'O' | null>): PlayerSlot | 'draw' | null {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] === 'X' ? 'proposer' : 'receiver';
    }
  }
  if (board.every((cell) => cell !== null)) {
    return 'draw';
  }
  return null;
}

function calculateRPSWinner(
  myChoice: 'rock' | 'paper' | 'scissors',
  oppChoice: 'rock' | 'paper' | 'scissors'
): 'me' | 'opponent' | 'draw' {
  if (myChoice === oppChoice) return 'draw';
  if (
    (myChoice === 'rock' && oppChoice === 'scissors') ||
    (myChoice === 'paper' && oppChoice === 'rock') ||
    (myChoice === 'scissors' && oppChoice === 'paper')
  ) {
    return 'me';
  }
  return 'opponent';
}

export const useGameStore = create<GameStore>((set, get) => ({
  activeGame: null,
  status: 'idle',
  isLocalProposer: false,

  ticTacToe: { ...initialTicTacToe },
  rps: { ...initialRPS },

  proposeGame: (game) =>
    set({
      activeGame: game,
      status: 'proposing',
      isLocalProposer: true,
    }),

  receiveGameProposal: (game) =>
    set({
      activeGame: game,
      status: 'proposing',
      isLocalProposer: false,
    }),

  acceptGame: () =>
    set({
      status: 'playing',
    }),

  declineGame: () =>
    set({
      activeGame: null,
      status: 'idle',
      isLocalProposer: false,
    }),

  makeTicTacToeMove: (index, isLocalPlayer) => {
    const { ticTacToe, isLocalProposer } = get();
    if (ticTacToe.winner !== null) return false;
    if (ticTacToe.board[index] !== null) return false;

    // Determine whose turn it is:
    // If currentTurn === 'proposer', it must be the proposer's move
    // If currentTurn === 'receiver', it must be the receiver's move
    const mySlot: PlayerSlot = isLocalProposer ? 'proposer' : 'receiver';
    const moverSlot: PlayerSlot = isLocalPlayer
      ? mySlot
      : mySlot === 'proposer'
      ? 'receiver'
      : 'proposer';

    if (ticTacToe.currentTurn !== moverSlot) return false;

    const symbol = moverSlot === 'proposer' ? 'X' : 'O';
    const newBoard = [...ticTacToe.board];
    newBoard[index] = symbol;

    const winner = checkTicTacToeWinner(newBoard);
    const nextTurn: PlayerSlot = moverSlot === 'proposer' ? 'receiver' : 'proposer';

    const newScores = { ...ticTacToe.scores };
    if (winner === 'draw') {
      newScores.ties += 1;
    } else if (winner !== null) {
      if (winner === mySlot) {
        newScores.me += 1;
      } else {
        newScores.opponent += 1;
      }
    }

    set({
      ticTacToe: {
        board: newBoard,
        currentTurn: nextTurn,
        winner,
        scores: newScores,
      },
    });

    return true;
  },

  makeRPSChoice: (choice, isLocalPlayer) => {
    const { rps } = get();
    const nextRps = { ...rps };

    if (isLocalPlayer) {
      nextRps.myChoice = choice;
    } else {
      nextRps.opponentChoice = choice;
    }

    if (nextRps.myChoice && nextRps.opponentChoice) {
      const winner = calculateRPSWinner(nextRps.myChoice, nextRps.opponentChoice);
      nextRps.roundWinner = winner;
      if (winner === 'me') nextRps.scores.me += 1;
      else if (winner === 'opponent') nextRps.scores.opponent += 1;
      else if (winner === 'draw') nextRps.scores.ties += 1;
    }

    set({ rps: nextRps });
  },

  resetTicTacToe: () =>
    set((state) => ({
      ticTacToe: {
        ...initialTicTacToe,
        scores: state.ticTacToe.scores,
      },
    })),

  resetRPS: () =>
    set((state) => ({
      rps: {
        ...initialRPS,
        round: state.rps.round + 1,
        scores: state.rps.scores,
      },
    })),

  endGame: () =>
    set({
      activeGame: null,
      status: 'idle',
      isLocalProposer: false,
      ticTacToe: { ...initialTicTacToe },
      rps: { ...initialRPS },
    }),
}));
