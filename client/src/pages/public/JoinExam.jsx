import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { examAPI, attemptAPI } from '../../api';
import { Brain, ArrowRight, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function JoinExam() {
  const { code: urlCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState(urlCode || '');
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error('Enter an exam code');
    setLoading(true);
    try {
      const res = await examAPI.getByCode(code.trim().toUpperCase());
      setExam(res.data.exam);
    } catch {
      toast.error('Exam not found or not available');
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!user) {
      navigate(`/login?redirect=/join/${code}`);
      return;
    }
    try {
      setLoading(true);
      const res = await attemptAPI.start({ examId: exam._id, accessCode: code });
      toast.success('Starting exam...');
      navigate(`/exam/${res.data.attempt._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-accent-600/5" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">Quzify</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white mb-2">Join an Exam</h1>
          <p className="text-surface-400">Enter the exam code provided by your instructor</p>
        </div>

        {!exam ? (
          <form onSubmit={handleLookup} className="p-8 rounded-2xl bg-white/[0.05] border border-white/10 space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Exam Access Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="input-field !bg-white/5 !border-white/10 !text-white text-center text-xl font-mono tracking-[0.3em] !pl-10"
                  placeholder="ENTER CODE" maxLength={10} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'Looking up...' : 'Find Exam'}
            </button>
          </form>
        ) : (
          <div className="p-8 rounded-2xl bg-white/[0.05] border border-white/10 space-y-4">
            <h2 className="text-xl font-display font-bold text-white">{exam.title}</h2>
            <p className="text-surface-400 text-sm">{exam.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-surface-500 block text-xs">Subject</span>
                <span className="text-white font-medium">{exam.subject || 'General'}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-surface-500 block text-xs">Duration</span>
                <span className="text-white font-medium">{exam.settings?.duration || 60} min</span>
              </div>
            </div>
            <button onClick={handleJoin} className="btn-primary w-full !py-3 group">
              {user ? 'Start Exam' : 'Login to Start'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>
            <button onClick={() => setExam(null)} className="btn-ghost w-full text-surface-400">Try different code</button>
          </div>
        )}
      </div>
    </div>
  );
}
