import { useEffect, useState } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMetricsHistory } from "../hooks/useMetricsHistory";
import { fetchMetricsHistory } from "../services/api";
import Navbar from "../components/Navbar";
import MetricCard from "../components/MetricCard";
import TrendChart from "../components/TrendChart";
import ProcessTable from "../components/ProcessTable";
import SystemInfo from "../components/SystemInfo";
import AlertPanel from "../components/AlertPanel";
import ThresholdSettings from "../components/ThresholdSettings";

const WS_URL = import.meta.env.VITE_WS_URL || "wss://127.0.0.1:8000/ws";

export default function Dashboard() {
  const { connectionStatus, lastMessage } = useWebSocket(WS_URL);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [historySeed, setHistorySeed] = useState(null);

  useEffect(() => {
    if (lastMessage) {
      try {
        const parsed = JSON.parse(lastMessage);
        if (parsed.type === "metrics") {
          setMetrics(parsed.data);
        } else if (parsed.type === "alert") {
          setAlerts((prev) => [parsed.data, ...prev].slice(0, 20));
        }
      } catch {
        // Ignore malformed frames.
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    fetchMetricsHistory(60)
      .then(setHistorySeed)
      .catch((err) => console.error("Failed to load history:", err));
  }, []);

  const history = useMetricsHistory(metrics, historySeed);

  if (!metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base font-mono text-muted">
        Waiting for first metrics frame…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <Navbar status={connectionStatus} />

      <main className="mx-auto max-w-6xl space-y-4 p-6">
        <SystemInfo system={metrics.system} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="CPU" value={metrics.cpu.usage_percent.toFixed(1)} unit="%" percent={metrics.cpu.usage_percent} delay={0} />
          <MetricCard label="Memory" value={metrics.memory.usage_percent.toFixed(1)} unit="%" percent={metrics.memory.usage_percent} delay={80} />
          <MetricCard label="Disk" value={metrics.disk.usage_percent.toFixed(1)} unit="%" percent={metrics.disk.usage_percent} delay={160} />
          <MetricCard
            label="Network ↓"
            value={(metrics.network.download_speed_bps / 1024).toFixed(1)}
            unit="KB/s"
            percent={Math.min((metrics.network.download_speed_bps / 1024 / 500) * 100, 100)}
            delay={240}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AlertPanel alerts={alerts} />
          <ThresholdSettings />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrendChart title="CPU Usage" data={history} dataKey="cpu" unit="%" color="#4FD1E8" />
          <TrendChart title="Memory Usage" data={history} dataKey="memory" unit="%" color="#FFB454" />
        </div>

        <TrendChart
          title="Network Throughput (KB/s down)"
          data={history}
          dataKey="download"
          unit=""
          color="#4FD1E8"
          domain={[0, "auto"]}
        />

        <ProcessTable processes={metrics.top_processes} />
      </main>
    </div>
  );
}