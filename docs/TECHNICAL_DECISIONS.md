# Technical Decisions & Architectural Records (ADR): Private Connect

## ADR 01: Decentralized WebRTC Signaling Transport
- **Decision:** Use Trystero with Nostr relays (`trystero/nostr`, the default import `trystero`) as the primary zero-backend WebRTC rendezvous mechanism.
- **Rationale:** 
  - Nostr relays are public, resilient, and require no account keys or developer infrastructure.
  - No custom backend server (Node.js, Express, Go) or third-party paid service (Pusher, Ably, Twilio) is needed.
  - Complete compliance with the strict serverless requirement.
- **Alternatives Considered:**
  - *Custom WebSocket Signaling Server:* Rejected because the project specification strictly forbids custom Node.js/Express application backends.
  - *Firebase/Supabase:* Rejected because user-specific API keys and third-party databases are explicitly disallowed.
  - *WebTorrent Trackers:* Secondary fallback option, but Nostr relays have superior WebSocket stability on modern networks.

---

## ADR 02: Cryptographic Room Identifier & Bearer Invitation Model
- **Decision:** Generate room IDs using `window.crypto.getRandomValues(new Uint8Array(16))` formatted into a URL-safe Base64URL string (22 characters). Validate format on all join paths with `^[a-zA-Z0-9_-]{16,36}$`.
- **Rationale:** 
  - Prevents topic collisions on public signaling relays.
  - Resists brute-force sniffing of active rooms.
- **Decentralized Security Limitations:**
  - Because there is no central database or authentication server, invitation links are bearer tokens. Anyone who possesses the link can connect while the creator's tab is alive.
  - The application clearly informs users of this property in the UI.

---

## ADR 03: Two-Phase Explicit File Transfer Protocol
- **Decision:** Implement an application-level Offer/Response/Stream protocol on top of Trystero binary actions before any file bytes are transmitted.
  1. Sender sends `file-offer` metadata (`transferId`, `name`, `size`, `mimeType`, `timestamp`).
  2. Receiver receives offer card with filename, size, and [Accept] / [Reject] actions.
  3. No binary payload is transmitted unless Receiver explicitly transmits `file-response` with `accepted: true`.
  4. Transmission occurs via `file-data` action with chunked backpressure-monitored binary streaming.
  5. Both parties have a cancel button that triggers `file-cancel` and an `AbortController.abort()` to halt transmission immediately.
- **Rationale:** 
  - Fulfills the strict requirement: "The receiver must explicitly accept incoming files before receiving their content. Never automatically download unexpected files."
  - Protects users from unexpected bandwidth consumption or malicious payload transfers.

---

## ADR 04: Configurable File Limits & Memory Management
- **Decision:** 
  - Set default maximum file size to 100 MB (`MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024`), defined in a central `src/config/constants.ts` file.
  - Restrict simultaneous in-flight transfers (`MAX_CONCURRENT_TRANSFERS = 2`) to avoid exhausting the WebRTC SCTP buffer or crashing mobile browser tabs.
  - Store completed received files as `Uint8Array` / `Blob` in local session memory only, generate `URL.createObjectURL`, and provide explicit "Clear" action that calls `URL.revokeObjectURL`.
  - Sanitize all incoming filenames (strip `../`, path separators, control characters) prior to offering download.

---

## ADR 05: Strict Asymmetric Camera & Microphone Control
- **Decision:**
  - **Room Creator:** Never calls `navigator.mediaDevices.getUserMedia()`. Creator UI has zero camera/mic capture buttons. Creator acts strictly as an audio/video receiver.
  - **Guest:** Media devices are completely disabled by default. Guest has explicit toggle controls to enable/disable camera and microphone.
  - Guest can stop media at any time (`track.stop()`), which immediately updates the creator's view.
- **Rationale:**
  - Guarantees complete compliance with: "The Room Creator must never request camera or microphone permissions... The creator can view the Guest's camera only when the Guest voluntarily enables it."

---

## ADR 06: Ephemeral-Only State Architecture (Zero Persistence)
- **Decision:**
  - All chat messages, file transfer logs, and game states exist strictly in React / Zustand memory.
  - Absolutely no storage in `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
  - Reloading or closing the tab cleanly destroys all active session data.
- **Rationale:** 
  - Complete privacy and temporary communication as required by the specification.

---

## ADR 07: Modular Multiplayer Turn-Based Architecture
- **Decision:**
  - Decouple game logic into a modular engine under `src/features/games/`.
  - Initial games: Tic Tac Toe (3x3 grid) and Rock Paper Scissors (simultaneous commit).
  - Validation: All game moves are verified on the receiver side before state transitions. Opponents cannot inject illegal moves or overwrite arbitrary state.
- **Rationale:**
  - Allows easy extensibility for future additions (e.g., Chess, Quiz) without refactoring the P2P networking layer.

---

## ADR 08: Netlify Static SPA Deployment
- **Decision:**
  - Vite static build targeting `dist/`.
  - `netlify.toml` with `/* -> /index.html 200` rewrite to support React Router direct deep links (e.g., direct navigation to `/room/:roomId`).
  - Production security headers: CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, and Permissions-Policy.
