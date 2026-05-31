'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ExamsBySubjectRow } from '@/lib/api/reports';

interface ExamsBarChartProps {
  data: ExamsBySubjectRow[];
  height?: number;
}

export function ExamsBarChart({ data, height = 200 }: ExamsBarChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="maMon"
            tick={{ fontSize: 10, fill: '#475569' }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#475569' }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: 'rgba(14,165,233,0.06)' }}
            contentStyle={{
              borderRadius: 6,
              fontSize: 12,
              border: '1px solid #cbd5e1',
              boxShadow: 'none',
            }}
            formatter={(value) => [String(value), 'Đề thi']}
          />
          <Bar dataKey="soLuongDeThi" fill="#0EA5E9" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
