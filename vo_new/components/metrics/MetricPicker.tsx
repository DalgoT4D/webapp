import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { apiGet } from "@/lib/api";

interface Metric {
  id: string;
  name: string;
  description?: string;
}

interface MetricPickerProps {
  onSelect: (metric: Metric) => void;
  onCreate: () => void;
}

export const MetricPicker: React.FC<MetricPickerProps> = ({ onSelect, onCreate }) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiGet("/api/visualization/metrics")
      .then((data) => setMetrics(data))
      .catch((err) => setError(err.message || "Failed to fetch metrics"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={onCreate} className="mb-2 w-full">+ Create New Metric</Button>
      <div className="border rounded divide-y">
        {loading && <div className="p-3 text-muted-foreground">Loading metrics...</div>}
        {error && <div className="p-3 text-red-500">{error}</div>}
        {!loading && !error && metrics.length === 0 && (
          <div className="p-3 text-muted-foreground">No metrics found.</div>
        )}
        {!loading && !error && metrics.map((metric) => (
          <div key={metric.id} className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer">
            <div>
              <div className="font-medium">{metric.name}</div>
              {metric.description && <div className="text-xs text-muted-foreground">{metric.description}</div>}
            </div>
            <Button size="sm" onClick={() => onSelect(metric)}>Select</Button>
          </div>
        ))}
      </div>
    </div>
  );
}; 