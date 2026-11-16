import { create } from 'zustand';

interface MediaState {
  // Guest local media
  localStream: MediaStream | null;
  isCameraActive: boolean;
  isMicMuted: boolean;

  // Screen share (either user)
  screenStream: MediaStream | null;
  isScreenSharingActive: boolean;

  // Remote media from peer
  remoteStream: MediaStream | null;
  remoteScreenStream: MediaStream | null;

  // Actions
  setLocalStream: (stream: MediaStream | null) => void;
  setCameraActive: (active: boolean) => void;
  setMicMuted: (muted: boolean) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setScreenSharingActive: (active: boolean) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setRemoteScreenStream: (stream: MediaStream | null) => void;
  cleanupAllMedia: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  localStream: null,
  isCameraActive: false,
  isMicMuted: false,

  screenStream: null,
  isScreenSharingActive: false,

  remoteStream: null,
  remoteScreenStream: null,

  setLocalStream: (localStream) => set({ localStream }),
  setCameraActive: (isCameraActive) => set({ isCameraActive }),
  setMicMuted: (isMicMuted) => set({ isMicMuted }),

  setScreenStream: (screenStream) => set({ screenStream }),
  setScreenSharingActive: (isScreenSharingActive) => set({ isScreenSharingActive }),

  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setRemoteScreenStream: (remoteScreenStream) => set({ remoteScreenStream }),

  cleanupAllMedia: () => {
    const { localStream, screenStream } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }

    if (screenStream) {
      screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }

    set({
      localStream: null,
      isCameraActive: false,
      isMicMuted: false,
      screenStream: null,
      isScreenSharingActive: false,
      remoteStream: null,
      remoteScreenStream: null,
    });
  },
}));
