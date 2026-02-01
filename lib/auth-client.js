// lib/auth-client.js

// ❌ Auth is handled exclusively by NextAuth in PROD
// This file now provides a safe stub for legacy imports

export async function getClientSession() {
  return null;
}

export function logout() {
  // No-op — logout handled via next-auth signOut()
}
