// components/PasswordGate.tsx
import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'customOptionsUnlocked';

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
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
