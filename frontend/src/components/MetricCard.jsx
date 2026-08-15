import { useAnimatedNumber } from "../hooks/useAnimatedNumber";

const SEGMENTS = 24;

function getColor(percent) {
  if (percent >= 90) return "bg-crit";
  if (percent >= 70) return "bg-amber";
  return "bg-cyan";
}

function getGlow(percent) {
  if (percent >= 90) return "shadow-[0_0_16px_-4px_rgba(255,92,92,0.5)]";
  if (percent >= 70) return "shadow-[0_0_16px_-4px_rgba(255,180,84,0.5)]";
  return "shadow-[0_0_16px_-4px_rgba(79,209,232,0.4)]";
}

export default function MetricCard({ label, value, unit, percent, delay = 0 }) {
  const animatedPercent = useAnimatedNumber(percent);
  const filledSegments = Math.round((animatedPercent / 100) * SEGMENTS);
  const color = getColor(animatedPercent);

  return (
    <div
      className={`animate-fade-in-up rounded-lg border border-border bg-panel p-5 transition-shadow duration-500 hover:bg-panel-hover ${getGlow(animatedPercent)}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="font-sans text-xs uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-3xl font-semibold text-primary">{value}</span>
        <span className="font-mono text-sm text-muted">{unit}</span>
      </div>
      <div className="mt-4 flex gap-[3px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className={`h-4 flex-1 rounded-sm transition-colors duration-300 ${i < filledSegments ? color : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}