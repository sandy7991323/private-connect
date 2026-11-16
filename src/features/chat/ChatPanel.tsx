import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, ShieldCheck } from 'lucide-react';
import { selfId } from 'trystero';
import { useChatStore } from '../../store/useChatStore';
import { useRoomStore } from '../../store/useRoomStore';
import { p2pService } from '../../services/p2p/p2pService';
import { formatTimeShort } from '../../utils/time';
import { Button } from '../../components/ui/Button';

export const ChatPanel: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const { messages } = useChatStore();
  const { peerId, selfPeerId } = useRoomStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSelfId = selfPeerId || selfId;
  const isPeerConnected = Boolean(peerId);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    p2pService.sendChatMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-semibold text-slate-200">Session Chat</h3>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
            Ephemeral
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">No storage / memory-only</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-8">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-400">No messages in this session</p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
              Messages flow directly over the WebRTC data channel. When you reload or leave, history is wiped.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[11px] text-slate-400 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full text-center">
                    {msg.text}
                  </span>
                </div>
              );
            }

            // Distinguish sender using unique peer IDs
            const isMe = msg.senderId === currentSelfId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono">
                  <span className={`font-semibold ${isMe ? 'text-brand-300' : 'text-emerald-400'}`}>
                    {isMe ? 'You' : 'Peer'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-500">{formatTimeShort(msg.timestamp)}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words shadow-sm ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-none'
                  }`}
                >
                  {/* Strict plain text rendering to prevent XSS */}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isPeerConnected
              ? 'Type a message (Enter to send)...'
              : 'Waiting for peer to connect before chatting...'
          }
          disabled={!isPeerConnected}
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!isPeerConnected || !inputText.trim()}
          icon={<Send className="w-3.5 h-3.5" />}
        >
          Send
        </Button>
      </form>
    </div>
  );
};
