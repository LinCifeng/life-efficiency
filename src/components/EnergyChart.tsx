"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export interface EnergySeries {
  label: string;
  color: string;
  scores: Array<number | null>;
}

export function EnergyChart({ series }: { series: EnergySeries[] }) {
  const data = Array.from({ length: 24 }, (_, h) => {
    const row: Record<string, number | string | null> = { hour: h };
    for (const s of series) {
      row[s.label] = s.scores[h] ?? null;
    }
    return row;
  });

  return (
    <div className="h-56 w-full" style={{ minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={160}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <XAxis
            dataKey="hour"
            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 23]}
            tick={{ fontSize: 10, fill: "#a79d8e" }}
            stroke="#e8e1d4"
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 5, 10]}
            tick={{ fontSize: 10, fill: "#a79d8e" }}
            stroke="#e8e1d4"
            tickLine={false}
          />
          <ReferenceLine y={5} stroke="#efeadf" strokeDasharray="2 4" />
          <Tooltip
            contentStyle={{
              background: "#fffefb",
              border: "1px solid #e8e1d4",
              borderRadius: 10,
              fontSize: 12,
              color: "#2b2621",
            }}
            labelFormatter={(h) => `${h}:00`}
          />
          {series.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#7a7065", paddingTop: 6 }}
              iconType="plainline"
            />
          )}
          {series.map((s) => (
            <Line
              key={s.label}
              type="monotone"
              dataKey={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
