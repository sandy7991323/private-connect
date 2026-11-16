import React, { useState } from 'react';
import { Gamepad2, Swords, Check, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useRoomStore } from '../../store/useRoomStore';
import { p2pService } from '../../services/p2p/p2pService';
import { GameType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { TicTacToe } from './TicTacToe';
import { RockPaperScissors } from './RockPaperScissors';

export const GamesPanel: React.FC = () => {
  const {
    activeGame,
    status,
    isLocalProposer,
    proposeGame,
    acceptGame,
    declineGame,
    endGame,
  } = useGameStore();
  const { peerId } = useRoomStore();
  const [showGameSelector, setShowGameSelector] = useState(false);

  const isPeerConnected = Boolean(peerId);

  const handlePropose = (game: GameType) => {
    proposeGame(game);
    setShowGameSelector(false);
    p2pService.sendGameAction({
      game,
      action: 'propose',
    });
  };

  const handleAccept = () => {
    if (!activeGame) return;
    acceptGame();
    p2pService.sendGameAction({
      game: activeGame,
      action: 'accept',
    });
  };

  const handleDecline = () => {
    if (!activeGame) return;
    declineGame();
    p2pService.sendGameAction({
      game: activeGame,
      action: 'decline',
    });
  };

  const handleLeaveGame = () => {
    if (!activeGame) return;
    endGame();
    p2pService.sendGameAction({
      game: activeGame,
      action: 'leave',
    });
  };

  const gameTitle = activeGame === 'tictactoe' ? 'Tic Tac Toe' : 'Rock Paper Scissors';

  return (
    <div className="flex flex-col gap-2">
      {/* Game Trigger Button */}
      {status === 'idle' && (
        <Button
          size="sm"
          variant="outline"
          disabled={!isPeerConnected}
          onClick={() => setShowGameSelector(true)}
          icon={<Gamepad2 className="w-3.5 h-3.5 text-purple-400" />}
          className="text-xs w-full"
        >
          Multiplayer Games
        </Button>
      )}

      {/* Proposer / Waiting State */}
      {status === 'proposing' && isLocalProposer && (
        <div className="p-3 bg-purple-950/40 border border-purple-800/80 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            Waiting for peer to accept {gameTitle}...
          </div>
          <button
            onClick={handleLeaveGame}
            className="text-slate-400 hover:text-slate-200 text-xs underline ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Incoming Challenge in Sidebar */}
      {status === 'proposing' && !isLocalProposer && (
        <div className="p-3.5 bg-purple-950/70 border border-purple-600 rounded-xl flex flex-col gap-2.5 animate-pulse">
          <div className="flex items-center gap-2 text-purple-200 text-xs font-semibold">
            <Swords className="w-4 h-4 text-purple-400" />
            Challenge: {gameTitle}!
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleDecline} className="text-xs">
              Decline
            </Button>
            <Button size="sm" variant="primary" onClick={handleAccept} className="text-xs">
              Accept & Play
            </Button>
          </div>
        </div>
      )}

      {/* Prominent Modal for Incoming Challenge (ensures visibility on all screens / mobile) */}
      <Modal
        isOpen={status === 'proposing' && !isLocalProposer}
        onClose={handleDecline}
        title="🎮 Game Challenge Received!"
        description={`Your peer wants to play ${gameTitle} with you.`}
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="p-4 bg-purple-950/30 border border-purple-800/60 rounded-xl flex items-center justify-center gap-3 text-purple-300 text-sm">
            <Swords className="w-5 h-5 text-purple-400 animate-bounce" />
            <span>Do you want to accept this challenge?</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={handleDecline}
              icon={<X className="w-4 h-4" />}
            >
              Decline
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleAccept}
              icon={<Check className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-500"
            >
              Accept & Play
            </Button>
          </div>
        </div>
      </Modal>

      {/* Game Selector Modal */}
      <Modal
        isOpen={showGameSelector}
        onClose={() => setShowGameSelector(false)}
        title="P2P Multiplayer Games"
        description="Lightweight synchronized games over WebRTC data channels"
      >
        <div className="grid grid-cols-2 gap-3 py-2">
          <button
            onClick={() => handlePropose('tictactoe')}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-brand-500/50 flex flex-col items-center gap-2 text-center transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center text-xl font-mono font-bold group-hover:scale-110 transition-transform">
              #
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Tic Tac Toe</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Classic 3x3 turn-based</div>
            </div>
          </button>

          <button
            onClick={() => handlePropose('rps')}
            className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-purple-500/50 flex flex-col items-center gap-2 text-center transition group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
              ✂️
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Rock Paper Scissors</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Fast blind-choice rounds</div>
            </div>
          </button>
        </div>
      </Modal>

      {/* Active Game Modal */}
      <Modal
        isOpen={status === 'playing' && Boolean(activeGame)}
        onClose={handleLeaveGame}
        title={gameTitle}
        description="Session-only multiplayer match"
        maxWidth="md"
      >
        <div>
          {activeGame === 'tictactoe' && <TicTacToe />}
          {activeGame === 'rps' && <RockPaperScissors />}

          <div className="flex justify-end pt-3 mt-3 border-t border-slate-800">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLeaveGame}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close Game
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
