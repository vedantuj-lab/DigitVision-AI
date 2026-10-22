import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ProbabilityChartProps {
  probabilities: number[];
  predictedDigit: number;
}

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({
  probabilities,
  predictedDigit
}) => {
  const chartData = probabilities.map((prob, idx) => ({
    digit: `Digit ${idx}`,
    digitLabel: `${idx}`,
    probability: Math.round(prob * 1000) / 10, // e.g. 98.4
    raw: prob,
    isPredicted: idx === predictedDigit
  }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-slate-300">Class Probability Distribution</span>
        <span className="font-mono text-slate-400 text-[11px]">Softmax Output (0–100%)</span>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="digitLabel"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#12141f] border border-white/10 rounded-lg p-2.5 shadow-xl text-xs font-mono">
                      <div className="text-white font-bold">{data.digit}</div>
                      <div className="text-lime-400 mt-1 font-semibold">
                        Probability: {data.probability.toFixed(1)}%
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Raw Softmax: {data.raw.toFixed(5)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isPredicted ? '#a3e635' : '#475569'}
                  className="transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible Text Alternative for Screen Readers */}
      <div className="sr-only">
        <table>
          <caption>Model prediction probabilities for digits 0 to 9</caption>
          <thead>
            <tr>
              <th>Digit</th>
              <th>Probability (%)</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((d) => (
              <tr key={d.digitLabel}>
                <td>{d.digitLabel}</td>
                <td>{d.probability}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
