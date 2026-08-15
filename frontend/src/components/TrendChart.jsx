import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * Custom dot renderer: only draws a dot on the LAST point in the dataset
 * (the "live edge"), with a soft pulsing ring — makes it obvious where
 * "right now" is on the line without cluttering every single point.
 */
function LiveDot({ cx, cy, index, dataLength, color }) {
  if (index !== dataLength - 1) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.15}>
        <animate attributeName="r" values="6;12;6" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0;0.25" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={3} fill={color} />
    </g>
  );
}

export default function TrendChart({ title, data, dataKey, unit, color, domain }) {
  const gradientId = `gradient-${dataKey}`;

  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <p className="mb-3 font-sans text-xs uppercase tracking-wider text-muted">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#232937" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis
            domain={domain || [0, 100]}
            stroke="#7C8698"
            fontSize={11}
            width={36}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            contentStyle={{ background: "#171C27", border: "1px solid #232937", borderRadius: 6 }}
            labelStyle={{ color: "#7C8698", fontSize: 11 }}
            itemStyle={{ color: color, fontFamily: "IBM Plex Mono" }}
            formatter={(value) => [`${value}${unit}`, title]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={(props) => <LiveDot {...props} dataLength={data.length} color={color} />}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}