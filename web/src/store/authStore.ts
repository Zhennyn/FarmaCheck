import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  role: string | null;
  setAuth: (user: User, role: string) => void;
  clearAuth: () => void;
}

let state: AuthState = {
  user: null,
  role: null,
  setAuth: () => {},
  clearAuth: () => {},
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

state.setAuth = (user: User, role: string) => {
  state = { ...state, user, role };
  notify();
};

state.clearAuth = () => {
  state = { ...state, user: null, role: null };
  notify();
};

export const useAuthStore = () => {
  return {
    user: state.user,
    role: state.role,
    setAuth: state.setAuth,
    clearAuth: state.clearAuth,
  };
};
