export default function ConnectionStatus({ status }) {
  const config = {
    open: { color: "bg-cyan", label: "LIVE", pulse: true },
    connecting: { color: "bg-amber", label: "CONNECTING", pulse: true },
    closed: { color: "bg-crit", label: "DISCONNECTED", pulse: false },
  }[status] || { color: "bg-muted", label: "UNKNOWN", pulse: false };

  return (
    <div className="flex items-center gap-2 font-mono text-xs tracking-wider">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-60`} />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`} />
      </span>
      <span className="text-muted">{config.label}</span>
    </div>
  );
}