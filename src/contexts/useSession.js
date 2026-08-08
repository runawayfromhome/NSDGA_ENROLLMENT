// src/contexts/useSession.js
// A small hook so any component can read the logged-in user and call
// login()/logout() without importing the store directly.
import { useContext } from 'react';
import { SessionContext } from './SessionContext';

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return ctx;
}
