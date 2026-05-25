import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ChevronRight, Calendar, Users, Megaphone, CalendarCheck, History,
  Pin, Trash2, Plus, Sparkles, AlertCircle, ArrowLeft, ArrowRight,
  ClipboardList, UserMinus, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClassroomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('announcements'); // announcements, upcoming, past, members
  
  // Announcement posting form state
  const [announcementText, setAnnouncementText] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Fetch Classroom details
  const { data, isLoading, error } = useQuery({
    queryKey: ['classroomDetail', id],
    queryFn: () => classroomAPI.getOne(id),
    enabled: !!id
  });

  const classroom = data?.data?.classroom || null;
  const isFaculty = user?.role !== 'student';

  // Add Announcement Mutation
  const addAnnouncementMutation = useMutation({
    mutationFn: (payload) => classroomAPI.addAnnouncement(id, payload),
    onSuccess: () => {
      toast.success('Announcement posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['classroomDetail', id] });
      setAnnouncementText('');
      setIsPinned(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post announcement');
    }
  });

  // Remove Student Mutation
  const removeStudentMutation = useMutation({
    mutationFn: (studentId) => classroomAPI.removeStudent(id, studentId),
    onSuccess: () => {
      toast.success('Student removed from classroom.');
      queryClient.invalidateQueries({ queryKey: ['classroomDetail', id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    }
  });

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementText.trim()) return toast.error('Announcement text cannot be empty');
    addAnnouncementMutation.mutate({
      text: announcementText.trim(),
      isPinned
    });
  };

  const handleRemoveStudent = (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to remove ${studentName || 'this student'} from the classroom?`)) {
      removeStudentMutation.mutate(studentId);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-36 bg-slate-100 rounded-2xl" />
        <div className="flex gap-4"><div className="h-10 w-24 bg-slate-100 rounded-lg" /><div className="h-10 w-24 bg-slate-100 rounded-lg" /></div>
        <div className="h-60 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="font-bold text-slate-800 text-sm">Classroom Access Restressed</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
          You are not registered in this classroom batch or don't have authorization. Contact course faculty.
        </p>
        <Link to="/app/classrooms" className="inline-block mt-4 text-xs font-bold text-primary-600 hover:underline">
          Go back to hub
        </Link>
      </div>
    );
  }

  const upcomingExams = classroom.upcomingSchedules || [];
  const pastExams = classroom.pastSchedules || [];
  const announcements = classroom.announcements || [];
  const members = classroom.students || [];
  const instructors = classroom.faculty || [];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Back button & Subject */}
      <div className="flex items-center gap-3">
        <Link to="/app/classrooms" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide text-white" style={{ backgroundColor: classroom.color || '#0ea5e9' }}>
              {classroom.subject || 'COURSE'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{classroom.academicYear || 'Academic Year'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">{classroom.name}</h1>
        </div>
      </div>

      {/* Classroom stats cover block */}
      <div 
        className="p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${classroom.color || '#0ea5e9'} 0%, ${classroom.color || '#0ea5e9'}dd 100%)`
        }}>
        <div className="absolute right-[-40px] bottom-[-40px] w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-3xl">
            {classroom.coverEmoji || '📚'}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{classroom.subject} Classroom</h2>
            <p className="text-xs text-white/80 mt-1 max-w-md">{classroom.description || 'No classroom description added.'}</p>
          </div>
        </div>

        {/* Counts summary widgets */}
        <div className="flex items-center gap-6 relative z-10 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white/70" />
            <div>
              <span className="block text-[9px] uppercase font-bold text-white/60">Enrolled Students</span>
              <span className="font-bold text-sm">{members.length} {classroom.maxStudents ? `/ ${classroom.maxStudents}` : ''}</span>
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/20" />
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-white/70" />
            <div>
              <span className="block text-[9px] uppercase font-bold text-white/60">Assessments</span>
              <span className="font-bold text-sm">{upcomingExams.length + pastExams.length} scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Panels Selector */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { key: 'announcements', label: 'Announcements', icon: Megaphone },
          { key: 'upcoming', label: `Upcoming (${upcomingExams.length})`, icon: CalendarCheck },
          { key: 'past', label: 'Past Assessments', icon: History },
          { key: 'members', label: 'Students & Members', icon: Users }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                isActive 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Announcements Panel */}
      {activeTab === 'announcements' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in">
            {/* Announcement creation form for Instructors */}
            {isFaculty && (
              <form onSubmit={handlePostAnnouncement} className="card p-5 bg-white border border-slate-200/80 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Post Classroom Announcement</h4>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  required
                  rows={3}
                  placeholder="Share resources, notify students, or write general instructions here..."
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5"
                />
                
                <div className="flex justify-between items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded text-primary-600 border-slate-300 focus:ring-primary-500"
                    />
                    Pin announcement to top 📌
                  </label>

                  <button 
                    type="submit" 
                    disabled={addAnnouncementMutation.isPending}
                    className="btn-primary !py-2 !px-4 text-xs font-bold shadow-md shadow-primary-500/20">
                    {addAnnouncementMutation.isPending ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {announcements.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-xl">
                <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-400">No announcements posted in this classroom batch yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann, idx) => (
                  <div key={idx} className={`card p-5 border bg-white shadow-sm relative overflow-hidden transition-all ${
                    ann.isPinned ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200/60'
                  }`}>
                    {/* Pin banner */}
                    {ann.isPinned && (
                      <div className="absolute right-0 top-0 bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase py-1 px-2.5 rounded-bl border-l border-b border-amber-200 flex items-center gap-1">
                        <Pin className="w-3 h-3 shrink-0 text-amber-700" /> Pinned
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                        {ann.createdBy?.name?.charAt(0) || 'F'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-slate-800 text-xs">{ann.createdBy?.name || 'Faculty Instructor'}</span>
                          <span className="text-[10px] text-slate-400">{new Date(ann.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{ann.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side course details panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card p-5 bg-white border border-slate-200/60">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Class Instructors</h3>
              <div className="divide-y divide-slate-100">
                {instructors.map((ins) => (
                  <div key={ins._id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-xs">
                      {ins.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-snug">{ins.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{ins.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Upcoming Exams Panel */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4 max-w-3xl animate-fade-in">
          {upcomingExams.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-xl">
              <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-semibold">No upcoming assessments scheduled for this batch.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingExams.map((s) => {
                const now = new Date();
                const start = new Date(s.scheduledStart);
                const isLive = s.status === 'live' || (start <= now && new Date(s.scheduledEnd) > now);

                return (
                  <div key={s._id} className="card p-6 border border-slate-200/60 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          isLive ? 'bg-green-50 text-green-700 border border-green-200 animate-pulse' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isLive ? '🔴 LIVE NOW' : '📅 SCHEDULED'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">Duration: {s.exam?.settings?.duration || 60} mins</span>
                      </div>
                      
                      <h3 className="font-bold text-slate-800 text-sm tracking-tight">{s.exam?.title}</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Start: <strong>{new Date(s.scheduledStart).toLocaleString()}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <History className="w-4 h-4 text-slate-400" />
                          <span>Grace Grace Grace Grace Grace End: <strong>{new Date(s.scheduledEnd).toLocaleString()}</strong></span>
                        </div>
                      </div>

                      {s.notes && (
                        <p className="text-[11px] bg-slate-50 text-slate-500 py-1.5 px-3 rounded-lg border-l-2 border-primary-500">{s.notes}</p>
                      )}
                    </div>

                    {/* Launch or manage trigger */}
                    <div className="shrink-0 flex items-center">
                      {!isFaculty ? (
                        <button 
                          onClick={() => {
                            if (s.shareLink?.slug) {
                              navigate(`/e/${s.shareLink.slug}`);
                            } else {
                              toast.error('Invitation link not resolved yet. Contact administrator.');
                            }
                          }}
                          disabled={!isLive && !s.allowLateSubmission}
                          className={`btn-primary flex items-center gap-2 font-bold text-xs py-2.5 px-5 shadow-lg ${
                            isLive ? 'shadow-primary-500/20' : 'bg-slate-300 hover:bg-slate-300 text-slate-400 shadow-none cursor-not-allowed opacity-50'
                          }`}>
                          {isLive ? 'Launch Exam Sandbox' : 'Locked till Start Time'} <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="text-right">
                          <span className="text-slate-400 text-xs block mb-1 font-semibold">Self Join Invite Slug:</span>
                          <span className="font-mono text-xs font-bold bg-slate-100 py-1 px-2.5 rounded text-slate-700">/e/{s.shareLink?.slug || 'none'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Past Exams Panel */}
      {activeTab === 'past' && (
        <div className="space-y-4 max-w-3xl animate-fade-in">
          {pastExams.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 bg-white rounded-xl">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-400">No historical/past assessments completed in this batch.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastExams.map((s) => (
                <div key={s._id} className="card p-5 border border-slate-200/60 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">Completed</span>
                    <h3 className="font-bold text-slate-800 text-sm mt-1">{s.exam?.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Concluded on: {new Date(s.scheduledEnd).toLocaleString()}</p>
                  </div>
                  
                  {isFaculty && (
                    <div className="text-right shrink-0">
                      <span className="text-slate-500 font-bold text-xs">{s.attemptCount || 0} attempts completed</span>
                      <button onClick={() => navigate('/app/evaluations')} className="text-[10px] font-bold text-primary-600 hover:underline block mt-1">Grade Sandbox Code Attempts</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Whitelist Panel */}
      {activeTab === 'members' && (
        <div className="card bg-white border border-slate-200/60 overflow-hidden max-w-3xl animate-fade-in">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Registered Students Whitelist ({members.length})</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Students enrolled in this classroom can unlock all scheduled exams</p>
          </div>
          
          <div className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No students whitelisted in this batch yet. Share classroom code to enroll them.</div>
            ) : (
              members.map((student) => (
                <div key={student._id} className="p-4 flex items-center justify-between gap-4 group hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                      {student.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-snug">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{student.email}</p>
                    </div>
                  </div>

                  {isFaculty && (
                    <button 
                      onClick={() => handleRemoveStudent(student._id, student.name)}
                      className="p-1.5 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-300 hover:text-red-600 transition-all shrink-0"
                      title="De-enroll student from classroom">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
