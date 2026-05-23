import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, FileText, CheckCircle, Clock, 
  TrendingUp, ArrowUpRight, Calendar, Brain, Loader2, Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsAPI.getDashboard().then(res => res.data),
  });

  const getStats = () => {
    if (user?.role === 'student') {
      return [
        { label: 'Total Attempts', value: statsData?.totalAttempts || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Average Score', value: `${statsData?.avgScore}%` || '0%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Upcoming Exams', value: '2', icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
        { label: 'Badges Earned', value: '5', icon: Brain, color: 'text-amber-600', bg: 'bg-amber-50' },
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

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  const stats = getStats();
  const recentItems = user?.role === 'student' ? statsData?.recentAttempts : statsData?.recentExams;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your assessments today.</p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'student' ? (
            <Link to="/join" className="btn-primary bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Join Exam
            </Link>
          ) : (
            <Link to="/app/ai-studio" className="btn-primary">
              <Brain className="w-4 h-4" /> AI Studio
            </Link>
          )}
        </div>
      </div>

      {user?.role === 'student' && (
        <div className="card p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Ready for your next assessment?</h2>
              <p className="text-emerald-50 text-sm">Enter your exam access code to begin your attempt safely.</p>
            </div>
            <Link to="/join" className="btn-primary bg-white text-emerald-600 hover:bg-emerald-50 !px-8 !py-3 font-bold border-none">
              Enter Exam Code
            </Link>
          </div>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +12%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-bold text-slate-800">Performance Trends</h2>
            <select className="text-sm font-medium text-slate-500 bg-slate-50 border-none outline-none rounded p-1">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <h2 className="font-bold text-slate-800 mb-6">
            {user?.role === 'student' ? 'Recent Attempts' : 'Recent Exams'}
          </h2>
          <div className="space-y-4 flex-1">
            {recentItems?.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex flex-col items-center justify-center text-primary-700 shrink-0">
                  <span className="text-[10px] font-bold uppercase leading-none">
                    {new Date(item.createdAt).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-sm font-black leading-none mt-0.5">
                    {new Date(item.createdAt).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary-600 transition-colors">
                    {user?.role === 'student' ? item.exam?.title : item.title}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 
                    {user?.role === 'student' ? `${item.score}% Score` : item.status}
                  </p>
                </div>
                <button className="p-2 text-slate-300 group-hover:text-slate-600"><ArrowUpRight className="w-4 h-4" /></button>
              </div>
            ))}
            {(!recentItems || recentItems.length === 0) && (
              <p className="text-center text-slate-400 text-sm py-10">No recent activity</p>
            )}
          </div>
          <button className="w-full btn-secondary mt-6 border-slate-200">View All Activity</button>
        </div>
      </div>
    </div>
  );
}

