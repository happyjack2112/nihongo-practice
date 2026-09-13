"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function DashboardChart({ data }: { data: { name: string; akurasi: number }[] }) {
  return (
    <div className="w-full h-44">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD2" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#7A756C" }} axisLine={{ stroke: "#E4DFD2" }} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#7A756C" }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E4DFD2" }} />
          <Bar dataKey="akurasi" fill="#6B7F66" radius={[6, 6, 0, 0]} barSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
