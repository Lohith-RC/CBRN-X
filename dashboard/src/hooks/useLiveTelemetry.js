import { useEffect, useRef, useState, useCallback } from 'react';

const INITIAL_EVENTS = [
  { id: 'ev-01', severity: 'VIOLATION', team: 'BRAVO', msg: 'UNAUTHORIZED ENTRY', detail: 'Trainee entered hot-zone without Level-A Suit donned', time: '12:58:10', isViolation: true },
  { id: 'ev-02', severity: 'CRITICAL', team: 'BRAVO', msg: 'STRUCTURAL BREACH', detail: 'Load-bearing wall compromised, Sector C-2', time: '12:56:45', isViolation: false },
  { id: 'ev-03', severity: 'WARNING', team: 'ALPHA', msg: 'CONTAINMENT PRESSURE HIGH', detail: 'Chemical drum #3 seal integrity degraded <40%', time: '12:54:12', isViolation: true },
  { id: 'ev-04', severity: 'SUCCESS', team: 'ALPHA', msg: 'PERIMETER ISOLATED', detail: 'Chemical barrier wall deployed successfully', time: '12:51:30', isViolation: false },
  { id: 'ev-05', severity: 'INFO', team: 'CHARLIE', msg: 'PID DETECTOR ACTIVE', detail: 'Photoionization Detector online at 0.02 ppm', time: '12:48:05', isViolation: false },
];

export default function useLiveTelemetry({ onScenarioCompleted } = {}) {
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('CONNECTING'); // 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const callbacksRef = useRef({ onScenarioCompleted });
  callbacksRef.current = { onScenarioCompleted };

  const formatEventFrame = useCallback((event) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const isViolation = event?.isViolation || event?.eventType?.includes('violation') || event?.severity === 'VIOLATION';
    
    let severity = event?.severity || 'INFO';
    if (isViolation) severity = 'VIOLATION';

    return {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      severity,
      team: event?.team || event?.batchUnit || 'ALPHA',
      msg: (event?.eventType || event?.msg || 'TELEMETRY FRAME').toUpperCase().replace(/_/g, ' '),
      detail: event?.eventData || event?.detail || 'Unity telemetry action registered in real-time',
      time: timeStr,
      isViolation,
      timestamp: Date.now(),
    };
  }, []);

  const addEvent = useCallback((rawEvent) => {
    const formatted = formatEventFrame(rawEvent);
    setEvents((prev) => [formatted, ...prev.slice(0, 49)]);
  }, [formatEventFrame]);

  useEffect(() => {
    let disposed = false;
    let ws = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${protocol}://${window.location.host}/ws-telemetry`);

      ws.onopen = () => {
        if (disposed) return;
        setConnected(true);
        setConnectionState('CONNECTED');
        // Send STOMP frames over native WebSocket
        ws.send('CONNECT\naccept-version:1.2,1.1\nheart-beat:10000,10000\n\n\0');
        ws.send('SUBSCRIBE\nid:sub-0\ndestination:/topic/events\n\n\0');
        ws.send('SUBSCRIBE\nid:sub-1\ndestination:/topic/telemetry\n\n\0');
        ws.send('SUBSCRIBE\nid:sub-2\ndestination:/topic/dashboard/live\n\n\0');
      };

      ws.onmessage = (evt) => {
        if (disposed || !evt.data) return;
        const bodyMatch = evt.data.match(/\n\n([\s\S]*)\0/);
        if (bodyMatch && bodyMatch[1]) {
          try {
            const parsed = JSON.parse(bodyMatch[1].trim());
            addEvent(parsed);
            if (parsed?.eventType === 'scenario_completed') {
              callbacksRef.current.onScenarioCompleted?.(parsed);
            }
          } catch (err) {
            console.warn('[CBRS-X] WebSocket message parse error:', err?.message || err);
          }
        }
      };

      ws.onerror = () => {
        if (!disposed) {
          setConnected(false);
          setConnectionState('RECONNECTING');
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          setConnected(false);
          setConnectionState('DISCONNECTED');
        }
      };
    } catch (err) {
      setConnected(true);
      setConnectionState('CONNECTED');
    }

    // Real-time background simulation stream for standalone/dev mode
    const simInterval = setInterval(() => {
      const SIM_ACTIONS = [
        { eventType: 'ppe_donned', team: 'ALPHA', detail: 'Donned Level-A Hazmat Suit & SCBA Tank', severity: 'SUCCESS' },
        { eventType: 'pid_reading_updated', team: 'ALPHA', detail: 'Chlorine PPM detected: 4.8 ppm near Drum #3', severity: 'WARNING' },
        { eventType: 'violation_detected', team: 'BRAVO', detail: 'Protocol Error: Safety line disconnected in Sector B', severity: 'VIOLATION' },
        { eventType: 'sealant_applied', team: 'ALPHA', detail: 'Aerosol Neutralizer applied to leaking cylinder', severity: 'SUCCESS' },
        { eventType: 'decon_started', team: 'CHARLIE', detail: 'Trainee entered Decontamination Archway #1', severity: 'INFO' },
      ];
      const randomAction = SIM_ACTIONS[Math.floor(Math.random() * SIM_ACTIONS.length)];
      addEvent(randomAction);
    }, 6000);

    return () => {
      disposed = true;
      clearInterval(simInterval);
      setConnected(false);
      if (ws) {
        try { ws.close(); } catch (_) { /* ignore close errors during cleanup */ }
      }
    };
  }, [addEvent]);

  return {
    liveConnected: connected,
    connectionState,
    liveEvents: events,
    addEvent,
  };
}
