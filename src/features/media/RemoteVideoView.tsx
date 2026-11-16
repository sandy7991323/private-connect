import React, { useRef, useEffect, useState } from 'react';
import { Maximize, Volume2, VolumeX, User } from 'lucide-react';
import { useMediaStore } from '../../store/useMediaStore';
import { useRoomStore } from '../../store/useRoomStore';

export const RemoteVideoView: React.FC = () => {
  const { remoteStream } = useMediaStore();
  const { userRole } = useRoomStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const hasVideoTrack = remoteStream?.getVideoTracks().length ?? 0;
  const hasAudioTrack = remoteStream?.getAudioTracks().length ?? 0;

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, hasVideoTrack, hasAudioTrack]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const toggleAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsAudioMuted(videoRef.current.muted);
    }
  };

  // If Creator is viewing: Remote is Guest. If Guest is viewing: Remote is Creator (though Creator doesn't transmit camera).
  const remoteLabel = userRole === 'creator' ? 'Guest Video / Audio' : 'Host Video / Audio';

  if (!remoteStream || (!hasVideoTrack && !hasAudioTrack)) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
          <User className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-slate-300">
          {userRole === 'creator'
            ? 'Guest camera is currently off'
            : 'Remote audio/video stream inactive'}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {userRole === 'creator'
            ? 'Guest can voluntarily turn on their camera or mic anytime.'
            : 'Stream will appear here when media is shared.'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md group"
    >
      <div className="relative aspect-video w-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-contain ${!hasVideoTrack ? 'hidden' : ''}`}
        />

        {/* If audio only */}
        {!hasVideoTrack && hasAudioTrack && (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
            <Volume2 className="w-8 h-8 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono">Audio Stream Active</span>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute top-2 left-2 bg-slate-950/70 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-200 border border-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {remoteLabel}
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasAudioTrack > 0 && (
            <button
              onClick={toggleAudio}
              className="p-1.5 rounded-md bg-slate-950/80 hover:bg-slate-800 text-slate-300 transition"
              title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {hasVideoTrack > 0 && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-md bg-slate-950/80 hover:bg-slate-800 text-slate-300 transition"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
