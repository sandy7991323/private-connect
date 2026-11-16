import { create } from 'zustand';
import { TransferItem } from '../types';

interface FileState {
  transfers: Record<string, TransferItem>;
  addTransfer: (item: TransferItem) => void;
  updateTransfer: (id: string, updates: Partial<TransferItem>) => void;
  removeTransfer: (id: string) => void;
  clearCompleted: () => void;
  resetTransfers: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  transfers: {},

  addTransfer: (item) =>
    set((state) => ({
      transfers: {
        ...state.transfers,
        [item.id]: item,
      },
    })),

  updateTransfer: (id, updates) =>
    set((state) => {
      const existing = state.transfers[id];
      if (!existing) return state;

      return {
        transfers: {
          ...state.transfers,
          [id]: {
            ...existing,
            ...updates,
          },
        },
      };
    }),

  removeTransfer: (id) => {
    const item = get().transfers[id];
    if (item?.blobUrl) {
      try {
        URL.revokeObjectURL(item.blobUrl);
      } catch (err) {
        console.error('Failed to revoke object URL', err);
      }
    }
    set((state) => {
      const next = { ...state.transfers };
      delete next[id];
      return { transfers: next };
    });
  },

  clearCompleted: () => {
    const all = get().transfers;
    const remaining: Record<string, TransferItem> = {};

    Object.entries(all).forEach(([id, item]) => {
      if (item.status === 'completed' || item.status === 'rejected' || item.status === 'cancelled' || item.status === 'error') {
        if (item.blobUrl) {
          try {
            URL.revokeObjectURL(item.blobUrl);
          } catch (err) {
            console.error('Failed to revoke object URL', err);
          }
        }
      } else {
        remaining[id] = item;
      }
    });

    set({ transfers: remaining });
  },

  resetTransfers: () => {
    const all = get().transfers;
    Object.values(all).forEach((item) => {
      if (item.blobUrl) {
        try {
          URL.revokeObjectURL(item.blobUrl);
        } catch {
          // ignore
        }
      }
      if (item.abortController) {
        item.abortController.abort();
      }
    });
    set({ transfers: {} });
  },
}));
