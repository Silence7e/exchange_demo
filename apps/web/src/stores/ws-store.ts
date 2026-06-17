import { create } from 'zustand';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface WsState {
  status: ConnectionStatus;
  subscriptions: string[];
  setStatus: (status: ConnectionStatus) => void;
  setSubscriptions: (subs: string[]) => void;
}

export const useWsStore = create<WsState>((set) => ({
  status: 'disconnected',
  subscriptions: [],
  setStatus: (status) => set({ status }),
  setSubscriptions: (subscriptions) => set({ subscriptions }),
}));
