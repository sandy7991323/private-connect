import { joinRoom, selfId } from 'trystero';
import { APP_ID, DEFAULT_RTC_CONFIG, NOSTR_RELAYS, MAX_FILE_SIZE_BYTES } from '../../config/constants';
import {
  ChatMessage,
  FileCancelPayload,
  FileOfferPayload,
  FileResponsePayload,
  GamePayload,
  UserRole,
} from '../../types';
import { useRoomStore } from '../../store/useRoomStore';
import { useChatStore } from '../../store/useChatStore';
import { useFileStore } from '../../store/useFileStore';
import { useMediaStore } from '../../store/useMediaStore';
import { useGameStore } from '../../store/useGameStore';
import { generateId } from '../../utils/crypto';
import { sanitizeFileName } from '../../utils/file';

class P2PService {
  private room: any | null = null;
  private currentRoomId: string | null = null;

  // Actions
  private chatAction: any = null;
  private fileOfferAction: any = null;
  private fileResponseAction: any = null;
  private fileDataAction: any = null;
  private fileCancelAction: any = null;
  private gameAction: any = null;
  private mediaStateAction: any = null;

  public initialize(roomId: string, role: UserRole) {
    if (this.room && this.currentRoomId === roomId) {
      return;
    }

    if (this.room) {
      this.disconnect();
    }

    this.currentRoomId = roomId;
    const roomStore = useRoomStore.getState();
    roomStore.setRoom(roomId, role);
    roomStore.setSelfPeerId(selfId);

    try {
      this.room = joinRoom(
        {
          appId: APP_ID,
          rtcConfig: DEFAULT_RTC_CONFIG,
          relayConfig: {
            urls: NOSTR_RELAYS,
          },
        },
        roomId
      );

      this.setupRoomEvents();
      this.setupActions();
    } catch (err: any) {
      console.error('Failed to initialize P2P room:', err);
      roomStore.setError(err?.message || 'Failed to initialize peer connection');
    }
  }

  private setupRoomEvents() {
    if (!this.room) return;

    this.room.onPeerJoin = (peerId: string) => {
      console.log('Peer connected:', peerId);
      const roomStore = useRoomStore.getState();
      roomStore.setPeerId(peerId);

      // System notification in chat
      useChatStore.getState().addMessage({
        id: generateId(),
        senderId: 'system',
        senderRole: roomStore.userRole,
        text: `Peer joined the room (${peerId.slice(0, 8)}). WebRTC connection active.`,
        timestamp: Date.now(),
        isSystem: true,
      });

      // Synchronize media state if local streams are active
      this.broadcastMediaState();
    };

    this.room.onPeerLeave = (peerId: string) => {
      console.log('Peer disconnected:', peerId);
      const roomStore = useRoomStore.getState();
      roomStore.setPeerId(null);

      // Clean up remote media
      const mediaStore = useMediaStore.getState();
      mediaStore.setRemoteStream(null);
      mediaStore.setRemoteScreenStream(null);

      // Clean up games
      useGameStore.getState().endGame();

      // System notification
      useChatStore.getState().addMessage({
        id: generateId(),
        senderId: 'system',
        senderRole: roomStore.userRole,
        text: `Peer disconnected (${peerId.slice(0, 8)}). Waiting for reconnection...`,
        timestamp: Date.now(),
        isSystem: true,
      });
    };

    this.room.onPeerStream = (stream: MediaStream, peerId: string, metadata: any) => {
      console.log('Received remote stream from:', peerId, metadata);
      const mediaStore = useMediaStore.getState();

      if (metadata?.type === 'screen') {
        mediaStore.setRemoteScreenStream(stream);
      } else {
        mediaStore.setRemoteStream(stream);
      }
    };
  }

