export default function SystemInfo({ system }) {
  const uptimeHours = (system.uptime_seconds / 3600).toFixed(1);

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-border bg-panel px-5 py-3 font-mono text-xs text-muted">
      <span><span className="text-primary">{system.hostname}</span></span>
      <span>{system.os}</span>
      <span>uptime {uptimeHours}h</span>
      <span>py {system.python_version}</span>
    </div>
  );
}