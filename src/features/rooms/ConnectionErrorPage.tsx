import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WifiOff, RotateCcw, Home, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useRoomStore } from '../../store/useRoomStore';
import { p2pService } from '../../services/p2p/p2pService';

export const ConnectionErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const { errorMessage, roomId, userRole } = useRoomStore();

  const handleRetry = () => {
    if (roomId) {
      p2pService.initialize(roomId, userRole);
      navigate(`/room/${roomId}`);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    p2pService.disconnect();
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
        <WifiOff className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-100">WebRTC Connection Issue</h2>
      <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
        {errorMessage ||
          'Unable to establish a direct peer-to-peer data channel with the remote participant.'}
      </p>

      {/* Network Explanation */}
      <div className="mt-5 p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300 font-medium">NAT & Firewall Limitations:</strong> Private
          Connect uses direct P2P connections via public STUN servers. If both devices are behind
          strict symmetric corporate firewalls or carrier-grade NATs without an active TURN relay,
          direct handshake may be blocked.
        </p>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleHome}
          icon={<Home className="w-4 h-4" />}
        >
          Return Home
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleRetry}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Retry Connection
        </Button>
      </div>
    </div>
  );
};
