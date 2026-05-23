import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI, scheduleAPI } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, FileText, CheckCircle, Clock, 
  TrendingUp, ArrowUpRight, ArrowRight, Calendar, Brain, Loader2, Plus, Play, Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Dashboard Core Analytics
  const { data: statsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsAPI.getDashboard().then(res => res.data),
  });

  // Upcoming/Live student exams
  const { data: upcomingData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['upcomingExams'],
    queryFn: () => scheduleAPI.getUpcoming().then(res => res.data),
    enabled: user?.role === 'student'
  });

  const upcomingList = upcomingData?.upcoming || [];
  const liveNowExams = upcomingList.filter(u => u.status === 'live' || u.timeUntilStart === 0);
  const scheduledFutureExams = upcomingList.filter(u => u.status !== 'live' && u.timeUntilStart > 0);

  const getStats = () => {
    if (user?.role === 'student') {
      return [
        { label: 'Total Attempts', value: statsData?.totalAttempts || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Average Score', value: statsData?.avgScore ? `${statsData.avgScore}%` : '0%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Upcoming Slots', value: scheduledFutureExams.length, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
        { label: 'Live Assessments', value: liveNowExams.length, icon: Brain, color: 'text-amber-600', bg: 'bg-amber-50' },
      ];
    }
    return [
      { label: 'My Exams', value: statsData?.myExams || 0, icon: FileText, color: 'text-primary-600', bg: 'bg-primary-50' },
      { label: 'Questions Created', value: statsData?.myQuestions || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'AI Generations', value: statsData?.myGenerations || 0, icon: Brain, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Pending Evals', value: '3', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
  };

  const chartData = [
    { name: 'Mon', score: 65 },
    { name: 'Tue', score: 72 },
    { name: 'Wed', score: 68 },
    { name: 'Thu', score: 85 },
    { name: 'Fri', score: 78 },
    { name: 'Sat', score: 90 },
    { name: 'Sun', score: 88 },
  ];

  if (analyticsLoading || (user?.role === 'student' && schedulesLoading)) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  const stats = getStats();
  const recentItems = user?.role === 'student' ? statsData?.recentAttempts : statsData?.recentExams;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Upper header segment */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-xs text-slate-500 mt-0.5">Here's what is happening with your assessments and classrooms today.</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'student' ? (
            <Link to="/join" className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-2.5 px-4 shadow-lg shadow-emerald-500/25">
              <Plus className="w-4 h-4 animate-bounce" /> Join Exam Code
            </Link>
          ) : (
            <Link to="/app/ai-studio" className="btn-primary text-xs font-bold py-2.5 px-4">
              <Brain className="w-4 h-4" /> AI Studio
            </Link>
          )}
        </div>
      </div>

      {/* Live Exams Dashboard Banner */}
      {user?.role === 'student' && liveNowExams.length > 0 && (
        <div className="card p-6 bg-gradient-to-r from-red-600 to-amber-600 text-white border-none shadow-xl shadow-red-500/20 relative overflow-hidden animate-in zoom-in-95">
          <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-white/10 rounded-full blur-lg pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="bg-white/20 border border-white/10 text-[9px] font-black tracking-widest uppercase py-1 px-3 rounded-full animate-pulse inline-block">🔴 Live Assessment Available</span>
              <h2 className="text-xl font-black tracking-tight">{liveNowExams[0].exam?.title || 'Assessment Scheduled'}</h2>
              <p className="text-slate-100 text-xs max-w-xl">
                This exam is now live for your classroom <strong>{liveNowExams[0].class?.name || 'Classroom'}</strong>. Launch the secure sandbox.
              </p>
            </div>
            <button 
              onClick={() => navigate(`/e/${liveNowExams[0].shareLinkSlug}`)}
              className="px-6 py-3 bg-white text-red-600 hover:bg-slate-50 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 group transition-all shrink-0">
              <Play className="w-4 h-4 fill-red-600" /> Start Sandbox <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Student prompt card if no live exams */}
      {user?.role === 'student' && liveNowExams.length === 0 && (
        <div className="card p-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-none shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight">Ready for your next assessment?</h2>
              <p className="text-slate-100 text-xs">Enter your passcode or whitelisted access code to begin securely.</p>
            </div>
            <Link to="/join" className="btn-primary bg-white text-primary-600 hover:bg-slate-50 border-none !px-6 !py-2.5 font-bold shadow-md text-xs transition-transform hover:scale-[1.02]">
              Join Secure Session
            </Link>
          </div>
        </div>
      )}

      {/* Statistics widget grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +12%
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Dynamic schedules and Performance split */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Performance charts or upcoming list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Student upcoming schedules list */}
          {user?.role === 'student' && scheduledFutureExams.length > 0 && (
            <div className="card p-6 border border-slate-200/60 bg-white">
              <h2 className="font-bold text-slate-800 text-sm tracking-tight mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" /> Upcoming Assessments Timeline
              </h2>
              <div className="divide-y divide-slate-100">
                {scheduledFutureExams.map((s, idx) => (
                  <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500 tracking-wider">
                        {s.class?.name || 'Classroom'}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs mt-1">{s.exam?.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Subject: {s.exam?.subject || 'CS'} • {s.exam?.settings?.duration || 60} minutes</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 block">
                        {new Date(s.scheduledStart).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Starts: {new Date(s.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core performance analytics graph */}
          <div className="card p-6 border border-slate-200/60 bg-white">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-bold text-slate-800 text-sm tracking-tight">Performance Trends</h2>
              <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none outline-none rounded p-1.5 cursor-pointer">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent attempts / Exams list */}
        <div className="card p-6 border border-slate-200/60 bg-white flex flex-col">
          <h2 className="font-bold text-slate-800 text-sm tracking-tight mb-6">
            {user?.role === 'student' ? 'Recent Attempts' : 'Recent Exams'}
          </h2>
          <div className="space-y-4 flex-1">
            {recentItems?.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex flex-col items-center justify-center text-primary-700 shrink-0">
                  <span className="text-[9px] font-extrabold uppercase leading-none">
                    {new Date(item.createdAt).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-xs font-black leading-none mt-0.5">
                    {new Date(item.createdAt).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
                    {user?.role === 'student' ? item.exam?.title : item.title}
                  </p>
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {user?.role === 'student' ? `${item.score}% Score` : item.status}
                  </p>
                </div>
                <button className="p-2 text-slate-300 group-hover:text-slate-600"><ArrowUpRight className="w-4 h-4" /></button>
              </div>
            ))}
            {(!recentItems || recentItems.length === 0) && (
              <p className="text-center text-slate-400 text-xs py-10 font-semibold">No recent activity</p>
            )}
          </div>
          <button className="w-full btn-secondary mt-6 border-slate-200 text-xs font-bold py-2.5">View All Activity</button>
        </div>
      </div>

    </div>
  );
}
