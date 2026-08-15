import ConnectionStatus from "./ConnectionStatus";

export default function Navbar({ status }) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-panel px-6 py-4">
      {/* Signature element: a slow-moving gradient sweep behind the title,
          echoing an oscilloscope's scan line. Purely decorative, low
          opacity, doesn't compete with real data above it. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          background: "linear-gradient(90deg, transparent, #4FD1E8, transparent)",
          width: "40%",
          animation: "scanline 6s linear infinite",
        }}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted">REALTIME TELEMETRY</p>
          <h1 className="font-mono text-xl font-semibold tracking-tight text-primary">SYSTEM MONITOR</h1>
        </div>
        <ConnectionStatus status={status} />
      </div>
    </header>
  );
}