// context/AuthContext.js
import { createContext, useContext } from 'react';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  // Auth state is owned by NextAuth (useSession)
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
