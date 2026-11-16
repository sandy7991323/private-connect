import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, AlertCircle } from 'lucide-react';
import { useMediaStore } from '../../store/useMediaStore';
import { useRoomStore } from '../../store/useRoomStore';
import { p2pService } from '../../services/p2p/p2pService';
import { Button } from '../../components/ui/Button';

export const GuestMediaControls: React.FC = () => {
  const { userRole } = useRoomStore();
  const {
    localStream,
    isCameraActive,
    isMicMuted,
    setLocalStream,
    setCameraActive,
    setMicMuted,
  } = useMediaStore();

  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // STRICT RULE CHECK: Creator NEVER runs media capture
  if (userRole === 'creator') {
    return null;
  }

  // Update local video element when stream changes
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraActive]);

  const toggleCamera = async () => {
    setMediaError(null);
    setIsLoading(true);

    try {
      if (isCameraActive && localStream) {
        // Stop video tracks
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach((track) => track.stop());

        // Check if audio tracks remain
        const remainingTracks = localStream.getAudioTracks();
        if (remainingTracks.length > 0) {
          const newStream = new MediaStream(remainingTracks);
          setLocalStream(newStream);
          p2pService.addMediaStream(newStream);
        } else {
          p2pService.removeMediaStream(localStream);
          setLocalStream(null);
        }
        setCameraActive(false);
      } else {
        // Request video stream
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });

        let compositeStream = localStream;
        if (!compositeStream) {
          compositeStream = new MediaStream();
        }

        // Add the video track
        videoStream.getVideoTracks().forEach((track) => compositeStream!.addTrack(track));

        setLocalStream(compositeStream);
        setCameraActive(true);
        p2pService.addMediaStream(compositeStream);
      }
    } catch (err: any) {
      console.error('Camera toggle error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('Camera permission was denied in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setMediaError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setMediaError('Camera is in use by another application.');
      } else {
        setMediaError(err.message || 'Could not access camera.');
      }
    } finally {
      setIsLoading(false);
      p2pService.broadcastMediaState();
    }
  };

  const toggleMicrophone = async () => {
    setMediaError(null);
    setIsLoading(true);

    try {
      if (!isMicMuted && localStream && localStream.getAudioTracks().length > 0) {
        // Mute mic
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        setMicMuted(true);
      } else if (localStream && localStream.getAudioTracks().length > 0) {
        // Unmute mic
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setMicMuted(false);
      } else {
        // Request mic access
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        let compositeStream = localStream;
        if (!compositeStream) {
          compositeStream = new MediaStream();
        }

        audioStream.getAudioTracks().forEach((track) => compositeStream!.addTrack(track));

        setLocalStream(compositeStream);
        setMicMuted(false);
        p2pService.addMediaStream(compositeStream);
      }
    } catch (err: any) {
      console.error('Mic toggle error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('Microphone permission was denied in your browser.');
      } else if (err.name === 'NotFoundError') {
        setMediaError('No microphone found on this device.');
      } else {
        setMediaError(err.message || 'Could not access microphone.');
      }
    } finally {
      setIsLoading(false);
      p2pService.broadcastMediaState();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase font-semibold tracking-wider text-slate-300">
          Your Media (Guest Controls)
        </h4>
        <span className="text-[10px] text-slate-500 font-mono">Off by default</span>
      </div>

      {/* Local Video Preview (when camera is on) */}
      {isCameraActive && (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 shadow-inner">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
            Self Preview
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant={isCameraActive ? 'danger' : 'outline'}
          onClick={toggleCamera}
          isLoading={isLoading}
          icon={isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          {isCameraActive ? 'Turn Off Cam' : 'Start Camera'}
        </Button>

        <Button
          size="sm"
          variant={localStream && !isMicMuted ? 'primary' : 'outline'}
          onClick={toggleMicrophone}
          isLoading={isLoading}
          icon={localStream && !isMicMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          {localStream && !isMicMuted ? 'Mute Mic' : 'Unmute Mic'}
        </Button>
      </div>

      {mediaError && (
        <div className="flex items-center gap-2 p-2 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{mediaError}</span>
        </div>
      )}
    </div>
  );
};
