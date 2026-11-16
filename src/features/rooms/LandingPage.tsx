import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Zap,
  Lock,
  HardDriveDownload,
  ScreenShare,
  FileCheck,
  ArrowRight,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { generateSecureRoomId, isValidRoomId } from '../../utils/crypto';
import { MAX_FILE_SIZE_LABEL } from '../../config/constants';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateRoom = () => {
    const newRoomId = generateSecureRoomId();
    navigate(`/waiting/${newRoomId}`);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    let cleanId = joinInput.trim();
    // Support pasting full URL like https://site.netlify.app/room/XXXXX
    if (cleanId.includes('/room/')) {
      cleanId = cleanId.split('/room/')[1].split('?')[0].split('#')[0];
    } else if (cleanId.includes('/waiting/')) {
      cleanId = cleanId.split('/waiting/')[1].split('?')[0].split('#')[0];
    }

    if (!isValidRoomId(cleanId)) {
      setJoinError('Invalid Room ID. Room IDs are 16–36 alphanumeric characters.');
      return;
    }

    navigate(`/room/${cleanId}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 w-full flex flex-col items-center text-center">
        {/* Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400 mb-8 font-mono shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Serverless • Zero Persistent Logs • 100% Ephemeral WebRTC</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-100 max-w-3xl leading-tight">
          Private, Temporary <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-200">
            Browser-to-Browser
          </span>{' '}
          Sharing
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Create a room, share an invitation link, and connect directly with a peer. Exchange
          files up to {MAX_FILE_SIZE_LABEL}, chat in real time, and share media without intermediary servers,
          cloud storage, or accounts.
        </p>

        {/* Action Center: Create Room & Join */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <Button
            size="lg"
            variant="primary"
            onClick={handleCreateRoom}
            icon={<Zap className="w-4 h-4" />}
            className="w-full text-base shadow-lg shadow-brand-500/20"
          >
            Create Private Room
          </Button>
        </div>

        {/* Or Join Existing Room */}
        <div className="mt-8 w-full max-w-md">
          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                placeholder="Paste invitation link or room ID..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-brand-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition font-mono"
              />
              <Button type="submit" variant="secondary" size="md">
                Join <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {joinError && (
              <p className="text-xs text-rose-400 text-left pl-1">{joinError}</p>
            )}
          </form>
        </div>

        {/* Security & Architecture Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full text-left">
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Two-Way File Sharing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chunked binary transport directly across WebRTC data channels with backpressure
              monitoring, progress reporting, and mandatory receiver approval.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Zero Cloud Storage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No databases, no S3 buckets, and no saved chat logs. All content resides in RAM only
              and is wiped immediately upon tab closure.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ScreenShare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Direct Screen & Game Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Share your screen directly with one click, chat in real time, and play multiplayer
              games with zero setup or software installation.
            </p>
          </div>
        </div>

        {/* Feature Matrix Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <FileCheck className="w-3.5 h-3.5 text-brand-400" /> Max 100 MB / file
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Gamepad2 className="w-3.5 h-3.5 text-purple-400" /> Multiplayer Games
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> crypto.getRandomValues()
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Private Connect • Browser-Only Peer-to-Peer Communication Platform
      </footer>
    </div>
  );
};
