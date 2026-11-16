import React, { useRef, useEffect } from 'react';
import { ScreenShare, Maximize } from 'lucide-react';
import { useMediaStore } from '../../store/useMediaStore';

export const RemoteScreenView: React.FC = () => {
  const { remoteScreenStream } = useMediaStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && remoteScreenStream) {
      videoRef.current.srcObject = remoteScreenStream;
    }
  }, [remoteScreenStream]);

  if (!remoteScreenStream) return null;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group my-3"
    >
      <div className="relative aspect-video w-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />

        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-200 border border-slate-800 flex items-center gap-1.5">
          <ScreenShare className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
          Remote Screen Stream
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md bg-slate-950/80 hover:bg-slate-800 text-slate-300 transition"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
