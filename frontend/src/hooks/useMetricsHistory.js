import { useEffect, useRef, useState } from "react";

const MAX_POINTS = 60;

/**
 * useMetricsHistory
 * ==================
 * Maintains a rolling window of the last MAX_POINTS readings.
 *
 * As of this update, the hook accepts an optional `seed` array — data
 * fetched once from the REST /api/metrics/history endpoint — so the chart
 * has something to show immediately on page load, BEFORE the first live
 * WebSocket message even arrives. Without this, every refresh means
 * staring at an empty chart for a few seconds while the first ~60 points
 * trickle in one per second.
 */
export function useMetricsHistory(metrics, seed = null) {
  const [history, setHistory] = useState([]);
  const lastTimestamp = useRef(null);
  const seeded = useRef(false);

  // Apply the seed exactly once, only if we haven't started receiving
  // live data yet (avoids overwriting live points if seed arrives late).
  useEffect(() => {
    if (seed && seed.length > 0 && !seeded.current && history.length === 0) {
      seeded.current = true;
      setHistory(
        seed.map((snap) => ({
          time: new Date(snap.timestamp).toLocaleTimeString(),
          cpu: snap.cpu_usage,
          memory: snap.memory_usage,
          download: 0, // historical snapshots don't store speed, only totals
          upload: 0,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  if (metrics && metrics.timestamp !== lastTimestamp.current) {
    lastTimestamp.current = metrics.timestamp;

    const point = {
      time: new Date(metrics.timestamp).toLocaleTimeString(),
      cpu: metrics.cpu.usage_percent,
      memory: metrics.memory.usage_percent,
      download: +(metrics.network.download_speed_bps / 1024).toFixed(2),
      upload: +(metrics.network.upload_speed_bps / 1024).toFixed(2),
    };

    setHistory((prev) => [...prev, point].slice(-MAX_POINTS));
  }

  return history;
}