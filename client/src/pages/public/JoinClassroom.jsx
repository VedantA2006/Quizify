import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { classroomAPI } from '../../api';
import { Brain, ArrowRight, Sparkles, Building, BookOpen, Users, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function JoinClassroom() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    if (slug) {
      resolveInvite();
    }
  }, [slug]);

  const resolveInvite = async () => {
    setResolving(true);
    try {
      const res = await classroomAPI.resolveInvite(slug);
      setClassInfo(res.data.data);
    } catch (err) {
      toast.error('Classroom invitation link is invalid or expired');
    } finally {
      setResolving(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/join-class/${slug}`)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await classroomAPI.join({ inviteLink: slug });
      toast.success('Successfully joined the classroom!');
      navigate(`/app/classrooms/${res.data.classroom._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join classroom');
    } finally {
      setLoading(false);
    }
  };

  if (resolving) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Resolving classroom invitation...</p>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-white">Invalid Invitation</h2>
          <p className="text-slate-400 text-sm">This invitation link has expired, reached its enrollment limit, or does not exist.</p>
          <Link to="/" className="inline-block px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Premium Visual Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-slate-950 to-slate-900/10" />
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{ backgroundColor: classInfo.color || '#0ea5e9' }}
      />

      <div className="w-full max-w-md relative z-10 my-10">
        {/* Logo and Greeting */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">Quizify</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Classroom Invitation</h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">You have been invited to join this learning batch</p>
        </div>

        {/* Invitation Card */}
        <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md space-y-6">
          {/* Header Cover Emoji */}
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
              style={{ backgroundColor: `${classInfo.color || '#0ea5e9'}20`, border: `1px solid ${classInfo.color || '#0ea5e9'}40` }}>
              {classInfo.coverEmoji || '📚'}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">
                {classInfo.subject || 'Classroom Subject'}
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                {classInfo.name}
              </h2>
            </div>
          </div>

          {/* Description */}
          {classInfo.description && (
            <p className="text-slate-400 text-xs leading-relaxed border-t border-white/5 pt-4">
              {classInfo.description}
            </p>
          )}

          {/* Class Statistics Grid */}
          <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-slate-300">
            <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-center">
              <GraduationCap className="w-4 h-4 mx-auto text-primary-400 mb-1" />
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Faculty</span>
              <span className="text-xs font-bold">{classInfo.facultyCount || 0}</span>
            </div>
            
            <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-center">
              <Users className="w-4 h-4 mx-auto text-accent-400 mb-1" />
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Students</span>
              <span className="text-xs font-bold">{classInfo.studentCount || 0}</span>
            </div>

            <div className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-center">
              <Building className="w-4 h-4 mx-auto text-green-400 mb-1" />
              <span className="text-[9px] uppercase font-bold text-slate-500 block">Partner</span>
              <span className="text-[10px] font-bold text-slate-200 truncate block mt-0.5" title={classInfo.institution?.name}>
                {classInfo.institution?.name?.split(' ')[0] || 'Quizify'}
              </span>
            </div>
          </div>

          {/* Action Join Buttons */}
          <div className="pt-2">
            <button 
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-3.5 hover:scale-[1.01] bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 group transition-all disabled:opacity-50"
              style={{ boxShadow: `0 10px 15px -3px ${classInfo.color || '#0ea5e9'}20` }}>
              {user ? 'Accept Invitation & Enroll' : 'Login to Join Batch'} 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
