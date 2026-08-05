interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, color = '#7B1E1E', height = 200, formatValue }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
          <div className="text-xs font-semibold text-maroon-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatValue ? formatValue(d.value) : d.value}
          </div>
          <div
            className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0', backgroundColor: color }}
          />
          <div className="text-xs text-maroon-500 mt-2 text-center truncate w-full">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export function LineChart({ data, color = '#7B1E1E', height = 200 }: LineChartProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const w = 100;
  const h = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((d.value - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * w;
          const y = h - ((d.value - min) / range) * h;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={color} vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <div key={i} className="text-xs text-maroon-500">{d.label}</div>
        ))}
      </div>
    </div>
  );
}
