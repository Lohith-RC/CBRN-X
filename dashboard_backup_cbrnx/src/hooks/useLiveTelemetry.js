import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

export default function useLiveTelemetry({ onScenarioCompleted } = {}) {
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef({ onScenarioCompleted });
  callbacksRef.current = { onScenarioCompleted };

  useEffect(() => {
    // Browser clients authenticate the WebSocket via their session cookie
    // (captured during the handshake by SessionRolesHandshakeInterceptor).
    // Never ship API keys in the JS bundle.
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    let disposed = false;

    const client = new Client({
      brokerURL: `${protocol}://${window.location.host}/ws-telemetry`,
      // Capped exponential backoff: a rejected connection (e.g. logged-out
      // tab) retries without hammering the server or flooding its logs.
      reconnectDelay: (attempt) => Math.min(30000, 500 * 2 ** attempt),
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (disposed) return;
        setConnected(true);
        client.subscribe('/topic/events', (message) => {
          try {
            const event = JSON.parse(message.body);
            if (event?.eventType === 'scenario_completed') {
              callbacksRef.current.onScenarioCompleted?.(event);
            }
          } catch (parseError) {
            console.warn('Malformed telemetry frame ignored:', parseError.message);
          }
        });
      },
      onWebSocketClose: () => {
        if (!disposed) setConnected(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame.headers?.message || frame.body);
        if (!disposed) setConnected(false);
      },
    });

    client.activate();

    return () => {
      disposed = true;
      setConnected(false);
      client.deactivate().catch(() => {});
    };
  }, []);

  return { liveConnected: connected };
}
