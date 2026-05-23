import { useState } from 'react';
import { analyticsAPI } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, TrendingUp, Users, Clock, 
  Download, Filter, ChevronDown, ArrowUpRight,
  PieChart as PieChartIcon, Activity, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Cell, Pie
} from 'recharts';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  const { data: analyticsMode, isLoading } = useQuery({
    queryKey: ['institutionAnalytics'],
    queryFn: () => analyticsAPI.getInstitution().then(res => res.data),
  });

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  const { overview, examsByStatus, submissionTrend } = analyticsMode || {};

  const performanceData = [
    { name: 'Unit 1', avg: 72, highest: 95 },
    { name: 'Unit 2', avg: 68, highest: 88 },
    { name: 'Unit 3', avg: 85, highest: 100 },
    { name: 'Unit 4', avg: 77, highest: 92 },
    { name: 'Unit 5', avg: 81, highest: 98 },
  ];

  const distributionData = examsByStatus?.map((item, i) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count,
    color: ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#64748b'][i % 5]
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Insights</h1>
          <p className="text-slate-500 mt-1">Detailed performance metrics across all assessments.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex gap-2">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <div className="relative">
            <button className="btn-secondary flex gap-2">
              {timeRange} <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Submissions" value={overview?.totalAttempts || 0} trend="+14%" icon={Users} />
        <MetricCard label="Avg. Completion Time" value={`${overview?.avgCompletionTime || 0}m`} trend="-5%" icon={Clock} />
        <MetricCard label="Pass Rate" value={`${overview?.passRate || 0}%`} trend="+2%" icon={Activity} />
        <MetricCard label="Total Questions" value={overview?.totalQuestions || 0} trend="+12%" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" /> Unit Performance
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="avg" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Submission Volume
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={submissionTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="card p-6">
          <h2 className="font-bold text-slate-800 mb-6">Exam Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {distributionData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card p-6">
          <h2 className="font-bold text-slate-800 mb-6 font-display">Institution Overview</h2>
          <div className="space-y-6">
            {[
              { label: 'Total Exams', value: overview?.totalExams, color: 'bg-primary-500' },
              { label: 'Total Faculty', value: overview?.totalFaculty, color: 'bg-blue-500' },
              { label: 'Total Students', value: overview?.totalStudents, color: 'bg-emerald-500' },
              { label: 'AI Generations', value: overview?.aiGenerations, color: 'bg-amber-500' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="text-slate-900 font-bold">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} transition-all duration-1000`} 
                    style={{ width: `${Math.min((item.value / 100) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, icon: Icon }) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-0.5 ${
          trend.startsWith('+') ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
        }`}>
          {trend}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  );
}

