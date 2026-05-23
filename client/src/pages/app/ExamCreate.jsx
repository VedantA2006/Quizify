import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, aiAPI } from '../../api';
import { Save, ArrowLeft, Sparkles, Edit3, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamCreate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', subject: '', topics: '',
    duration: 60, totalMarks: 100, passingMarks: 40,
    instructions: '', negativeMarking: false, shuffleQuestions: false,
  });

  useEffect(() => {
    if (mode === 'ai' && aiLogs.length === 0) {
      setFetchingLogs(true);
      aiAPI.getHistory({ type: 'exam', limit: 20 })
        .then(res => setAiLogs(res.data.logs))
        .catch(err => toast.error('Failed to load AI history'))
        .finally(() => setFetchingLogs(false));
    }
  }, [mode]);

  const handleImportAi = async (logId) => {
    setLoading(true);
    try {
      const res = await examAPI.createFromAi({ logId });
      toast.success('Exam imported from AI!');
      navigate(`/app/exams/${res.data.exam._id}`);
    } catch (err) { toast.error(err.message || 'Import failed'); }
    finally { setLoading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    setLoading(true);
    try {
      const res = await examAPI.create({
        title: form.title,
        description: form.description,
        subject: form.subject,
        topics: form.topics.split(',').map(t => t.trim()).filter(Boolean),
        settings: {
          duration: form.duration,
          totalMarks: form.totalMarks,
          passingMarks: form.passingMarks,
          instructions: form.instructions,
          negativeMarking: form.negativeMarking,
          shuffleQuestions: form.shuffleQuestions,
        },
      });
      toast.success('Exam created!');
      navigate(`/app/exams/${res.data.exam._id}`);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost !p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-display font-bold">Create Exam</h1></div>
      </div>

      <div className="flex bg-surface-100 p-1 rounded-xl w-fit">
        <button onClick={() => setMode('manual')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'manual' ? 'bg-white shadow text-surface-900' : 'text-surface-600 hover:text-surface-900'}`}>
          <Edit3 className="w-4 h-4" /> Create Manually
        </button>
        <button onClick={() => setMode('ai')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'ai' ? 'bg-primary-600 shadow text-white' : 'text-surface-600 hover:text-surface-900'}`}>
          <Sparkles className="w-4 h-4" /> Import from AI Studio
        </button>
      </div>

      {mode === 'manual' ? (
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div><label className="block text-sm font-medium mb-1.5">Title *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className="input-field" placeholder="Midterm Exam 2024" /></div>
        <div><label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className="input-field" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Subject</label>
            <input value={form.subject} onChange={(e) => set('subject', e.target.value)} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Topics (comma-separated)</label>
            <input value={form.topics} onChange={(e) => set('topics', e.target.value)} className="input-field" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Duration (min)</label>
            <input type="number" value={form.duration} onChange={(e) => set('duration', parseInt(e.target.value))} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Total Marks</label>
            <input type="number" value={form.totalMarks} onChange={(e) => set('totalMarks', parseInt(e.target.value))} className="input-field" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Passing Marks</label>
            <input type="number" value={form.passingMarks} onChange={(e) => set('passingMarks', parseInt(e.target.value))} className="input-field" /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1.5">Instructions</label>
          <textarea value={form.instructions} onChange={(e) => set('instructions', e.target.value)} rows={3} className="input-field" placeholder="Enter exam instructions for students..." /></div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.negativeMarking} onChange={(e) => set('negativeMarking', e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-primary-600" />
            <span className="text-sm">Negative Marking</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => set('shuffleQuestions', e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-primary-600" />
            <span className="text-sm">Shuffle Questions</span>
          </label>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Exam'}
        </button>
      </form>
      ) : (
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg">Select AI Generated Exam</h2>
          <p className="text-surface-500 text-sm">Choose an exam previously generated in AI Studio to import.</p>
          
          {fetchingLogs ? (
            <div className="flex items-center justify-center p-8 text-surface-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : aiLogs.length === 0 ? (
            <div className="text-center p-8 text-surface-400 border border-dashed border-surface-200 rounded-xl">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No exams generated in AI Studio yet.</p>
              <button onClick={() => navigate('/app/ai-studio')} className="btn-ghost mt-4">Go to AI Studio</button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {aiLogs.map(log => (
                <div key={log._id} className="p-4 border border-surface-200 rounded-xl hover:border-primary-300 transition-colors flex justify-between items-center group">
                  <div>
                    <h3 className="font-semibold">{log.parsedOutput?.title || 'Untitled Exam'}</h3>
                    <p className="text-sm text-surface-500 mt-1 line-clamp-1">{log.parsedOutput?.description || 'No description'}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="badge-neutral text-xs">{new Date(log.createdAt).toLocaleDateString()}</span>
                      <span className="badge-primary text-xs">{log.parsedOutput?.subject || 'General'}</span>
                      <span className="badge-info text-xs">{log.parsedOutput?.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0} questions</span>
                    </div>
                  </div>
                  <button onClick={() => handleImportAi(log._id)} disabled={loading} className="btn-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import Exam'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
