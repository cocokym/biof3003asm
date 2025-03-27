export interface RecordData {
  heartRate: {
    bpm: number;
    confidence: number;
  };
  hrv: {
    sdnn: number;
    confidence: number;
  };
  ppgData: number[];
  timestamp: Date;
}

export interface MetricsValue {
  bpm?: number;
  sdnn?: number;
  quality?: string;
}

interface MetricsCardProps {
  title: string;
  value: { [key: string]: number | string };
  unit: string;
  confidence?: number;
  className?: string; // Allow custom styles
}

export default function MetricsCard({
  title,
  value,
  unit,
  confidence,
  className = '', // Default to an empty string
}: MetricsCardProps) {
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-2xl font-semibold">
        {Object.values(value)[0]} {unit}
      </p>
      {confidence !== undefined && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Confidence: {confidence}%
        </p>
      )}
    </div>
  );
}
