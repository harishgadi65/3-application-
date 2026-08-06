import { useEffect, useRef } from 'react';
import { useStomp } from './useStomp.js';

/**
 * Subscribes to a STOMP destination while connected, parsing each message
 * body as JSON before invoking the callback.
 *
 * @param {string|null|undefined} destination
 * @param {(payload: any, message: import('@stomp/stompjs').IMessage) => void} onMessage
 * @param {any[]} deps - extra dependencies that should trigger a re-subscribe
 */
export function useSubscription(destination, onMessage, deps = []) {
  const { client, connected } = useStomp();
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!client || !connected || !destination) {
      return undefined;
    }

    const subscription = client.subscribe(destination, (message) => {
      let payload = message.body;
      try {
        payload = JSON.parse(message.body);
      } catch {
        // Not JSON - fall back to the raw string body.
      }
      callbackRef.current && callbackRef.current(payload, message);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, connected, destination, ...deps]);
}

export default useSubscription;
