import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, Share2, Shield, Radio, ArrowRight } from 'lucide-react';
import { isValidRoomId } from '../../utils/crypto';
import { p2pService } from '../../services/p2p/p2pService';
import { useRoomStore } from '../../store/useRoomStore';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const RoomWaitingPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { peerId } = useRoomStore();

  const inviteUrl = roomId ? `${window.location.origin}/room/${roomId}` : '';

  useEffect(() => {
    if (!isValidRoomId(roomId)) {
      navigate('/invalid-room', { replace: true });
      return;
    }

    // Initialize P2P as 'creator'
    p2pService.initialize(roomId!, 'creator');
  }, [roomId, navigate]);

  // When peer joins, auto-transition to active room
  useEffect(() => {
    if (peerId) {
      navigate(`/room/${roomId}`, { replace: true });
    }
  }, [peerId, roomId, navigate]);

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!inviteUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Private Connect P2P Room',
          text: 'Private peer-to-peer temporary room for file sharing and chat.',
          url: inviteUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleManualEnter = () => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-xl mx-auto w-full text-center">
      <div className="w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur flex flex-col items-center">
        {/* Pulsing Signal Icon */}
        <div className="relative w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5">
          <Radio className="w-8 h-8 animate-pulse text-brand-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full animate-ping" />
        </div>

        <Badge variant="warning" dot size="md" className="mb-3">
          Waiting for Guest to Connect
        </Badge>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Share Your Invitation Link
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md">
          Anyone with this link can establish a direct peer-to-peer connection with your browser.
          Keep this tab open while you wait.
        </p>

        {/* Shareable Link Box */}
        <div className="w-full mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-slate-300 outline-none px-2 select-all overflow-hidden text-ellipsis"
            />
            <Button
              size="sm"
              variant={copied ? 'secondary' : 'primary'}
              onClick={handleCopy}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              className="shrink-0 text-xs"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-3">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNativeShare}
                icon={<Share2 className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Share via App
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualEnter}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Enter Room Now
            </Button>
          </div>
        </div>

        {/* Informational Security Notice */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 w-full flex items-start gap-3 text-left bg-slate-950/40 p-3.5 rounded-xl border">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300 font-medium">Decentralized Bearer Link:</strong> There
            is no central user database. The room identifier acts as the secret handshake topic.
            Once both browsers connect, files and messages stream directly peer-to-peer.
          </div>
        </div>
      </div>
    </div>
  );
};
