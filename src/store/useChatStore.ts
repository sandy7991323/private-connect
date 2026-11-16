import { create } from 'zustand';
import { ChatMessage } from '../types';

interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  addMessage: (message: ChatMessage) => void;
  resetUnread: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  unreadCount: 0,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      unreadCount: state.unreadCount + 1,
    })),

  resetUnread: () => set({ unreadCount: 0 }),

  clearMessages: () => set({ messages: [], unreadCount: 0 }),
}));
