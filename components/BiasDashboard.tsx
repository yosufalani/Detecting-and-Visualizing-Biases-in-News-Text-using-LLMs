import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from 'recharts';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

interface BiasDashboardProps {
  data: AnalysisResult[];
}

const DIRECTION_ORDER = ['Far Left', 'Left', 'Center', 'Right', 'Far Right'];

const StatCard = ({ label, value, sub, icon, gradient }: {
  label: string; value: string | number; sub?: string; icon: string; gradient: string;
}) => (
  <div className={`${gradient} p-5 rounded-2xl shadow-sm text-white`}>
    <div className="flex justify-between items-start mb-3">
      <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <div className="p-2 bg-white/20 rounded-lg">
        <i className={`fas ${icon} text-sm`} />
      </div>
    </div>
    <div className="text-3xl font-black">{value}</div>
    {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
  </div>
);

const BiasDashboard: React.FC<BiasDashboardProps> = ({ data }) => {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    // ── Direction distribution (pie)
    const directionCounts = data.reduce((acc, item) => {
      const cat = item.category || 'Center';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = DIRECTION_ORDER
      .filter(d => directionCounts[d])
      .map(name => ({ name, value: directionCounts[name] }));

    // ── Framing intensity distribution (bar)
    const framingBuckets = [0, 0, 0, 0, 0]; // scores 1-5
    data.forEach(item => {
      const score = Math.round(item.framingScore ?? 1);
      if (score >= 1 && score <= 5) framingBuckets[score - 1]++;
    });
    const framingBarData = framingBuckets.map((count, i) => ({
      label: `${i + 1}`,
      count,
      fill: i < 1 ? '#10b981' : i < 2 ? '#84cc16' : i < 3 ? '#f59e0b' : i < 4 ? '#f97316' : '#e11d48'
    }));

    // ── Trend over time
    const timeData = data
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((item, i) => ({
        index: i + 1,
        date: new Date(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        framing: item.framingScore ?? 0,
        sensationalism: item.sensationalismScore ?? 0,
        direction: Math.abs(item.biasScore ?? 0) / 20, // scale to 0-5
      }));

    // ── Radar: average across all bias dimensions
    const avg = (key: (item: AnalysisResult) => number) =>
      Math.round((data.reduce((s, d) => s + (key(d) || 0), 0) / data.length) * 10) / 10;

    const radarData = [
      { subject: 'Framing',       value: avg(d => d.framingScore ?? 0),        fullMark: 5 },
      { subject: 'Sensationalism',value: avg(d => d.sensationalismScore ?? 0),  fullMark: 5 },
      { subject: 'Direction',     value: avg(d => Math.abs(d.biasScore ?? 0) / 20), fullMark: 5 },
    ];

    // ── Summary stats
    const avgFraming        = avg(d => d.framingScore ?? 0);
    const avgSensationalism = avg(d => d.sensationalismScore ?? 0);
    const avgDirection      = avg(d => Math.abs(d.biasScore ?? 0));
    const highBiasCount     = data.filter(d => (d.framingScore ?? 0) >= 4).length;
    const neutralCount      = data.filter(d => (d.framingScore ?? 1) <= 2).length;

    // ── Top biased articles
    const topBiased = data
      .slice()
      .sort((a, b) => (b.framingScore ?? 0) - (a.framingScore ?? 0))
      .slice(0, 5)
      .map(item => ({
        title: item.title.length > 30 ? item.title.slice(0, 30) + '…' : item.title,
        framing: item.framingScore ?? 0,
        sensationalism: item.sensationalismScore ?? 0,
      }));

    return {
      pieData, framingBarData, timeData, radarData,
      avgFraming, avgSensationalism, avgDirection,
      highBiasCount, neutralCount, total: data.length,
      topBiased,
    };
  }, [data]);

  if (!stats) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
        <i className="fas fa-chart-pie text-6xl text-gray-200 mb-4" />
        <h3 className="text-lg font-medium text-gray-500">No data yet</h3>
        <p className="text-sm text-gray-400 mt-1">Analyze your first article to see insights here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Row 1: Summary stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Articles Analyzed" value={stats.total}
          sub="total in database" icon="fa-newspaper"
          gradient="bg-gradient-to-br from-slate-700 to-slate-900" />
        <StatCard label="Avg Framing Score" value={`${stats.avgFraming}/5`}
          sub="political framing intensity" icon="fa-balance-scale"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
        <StatCard label="Avg Sensationalism" value={`${stats.avgSensationalism}/5`}
          sub="emotional language level" icon="fa-fire"
          gradient="bg-gradient-to-br from-orange-500 to-rose-600" />
        <StatCard label="High Bias Articles" value={stats.highBiasCount}
          sub={`${Math.round(stats.highBiasCount / stats.total * 100)}% of total scored 4+`}
          icon="fa-exclamation-triangle"
          gradient="bg-gradient-to-br from-rose-500 to-red-700" />
      </div>

      {/* ── Row 2: Direction pie + Framing distribution bar ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Political Direction Distribution
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pieData} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}>
                  {stats.pieData.map((entry, i) => (
                    <Cell key={i} fill={BIAS_COLORS[entry.name as keyof typeof BIAS_COLORS] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} articles`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
            {stats.pieData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: BIAS_COLORS[item.name as keyof typeof BIAS_COLORS] ?? '#94a3b8' }} />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Framing Score Distribution
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.framingBarData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  label={{ value: 'Score (1=Neutral, 5=Extreme)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }}
                  allowDecimals={false} />
                <Tooltip formatter={(v: any) => [`${v} articles`, 'Count']} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.framingBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: Trend line + Radar ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Bias Trends Over Time
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }} interval="preserveStartEnd" />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                <Line type="monotone" dataKey="framing" stroke="#3b82f6" strokeWidth={2}
                  dot={{ r: 3 }} name="Framing" />
                <Line type="monotone" dataKey="sensationalism" stroke="#f97316" strokeWidth={2}
                  dot={{ r: 3 }} name="Sensationalism" />
                <Line type="monotone" dataKey="direction" stroke="#8b5cf6" strokeWidth={2}
                  strokeDasharray="4 2" dot={false} name="Direction (scaled)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Average Bias Profile
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={stats.radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject"
                  tick={{ fontSize: 11, fill: '#64748b' }} />
                <Radar name="Avg Score" dataKey="value" stroke="#3b82f6"
                  fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip formatter={(v: any) => [`${v}/5`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1">
            Average scores across all {stats.total} analyzed articles
          </p>
        </div>
      </div>

      {/* ── Row 4: Top biased articles ────────────────────────────── */}
      {stats.topBiased.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Most Biased Articles
          </h3>
          <div className="space-y-3">
            {stats.topBiased.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 truncate">{item.title}</div>
                  <div className="flex gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(item.framing / 5) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400">Framing {item.framing}/5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full"
                          style={{ width: `${(item.sensationalism / 5) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400">Sensationalism {item.sensationalism}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default BiasDashboard;