  private setupActions() {
    if (!this.room) return;

    // 1. Real-Time Chat Action
    this.chatAction = this.room.makeAction('chat-message');
    this.chatAction.onMessage = (data: ChatMessage, context: any) => {
      useChatStore.getState().addMessage({
        ...data,
        senderId: data.senderId || context?.peerId || 'remote-peer',
      });
    };

    // 2. File Offer Action
    this.fileOfferAction = this.room.makeAction('file-offer');
    this.fileOfferAction.onMessage = (data: FileOfferPayload) => {
      console.log('Received file offer:', data);
      const fileStore = useFileStore.getState();

      // Validate size
      if (data.size > MAX_FILE_SIZE_BYTES) {
        this.sendFileResponse(data.transferId, false, 'File exceeds 100 MB limit');
        return;
      }

      fileStore.addTransfer({
        id: data.transferId,
        name: sanitizeFileName(data.name),
        size: data.size,
        mimeType: data.mimeType || 'application/octet-stream',
        direction: 'incoming',
        status: 'pending_approval',
        progress: 0,
        speed: 0,
        timestamp: data.timestamp || Date.now(),
      });
    };

    // 3. File Response Action (Accept / Reject)
    this.fileResponseAction = this.room.makeAction('file-response');
    this.fileResponseAction.onMessage = async (data: FileResponsePayload) => {
      console.log('Received file response:', data);
      const fileStore = useFileStore.getState();
      const transfer = fileStore.transfers[data.transferId];

      if (!transfer) return;

      if (!data.accepted) {
        fileStore.updateTransfer(data.transferId, {
          status: 'rejected',
          error: data.reason || 'File was rejected by peer',
        });
        return;
      }

      // If accepted, begin binary transmission!
      if (transfer.localFile) {
        await this.transmitFileData(transfer.id, transfer.localFile);
      }
    };

    // 4. File Data Action (Binary Streaming)
    this.fileDataAction = this.room.makeAction('file-data');
    this.fileDataAction.onReceiveProgress = (progress: number, context: any) => {
      const transferId = context?.metadata?.transferId;
      if (!transferId) return;

      const fileStore = useFileStore.getState();
      const item = fileStore.transfers[transferId];
      if (!item) return;

      const now = Date.now();
      const currentBytes = progress * item.size;
      let speed = 0;

      if (item.lastProgressTimestamp && item.lastProgressBytes !== undefined) {
        const timeDiff = (now - item.lastProgressTimestamp) / 1000;
        if (timeDiff > 0.2) {
          speed = (currentBytes - item.lastProgressBytes) / timeDiff;
        } else {
          speed = item.speed;
        }
      }

      fileStore.updateTransfer(transferId, {
        status: 'transferring',
        progress: Math.min(1, progress),
        speed: Math.max(0, speed),
        lastProgressTimestamp: now,
        lastProgressBytes: currentBytes,
      });
    };

    this.fileDataAction.onMessage = (data: Uint8Array | ArrayBuffer | Blob, context: any) => {
      const transferId = context?.metadata?.transferId;
      if (!transferId) return;

      const fileStore = useFileStore.getState();
      const item = fileStore.transfers[transferId];
      if (!item) return;

      try {
        const blob = data instanceof Blob ? data : new Blob([data as any], { type: item.mimeType });
        const blobUrl = URL.createObjectURL(blob);

        fileStore.updateTransfer(transferId, {
          status: 'completed',
          progress: 1,
          speed: 0,
          blob,
          blobUrl,
        });

        // Chat notification
        useChatStore.getState().addMessage({
          id: generateId(),
          senderId: 'system',
          senderRole: useRoomStore.getState().userRole,
          text: `File received: ${item.name}`,
          timestamp: Date.now(),
          isSystem: true,
        });
      } catch (err: any) {
        console.error('Failed to construct received blob:', err);
        fileStore.updateTransfer(transferId, {
          status: 'error',
          error: 'Failed to process received file data',
        });
      }
    };

    // 5. File Cancel Action
    this.fileCancelAction = this.room.makeAction('file-cancel');
    this.fileCancelAction.onMessage = (data: FileCancelPayload) => {
      const fileStore = useFileStore.getState();
      const item = fileStore.transfers[data.transferId];
      if (item) {
        if (item.abortController) {
          item.abortController.abort();
        }
        fileStore.updateTransfer(data.transferId, {
          status: 'cancelled',
          error: data.reason || 'Transfer cancelled by remote peer',
        });
      }
    };

    // 6. Multiplayer Game Action
    this.gameAction = this.room.makeAction('game-action');
    this.gameAction.onMessage = (payload: GamePayload) => {
      const gameStore = useGameStore.getState();

      switch (payload.action) {
        case 'propose':
          gameStore.receiveGameProposal(payload.game);
          useChatStore.getState().addMessage({
            id: generateId(),
            senderId: 'system',
            senderRole: useRoomStore.getState().userRole,
            text: `Peer challenged you to ${payload.game === 'tictactoe' ? 'Tic Tac Toe' : 'Rock Paper Scissors'}!`,
            timestamp: Date.now(),
            isSystem: true,
          });
          break;
        case 'accept':
          gameStore.acceptGame();
          break;
        case 'decline':
          gameStore.declineGame();
          break;
        case 'move':
          if (payload.game === 'tictactoe' && typeof payload.data?.index === 'number') {
            gameStore.makeTicTacToeMove(payload.data.index, false);
          } else if (payload.game === 'rps' && payload.data?.choice) {
            gameStore.makeRPSChoice(payload.data.choice, false);
          }
          break;
        case 'reset':
          if (payload.game === 'tictactoe') {
            gameStore.resetTicTacToe();
          } else if (payload.game === 'rps') {
            gameStore.resetRPS();
          }
          break;
        case 'leave':
          gameStore.endGame();
          break;
      }
    };

    // 7. Media State Sync Action
    this.mediaStateAction = this.room.makeAction('media-state');
    this.mediaStateAction.onMessage = (state: any) => {
      console.log('Peer media state changed:', state);
    };
  }

