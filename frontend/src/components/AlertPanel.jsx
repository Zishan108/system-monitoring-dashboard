export default function AlertPanel({ alerts }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-panel p-5">
        <p className="font-sans text-xs uppercase tracking-wider text-muted">Alerts</p>
        <p className="mt-3 font-mono text-sm text-muted">No alerts yet — all metrics within thresholds.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <p className="mb-3 font-sans text-xs uppercase tracking-wider text-muted">Alerts</p>
      <div className="space-y-2">
        {alerts.map((alert, i) => {
          const isResolved = alert.severity === "resolved";
          return (
            <div
              key={`${alert.timestamp}-${i}`}
              className={`animate-fade-in-up flex items-center justify-between rounded-md border px-3 py-2 font-mono text-xs ${
                isResolved
                  ? "border-cyan/30 bg-cyan/5 text-cyan"
                  : "border-crit/30 bg-crit/5 text-crit"
              }`}
            >
              <span>{isResolved ? "✓" : "⚠"} {alert.message}</span>
              <span className="text-muted">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}