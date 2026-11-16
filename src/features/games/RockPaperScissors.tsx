import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { p2pService } from '../../services/p2p/p2pService';
import { Button } from '../../components/ui/Button';
import { RotateCcw } from 'lucide-react';

const CHOICES = [
  { id: 'rock', label: 'Rock', icon: '🪨' },
  { id: 'paper', label: 'Paper', icon: '📄' },
  { id: 'scissors', label: 'Scissors', icon: '✂️' },
] as const;

export const RockPaperScissors: React.FC = () => {
  const { rps, makeRPSChoice, resetRPS } = useGameStore();

  const bothChosen = Boolean(rps.myChoice && rps.opponentChoice);

  const handleSelectChoice = (choice: 'rock' | 'paper' | 'scissors') => {
    if (rps.myChoice) return; // already picked

    makeRPSChoice(choice, true);
    p2pService.sendGameAction({
      game: 'rps',
      action: 'move',
      data: { choice },
    });
  };

  const handleNextRound = () => {
    resetRPS();
    p2pService.sendGameAction({
      game: 'rps',
      action: 'reset',
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full max-w-xs bg-slate-800/60 px-4 py-2 rounded-lg text-xs font-mono border border-slate-700/60">
        <div className="flex flex-col items-center">
          <span className="text-slate-400">You</span>
          <span className="font-bold text-slate-100 text-sm">{rps.scores.me}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500">Round {rps.round}</span>
          <span className="font-semibold text-slate-400 text-sm">{rps.scores.ties} ties</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-400">Opponent</span>
          <span className="font-bold text-slate-100 text-sm">{rps.scores.opponent}</span>
        </div>
      </div>

      {/* Choices Area */}
      <div className="flex flex-col items-center gap-3 w-full">
        <p className="text-xs text-slate-400">
          {!rps.myChoice
            ? 'Make your selection:'
            : !bothChosen
            ? 'Waiting for opponent to choose...'
            : rps.roundWinner === 'draw'
            ? 'Round ended in a tie!'
            : rps.roundWinner === 'me'
            ? '🎉 You won this round!'
            : 'Opponent won this round!'}
        </p>

        {/* Choice buttons */}
        <div className="flex items-center gap-3">
          {CHOICES.map((item) => {
            const isSelected = rps.myChoice === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectChoice(item.id)}
                disabled={Boolean(rps.myChoice)}
                className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 text-2xl transition-all border ${
                  isSelected
                    ? 'bg-brand-600/30 border-brand-500 scale-105 shadow-lg'
                    : rps.myChoice
                    ? 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 hover:border-slate-500 active:scale-95 cursor-pointer'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-[10px] font-sans text-slate-300 font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reveal Opponent Choice */}
        {bothChosen && (
          <div className="flex items-center gap-6 mt-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex flex-col items-center">
              <span className="text-slate-400">Your choice</span>
              <span className="text-xl capitalize">
                {CHOICES.find((c) => c.id === rps.myChoice)?.icon}
              </span>
            </div>
            <span className="text-slate-500 font-bold">VS</span>
            <div className="flex flex-col items-center">
              <span className="text-slate-400">Opponent</span>
              <span className="text-xl capitalize">
                {CHOICES.find((c) => c.id === rps.opponentChoice)?.icon}
              </span>
            </div>
          </div>
        )}

        {/* Next Round Button */}
        {bothChosen && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleNextRound}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs mt-2"
          >
            Next Round
          </Button>
        )}
      </div>
    </div>
  );
};
