import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { generateSecureRoomId, isValidRoomId, generateId } from '../utils/crypto.ts';
import { formatBytes, formatSpeed, sanitizeFileName, getFileCategory } from '../utils/file.ts';
import { useGameStore } from '../store/useGameStore.ts';
import { useChatStore } from '../store/useChatStore.ts';
import { useFileStore } from '../store/useFileStore.ts';

describe('1. Cryptographic Security & Room Tokens', () => {
  test('generateSecureRoomId produces 16+ char url-safe string with 128-bit entropy', () => {
    const id = generateSecureRoomId();
    assert.ok(id, 'id should exist');
    assert.equal(typeof id, 'string');
    assert.ok(id.length >= 16 && id.length <= 36, `Length ${id.length} out of bounds`);
    assert.match(id, /^[a-zA-Z0-9_-]+$/, 'Must be URL-safe Base64');
  });

  test('generateSecureRoomId generates unique identifiers', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(generateSecureRoomId());
    }
    assert.equal(set.size, 100, 'All 100 generated room IDs must be unique');
  });

  test('isValidRoomId validates properly formatted IDs', () => {
    const valid = generateSecureRoomId();
    assert.equal(isValidRoomId(valid), true);
    assert.equal(isValidRoomId('abcdefgh12345678'), true);
    assert.equal(isValidRoomId('Room_Token-12345678'), true);
  });

  test('isValidRoomId rejects malformed, short, or injected IDs', () => {
    assert.equal(isValidRoomId(null), false);
    assert.equal(isValidRoomId(undefined), false);
    assert.equal(isValidRoomId(''), false);
    assert.equal(isValidRoomId('short'), false);
    assert.equal(isValidRoomId('invalid id with spaces'), false);
    assert.equal(isValidRoomId('invalid$*special!'), false);
    assert.equal(isValidRoomId('a'.repeat(45)), false);
  });

  test('generateId produces valid 36-char UUID format', () => {
    const id = generateId();
    assert.equal(id.length, 36);
    assert.equal(id.split('-').length, 5);
  });
});

describe('2. File Utility & Path Traversal Security Sanitization', () => {
  test('formatBytes formats file sizes correctly', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(1024 * 1024), '1 MB');
    assert.equal(formatBytes(100 * 1024 * 1024), '100 MB');
    assert.equal(formatBytes(1.5 * 1024 * 1024 * 1024), '1.5 GB');
  });

  test('formatSpeed displays transfer rates', () => {
    assert.equal(formatSpeed(0), '0 KB/s');
    assert.equal(formatSpeed(1024 * 250), '250 KB/s');
    assert.equal(formatSpeed(1024 * 1024 * 3.5), '3.5 MB/s');
  });

  test('sanitizeFileName prevents directory traversal attacks', () => {
    assert.equal(sanitizeFileName('../../etc/shadow'), 'shadow');
    assert.equal(sanitizeFileName('..\\..\\windows\\system32\\cmd.exe'), 'cmd.exe');
    assert.equal(sanitizeFileName('nested/dir/my-report.pdf'), 'my-report.pdf');
    assert.equal(sanitizeFileName('file:with*invalid|chars?.txt'), 'file_with_invalid_chars_.txt');
  });

  test('sanitizeFileName handles dangerous empty / dot filenames', () => {
    assert.ok(sanitizeFileName('').startsWith('unnamed-file-'));
    assert.ok(sanitizeFileName('.').startsWith('unnamed-file-'));
    assert.ok(sanitizeFileName('..').startsWith('unnamed-file-'));
  });

  test('getFileCategory detects MIME categories', () => {
    assert.equal(getFileCategory('image/png', 'photo.png'), 'image');
    assert.equal(getFileCategory('video/mp4', 'movie.mp4'), 'video');
    assert.equal(getFileCategory('audio/wav', 'sound.wav'), 'audio');
    assert.equal(getFileCategory('application/pdf', 'paper.pdf'), 'pdf');
    assert.equal(getFileCategory('text/plain', 'notes.txt'), 'text');
    assert.equal(getFileCategory('application/zip', 'files.zip'), 'archive');
    assert.equal(getFileCategory('', 'script.ts'), 'code');
  });
});

