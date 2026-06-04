import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ActivitySquare, AlertTriangle, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCases: 0,
    diseaseDistribution: [],
    heatmapData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/api/patients/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#facc15', '#10b981'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Patients', 
      value: stats.totalPatients, 
      icon: Users, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      glowHover: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.22)] hover:border-blue-500/40'
    },
    { 
      title: 'Active Cases', 
      value: stats.activeCases, 
      icon: AlertTriangle, 
      color: 'text-rose-400', 
      bg: 'bg-rose-500/10',
      glowHover: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.22)] hover:border-rose-500/40'
    },
    { 
      title: 'Recovery Rate', 
      value: stats.totalPatients ? Math.round(((stats.totalPatients - stats.activeCases) / stats.totalPatients) * 100) + '%' : '0%', 
      icon: TrendingUp, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      glowHover: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.22)] hover:border-emerald-500/40'
    },
    { 
      title: 'Unique Diseases', 
      value: stats.diseaseDistribution.length, 
      icon: ActivitySquare, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10',
      glowHover: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.22)] hover:border-purple-500/40'
    },
  ];

  const chartData = stats.diseaseDistribution.map(d => ({
    name: d._id,
    Count: d.count
  }));

  return (
    <div className="space-y-8 relative overflow-visible">
      {/* Sleek dashboard reveal style definitions */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dashboardReveal {
          0% { opacity: 0; transform: translateY(24px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-reveal {
          animation: dashboardReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Futuristic Deep Glow HUD Dots in the background */}
      <div className="bg-emerald-500/5 blur-[130px] rounded-full w-96 h-96 absolute -top-40 -left-40 pointer-events-none -z-10 animate-pulse animate-duration-[8000ms]" />
      <div className="bg-blue-500/5 blur-[130px] rounded-full w-96 h-96 absolute top-80 right-0 pointer-events-none -z-10 animate-pulse animate-duration-[10000ms]" />

      <div className="flex justify-between items-end animate-reveal opacity-0" style={{ animationDelay: '0ms' }}>
        <div>
          <h2 className="text-3xl font-black tracking-wider text-white mb-2 uppercase font-sans">
            Hospital Dashboard
          </h2>
          <p className="text-slate-400 text-sm font-semibold tracking-wide">Overview of patient statistics and health data</p>
        </div>
      </div>
      
      {/* Stat Cards with staggered reveal and glowing hover outlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-slate-800/90 transition-all duration-300 border border-slate-800/60 shadow-lg group select-none cursor-pointer animate-reveal opacity-0 ${card.glowHover}`}
              style={{ animationDelay: `${(idx + 1) * 100}ms` }}
            >
              <div className={`p-4 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${card.bg} ${card.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{card.title}</p>
                <p className="text-3xl font-black tracking-tight text-white">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section with staggered slide entrances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Disease Distribution Bar Chart */}
        <div 
          className="glass-panel p-6 rounded-2xl border border-slate-800/60 shadow-xl hover:shadow-[0_0_35px_rgba(59,130,246,0.06)] hover:border-blue-500/25 transition-all duration-500 animate-reveal opacity-0"
          style={{ animationDelay: '500ms' }}
        >
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]"></span>
            Disease Distribution
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: '11px', fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: '11px', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid rgba(255, 255, 255, 0.15)', borderRadius: '1rem', color: '#fff', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#60a5fa', fontSize: '12px', fontWeight: 700 }}
                  cursor={{ fill: 'rgba(51, 65, 85, 0.25)' }}
                />
                <Bar dataKey="Count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Disease Distribution Line Chart */}
        <div 
          className="glass-panel p-6 rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden flex flex-col hover:shadow-[0_0_35px_rgba(16,185,129,0.06)] hover:border-emerald-500/25 transition-all duration-500 animate-reveal opacity-0"
          style={{ animationDelay: '620ms' }}
        >
          <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
            Regional Disease Distribution
          </h3>
          <div className="h-80 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.regionStats || []} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.4)" vertical={false} />
                <XAxis dataKey="_id" stroke="#64748b" tick={{ fill: '#64748b', fontSize: '11px', fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: '11px', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1.5px solid rgba(255, 255, 255, 0.15)', borderRadius: '1rem', color: '#fff', backdropFilter: 'blur(12px)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '11px', fontWeight: 600 }} />
                <Line type="monotone" dataKey="cases" stroke="#3b82f6" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 8 }} name="cases" />
                <Line type="monotone" dataKey="active" stroke="#f43f5e" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 8 }} name="active" />
                <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 8 }} name="recovered" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
