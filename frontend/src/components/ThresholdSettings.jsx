import { useEffect, useState } from "react";
import { getThresholds, updateThresholds } from "../services/api";

export default function ThresholdSettings() {
  const [values, setValues] = useState({ cpu: 80, memory: 85, disk: 90 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getThresholds().then(setValues).catch(() => {});
  }, []);

  const handleChange = (key, val) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    await updateThresholds(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <p className="mb-3 font-sans text-xs uppercase tracking-wider text-muted">Alert Thresholds</p>
      <div className="flex flex-wrap items-end gap-4">
        {["cpu", "memory", "disk"].map((key) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase text-muted">{key}</span>
            <input
              type="number"
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-20 rounded-md border border-border bg-base px-2 py-1 font-mono text-sm text-primary focus:border-cyan focus:outline-none"
            />
          </label>
        ))}
        <button
          onClick={handleSave}
          className="rounded-md border border-border bg-panel-hover px-3 py-1.5 font-mono text-xs text-primary transition-colors hover:border-cyan"
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}