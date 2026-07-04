import React from 'react';

interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

interface CircleChartProps {
  data: ChartSlice[];
  size?: number;
  thickness?: number;
}

export const CircleChart: React.FC<CircleChartProps> = ({ 
  data, 
  size = 180, 
  thickness = 22 
}) => {
  const filteredData = data.filter(d => d.value > 0);
  const total = filteredData.reduce((acc, curr) => acc + curr.value, 0);
  
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center justify-center sm:flex-row gap-6">
      {/* SVG Ring Graph */}
      <div className="relative" style={{ width: size, height: size }}>
        {total > 0 ? (
          <svg width={size} height={size} className="transform -rotate-90">
            {filteredData.map((slice, index) => {
              const percentage = slice.value / total;
              const strokeDasharray = `${percentage * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              
              accumulatedPercent += percentage;

              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={thickness}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-in-out"
                />
              );
            })}
          </svg>
        ) : (
          /* Empty/Fallback Ring */
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth={thickness}
              className="dark:stroke-slate-800"
            />
          </svg>
        )}
        
        {/* Inner Label Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {total}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5">
        {filteredData.length > 0 ? (
          filteredData.map((slice, index) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <div key={index} className="flex items-center gap-2">
                {/* Dot */}
                <div 
                  className="w-3.5 h-3.5 rounded-md flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {slice.label}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">
                    ({slice.value} - {pct}%)
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-slate-400 dark:text-slate-500 italic">
            Aucune donnée à afficher
          </div>
        )}
      </div>
    </div>
  );
};