  // --- Chat Methods ---
  public sendChatMessage(text: string) {
    if (!text.trim() || !this.chatAction) return;
    const roomStore = useRoomStore.getState();

    const message: ChatMessage = {
      id: generateId(),
      senderId: roomStore.selfPeerId || selfId,
      senderRole: roomStore.userRole,
      text: text.trim(),
      timestamp: Date.now(),
    };

    // Add locally
    useChatStore.getState().addMessage(message);

    // Send to peer
    if (roomStore.peerId) {
      this.chatAction.send(message);
    }
  }

  // --- File Transfer Methods ---
  public offerFile(file: File) {
    if (!file || !this.fileOfferAction) return;
    const roomStore = useRoomStore.getState();
    const fileStore = useFileStore.getState();

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File exceeds the maximum limit of 100 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
      return;
    }

    const transferId = generateId();
    const abortController = new AbortController();

    const offer: FileOfferPayload = {
      transferId,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      senderRole: roomStore.userRole,
      timestamp: Date.now(),
    };

    // Add to local state as offered
    fileStore.addTransfer({
      id: transferId,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      direction: 'outgoing',
      status: 'offered',
      progress: 0,
      speed: 0,
      timestamp: Date.now(),
      localFile: file,
      abortController,
    });

    if (roomStore.peerId) {
      this.fileOfferAction.send(offer);
    }
  }

  public sendFileResponse(transferId: string, accepted: boolean, reason?: string) {
    if (!this.fileResponseAction) return;
    const fileStore = useFileStore.getState();

    const payload: FileResponsePayload = {
      transferId,
      accepted,
      reason,
    };

    fileStore.updateTransfer(transferId, {
      status: accepted ? 'transferring' : 'rejected',
      error: accepted ? undefined : reason || 'Rejected by user',
    });

    this.fileResponseAction.send(payload);
  }

  private async transmitFileData(transferId: string, file: File) {
    const fileStore = useFileStore.getState();
    const item = fileStore.transfers[transferId];
    if (!item || !this.fileDataAction) return;

    fileStore.updateTransfer(transferId, {
      status: 'transferring',
      progress: 0,
      speed: 0,
      lastProgressTimestamp: Date.now(),
      lastProgressBytes: 0,
    });

    try {
      await this.fileDataAction.send(file, {
        metadata: { transferId },
        signal: item.abortController?.signal,
        onProgress: (progress: number) => {
          const now = Date.now();
          const currentBytes = progress * file.size;
          const currentItem = useFileStore.getState().transfers[transferId];
          let speed = 0;

          if (currentItem?.lastProgressTimestamp && currentItem.lastProgressBytes !== undefined) {
            const timeDiff = (now - currentItem.lastProgressTimestamp) / 1000;
            if (timeDiff > 0.2) {
              speed = (currentBytes - currentItem.lastProgressBytes) / timeDiff;
            } else {
              speed = currentItem.speed;
            }
          }

          useFileStore.getState().updateTransfer(transferId, {
            progress: Math.min(1, progress),
            speed: Math.max(0, speed),
            lastProgressTimestamp: now,
            lastProgressBytes: currentBytes,
          });
        },
      });

      // Sender finished dispatching all chunks
      useFileStore.getState().updateTransfer(transferId, {
        status: 'completed',
        progress: 1,
        speed: 0,
      });

      useChatStore.getState().addMessage({
        id: generateId(),
        senderId: 'system',
        senderRole: useRoomStore.getState().userRole,
        text: `File transfer completed: ${file.name}`,
        timestamp: Date.now(),
        isSystem: true,
      });
    } catch (err: any) {
      if (item.abortController?.signal.aborted) {
        useFileStore.getState().updateTransfer(transferId, {
          status: 'cancelled',
          error: 'Transfer cancelled by user',
        });
      } else {
        console.error('File transmission failed:', err);
        useFileStore.getState().updateTransfer(transferId, {
          status: 'error',
          error: err?.message || 'Transmission failed',
        });
      }
    }
  }

  public cancelTransfer(transferId: string, reason: string = 'Transfer cancelled') {
    const fileStore = useFileStore.getState();
    const item = fileStore.transfers[transferId];
    if (!item) return;

    if (item.abortController) {
      item.abortController.abort();
    }

    fileStore.updateTransfer(transferId, {
      status: 'cancelled',
      error: reason,
    });

    if (this.fileCancelAction) {
      this.fileCancelAction.send({ transferId, reason });
    }
  }

  // --- Media & Screen Streaming Methods ---
  public async addMediaStream(stream: MediaStream, metadata?: any) {
    if (!this.room) return;
    try {
      await Promise.all(this.room.addStream(stream, { metadata }));
    } catch (err) {
      console.error('Failed to add stream to room:', err);
    }
  }

  public removeMediaStream(stream: MediaStream) {
    if (!this.room) return;
    try {
      this.room.removeStream(stream);
    } catch (err) {
      console.error('Failed to remove stream from room:', err);
    }
  }

  public broadcastMediaState() {
    if (!this.mediaStateAction) return;
    const { isCameraActive, isMicMuted, isScreenSharingActive } = useMediaStore.getState();
    this.mediaStateAction.send({
      isCameraActive,
      isMicMuted,
      isScreenSharingActive,
    });
  }

  // --- Multiplayer Game Methods ---
  public sendGameAction(payload: GamePayload) {
    if (!this.gameAction) return;
    this.gameAction.send(payload);
  }

  // --- Disconnect & Cleanup ---
  public disconnect() {
    if (this.room) {
      try {
        this.room.leave();
      } catch (err) {
        console.error('Error leaving room:', err);
      }
      this.room = null;
    }

    this.currentRoomId = null;
    useRoomStore.getState().resetRoom();
    useFileStore.getState().resetTransfers();
    useChatStore.getState().clearMessages();
    useMediaStore.getState().cleanupAllMedia();
    useGameStore.getState().endGame();
  }
}

export const p2pService = new P2PService();
