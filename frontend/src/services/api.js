/**
 * api.js
 * ======
 * Thin wrapper around REST calls to the backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function fetchMetricsHistory(limit = 60) {
  const response = await fetch(`${API_BASE}/api/metrics/history?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.status}`);
  }
  return response.json();
}

export async function getThresholds() {
  const response = await fetch(`${API_BASE}/api/alerts/thresholds`);
  if (!response.ok) throw new Error(`Failed to fetch thresholds: ${response.status}`);
  return response.json();
}

export async function updateThresholds(thresholds) {
  const response = await fetch(`${API_BASE}/api/alerts/thresholds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(thresholds),
  });
  if (!response.ok) throw new Error(`Failed to update thresholds: ${response.status}`);
  return response.json();
}