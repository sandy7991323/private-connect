# Research & Technical Investigation: Private Connect

## 1. Executive Summary & Core Principles
**Private Connect** is a production-quality, browser-only, peer-to-peer (P2P) file sharing and real-time communication platform. It connects two parties (Room Creator and Invited Guest) directly using WebRTC data channels and media streams without custom backend application servers, databases, account systems, or cloud storage intermediaries.

This research document details the technical mechanics of:
1. P2P signaling & peer discovery via Trystero.
2. WebRTC data channel binary transport, flow control, chunking, and backpressure.
3. MediaStream capture (`getUserMedia`, `getDisplayMedia`) and unidirectional/bidirectional routing rules.
4. Cryptographic room generation and bearer invitation semantics.
5. In-flight transfer negotiation, validation, rejection, and cancellation.
6. Ephemeral state management without persistent storage.
7. Netlify Single Page Application (SPA) static deployment and WebRTC STUN/TURN considerations.

---

## 2. Trystero Architecture & Peer Discovery
Trystero is a serverless WebRTC signaling wrapper that leverages public federated infrastructure to exchange SDP offers, answers, and ICE candidates without maintaining custom signaling servers.

### 2.1 Signaling Strategies in Trystero
Trystero provides several transport strategies for initial WebRTC rendezvous:
- **Nostr (`trystero/nostr` or default `trystero`):** Uses public, decentralized Nostr relays over WebSockets (e.g., `wss://relay.damus.io`, `wss://nos.lol`). Nostr ephemeral events (kind 2xxxx or tag-filtered) exchange SDP offers, answers, and ICE candidates between peers subscribed to a room topic.
- **BitTorrent Tracker (`trystero/torrent`):** Uses public WebTorrent trackers (e.g., `wss://tracker.openwebtorrent.com`).
- **MQTT (`trystero/mqtt`):** Uses public MQTT brokers over secure WebSockets.
- **Firebase / Supabase (`trystero/firebase`, `trystero/supabase`):** Uses public client SDKs with app configuration.

For **Private Connect**, `trystero/nostr` or `trystero/torrent` provides true zero-backend decentralized signaling with zero API keys and zero vendor lock-in. Once WebRTC signaling handshake completes, all signaling connections are idle or decoupled; all subsequent data channel traffic and audio/video media streams flow **directly point-to-point (P2P)** between the two browsers.

### 2.2 Room Lifecycle & Discovery Mechanics
1. **Join Room:**
   ```typescript
   import { joinRoom } from 'trystero/nostr'; // or 'trystero'
   const config = { appId: 'private-connect-p2p' };
   const room = joinRoom(config, roomId);
   ```
2. **Peer Discovery Callbacks:**
   - `room.onPeerJoin((peerId: string) => void)`: Fired when a remote peer successfully completes the WebRTC handshake and establishes a DataChannel connection.
   - `room.onPeerLeave((peerId: string) => void)`: Fired when peer connection state transitions to disconnected/closed or ICE keepalive fails.
   - `room.getPeers()`: Returns a record of currently connected peer IDs and their underlying `RTCPeerConnection` references.
   - `room.leave()`: Closes all peer connections, stops discovery listeners, and disconnects signaling relays.

### 2.3 Decentralized Ephemeral Reality
- Rooms are **not registered in a centralized database**. A room "exists" strictly when at least one participant has joined the rendezvous topic on signaling relays.
- Room identifiers act as shared secret rendezvous keys. Anyone who holds the room ID can connect if the creator is listening.
- Client-side roles ("Creator" vs "Guest") are operational interface designations, not cryptographically enforced server permissions.

---

## 3. Cryptographically Secure Room Generation
- Room IDs must never use `Math.random()` or predictable timestamps.
- To prevent collision and interception on public signaling relays, room IDs must be generated using `crypto.getRandomValues()`.
- Generation standard for Private Connect:
  - 16 cryptographically random bytes (128 bits of entropy) encoded into URL-safe Base64 or lowercase hex / nanoid-equivalent format (e.g., 22–24 characters: `[a-zA-Z0-9_-]`).
  - Validation: Room IDs must match a strict regex format `^[a-zA-Z0-9_-]{16,36}$` before connecting.

