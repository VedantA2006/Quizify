import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionAPI } from '../../api';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuestionCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: 'mcq', text: '', subject: '', topic: '', difficulty: 'medium',
    bloomLevel: 'understand', marks: 2, options: [
      { label: 'A', text: '', isCorrect: true },
      { label: 'B', text: '', isCorrect: false },
      { label: 'C', text: '', isCorrect: false },
      { label: 'D', text: '', isCorrect: false },
    ],
    correctAnswer: '', explanation: '', rubric: '', modelAnswer: '',
    estimatedTime: 2, tags: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addOption = () => {
    const label = String.fromCharCode(65 + form.options.length);
    setForm(f => ({ ...f, options: [...f.options, { label, text: '', isCorrect: false }] }));
  };

  const removeOption = (idx) => {
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) })) }));
  };

  const updateOption = (idx, key, val) => {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => {
        if (key === 'isCorrect') return { ...o, isCorrect: i === idx };
        return i === idx ? { ...o, [key]: val } : o;
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.text) return toast.error('Question text is required');
    if (form.type === 'mcq' && !form.options.some(o => o.isCorrect)) return toast.error('Select correct answer');
    setLoading(true);
    try {
      await questionAPI.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Question created!');
      navigate('/app/questions');
    } catch (err) { toast.error(err.message || 'Failed to create'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost !p-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-display font-bold">Create Question</h1>
          <p className="text-surface-500">Add a new question to your bank</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className="select-field">
              <option value="mcq">MCQ</option><option value="subjective">Subjective</option><option value="coding">Coding</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Difficulty</label>
            <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)} className="select-field">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bloom Level</label>
            <select value={form.bloomLevel} onChange={(e) => set('bloomLevel', e.target.value)} className="select-field">
              <option value="remember">Remember</option><option value="understand">Understand</option><option value="apply">Apply</option>
              <option value="analyze">Analyze</option><option value="evaluate">Evaluate</option><option value="create">Create</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Marks</label>
            <input type="number" value={form.marks} onChange={(e) => set('marks', parseInt(e.target.value) || 1)} className="input-field" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Subject</label>
            <input value={form.subject} onChange={(e) => set('subject', e.target.value)} className="input-field" placeholder="Data Structures" /></div>
          <div><label className="block text-sm font-medium mb-1.5">Topic</label>
            <input value={form.topic} onChange={(e) => set('topic', e.target.value)} className="input-field" placeholder="Sorting" /></div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Question Text *</label>
          <textarea value={form.text} onChange={(e) => set('text', e.target.value)} rows={3} className="input-field" placeholder="Enter your question..." />
        </div>

        {form.type === 'mcq' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">Options</label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="radio" name="correct" checked={opt.isCorrect}
                  onChange={() => updateOption(i, 'isCorrect', true)}
                  className="w-4 h-4 text-primary-600" />
                <span className="w-8 h-8 flex items-center justify-center bg-surface-100 rounded-lg text-sm font-medium">{opt.label}</span>
                <input value={opt.text} onChange={(e) => updateOption(i, 'text', e.target.value)}
                  className="input-field flex-1" placeholder={`Option ${opt.label}`} />
                {form.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="p-2 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {form.options.length < 6 && (
              <button type="button" onClick={addOption} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Add Option</button>
            )}
          </div>
        )}

        {form.type === 'subjective' && (
          <>
            <div><label className="block text-sm font-medium mb-1.5">Model Answer</label>
              <textarea value={form.modelAnswer} onChange={(e) => set('modelAnswer', e.target.value)} rows={3} className="input-field" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Rubric</label>
              <textarea value={form.rubric} onChange={(e) => set('rubric', e.target.value)} rows={2} className="input-field" /></div>
          </>
        )}

        <div><label className="block text-sm font-medium mb-1.5">Explanation</label>
          <textarea value={form.explanation} onChange={(e) => set('explanation', e.target.value)} rows={2} className="input-field" placeholder="Why is this the correct answer?" /></div>

        <div><label className="block text-sm font-medium mb-1.5">Tags (comma-separated)</label>
          <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className="input-field" placeholder="sorting, algorithms" /></div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          <Save className="w-4 h-4" /> {loading ? 'Creating...' : 'Create Question'}
        </button>
      </form>
    </div>
  );
}
