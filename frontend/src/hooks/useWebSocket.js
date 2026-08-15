import { useEffect, useRef, useState } from "react";

/**
 * useWebSocket
 * ============
 *
 * A custom hook that owns the entire lifecycle of a WebSocket connection:
 * connecting, receiving messages, tracking connection state, and cleaning
 * up when the component using it unmounts.
 *
 * WHY A CUSTOM HOOK (and not just useEffect inline in the component)?
 * Any component that needs live data (the Dashboard now, maybe an Alerts
 * panel later) would otherwise have to duplicate this connect/cleanup
 * logic. Wrapping it in a hook means ANY component can just call
 * `useWebSocket(url)` and get connection state + messages for free.
 *
 * WHY STATE (useState) INSTEAD OF A PLAIN VARIABLE?
 * React only re-renders a component when its state changes. If we stored
 * the latest message in a plain `let lastMessage`, updating it would NOT
 * trigger React to re-render the UI — the screen would just never update,
 * even though the data changed. useState is what tells React "something
 * changed, please re-render."
 */
export function useWebSocket(url) {
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // "connecting" | "open" | "closed"
  const [lastMessage, setLastMessage] = useState(null);

  // WHY useRef HERE INSTEAD OF useState?
  // We need to hold onto the actual WebSocket OBJECT across re-renders so
  // we can call ws.send() from elsewhere, or close it on cleanup. But we
  // do NOT want changes to this object to trigger a re-render (unlike
  // state). useRef gives us a mutable box that persists across renders
  // WITHOUT causing re-renders when it changes. Perfect for "I need to
  // remember this thing" but not "I need the UI to update because of it."
  const wsRef = useRef(null);

  useEffect(() => {
    // WHY useEffect?
    // Creating a WebSocket connection is a "side effect" — it reaches
    // outside of React (to the network) rather than just computing what
    // to render. Side effects belong in useEffect, run AFTER React commits
    // the render to the screen.
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("open");
    };

    ws.onmessage = (event) => {
      setLastMessage(event.data);
    };

    ws.onclose = () => {
      setConnectionStatus("closed");
    };

    ws.onerror = () => {
      setConnectionStatus("closed");
    };

    // THE CLEANUP FUNCTION — this is the critical part.
    // Whatever we `return` from inside useEffect runs when the component
    // UNMOUNTS (e.g. user navigates away from the Dashboard page), or
    // right before the effect re-runs (e.g. if `url` changes).
    //
    // WHAT HAPPENS IF WE SKIP THIS?
    // The WebSocket connection would stay open in the browser even after
    // the component using it is gone. Every time the component mounted
    // again, a NEW connection would open on top of the old one — leaking
    // connections, wasting server resources, and eventually breaking
    // things in ways that are very annoying to debug.
    return () => {
      ws.close();
    };
  }, [url]); // Re-run this effect only if `url` changes. Since url is
             // constant in our case, this effect runs exactly once —
             // on mount — and cleans up exactly once — on unmount.

  return { connectionStatus, lastMessage, wsRef };
}