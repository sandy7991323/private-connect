export const APP_ID = 'private-connect-p2p-v1';

// Configurable maximum file size (100 MB default per requirement)
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_FILE_SIZE_LABEL = '100 MB';

// Maximum concurrent in-flight transfers to prevent SCTP buffer choking
export const MAX_CONCURRENT_TRANSFERS = 2;

// Cryptographic room identifier constraints
export const ROOM_ID_REGEX = /^[a-zA-Z0-9_-]{16,36}$/;

// Standard public STUN configuration for WebRTC ICE negotiation
export const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Nostr relays fallback list
export const NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.mom',
];
