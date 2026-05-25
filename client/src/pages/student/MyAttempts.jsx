import { useState, useEffect } from 'react';
import { attemptAPI } from '../../api';
import { FileText, Clock, TrendingUp, CheckCircle, XCircle, Sparkles, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState(null);

  const handleGetFeedback = async (attemptId) => {
    setFeedbackModal({ attemptId, loading: true });
    try {
      const res = await attemptAPI.getFeedback(attemptId);
      setFeedbackModal({ attemptId, feedback: res.data.feedback, loading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to generate feedback');
      setFeedbackModal(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try { const res = await attemptAPI.getMine(); setAttempts(res.data.attempts); }
      catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">My Exams</h1>
        <p className="text-surface-500">{attempts.length} attempts</p>
      </div>

      {attempts.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <h3 className="font-semibold text-lg mb-1">No exams taken yet</h3>
          <p className="text-surface-400">Join an exam using an access code to get started</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {attempts.map((a) => (
            <div key={a._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{a.exam?.title || 'Exam'}</h3>
                  <p className="text-xs text-surface-400">{a.exam?.subject}</p>
                </div>
                <span className={`badge ${a.status === 'submitted' ? (a.percentage === null ? 'badge-warning' : 'badge-success') : a.status === 'in_progress' ? 'badge-warning' : 'badge-neutral'}`}>
                  {a.status === 'in_progress' ? 'In Progress' : (a.status === 'submitted' && a.percentage === null ? 'Pending Grading' : a.status)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-2 bg-surface-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary-500" />
                  <p className="text-lg font-bold">{a.percentage != null ? `${a.percentage}%` : '—'}</p>
                  <p className="text-xs text-surface-400">Score</p>
                </div>
                <div className="text-center p-2 bg-surface-50 rounded-lg">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-bold">{a.timeSpent ? `${Math.floor(a.timeSpent / 60)}m` : '—'}</p>
                  <p className="text-xs text-surface-400">Time</p>
                </div>
                <div className="text-center p-2 bg-surface-50 rounded-lg">
                  {a.percentage >= (a.exam?.settings?.passingMarks || 40) ? (
                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  ) : a.percentage != null ? (
                    <XCircle className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  ) : (
                    <Clock className="w-4 h-4 mx-auto mb-1 text-surface-400" />
                  )}
                  <p className="text-lg font-bold">
                    {a.percentage != null ? (a.percentage >= (a.exam?.settings?.passingMarks || 40) ? 'Pass' : 'Fail') : '—'}
                  </p>
                  <p className="text-xs text-surface-400">Result</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-surface-200">
                <p className="text-xs text-surface-400">
                  {a.submittedAt ? `Submitted: ${new Date(a.submittedAt).toLocaleDateString()}` : `Started: ${new Date(a.startedAt || a.createdAt).toLocaleDateString()}`}
                </p>
                {a.status === 'submitted' && a.percentage !== null && (
                  <button onClick={() => handleGetFeedback(a._id)} className="btn-secondary text-xs !py-1 !px-2 flex items-center gap-1 bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200">
                    <Sparkles className="w-3 h-3" /> AI Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 px-6 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-accent-50">
              <div className="flex items-center gap-2 text-primary-700">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-display font-bold text-lg">AI Performance Review</h2>
              </div>
              <button onClick={() => setFeedbackModal(null)} className="p-2 -mr-2 text-surface-400 hover:bg-surface-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {feedbackModal.loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-surface-500">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
                  <p className="font-medium animate-pulse">Analyzing your performance...</p>
                  <p className="text-sm mt-2">This may take a few moments</p>
                </div>
              ) : feedbackModal.feedback ? (
                <div className="space-y-6">
                  <div className="p-4 bg-primary-50 text-primary-900 rounded-xl leading-relaxed">
                    {feedbackModal.feedback.overall}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Strengths
                      </h3>
                      <ul className="space-y-2 text-sm text-emerald-700">
                        {feedbackModal.feedback.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                      <h3 className="font-semibold text-rose-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Areas to Improve
                      </h3>
                      <ul className="space-y-2 text-sm text-rose-700">
                        {feedbackModal.feedback.weaknesses?.map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-surface-50 border border-surface-200 rounded-xl">
                    <h3 className="font-semibold text-surface-800 mb-3">Actionable Recommendations</h3>
                    <ul className="space-y-2 text-sm text-surface-600">
                      {feedbackModal.feedback.recommendations?.map((r, i) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-red-500">Failed to load feedback. Please try again.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