---

## 4. Two-Way Binary File Transfer Architecture
WebRTC Data Channels support `ArrayBuffer` and `Blob` transmission. However, naive implementation causes memory leaks, browser tab crashes, and buffer overflows.

### 4.1 Trystero Action Mechanism for Binary Payloads
Trystero's `room.makeAction(actionName)` creates scoped messaging channels over WebRTC data channels:
```typescript
const [sendFileData, onFileData, onFileProgress] = room.makeAction('file-data');
```
When `sendFileData(data, targetPeerId, metadata, progressCallback)` is called with an `ArrayBuffer`, `Uint8Array`, or `Blob`:
- Trystero handles binary framing, slicing into MTU-safe chunks (typically 16 KB or 64 KB per WebRTC data channel packet limit), adding sequence headers, and reconstructing chunks at the receiver.
- Flow control: Trystero tracks `bufferedAmount` on the underlying `RTCDataChannel` and throttles chunk transmission to prevent overflowing the SCTP send buffer.
- `progressCallback(percent: number, peerId: string, metadata?: any)` reports real-time progress (0.0 to 1.0).

### 4.2 Explicit In-Flight File Offer & Acceptance Protocol
To comply with security requirements (never auto-download unexpected files, receiver must explicitly accept before data is transmitted), we implement a **two-phase transfer protocol** layered over Trystero actions:

1. **Offer Phase (`file-offer` action):**
   - Sender generates a unique `transferId` (`crypto.randomUUID()`).
   - Sender packages metadata:
     ```typescript
     interface FileOffer {
       transferId: string;
       name: string;
       size: number;
       mimeType: string;
       senderRole: 'creator' | 'guest';
       timestamp: number;
     }
     ```
   - Sender sends `file-offer` to target peer.
   - Sender queues transfer state as `offered`.
   - Receiver receives `file-offer` and displays acceptance card: File Name, Size, MIME Type, and [Accept] / [Reject] buttons.

2. **Response Phase (`file-response` action):**
   - If Receiver clicks **Reject**:
     - Receiver emits `file-response` with `{ transferId, accepted: false, reason: 'rejected_by_user' }`.
     - Sender marks transfer as `rejected` and aborts file reading.
   - If Receiver clicks **Accept**:
     - Receiver emits `file-response` with `{ transferId, accepted: true }`.
     - Receiver prepares buffer/stream accumulator.
     - Sender receives acceptance and begins binary payload dispatch.

3. **Data & Progress Phase (`file-data` action):**
   - Sender streams the file binary via `sendFileData(fileBlob, receiverPeerId, { transferId }, onProgress)`.
   - Receiver tracks `onFileProgress(percent, senderPeerId, metadata)`.
   - On completion, receiver reconstructs the Blob, generates a local Object URL, and prompts download or in-app preview (images, audio, text).

4. **Cancellation Phase (`file-cancel` action):**
   - Either party can abort an in-flight transfer at any time.
   - Abort signal halts reader loops, detaches listeners, releases memory, and frees buffers.

