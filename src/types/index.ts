export type UserRole = 'creator' | 'guest';

export type ConnectionStatus =
  | 'idle'
  | 'generating'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface Participant {
  id: string;
  role: UserRole;
  joinedAt: number;
}

export type TransferStatus =
  | 'offered'            // Sender has proposed the file
  | 'pending_approval'  // Receiver has received the offer and must decide
  | 'transferring'      // Active chunk transfer
  | 'completed'         // Successfully received or sent
  | 'rejected'          // Rejected by receiver
  | 'cancelled'         // Cancelled by sender or receiver
  | 'error';            // Network / buffer / browser failure

export interface FileOfferPayload {
  transferId: string;
  name: string;
  size: number;
  mimeType: string;
  senderRole: UserRole;
  timestamp: number;
}

export interface FileResponsePayload {
  transferId: string;
  accepted: boolean;
  reason?: string;
}

export interface FileCancelPayload {
  transferId: string;
  reason?: string;
}

export interface TransferItem {
  id: string; // transferId
  name: string;
  size: number;
  mimeType: string;
  direction: 'outgoing' | 'incoming';
  status: TransferStatus;
  progress: number; // 0.0 to 1.0
  speed: number; // bytes per second
  error?: string;
  blob?: Blob;
  blobUrl?: string;
  timestamp: number;
  // Local references (not transmitted over wire)
  localFile?: File;
  abortController?: AbortController;
  lastProgressTimestamp?: number;
  lastProgressBytes?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface MediaDeviceState {
  hasCamera: boolean;
  hasMicrophone: boolean;
  isCameraActive: boolean;
  isMicrophoneMuted: boolean;
  isScreenSharingActive: boolean;
}

export interface RemoteMediaState {
  hasRemoteVideo: boolean;
  hasRemoteAudio: boolean;
  hasRemoteScreen: boolean;
}

export type GameType = 'tictactoe' | 'rps';

export type GameStateStatus = 'idle' | 'proposing' | 'playing' | 'ended';

export type PlayerSlot = 'proposer' | 'receiver';

export interface TicTacToeState {
  board: Array<'X' | 'O' | null>; // 9 slots
  currentTurn: PlayerSlot; // Proposer is 'X' (goes first), Receiver is 'O'
  winner: PlayerSlot | 'draw' | null;
  scores: { me: number; opponent: number; ties: number };
}

export interface RPSState {
  round: number;
  myChoice: 'rock' | 'paper' | 'scissors' | null;
  opponentChoice: 'rock' | 'paper' | 'scissors' | null;
  roundWinner: 'me' | 'opponent' | 'draw' | null;
  scores: { me: number; opponent: number; ties: number };
}

export interface GamePayload {
  game: GameType;
  action: 'propose' | 'accept' | 'decline' | 'move' | 'reset' | 'leave';
  senderId?: string;
  senderRole?: UserRole;
  data?: any;
}
