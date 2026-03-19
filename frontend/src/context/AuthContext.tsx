import { createContext } from 'react';
import type { User } from '@shared/types';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType {
  authState: AuthState;
  login: (token: string, user: User) => void;
  logout: () => void;
  clearState: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
