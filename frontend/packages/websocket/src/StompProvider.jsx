import React, {
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Client } from '@stomp/stompjs';

const TOKEN_KEY = 'smartad_token';

export const StompContext = createContext({
  client: null,
  connected: false,
  reconnect: () => {},
});

function resolveBrokerUrl() {
  const raw =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_WS_URL) ||
    'ws://localhost:8080/ws';

  if (raw.startsWith('https://')) {
    return raw.replace(/^https:\/\//, 'wss://');
  }
  if (raw.startsWith('http://')) {
    return raw.replace(/^http:\/\//, 'ws://');
  }
  return raw;
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function StompProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  const client = useMemo(() => {
    const stompClient = new Client({
      brokerURL: resolveBrokerUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // Read the token fresh on every (re)connect attempt so that logging
      // in/out after the provider has mounted is picked up automatically.
      beforeConnect: () => {
        const token = getToken();
        stompClient.connectHeaders = {
          ...(stompClient.connectHeaders || {}),
          Authorization: token ? `Bearer ${token}` : undefined,
        };
      },
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    return stompClient;
  }, []);

  clientRef.current = client;

  useEffect(() => {
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [client]);

  const reconnect = useCallback(() => {
    const current = clientRef.current;
    if (!current) return;
    if (current.active) {
      current.deactivate().then(() => current.activate());
    } else {
      current.activate();
    }
  }, []);

  const value = useMemo(
    () => ({ client, connected, reconnect }),
    [client, connected, reconnect]
  );

  return <StompContext.Provider value={value}>{children}</StompContext.Provider>;
}

export default StompProvider;
