export default function ProcessTable({ processes }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <p className="mb-4 font-sans text-xs uppercase tracking-wider text-muted">Top Processes</p>
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="pb-2 font-normal">PID</th>
            <th className="pb-2 font-normal">Process</th>
            <th className="pb-2 font-normal text-right">CPU %</th>
            <th className="pb-2 font-normal text-right">Mem %</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => (
            <tr key={p.pid} className="border-b border-border/50 text-primary last:border-0">
              <td className="py-2 text-muted">{p.pid}</td>
              <td className="py-2">{p.name}</td>
              <td className="py-2 text-right text-cyan">{p.cpu_percent.toFixed(1)}</td>
              <td className="py-2 text-right">{p.memory_percent.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}