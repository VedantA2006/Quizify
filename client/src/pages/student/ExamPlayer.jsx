import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptAPI } from '../../api';
import { 
  Clock, ChevronLeft, ChevronRight, Send, 
  AlertTriangle, Flag, CheckCircle, Play 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamPlayer() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [testResults, setTestResults] = useState({}); // { questionId: result }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await attemptAPI.getOne(attemptId);
        setAttempt(res.data.attempt);
        const existing = {};
        res.data.attempt.answers?.forEach(a => { existing[a.question] = a; });
        setAnswers(existing);
        const duration = res.data.attempt.exam?.settings?.duration || 60;
        const startTime = new Date(res.data.attempt.startedAt).getTime();
        const remaining = Math.max(0, Math.floor((startTime + duration * 60000 - Date.now()) / 1000));
        setTimeLeft(remaining);
      } catch { toast.error('Failed to load exam'); navigate('/app/dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, [attemptId]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || !attempt) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attempt]);

  const allQuestions = attempt?.exam?.sections?.flatMap(s => s.questions?.map(q => ({ ...q.question, sectionTitle: s.title, marks: q.marks || q.question?.marks }))) || [];

  const saveAnswer = useCallback(async (questionId, answerData) => {
    const merged = { ...answers, [questionId]: answerData };
    setAnswers(merged);
    try { await attemptAPI.saveAnswer(attemptId, { questionId, ...answerData }); }
    catch { /* silent save failure */ }
  }, [answers, attemptId]);

  const handleSubmit = async () => {
    if (submitting) return;
    // Removed native confirm to prevent browser blocking
    setSubmitting(true);
    try {
      await attemptAPI.submit(attemptId);
      navigate('/submission-success', { state: { examTitle: attempt?.exam?.title } });
    } catch (err) { toast.error(err.message || 'Submit failed'); setSubmitting(false); }
  };

  const handleRunTests = async (questionId, code) => {
    if (executing) return;
    setExecuting(true);
    try {
      const res = await attemptAPI.executeCode(attemptId, {
        questionId,
        code,
        language: 'javascript'
      });
      setTestResults(prev => ({ ...prev, [questionId]: res.data.result }));
      toast.success('Tests completed');
    } catch (err) {
      toast.error('Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!attempt || attempt.status === 'submitted') return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="card p-8 text-center">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
        <h2 className="font-display font-bold text-xl mb-2">Exam Already Submitted</h2>
        <button onClick={() => navigate('/app/dashboard')} className="btn-primary mt-4">Go to Dashboard</button>
      </div>
    </div>
  );

  const currentQuestion = allQuestions[currentQ];
  const answered = Object.keys(answers).length;
  const isTimeWarning = timeLeft < 300 && timeLeft > 0;

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Header */}
      <header className={`h-14 flex items-center justify-between px-4 shrink-0 border-b ${isTimeWarning ? 'bg-red-50 border-red-200' : 'bg-white border-surface-200'}`}>
        <div>
          <h1 className="font-display font-bold text-sm">{attempt.exam?.title}</h1>
          <p className="text-xs text-surface-400">{answered}/{allQuestions.length} answered</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${isTimeWarning ? 'bg-red-100 text-red-700 animate-pulse-soft' : 'bg-surface-100 text-surface-700'}`}>
          <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
        </div>
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm !py-1.5">
          <Send className="w-4 h-4" /> Submit
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentQuestion ? (
            <div className="max-w-3xl mx-auto animate-fade-in" key={currentQ}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-primary-100 text-primary-700 px-2 py-1 rounded-lg">Q{currentQ + 1}</span>
                  <span className="text-xs text-surface-400">{currentQuestion.sectionTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-info">{currentQuestion.marks} marks</span>
                  <button onClick={() => setFlagged(f => ({ ...f, [currentQuestion._id]: !f[currentQuestion._id] }))}
                    className={`p-1.5 rounded-lg ${flagged[currentQuestion._id] ? 'text-amber-500 bg-amber-50' : 'text-surface-400 hover:bg-surface-100'}`}>
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-lg font-medium mb-6 leading-relaxed">{currentQuestion.text}</p>

              {currentQuestion.type === 'mcq' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt) => {
                    const selected = answers[currentQuestion._id]?.selectedOption === opt.label;
                    return (
                      <button key={opt.label}
                        onClick={() => saveAnswer(currentQuestion._id, { selectedOption: opt.label })}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selected ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            selected ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600'
                          }`}>{opt.label}</div>
                          <span className="text-sm">{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'subjective' && (
                <textarea
                  value={answers[currentQuestion._id]?.textAnswer || ''}
                  onChange={(e) => saveAnswer(currentQuestion._id, { textAnswer: e.target.value })}
                  rows={8} className="input-field" placeholder="Write your answer here..."
                />
              )}

              {currentQuestion.type === 'coding' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Code Editor</span>
                    <button 
                      onClick={() => handleRunTests(currentQuestion._id, answers[currentQuestion._id]?.codeAnswer)}
                      disabled={executing || !answers[currentQuestion._id]?.codeAnswer}
                      className="btn-secondary !py-1 !px-3 !text-xs flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                    >
                      {executing ? <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /> : <Play className="w-3 h-3" />}
                      Run Tests
                    </button>
                  </div>
                  <textarea
                    value={answers[currentQuestion._id]?.codeAnswer || currentQuestion.starterCode || ''}
                    onChange={(e) => saveAnswer(currentQuestion._id, { codeAnswer: e.target.value, codeLanguage: 'javascript' })}
                    rows={12} 
                    className="w-full p-4 rounded-xl border-2 border-slate-200 font-mono text-sm focus:border-primary-500 focus:ring-0 transition-all bg-slate-900 text-slate-100" 
                    placeholder="// Write your solution here..."
                  />
                  
                  {testResults[currentQuestion._id] && (
                    <div className="card bg-slate-50 border-slate-200 overflow-hidden">
                      <div className="p-3 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Test Results</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          testResults[currentQuestion._id].overallPass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {testResults[currentQuestion._id].passedCount}/{testResults[currentQuestion._id].totalCount} Passed
                        </span>
                      </div>
                      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                        {testResults[currentQuestion._id].results.map((res, i) => (
                          <div key={i} className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                            res.status === 'passed' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                          }`}>
                            <div className="flex items-center gap-2">
                              {res.status === 'passed' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                              <span className="font-medium">Test Case #{i + 1}</span>
                            </div>
                            <span className="font-bold uppercase tracking-wider">{res.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
                  className="btn-secondary"><ChevronLeft className="w-4 h-4" /> Previous</button>
                {currentQ < allQuestions.length - 1 ? (
                  <button onClick={() => setCurrentQ(q => q + 1)} className="btn-primary">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
                    <Send className="w-4 h-4" /> Submit Exam
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-surface-400 mt-20">No questions available</div>
          )}
        </div>

        {/* Question Navigator */}
        <aside className="w-52 bg-white border-l border-surface-200 p-4 overflow-y-auto hidden md:block scrollbar-thin">
          <h3 className="text-xs font-medium text-surface-500 uppercase mb-3">Questions</h3>
          <div className="grid grid-cols-4 gap-2">
            {allQuestions.map((q, i) => {
              const isAnswered = !!answers[q._id];
              const isFlagged = flagged[q._id];
              const isCurrent = i === currentQ;
              return (
                <button key={i} onClick={() => setCurrentQ(i)}
                  className={`w-10 h-10 rounded-lg text-xs font-medium flex items-center justify-center transition-all relative ${
                    isCurrent ? 'bg-primary-600 text-white ring-2 ring-primary-300' :
                    isAnswered ? 'bg-emerald-100 text-emerald-700' :
                    'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}>
                  {i + 1}
                  {isFlagged && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full" />}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 text-xs text-surface-500">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-emerald-100" /> Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-surface-100" /> Unanswered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary-600" /> Current</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400" /> Flagged</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
