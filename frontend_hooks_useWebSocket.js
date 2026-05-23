// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveAlert, prependEvent } from '../store';
import { WS_URL } from '../services/api';

export default function useWebSocket() {
  const dispatch    = useDispatch();
  const wsRef       = useRef(null);
  const retryRef    = useRef(null);
  const mountedRef  = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'GATE_ALERT') {
            dispatch(setActiveAlert(data));
            dispatch(prependEvent({
              id:           data.event_id,
              message:      data.message,
              triggered_by: data.triggered_by,
              created_at:   data.timestamp,
              acknowledged: false,
            }));
          }
        } catch (_) {}
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        if (mountedRef.current) {
          retryRef.current = setTimeout(connect, 4000);
        }
      };

      // Heartbeat every 25s
      const hb = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 25000);

      ws._hb = hb;
    } catch (_) {
      if (mountedRef.current) retryRef.current = setTimeout(connect, 4000);
    }
  }, [dispatch]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) {
        clearInterval(wsRef.current._hb);
        wsRef.current.close();
      }
    };
  }, [connect]);
}
