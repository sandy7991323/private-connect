import React from 'react';
import { Shield, ShieldAlert, Wifi, WifiOff, Copy, Check, LogOut } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { p2pService } from '../../services/p2p/p2pService';
import { useNavigate } from 'react-router-dom';

export const AppHeader: React.FC = () => {
  const { roomId, userRole, connectionStatus } = useRoomStore();
  const [copied, setCopied] = React.useState(false);
  const navigate = useNavigate();

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    p2pService.disconnect();
    navigate('/');
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-wide text-slate-100">
              PRIVATE CONNECT
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
              P2P
            </span>
          </div>
          <p className="text-[10px] text-slate-400 hidden md:block">
            Decentralized Serverless File Exchange
          </p>
        </div>
      </div>

      {/* Center / Status */}
      {roomId && (
        <div className="flex items-center gap-2 sm:gap-3">
          {connectionStatus === 'connected' ? (
            <Badge variant="success" dot size="sm">
              <Wifi className="w-3 h-3 mr-1" /> Connected
            </Badge>
          ) : connectionStatus === 'waiting' ? (
            <Badge variant="warning" dot size="sm">
              Waiting for Guest
            </Badge>
          ) : connectionStatus === 'connecting' ? (
            <Badge variant="info" dot size="sm">
              Handshaking...
            </Badge>
          ) : connectionStatus === 'error' ? (
            <Badge variant="danger" dot size="sm">
              <ShieldAlert className="w-3 h-3 mr-1" /> Error
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              <WifiOff className="w-3 h-3 mr-1" /> Disconnected
            </Badge>
          )}

          <span className="hidden lg:inline-flex text-xs text-slate-400 font-mono bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700/60">
            Role: <strong className="text-slate-200 uppercase ml-1">{userRole}</strong>
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {roomId && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex text-xs"
            >
              {copied ? 'Copied Link' : 'Invite Link'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              icon={<LogOut className="w-3.5 h-3.5 text-rose-400" />}
              className="text-xs hover:text-rose-300"
            >
              Leave
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
