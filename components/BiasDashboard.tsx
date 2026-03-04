
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { AnalysisResult } from '../types';
import { BIAS_COLORS } from '../constants';

interface BiasDashboardProps {
  data: AnalysisResult[];
}

const BiasDashboard: React.FC<BiasDashboardProps> = ({ data }) => {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const biasCounts = data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(biasCounts).map(([name, value]) => ({ name, value }));
    
    const timeData = data
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => ({
        date: new Date(item.timestamp).toLocaleDateString(),
        sensationalism: item.sensationalismScore,
        bias: Math.abs(item.biasScore)
      }));

    const avgSensationalism = Math.round(data.reduce((a, b) => a + b.sensationalismScore, 0) / data.length);
    const avgExtremeBias = Math.round(data.reduce((a, b) => a + Math.abs(b.biasScore), 0) / data.length);

    return { pieData, timeData, avgSensationalism, avgExtremeBias };
  }, [data]);

  if (!stats) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center">
        <div className="text-gray-400 mb-4">
          <i className="fas fa-chart-pie text-6xl opacity-20"></i>
        </div>
        <h3 className="text-lg font-medium text-gray-500">No data available for statistics yet.</h3>
        <p className="text-sm text-gray-400">Analyze your first article to see insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bias Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Bias Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BIAS_COLORS[entry.name as keyof typeof BIAS_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats.pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BIAS_COLORS[item.name as keyof typeof BIAS_COLORS] }}></div>
                <span className="text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sensationalism Trends */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Metric Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sensationalism" stroke="#8b5cf6" strokeWidth={2} name="Sensationalism" />
                <Line type="monotone" dataKey="bias" stroke="#f43f5e" strokeWidth={2} name="Extreme Bias (Abs)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium">Avg. Sensationalism</p>
              <h4 className="text-3xl font-bold mt-1">{stats.avgSensationalism}%</h4>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <i className="fas fa-fire text-xl"></i>
            </div>
          </div>
          <div className="mt-4 w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-white h-full" style={{ width: `${stats.avgSensationalism}%` }}></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-teal-100 text-sm font-medium">Avg. Bias Intensity</p>
              <h4 className="text-3xl font-bold mt-1">{stats.avgExtremeBias}/100</h4>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <i className="fas fa-balance-scale text-xl"></i>
            </div>
          </div>
          <div className="mt-4 w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="bg-white h-full" style={{ width: `${stats.avgExtremeBias}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiasDashboard;