describe('3. Multiplayer Game Logic & Turn Validation', () => {
  test('TicTacToe manages turns and prevents invalid moves', () => {
    const store = useGameStore.getState();
    store.endGame();
    store.proposeGame('tictactoe');
    store.acceptGame();

    assert.equal(useGameStore.getState().ticTacToe.currentTurn, 'proposer');

    // Receiver cannot play on proposer turn
    const illegalReceiverMove = useGameStore.getState().makeTicTacToeMove(0, false);
    assert.equal(illegalReceiverMove, false);

    // Proposer (local player) plays top-left (0)
    const validProposerMove = useGameStore.getState().makeTicTacToeMove(0, true);
    assert.equal(validProposerMove, true);
    assert.equal(useGameStore.getState().ticTacToe.board[0], 'X');
    assert.equal(useGameStore.getState().ticTacToe.currentTurn, 'receiver');

    // Receiver (remote player) plays center (4)
    const validReceiverMove = useGameStore.getState().makeTicTacToeMove(4, false);
    assert.equal(validReceiverMove, true);
    assert.equal(useGameStore.getState().ticTacToe.board[4], 'O');
    assert.equal(useGameStore.getState().ticTacToe.currentTurn, 'proposer');

    // Cannot play on already occupied cell
    const duplicateMove = useGameStore.getState().makeTicTacToeMove(4, true);
    assert.equal(duplicateMove, false);
  });

  test('TicTacToe correctly declares winner on winning line', () => {
    const store = useGameStore.getState();
    store.endGame();
    store.proposeGame('tictactoe');
    store.acceptGame();

    // Top row win for proposer: 0, 1, 2
    store.makeTicTacToeMove(0, true);
    store.makeTicTacToeMove(3, false);
    store.makeTicTacToeMove(1, true);
    store.makeTicTacToeMove(4, false);
    store.makeTicTacToeMove(2, true);

    const state = useGameStore.getState().ticTacToe;
    assert.equal(state.winner, 'proposer');
    assert.equal(state.scores.me, 1);
  });

  test('Rock Paper Scissors calculates winner matrix correctly', () => {
    const store = useGameStore.getState();
    store.endGame();
    store.proposeGame('rps');
    store.acceptGame();

    // Round 1: Rock beats Scissors (Local is Rock, Opponent is Scissors)
    store.makeRPSChoice('rock', true);
    store.makeRPSChoice('scissors', false);
    assert.equal(useGameStore.getState().rps.roundWinner, 'me');
    assert.equal(useGameStore.getState().rps.scores.me, 1);

    // Next round
    store.resetRPS();
    assert.equal(useGameStore.getState().rps.round, 2);

    // Round 2: Paper ties with Paper
    store.makeRPSChoice('paper', true);
    store.makeRPSChoice('paper', false);
    assert.equal(useGameStore.getState().rps.roundWinner, 'draw');
    assert.equal(useGameStore.getState().rps.scores.ties, 1);
  });
});

describe('4. Ephemeral In-Memory State Architecture', () => {
  test('Chat store stores messages in memory and counts unread', () => {
    const store = useChatStore.getState();
    store.clearMessages();

    store.addMessage({
      id: 'm1',
      senderId: 'user1',
      senderRole: 'creator',
      text: 'Hello peer!',
      timestamp: Date.now(),
    });

    assert.equal(useChatStore.getState().messages.length, 1);
    assert.equal(useChatStore.getState().messages[0].text, 'Hello peer!');
    assert.equal(useChatStore.getState().unreadCount, 1);

    store.resetUnread();
    assert.equal(useChatStore.getState().unreadCount, 0);

    store.clearMessages();
    assert.equal(useChatStore.getState().messages.length, 0);
  });

  test('File store manages transfer states', () => {
    const store = useFileStore.getState();
    store.resetTransfers();

    store.addTransfer({
      id: 'transfer-101',
      name: 'archive.zip',
      size: 1024 * 1024 * 5,
      mimeType: 'application/zip',
      direction: 'incoming',
      status: 'pending_approval',
      progress: 0,
      speed: 0,
      timestamp: Date.now(),
    });

    assert.ok(useFileStore.getState().transfers['transfer-101']);
    assert.equal(useFileStore.getState().transfers['transfer-101'].status, 'pending_approval');

    store.updateTransfer('transfer-101', {
      status: 'transferring',
      progress: 0.65,
      speed: 1024 * 800,
    });

    assert.equal(useFileStore.getState().transfers['transfer-101'].status, 'transferring');
    assert.equal(useFileStore.getState().transfers['transfer-101'].progress, 0.65);

    store.removeTransfer('transfer-101');
    assert.equal(useFileStore.getState().transfers['transfer-101'], undefined);
  });
});
