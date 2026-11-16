import { create } from 'zustand';
import { ConnectionStatus, UserRole } from '../types';

interface RoomState {
  roomId: string | null;
  userRole: UserRole;
  selfPeerId: string | null;
  peerId: string | null;
  connectionStatus: ConnectionStatus;
  errorMessage: string | null;

  setRoom: (roomId: string, role: UserRole) => void;
  setSelfPeerId: (id: string | null) => void;
  setPeerId: (id: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  resetRoom: () => void;
}

const initialState = {
  roomId: null,
  userRole: 'guest' as UserRole,
  selfPeerId: null,
  peerId: null,
  connectionStatus: 'idle' as ConnectionStatus,
  errorMessage: null,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  setRoom: (roomId, role) =>
    set({
      roomId,
      userRole: role,
      connectionStatus: role === 'creator' ? 'waiting' : 'connecting',
      errorMessage: null,
    }),

  setSelfPeerId: (selfPeerId) => set({ selfPeerId }),

  setPeerId: (peerId) =>
    set((state) => ({
      peerId,
      connectionStatus: peerId ? 'connected' : state.userRole === 'creator' ? 'waiting' : 'connecting',
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setError: (errorMessage) =>
    set({
      errorMessage,
      connectionStatus: 'error',
    }),

  resetRoom: () => set(initialState),
}));
