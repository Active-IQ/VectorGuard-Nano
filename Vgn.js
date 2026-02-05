// vectorguard-nnano v0.1.0
// MIT License — free, open, honest.
// Lightweight digit stream from HMAC + timestamp. Not model-bound.

import crypto from 'crypto'; // Node.js, Deno, Bun — all work

const TUMBLE_MOD = 10;

// secret: shared between sender/receiver (e.g. agent key)
// id: agent identifier
// ts: timestamp (seconds)
// dir: +1 encode, -1 decode
export function tumblestring(text, secret, id, ts, dir = 1) {
  const key = crypto.createHmac('sha256', secret)
                  .update(id + ':' + ts)
                  .digest('hex');

  let i = 0;
  const stream = key.split('').map(c => Number(c) * dir); // 0–9 rolling

  return text.split('').map(char => {
    const ord = char.charCodeAt(0);
    const delta = stream ;
    const rolled = ((ord - delta % TUMBLE_MOD + TUMBLE_MOD) % TUMBLE_MOD) + delta;
    i++;
    return String.fromCharCode(rolled);
  }).join('');
}

// Usage:
// const enc = tumblestring("hello", "mykey", "bot42", "1717800000", +1);
// const dec = tumblestring(enc, "mykey", "bot42", "1717800000", -1);
// console.log(dec); // "hello"
