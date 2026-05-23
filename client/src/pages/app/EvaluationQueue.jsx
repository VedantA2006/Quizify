import { useState, useEffect } from 'react';
import { examAPI, attemptAPI } from '../../api';
import { ClipboardCheck, User, TrendingUp, Clock, CheckCircle, XCircle, Sparkles, X, ChevronDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EvaluationQueue() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);

  useEffect(() => {
    const load = async () => {
      try { const res = await examAPI.getAll(); setExams(res.data.exams || []); }
      catch { toast.error('Failed to load exams'); }
      finally { setLoadingExams(false); }
    };
    load();
  }, []);

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    setAttempts([]);
    setLoadingAttempts(true);
    try {
      const res = await attemptAPI.getExamAttempts(exam._id);
      setAttempts(res.data.attempts || []);
    } catch { toast.error('Failed to load student results'); }
    finally { setLoadingAttempts(false); }
  };

  const handleGetFeedback = async (attemptId, studentName) => {
    setFeedbackModal({ attemptId, studentName, loading: true });
    try {
      const res = await attemptAPI.getFeedback(attemptId);
      setFeedbackModal({ attemptId, studentName, feedback: res.data.feedback, loading: false });
    } catch (err) {
      toast.error(err.message || 'Failed to generate feedback');
      setFeedbackModal(null);
    }
  };

  if (loadingExams) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Evaluation</h1>
        <p className="text-surface-500">View student results and generate AI-powered feedback</p>
      </div>

      {/* Exam Selector */}
      <div className="card p-4">
        <label className="text-xs font-semibold text-surface-500 mb-2 block">Select an Exam to View Results</label>
        <div className="relative">
          <select onChange={(e) => handleSelectExam(exams.find(x => x._id === e.target.value))} defaultValue=""
            className="select-field w-full appearance-none">
            <option value="" disabled>-- Choose an exam --</option>
            {exams.filter(e => e.status === 'published').map(e => (
              <option key={e._id} value={e._id}>{e.title} — {e.subject}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        </div>
      </div>

      {selectedExam && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg">{selectedExam.title}</h2>
            <span className="badge-info">{attempts.length} submissions</span>
          </div>

          {loadingAttempts ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
          ) : attempts.length === 0 ? (
            <div className="card p-12 text-center">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <h3 className="font-semibold text-lg mb-1">No submissions yet</h3>
              <p className="text-surface-400">No students have submitted this exam.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {attempts.map((attempt) => {
                const passed = attempt.percentage != null && attempt.percentage >= (selectedExam.settings?.passingMarks || 40);
                return (
                  <div key={attempt._id} className="card p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {attempt.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{attempt.student?.name || 'Student'}</p>
                        <p className="text-xs text-surface-400 truncate">{attempt.student?.email}</p>
                      </div>
                      <span className={`badge ${passed ? 'badge-success' : attempt.percentage != null ? 'badge-neutral' : 'badge-warning'}`}>
                        {attempt.percentage != null ? (passed ? 'Pass' : 'Fail') : 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-surface-50 rounded-xl p-3">
                      <div className="text-center">
                        <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary-500" />
                        <p className="text-base font-bold">{attempt.percentage != null ? `${attempt.percentage}%` : '—'}</p>
                        <p className="text-xs text-surface-400">Score</p>
                      </div>
                      <div className="text-center">
                        <Clock className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        <p className="text-base font-bold">{attempt.timeSpent ? `${Math.floor(attempt.timeSpent / 60)}m` : '—'}</p>
                        <p className="text-xs text-surface-400">Time</p>
                      </div>
                      <div className="text-center">
                        {passed ? <CheckCircle className="w-4 h-4 mx-auto mb-1 text-emerald-500" /> : <XCircle className="w-4 h-4 mx-auto mb-1 text-red-400" />}
                        <p className="text-base font-bold">{attempt.totalScore ?? '—'}/{attempt.maxScore ?? '—'}</p>
                        <p className="text-xs text-surface-400">Marks</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-surface-100">
                      <p className="text-xs text-surface-400">
                        {attempt.submittedAt ? `Submitted ${new Date(attempt.submittedAt).toLocaleDateString()}` : `Started ${new Date(attempt.startedAt || attempt.createdAt).toLocaleDateString()}`}
                      </p>
                      {attempt.status === 'submitted' && (
                        <button onClick={() => handleGetFeedback(attempt._id, attempt.student?.name)}
                          className="btn-secondary text-xs !py-1 !px-2 flex items-center gap-1 bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200">
                          <Sparkles className="w-3 h-3" /> AI Feedback
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 px-6 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-accent-50">
              <div className="flex items-center gap-2 text-primary-700">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h2 className="font-display font-bold text-lg">AI Feedback</h2>
                  <p className="text-xs text-primary-600">{feedbackModal.studentName}</p>
                </div>
              </div>
              <button onClick={() => setFeedbackModal(null)} className="p-2 -mr-2 text-surface-400 hover:bg-surface-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {feedbackModal.loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-surface-500">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
                  <p className="font-medium animate-pulse">Generating personalized feedback...</p>
                  <p className="text-sm mt-2">AI is analyzing the student's performance</p>
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
                    <h3 className="font-semibold text-surface-800 mb-3">Recommendations for Next Test</h3>
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
