import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { scheduleAPI } from '../../api';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
  ArrowRight, BookOpen, Sparkles, Building, AlertCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MySchedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar'); // calendar, list

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed for backend

  // Fetch calendar events
  const { data, isLoading } = useQuery({
    queryKey: ['myCalendar', year, month],
    queryFn: () => {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      return scheduleAPI.getCalendar(monthStr).then(res => res.data);
    },
    keepPreviousData: true
  });

  const groupedSchedules = data?.data || {};
  const schedules = Object.values(groupedSchedules).flat();

  // Helper: Get list of days in current month
  const getDaysInMonth = () => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const days = [];
    
    // Add empty slots for days before start of month
    const firstDayIndex = date.getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === currentDate.getMonth()) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInMonth();

  // Find schedules for a specific date
  const getSchedulesForDate = (date) => {
    if (!date) return [];
    return schedules.filter(s => {
      const sDate = new Date(s.scheduledStart);
      return sDate.getFullYear() === date.getFullYear() &&
             sDate.getMonth() === date.getMonth() &&
             sDate.getDate() === date.getDate();
    });
  };

  const activeSchedulesForSelectedDate = getSchedulesForDate(selectedDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Upper header segment */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Exam Schedule</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Track upcoming tests, grace windows, timezone allocations, and live sandboxes</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { key: 'calendar', label: 'Calendar Grid', icon: CalendarIcon },
          { key: 'list', label: 'Timeline List', icon: Clock }
        ].map(t => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                activeTab === t.key 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          
          {/* Left Grid Calendar */}
          <div className="lg:col-span-2 card p-6 border border-slate-200/60 bg-white">
            
            {/* Header controls */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wider">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1.5">
                <button onClick={prevMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days label header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-16 bg-slate-50/50 rounded-lg border border-transparent" />;
                
                const dateSchedules = getSchedulesForDate(day);
                const isSelected = selectedDate.getFullYear() === day.getFullYear() &&
                                   selectedDate.getMonth() === day.getMonth() &&
                                   selectedDate.getDate() === day.getDate();
                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`h-16 p-2 rounded-xl border text-left flex flex-col justify-between group transition-all relative ${
                      isSelected 
                        ? 'border-primary-600 bg-primary-50/10' 
                        : isToday 
                          ? 'border-slate-800 bg-slate-900 text-white shadow' 
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                    }`}>
                    <span className={`text-xs font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>{day.getDate()}</span>
                    
                    {/* Event Dots */}
                    {dateSchedules.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dateSchedules.slice(0, 3).map((s, sidx) => (
                          <span 
                            key={sidx} 
                            className="w-1.5 h-1.5 rounded-full block animate-pulse" 
                            style={{ backgroundColor: s.class?.color || '#0ea5e9' }}
                            title={s.exam?.title}
                          />
                        ))}
                        {dateSchedules.length > 3 && (
                          <span className="text-[7px] font-extrabold text-slate-400 leading-none">+{dateSchedules.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Selected Date details panel */}
          <div className="lg:col-span-1 card p-5 bg-white border border-slate-200/60 space-y-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Timeline Focus</span>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight leading-snug mt-0.5">
                {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
            </div>

            <div className="space-y-4">
              {activeSchedulesForSelectedDate.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-slate-200 mb-2" />
                  No assessments scheduled for this date.
                </div>
              ) : (
                activeSchedulesForSelectedDate.map((s) => {
                  const now = new Date();
                  const start = new Date(s.scheduledStart);
                  const isLive = s.status === 'live' || (start <= now && new Date(s.scheduledEnd) > now);

                  return (
                    <div 
                      key={s._id} 
                      className="p-4 rounded-xl border border-slate-200/60 bg-white space-y-3 relative group"
                      style={{ borderLeft: `4px solid ${s.class?.color || '#0ea5e9'}` }}>
                      <div>
                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide bg-slate-50 text-slate-500" style={{ color: s.class?.color }}>
                          {s.class?.name || 'Class Batch'}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs mt-1.5">{s.exam?.title}</h4>
                      </div>
                      
                      <div className="space-y-1 text-[10px] text-slate-500 font-medium">
                        <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Start: {new Date(s.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> End: {new Date(s.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      {/* Action buttons */}
                      <button 
                        onClick={() => navigate(`/e/${s.shareLink?.slug}`)}
                        className={`w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1`}>
                        Enter Assessment <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Timeline List view tab */
        <div className="space-y-4 max-w-3xl animate-fade-in">
          {schedules.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-xl">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-400">No scheduled exams loaded for this month.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((s) => {
                const now = new Date();
                const start = new Date(s.scheduledStart);
                const isLive = s.status === 'live' || (start <= now && new Date(s.scheduledEnd) > now);

                return (
                  <div key={s._id} className="card p-5 border border-slate-200/60 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: s.class?.color || '#0ea5e9' }}>
                          {s.class?.name || 'Class Batch'}
                        </span>
                        {isLive && <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-red-50 text-red-700 animate-pulse border border-red-200">🔴 LIVE</span>}
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs">{s.exam?.title}</h4>
                      
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold">
                        <span>Duration: {s.exam?.settings?.duration || 60} mins</span>
                        <span>•</span>
                        <span>Date: {new Date(s.scheduledStart).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button 
                        onClick={() => navigate(`/e/${s.shareLink?.slug}`)}
                        className="btn-primary !py-2 !px-4 text-xs font-bold shadow-sm">
                        Enter Exam <ArrowRight className="w-4 h-4 inline ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
