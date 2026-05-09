"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const salesData = [
  { d: "Lun", ventas: 0, visitas: 45 },
  { d: "Mar", ventas: 0, visitas: 62 },
  { d: "Mié", ventas: 0, visitas: 78 },
  { d: "Jue", ventas: 0, visitas: 55 },
  { d: "Vie", ventas: 0, visitas: 90 },
  { d: "Sáb", ventas: 0, visitas: 120 },
  { d: "Dom", ventas: 0, visitas: 85 },
];

const contentData = [
  { d: "Lun", tiktok: 0, ig: 0, yt: 0, fb: 0 },
  { d: "Mar", tiktok: 0, ig: 0, yt: 0, fb: 0 },
  { d: "Mié", tiktok: 0, ig: 0, yt: 0, fb: 0 },
  { d: "Jue", tiktok: 0, ig: 0, yt: 0, fb: 0 },
  { d: "Vie", tiktok: 0, ig: 0, yt: 0, fb: 0 },
  { d: "Sáb", tiktok: 0, ig: 0, yt: 0, fb: 0 },
  { d: "Dom", tiktok: 0, ig: 0, yt: 0, fb: 0 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: "#1A2235", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "10px 14px", fontSize: 12
    }}>
      <p style={{ color: "#94A3B8", marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function SalesChart() {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A9EFF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4A9EFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gVisitas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#22C55E" fill="url(#gVisitas)" strokeWidth={2} />
          <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#4A9EFF" fill="url(#gVentas)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContentChart() {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={contentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="tiktok" name="TikTok" fill="#ff0050" radius={[3, 3, 0, 0]} />
          <Bar dataKey="ig" name="Instagram" fill="#E1306C" radius={[3, 3, 0, 0]} />
          <Bar dataKey="yt" name="YouTube" fill="#FF0000" radius={[3, 3, 0, 0]} />
          <Bar dataKey="fb" name="Facebook" fill="#1877F2" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
