// components/PasswordGate.tsx
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'customOptionsUnlocked';

/**
 * SHA-256 without Web Crypto.
 *
 * crypto.subtle only exists in a secure context - HTTPS or localhost. Testing
 * over a LAN address (http://192.168.x.x:3000) leaves it undefined, and so
 * would any plain-HTTP deployment. This keeps the unlock working there.
 */
function sha256Fallback(ascii: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));

  const maxWord = Math.pow(2, 32);
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) throw new Error('sha256Fallback: non-ASCII input');
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(text);
}

/**
 * Unlock state for the session. One correct password unlocks every
 * locked patch until the tab is closed.
 */
export function usePasswordUnlock(expectedHash: string) {
  const [unlocked, setUnlocked] = useState(false);

  // Checked after mount, not in the initializer: reading sessionStorage
  // during server render would cause a hydration mismatch.
  useEffect(() => {
    try {
      if (expectedHash && sessionStorage.getItem(STORAGE_KEY) === expectedHash) {
        setUnlocked(true);
      }
    } catch { /* storage blocked, stay locked */ }
  }, [expectedHash]);

  const attempt = async (candidate: string): Promise<boolean> => {
    if (!expectedHash) return false;
    const hash = await sha256Hex(candidate.trim());
    if (hash !== expectedHash) return false;
    try { sessionStorage.setItem(STORAGE_KEY, hash); } catch { /* non-critical */ }
    setUnlocked(true);
    return true;
  };

  return { unlocked, attempt };
}

interface PasswordFormProps {
  onAttempt: (candidate: string) => Promise<boolean>;
  onCancel: () => void;
}

/** Compact password entry, sized to sit inside an option box. */
export function PasswordForm({ onAttempt, onCancel }: PasswordFormProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onAttempt(input);
    if (!ok) {
      // Signalled by the input turning red and shaking rather than by an
      // error message, which would make the box taller than its neighbours.
      setError(true);
      setInput('');
    }
  };

  return (
    <form onSubmit={submit} className="password-form">
      <input
        type="text"
        autoComplete="off"
        autoFocus
        placeholder="Password"
        aria-label="Password"
        aria-invalid={error}
        value={input}
        onChange={e => { setInput(e.target.value); setError(false); }}
        className={error ? 'password-input password-input-error' : 'password-input'}
      />
      <div className="password-form-actions">
        <button type="submit" className="option-btn">Unlock</button>
        <button type="button" onClick={onCancel} className="option-btn">Cancel</button>
      </div>
    </form>
  );
}
