import React, { useState } from 'react';
import { ScreenShare, StopCircle, AlertCircle } from 'lucide-react';
import { useMediaStore } from '../../store/useMediaStore';
import { p2pService } from '../../services/p2p/p2pService';
import { Button } from '../../components/ui/Button';

export const ScreenShareControls: React.FC = () => {
  const {
    screenStream,
    isScreenSharingActive,
    setScreenStream,
    setScreenSharingActive,
  } = useMediaStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startScreenShare = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      // Handle user clicking the native browser "Stop sharing" button
      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          stopScreenShare();
        };
      }

      setScreenStream(stream);
      setScreenSharingActive(true);
      await p2pService.addMediaStream(stream, { type: 'screen' });
      p2pService.broadcastMediaState();
    } catch (err: any) {
      console.error('Screen sharing error:', err);
      if (err.name !== 'NotAllowedError') {
        setError(err.message || 'Failed to start screen sharing.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      p2pService.removeMediaStream(screenStream);
    }
    setScreenStream(null);
    setScreenSharingActive(false);
    p2pService.broadcastMediaState();
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant={isScreenSharingActive ? 'danger' : 'outline'}
        onClick={isScreenSharingActive ? stopScreenShare : startScreenShare}
        isLoading={isLoading}
        icon={
          isScreenSharingActive ? (
            <StopCircle className="w-3.5 h-3.5" />
          ) : (
            <ScreenShare className="w-3.5 h-3.5" />
          )
        }
        className="text-xs w-full"
      >
        {isScreenSharingActive ? 'Stop Screen Share' : 'Share Screen'}
      </Button>

      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
