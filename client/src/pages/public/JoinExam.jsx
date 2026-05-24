import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { examAPI, attemptAPI, shareLinkAPI, examPreviewAPI } from '../../api';
import { Brain, ArrowRight, KeyRound, Clock, BookOpen, AlertCircle, Sparkles, Building, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function JoinExam() {
  const { code: urlCode, slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // General States
  const [code, setCode] = useState(urlCode || '');
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(false);
  const [resolvedLink, setResolvedLink] = useState(null);

  // Classic code exam state
  const [exam, setExam] = useState(null);

  // Passcode protected state
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (slug) {
      resolveShareLink();
    }
  }, [slug]);

  const resolveShareLink = async () => {
    setCheckingLink(true);
    try {
      const res = await shareLinkAPI.resolve(slug);
      setResolvedLink(res.data.link);
    } catch (err) {
      toast.error(err.message || 'Failed to resolve share link');
    } finally {
      setCheckingLink(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error('Enter an exam code');
    setLoading(true);
    try {
      const res = await examAPI.getByCode(code.trim().toUpperCase());
      setExam(res.data.exam);
    } catch {
      toast.error('Exam not found or not available');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      const redirectPath = slug ? `/e/${slug}` : `/join/${code}`;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    setLoading(true);
    try {
      if (slug) {
        // Share link resolution join flow
        const res = await shareLinkAPI.join(slug, { password });
        toast.success('Joined successfully! Preparing sandbox environment...');
        navigate(`/exam/${res.data.attempt._id}`);
      } else {
        // Classic code join flow
        const res = await attemptAPI.start({ examId: exam._id, accessCode: code });
        toast.success('Starting exam sandbox...');
        navigate(`/exam/${res.data.attempt._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access denied or whitelisting verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Resolving assessment invitation link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Dynamic Aesthetic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-slate-950 to-slate-900/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 my-10">
        
        {/* Logo Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Brain className="w-6 h-6 text-white animate-pulse" />
            </div>
            <span className="font-display font-bold text-2xl text-white tracking-tight">Quizify</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {resolvedLink ? 'Assessment Invitation' : 'Join an Exam'}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 font-medium">
            {resolvedLink 
              ? 'You have been invited to attempt this secure institutional exam' 
              : 'Enter the exam code provided by your instructor'
            }
          </p>
        </div>

        {/* Dynamic Card Area */}
        {resolvedLink ? (
          /* Share link invitation card */
          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md space-y-6">
            
            {/* Institution Badge */}
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 py-2 px-3 rounded-lg w-fit">
              <Building className="w-4 h-4 text-primary-400" />
              <span className="text-[11px] font-bold tracking-wide uppercase text-slate-300">
                {resolvedLink.institution?.name || 'Partner Institution'}
              </span>
            </div>

            {/* Title / Description */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-2">
                {resolvedLink.exam?.title || 'Loading Exam Title...'}
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                {resolvedLink.exam?.description || 'No exam description provided.'}
              </p>
            </div>

            {/* Quick Details Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary-400" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Subject</span>
                  <span className="text-xs font-bold text-slate-200">{resolvedLink.exam?.subject || 'Assessment'}</span>
                </div>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                <Clock className="w-5 h-5 text-accent-400" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Duration</span>
                  <span className="text-xs font-bold text-slate-200">{resolvedLink.exam?.settings?.duration || 60} Minutes</span>
                </div>
              </div>
            </div>

            {/* Passcode validation field if type is password */}
            {resolvedLink.type === 'password' && (
              <div className="space-y-2 p-4 bg-white/5 border border-white/5 rounded-xl animate-in slide-in-from-top-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" /> Secure Passcode Required
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret passcode to start"
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}

            {/* Whitelisted student notice if invite only */}
            {resolvedLink.type === 'invite_only' && (
              <div className="p-3.5 bg-blue-950/40 border border-blue-900/30 rounded-xl flex gap-3 text-xs text-blue-300">
                <AlertCircle className="w-5 h-5 shrink-0 text-blue-400" />
                <div>
                  <span className="font-bold text-blue-200 block mb-0.5">Whitelisted Registration Only</span>
                  You must join with the matching whitelisted email address on your Quizify account.
                </div>
              </div>
            )}

            {/* Join Action button */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={handleJoin} 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 group transition-all disabled:opacity-50">
                {user ? 'Enter Exam Sandbox' : 'Login to Join Exam'} 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        ) : (
          /* Classic Exam lookup card */
          <div className="space-y-6">
            {!exam ? (
              <form onSubmit={handleLookup} className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Exam Access Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      value={code} 
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3.5 text-center text-xl font-mono tracking-[0.3em] pl-11 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                      placeholder="ENTER CODE" 
                      maxLength={10} 
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs shadow-md transition-all">
                  {loading ? 'Finding Exam...' : 'Lookup Code'}
                </button>
              </form>
            ) : (
              <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md space-y-5">
                <h2 className="text-xl font-bold text-white tracking-tight">{exam.title}</h2>
                <p className="text-slate-400 text-xs leading-relaxed">{exam.description || 'No description provided.'}</p>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Subject</span>
                    <span className="text-slate-200 font-bold">{exam.subject || 'General'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Duration</span>
                    <span className="text-slate-200 font-bold">{exam.settings?.duration || 60} min</span>
                  </div>
                </div>

                <button onClick={handleJoin} disabled={loading} className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 group transition-all">
                  {user ? 'Start Exam' : 'Login to Start'} 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => setExam(null)} className="w-full text-slate-400 text-xs hover:underline block text-center font-medium">
                  Try different code
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
