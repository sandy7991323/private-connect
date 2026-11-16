# PRIVATE CONNECT

> **Production-Quality Serverless Peer-to-Peer File Sharing & Communication Platform**

Private Connect is a browser-only, zero-backend web application for temporary, private file exchange, real-time messaging, guest-controlled audio/video, screen sharing, and synchronized multiplayer games between two participants.

---

## 🌟 Key Architectural Pillars

1. **Zero-Backend & Serverless:** No custom Node.js/Express server, database, user authentication system, or cloud storage. Signaling happens over federated Nostr relays via [Trystero](https://trystero.dev).
2. **Direct Peer-to-Peer (WebRTC):** Files, messages, and media streams flow directly between the two browser tabs over WebRTC Data Channels and MediaStreams.
3. **Zero Persistent Storage:** No IndexedDB, no localStorage, no cookies. When the browser tab is closed or reloaded, all chat messages and session memory are permanently wiped.
4. **Mandatory Explicit Offer/Acceptance for Files:** Receivers must explicitly inspect file metadata (name, size, MIME type) and click **Accept** before any binary chunks are transferred.
5. **Strict Creator Camera Rule:** The Room Creator **never** requests camera or microphone permissions (`getUserMedia` is never invoked for Creator). The Invited Guest retains voluntary control over camera, microphone, and screen sharing.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v3, Lucide React, React Router v6, Zustand (ephemeral state only)
- **Networking & P2P:** Trystero (`trystero/nostr`), WebRTC Data Channels, MediaStream APIs (`getUserMedia`, `getDisplayMedia`)
- **Hosting:** Netlify Static Hosting (`netlify.toml` with SPA rewrite and strict security headers)
- **Testing:** Native Node.js Test Runner + tsx

---

## 📁 Project Structure

```
├── docs/
│   ├── ARCHITECTURE.md          # Complete system architecture and Mermaid sequence diagrams
│   ├── RESEARCH.md              # In-depth technical research on Trystero, WebRTC & STUN/TURN
│   └── TECHNICAL_DECISIONS.md   # Architectural Decision Records (ADRs)
├── public/
│   └── shield-check.svg         # Application icon
├── src/
│   ├── app/                     # App shell and React Router routing
│   │   ├── layout/AppLayout.tsx
│   │   ├── router/index.tsx
│   │   └── App.tsx
│   ├── components/              # Reusable UI & Layout components
│   │   ├── layout/AppHeader.tsx
│   │   └── ui/                  # Button, Badge, Modal
│   ├── config/
│   │   └── constants.ts         # Central configuration (100 MB file limit, relays, STUN)
│   ├── features/
│   │   ├── chat/                # Real-time chat panel (plain-text, anti-XSS)
│   │   ├── file-sharing/        # Drag & drop, chunked binary stream, approval cards
│   │   ├── games/               # Synchronized Tic Tac Toe & Rock Paper Scissors
│   │   ├── media/               # Guest media controls & remote video preview
│   │   ├── rooms/               # Landing, Waiting, and Active room pages
│   │   └── screen-sharing/      # Screen sharing controls and viewport
│   ├── services/
│   │   └── p2p/p2pService.ts    # Trystero adapter, binary actions, lifecycle handlers
│   ├── store/                   # Ephemeral Zustand stores (room, chat, files, media, games)
│   ├── types/                   # Comprehensive TypeScript definitions
│   ├── utils/                   # Cryptographic tokens, file sanitization, formatting
│   ├── index.css                # Tailwind directives & sleek styling
│   └── main.tsx                 # Application entry point
├── netlify.toml                 # Netlify SPA redirect rules & security headers
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Tests
```bash
npm test
```
Executes 15 comprehensive automated test suites covering cryptographic token generation, path traversal sanitization, byte formatting, game engines, and store transitions.

### 4. Build for Production
```bash
npm run build
```
Generates production assets into `dist/`.

---

## 🌐 Netlify Deployment Guide

The project is preconfigured for continuous deployment with Netlify Static Hosting.

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: Private Connect P2P platform"
   git remote add origin https://github.com/your-username/private-connect.git
   git push -u origin main
   ```
2. **Connect to Netlify:**
   - Log in to [Netlify](https://app.netlify.com).
   - Click **Add new site** > **Import an existing project**.
   - Select your GitHub repository.
3. **Configure Build Settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. **Deploy:**
   - Click **Deploy site**.
   - The included `netlify.toml` configures SPA rewrites (`/* -> /index.html`) so direct invitation links like `https://your-site.netlify.app/room/RANDOM_ID` resolve seamlessly without 404s.
   - Strict Content Security Policy (CSP), Permissions-Policy, and anti-clickjacking headers are applied automatically.

---

## 🔒 Security & Privacy Notes

- **Bearer Invitation Model:** Without a backend account database, the generated room URL is a bearer token. Anyone with the link can connect while the host tab remains open.
- **Path Traversal Protection:** All incoming file names are sanitized to strip `../`, directories, and dangerous control characters before generating download links.
- **XSS Prevention:** Chat messages are rendered strictly as text nodes.
- **Network Limitations (STUN vs TURN):** WebRTC uses standard STUN servers for NAT traversal. In restrictive enterprise firewalls or dual-symmetric NATs, WebRTC requires a TURN relay server to bridge the connection.