5. **Memory & Cleanup Constraints:**
   - 100 MB configurable default limit (`MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024`).
   - Active Object URLs (`URL.createObjectURL`) must be tracked and revoked (`URL.revokeObjectURL`) on transfer clearing or session termination.
   - Filenames must be sanitized to strip path traversal (`../`, `/`, `\`) and non-printable control characters before generating download links.

---

## 5. Real-Time Ephemeral Chat
- Chat messages are exchanged via a typed `room.makeAction('chat-message')`.
- Payload structure:
  ```typescript
  interface ChatMessage {
    id: string;
    senderId: string;
    senderRole: 'creator' | 'guest';
    text: string;
    timestamp: number;
  }
  ```
- Chat messages are stored solely in transient React / Zustand client memory.
- **Zero persistence:** No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies. When a tab reloads or the room is left, all chat history is destroyed.
- Content rendering: Always rendered as plain text strings to prevent Cross-Site Scripting (XSS).

---

## 6. Audio / Video Media & Strict Permission Controls

### 6.1 Strict Camera Rule (Room Creator)
- **Room Creator MUST NEVER invoke `navigator.mediaDevices.getUserMedia()`.**
- Room Creator UI has **NO** camera enable button, microphone enable button, or media capture hooks.
- Room Creator is strictly a **media receiver**. When the Guest shares camera/microphone, the Creator attaches the incoming remote `MediaStream` to an `<audio>` / `<video>` element for playback.

### 6.2 Invited Guest Media Controls
- Guest media is **disabled by default**.
- Guest UI presents explicit toggle buttons:
  - "Start Camera" (`getUserMedia({ video: { width: 1280, height: 720 }, audio: false })`)
  - "Unmute Microphone" (`getUserMedia({ video: false, audio: true })`)
- If both are desired, tracks are added to a composite local stream.
- In Trystero, media streams are attached to peers via:
  ```typescript
  room.addStream(stream, peerId);
  ```
  And remote streams are received via:
  ```typescript
  room.onPeerStream((stream: MediaStream, peerId: string) => {
    // Attach stream to remote video/audio DOM element
  });
  ```
- To stop media, all tracks on the local stream must be explicitly stopped (`track.stop()`) and removed (`room.removeStream(stream, peerId)`).
- Error handling: Handle `NotAllowedError` (permission denied), `NotFoundError` (no device), `NotReadableError` (hardware locked by another app), and `OverconstrainedError`.

---

## 7. Screen Sharing Architecture
- Screen sharing is initiated solely upon explicit user interaction via:
  ```typescript
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: 'always' },
    audio: false
  });
  ```
- The local track listens for the native browser banner stop event:
  ```typescript
  screenTrack.onended = () => {
    handleStopScreenShare();
  };
  ```
- Stream is routed via `room.addStream(screenStream)` or handled through WebRTC track substitution.
- Remote party receives the stream and previews it in an aspect-ratio-locked viewport with fullscreen support.

---

## 8. Multiplayer Game Architecture (State Synchronization)
- Games are built as modular P2P state machines using a dedicated action `room.makeAction('game-action')`.
- Initial Games:
  1. **Tic Tac Toe:** 3x3 grid, turn-based validation, win/draw detection, mutual reset agreement.
  2. **Rock Paper Scissors:** Blind commit / reveal or synchronized choice validation, best of 3/5, score tracking.
- Security & Validation:
  - Each move payload contains `{ game: string, round: number, move: any, playerRole: string }`.
  - Inbound moves are strictly validated against current turn and board state before updating local state.
  - Peer disconnections gracefully reset active game sessions to waiting state.

---

## 9. WebRTC Connectivity, STUN, & TURN Limitations
- WebRTC requires ICE candidates to establish direct connections:
  - **Host candidates:** Direct local LAN connection.
  - **Server Reflexive (STUN):** Public IP mapping through public STUN servers (e.g., `stun:stun.l.google.com:19302`). Works across most home NATs and cone NAT configurations.
  - **Relay (TURN):** Required when both peers are behind symmetric NATs or restrictive enterprise firewalls.
- Without a self-hosted or paid TURN server, P2P connections between certain restrictive enterprise cellular/corporate firewalls may fail to negotiate ICE.
- Private Connect configures standard public Google STUN servers and provides clear user feedback if ICE negotiation fails, explaining network relay requirements.

---

## 10. Netlify SPA Static Hosting & Production Deployment
- **Routing:** React Router client-side routes (e.g., `/room/:roomId`) require SPA URL rewrites on static hosts. In `netlify.toml`:
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- **Security Headers:** Enforce HTTPS, HSTS, frame-ancestors defense, CSP, and permissions policies in `netlify.toml`:
  ```toml
  [[headers]]
    for = "/*"
    [headers.values]
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Permissions-Policy = "camera=(self), microphone=(self), display-capture=(self)"
  ```
- **Build Output:** Vite builds to `dist/`, which is published directly to Netlify's global CDN. Zero server functions required.
