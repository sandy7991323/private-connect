import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { p2pService } from '../../services/p2p/p2pService';
import { Button } from '../../components/ui/Button';
import { RotateCcw } from 'lucide-react';

export const TicTacToe: React.FC = () => {
  const { ticTacToe, isLocalProposer, makeTicTacToeMove, resetTicTacToe } = useGameStore();

  const mySlot = isLocalProposer ? 'proposer' : 'receiver';
  const isMyTurn = ticTacToe.currentTurn === mySlot && ticTacToe.winner === null;
  const mySymbol = isLocalProposer ? 'X' : 'O';
  const oppSymbol = isLocalProposer ? 'O' : 'X';

  const handleCellClick = (index: number) => {
    if (!isMyTurn || ticTacToe.board[index] !== null) return;

    const valid = makeTicTacToeMove(index, true);
    if (valid) {
      p2pService.sendGameAction({
        game: 'tictactoe',
        action: 'move',
        data: { index },
      });
    }
  };

  const handleReset = () => {
    resetTicTacToe();
    p2pService.sendGameAction({
      game: 'tictactoe',
      action: 'reset',
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full max-w-xs bg-slate-800/60 px-4 py-2 rounded-lg text-xs font-mono border border-slate-700/60">
        <div className="flex flex-col items-center">
          <span className="text-slate-400">You ({mySymbol})</span>
          <span className="font-bold text-slate-100 text-sm">{ticTacToe.scores.me}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500">Ties</span>
          <span className="font-semibold text-slate-400 text-sm">{ticTacToe.scores.ties}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-400">Opponent ({oppSymbol})</span>
          <span className="font-bold text-slate-100 text-sm">{ticTacToe.scores.opponent}</span>
        </div>
      </div>

      {/* Turn or Winner Banner */}
      <div className="text-xs font-medium text-center">
        {ticTacToe.winner ? (
          ticTacToe.winner === 'draw' ? (
            <span className="text-amber-400 font-semibold">Game ended in a draw!</span>
          ) : ticTacToe.winner === mySlot ? (
            <span className="text-emerald-400 font-bold">🎉 You won!</span>
          ) : (
            <span className="text-rose-400 font-semibold">Opponent won!</span>
          )
        ) : (
          <span className={isMyTurn ? 'text-brand-400 font-semibold' : 'text-slate-400'}>
            {isMyTurn ? `Your turn (${mySymbol})` : `Opponent's turn (${oppSymbol})...`}
          </span>
        )}
      </div>

      {/* 3x3 Board */}
      <div className="grid grid-cols-3 gap-2 w-64 h-64 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-inner">
        {ticTacToe.board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            disabled={!isMyTurn || cell !== null}
            className={`w-full h-full rounded-lg font-mono font-bold text-2xl flex items-center justify-center transition-all ${
              cell === 'X'
                ? 'bg-slate-800/90 text-brand-400 border border-brand-500/30'
                : cell === 'O'
                ? 'bg-slate-800/90 text-purple-400 border border-purple-500/30'
                : isMyTurn
                ? 'bg-slate-800/40 hover:bg-slate-800 text-slate-500 hover:border hover:border-slate-600 cursor-pointer'
                : 'bg-slate-800/20 text-transparent cursor-not-allowed'
            }`}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Reset Game button */}
      {ticTacToe.winner !== null && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReset}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          Play Again
        </Button>
      )}
    </div>
  );
};
