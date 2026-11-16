import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Radio,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { isValidRoomId } from '../../utils/crypto';
import { p2pService } from '../../services/p2p/p2pService';
import { useRoomStore } from '../../store/useRoomStore';
import { FileDropZone } from '../file-sharing/FileDropZone';
import { TransferList } from '../file-sharing/TransferList';
import { ChatPanel } from '../chat/ChatPanel';
import { ScreenShareControls } from '../screen-sharing/ScreenShareControls';
import { RemoteScreenView } from '../screen-sharing/RemoteScreenView';
import { GamesPanel } from '../games/GamesPanel';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const ActiveRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { userRole, peerId, connectionStatus, selfPeerId } = useRoomStore();
  const [copied, setCopied] = useState(false);
  const [showMobileSidePanel, setShowMobileSidePanel] = useState(false);

  useEffect(() => {
    if (!isValidRoomId(roomId)) {
      navigate('/invalid-room', { replace: true });
      return;
    }

    // If user arrived directly at /room/:roomId (i.e. invited guest)
    if (!useRoomStore.getState().roomId) {
      p2pService.initialize(roomId!, 'guest');
    }
  }, [roomId, navigate]);

  const inviteUrl = roomId ? `${window.location.origin}/room/${roomId}` : '';

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConnected = connectionStatus === 'connected' && Boolean(peerId);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
      {/* Top Banner (Peer Waiting Notice or Connection Status) */}
      {!isConnected && (
        <div className="bg-amber-950/40 border-b border-amber-800/60 px-4 py-2.5 flex items-center justify-between shrink-0 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              {userRole === 'creator'
                ? 'Waiting for your guest to connect. Share the invitation link to begin.'
                : 'Connecting to room host over WebRTC signaling relays...'}
            </span>
          </div>
          {userRole === 'creator' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs py-1"
            >
              {copied ? 'Copied' : 'Copy Invite Link'}
            </Button>
          )}
        </div>
      )}

      {/* Mobile Side Panel Toggle Button */}
      <div className="md:hidden border-b border-slate-800 bg-slate-900/60 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Users className="w-4 h-4 text-brand-400" />
          <span>Status & Media Panel</span>
        </div>
        <button
          onClick={() => setShowMobileSidePanel(!showMobileSidePanel)}
          className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
        >
          {showMobileSidePanel ? (
            <>
              Hide Panel <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show Media & Status <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Main Workspace Split View */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* LEFT / MAIN AREA: File Drop Zone, Transfer Queue, Chat */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 gap-6">
          {/* File Transfer Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Direct File Exchange</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Files are transferred directly point-to-point. The recipient must approve each file.
                </p>
              </div>
            </div>

            <FileDropZone />
            <TransferList />
          </div>

          {/* Ephemeral Real-Time Chat */}
          <div className="flex-1 flex flex-col min-h-[360px] pb-4">
            <ChatPanel />
          </div>
        </div>

        {/* RIGHT / SIDE PANEL: Participants, Media, Screen, Games */}
        <div
          className={`${
            showMobileSidePanel ? 'flex' : 'hidden md:flex'
          } w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/40 backdrop-blur p-4 flex-col gap-4 overflow-y-auto shrink-0`}
        >
          {/* Participants & Status Card */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-400" /> Participants (2 Max)
              </span>
              <Badge variant={isConnected ? 'success' : 'warning'} dot size="sm">
                {isConnected ? 'P2P Active' : 'Waiting'}
              </Badge>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              {/* Local User */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400" />
                  <span className="text-slate-200">
                    You ({userRole === 'creator' ? 'Room Host' : 'Guest'})
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {selfPeerId ? selfPeerId.slice(0, 6) : 'local'}
                </span>
              </div>

              {/* Peer User */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      peerId ? 'bg-emerald-400' : 'bg-slate-600 animate-pulse'
                    }`}
                  />
                  <span className="text-slate-300">
                    {peerId
                      ? userRole === 'creator'
                        ? 'Connected Guest'
                        : 'Connected Host'
                      : 'Waiting for peer...'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {peerId ? peerId.slice(0, 6) : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* Remote Screen Share View (if active) */}
          <RemoteScreenView />

          {/* Screen Sharing Controls */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                Screen Sharing
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Optional</span>
            </div>
            <ScreenShareControls />
          </div>

          {/* Multiplayer Games Panel */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                P2P Games
              </span>
              <span className="text-[10px] text-purple-400 font-mono">Sync</span>
            </div>
            <GamesPanel />
          </div>

          {/* Security & Privacy Reminder */}
          <div className="mt-auto p-3 rounded-lg border border-slate-800/60 bg-slate-950/40 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Direct WebRTC channel. Nothing is saved to any cloud or database. Closing your tab
              ends the session permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
