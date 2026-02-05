// vectorguard-nano v0.1.0
// MIT License — free, open, honest.
// Lightweight, reversible string obfuscation using HMAC-SHA256 stream
// Not model-bound — suitable for casual agent messaging (Moltbook, Slack, etc.)

import crypto from 'crypto'; // Works in Node.js, Deno, Bun

/**
 * Generate a repeating digit stream (0-9) from HMAC-SHA256
 * @param {string} secret - Shared secret key
 * @param {string} id - Agent / session identifier
 * @param {string|number} ts - Timestamp or nonce (string or number)
 * @returns {number[]} Array of digits 0-9 (repeating)
 */
function getDigitStream(secret, id, ts) {
  const input = String(id) + ':' + String(ts);
  let hash = crypto.createHmac('sha256', secret).update(input).digest('hex');

  // Extend stream by re-hashing when needed
  const stream = [];
  while (stream.length < 1024) { // arbitrary long enough buffer
    hash = crypto.createHmac('sha256', secret).update(hash).digest('hex');
    for (const c of hash) {
      stream.push(Number.parseInt(c, 16) % 10); // 0-9
    }
  }
  return stream;
}

/**
 * Tumble (encode or decode) a string
 * @param {string} text - Input text
 * @param {string} secret - Shared secret
 * @param {string} id - Agent/session ID
 * @param {string|number} ts - Timestamp/nonce
 * @param {number} dir - +1 to encode, -1 to decode
 * @returns {string} Tumbled output
 */
export function tumble(text, secret, id, ts, dir = 1) {
  if (!text) return '';

  const stream = getDigitStream(secret, id, ts);
  let i = 0;

  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      const delta = stream[i % stream.length] * dir;
      // Simple reversible shift (wraps around 0-65535 range safely)
      const shifted = (code + delta + 65536) % 65536;
      i++;
      return String.fromCharCode(shifted);
    })
    .join('');
}

// Convenience wrappers
export function encode(text, secret, id, ts) {
  return tumble(text, secret, id, ts, 1);
}

export function decode(text, secret, id, ts) {
  return tumble(text, secret, id, ts, -1);
}

// Example usage (commented out)
// const secret = "my-super-secret-key";
// const agentId = "clawbot-xyz";
// const timestamp = Date.now();
// const original = "Hello, this is a secret message!";
// const encoded = encode(original, secret, agentId, timestamp);
// const decoded = decode(encoded, secret, agentId, timestamp);
// console.log("Original:", original);
// console.log("Encoded: ", encoded);
// console.log("Decoded: ", decoded);  // should match original
