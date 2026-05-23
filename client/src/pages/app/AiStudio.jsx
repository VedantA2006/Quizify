import { useState, useRef, useEffect } from 'react';
import { aiAPI, examAPI } from '../../api';
import { 
  Sparkles, Send, Loader2, Copy, MessageSquare, Trash2, Edit2, X, Plus, 
  Paperclip, FileUp, Zap, HelpCircle, GripVertical, CheckCircle2, Brain,
  ShieldAlert, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function AiStudio() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  
  if (!user?.institution) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 border border-amber-100 shadow-sm">
          <Building2 className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Institution Required</h2>
        <p className="text-slate-500 max-w-md mb-8">
          The AI Studio features are currently restricted to users associated with an institution for billing and quota tracking. 
        </p>
        <div className="flex gap-4">
          <button className="btn-primary">Join an Institution</button>
          <button className="btn-secondary">Request Access</button>
        </div>
        <div className="mt-12 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 max-w-sm">
           <ShieldAlert className="w-4 h-4 inline mr-1 mb-0.5" />
           If you are an administrator, you can create a new institution from your profile settings.
        </div>
      </div>
    );
  }
  const [currentExam, setCurrentExam] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [syllabusText, setSyllabusText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSend = async () => {
    if (!prompt.trim()) return;
    const msg = prompt;
    const contextPrompt = syllabusText ? `${msg}\n\n[Syllabus/Context Provided]:\n${syllabusText.slice(0, 8000)}` : msg;
    
    setHistory(h => [...h, { role: 'user', content: msg, hasAttachement: !!syllabusText }]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await aiAPI.chatExam({ prompt: contextPrompt, currentExam });
      setSyllabusText('');
      setSyllabusFile(null);
      setCurrentExam(res.data);
      setHistory(h => [...h, { 
        role: 'assistant', 
        content: currentExam ? "I've updated the assessment based on your request!" : "I've generated a new assessment structure for you." 
      }]);
      if (!currentExam) toast.success('Generated!');
    } catch (err) {
      toast.error(err.message || 'Generation failed');
      setHistory(h => [...h, { role: 'assistant', content: 'Error: ' + (err.response?.data?.message || err.message) }]);
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSyllabusFile(file);
    const extractToast = toast.loading(`Uploading "${file.name}"...`);
    try {
      const res = await aiAPI.extractSyllabusText(file);
      setSyllabusText(res.data.text);
      toast.success(`Context extracted!`, { id: extractToast });
    } catch (err) {
      toast.error('Failed to extract text', { id: extractToast });
      setSyllabusFile(null);
    }
  };

  const handleSaveToExams = async () => {
    if (!currentExam) return;
    setLoading(true);
    const saveToast = toast.loading('Saving to exams...');
    try {
      await examAPI.saveAiDraft(currentExam);
      toast.success('Saved to Exams as draft!', { id: saveToast });
    } catch (err) {
      toast.error(err.message || 'Failed to save', { id: saveToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col -m-4 lg:-m-8">
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Sidebar */}
        <aside className="w-80 lg:w-96 flex flex-col bg-white border-r border-slate-200">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" /> AI Copilot
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-6">
                <Sparkles className="w-10 h-10 mb-4 opacity-20" />
                <p className="text-sm">Speak to our AI to generate or modify your assessment.</p>
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {m.content}
                  {m.hasAttachement && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] opacity-70 italic font-medium">
                      <Paperclip className="w-3 h-3" /> Syllabus attached
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-lg flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 space-y-3">
            {syllabusFile && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                <FileUp className="w-4 h-4 text-primary-600" />
                <span className="flex-1 truncate">{syllabusFile.name}</span>
                <button onClick={() => { setSyllabusFile(null); setSyllabusText(''); }}><X className="w-4 h-4" /></button>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message AI..."
                className="flex-1 min-h-[40px] max-h-32 p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                rows={1}
              />
              <button onClick={handleSend} disabled={loading || !prompt.trim()} className="btn-primary !p-2.5 h-fit self-end">
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
              <label className="flex items-center gap-1 hover:text-primary-600 cursor-pointer">
                <Paperclip className="w-3.5 h-3.5" /> Upload Syllabus
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <span>Shift + Enter for new line</span>
            </div>
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 bg-slate-50 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 lg:p-8">
            {!currentExam ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <Brain className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h1 className="text-xl font-bold text-slate-800">Ready to build?</h1>
                  <p className="text-sm text-slate-500 max-w-sm mt-2">Chat with our AI to generate a complete assessment structure from scratch or a syllabus.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button onClick={() => setPrompt('Create a 10-question quiz on JavaScript Basics')} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left group">
                    <p className="text-xs font-bold text-primary-600 mb-1">Quickstart</p>
                    <p className="text-sm font-medium text-slate-700">JS Fundamentals Quiz</p>
                  </button>
                  <button onClick={() => setPrompt('Generate a python coding assessment for beginners')} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left group">
                    <p className="text-xs font-bold text-primary-600 mb-1">Advanced</p>
                    <p className="text-sm font-medium text-slate-700">Python Coding Lab</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 space-y-2">
                    <input 
                      value={currentExam.title} 
                      onChange={(e) => setCurrentExam({...currentExam, title: e.target.value})}
                      className="text-3xl font-bold text-slate-900 bg-transparent border-none outline-none w-full border-b border-transparent focus:border-slate-300 transition-colors"
                      placeholder="Exam Title"
                    />
                    <textarea 
                      value={currentExam.description} 
                      onChange={(e) => setCurrentExam({...currentExam, description: e.target.value})}
                      className="text-sm text-slate-600 bg-transparent border-none outline-none w-full resize-none leading-relaxed"
                      placeholder="Add a description..."
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-3">
                     <div className="flex gap-2">
                       <button onClick={handleSaveToExams} disabled={loading} className="btn-primary !text-xs !py-1.5 flex items-center gap-2">
                         <Plus className="w-3.5 h-3.5" /> Save to Exams
                       </button>
                       <button onClick={() => { 
                         navigator.clipboard.writeText(JSON.stringify(currentExam, null, 2));
                         toast.success('Blueprint copied to clipboard!');
                       }} className="btn-secondary !text-xs !py-1.5 flex items-center gap-2">
                         <Copy className="w-3.5 h-3.5" /> Copy JSON
                       </button>
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded">
                       <span className="uppercase tracking-wider">Status:</span>
                       <span className="text-emerald-600">Blueprint Ready</span>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <StatInput label="Subject" value={currentExam.subject || ''} onChange={(v) => setCurrentExam({...currentExam, subject: v})} />
                  <StatInput label="Duration (min)" value={currentExam.duration || 60} type="number" onChange={(v) => setCurrentExam({...currentExam, duration: parseInt(v)||60})} />
                  <StatInput label="Total Questions" value={currentExam.sections?.reduce((a, s) => a + (s.questions?.length || 0), 0) || 0} readOnly />
                </div>

                <ExamPreview exam={currentExam} onUpdate={setCurrentExam} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatInput({ label, value, onChange, type="text", readOnly=false }) {
  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={readOnly ? null : (e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full text-sm font-semibold text-slate-800 bg-transparent border-none outline-none ${readOnly ? 'cursor-default' : 'focus:text-primary-600 transition-colors'}`}
      />
    </div>
  );
}

function ExamPreview({ exam, onUpdate }) {
  const [editingQ, setEditingQ] = useState(null);

  const deleteQuestion = (secIdx, qIdx) => {
    if (!window.confirm("Are you sure?")) return;
    const ex = { ...exam };
    ex.sections[secIdx].questions.splice(qIdx, 1);
    onUpdate(ex);
  };

  const updateQuestionField = (secIdx, qIdx, field, val) => {
    const ex = { ...exam };
    ex.sections[secIdx].questions[qIdx][field] = val;
    onUpdate(ex);
  };

  return (
    <div className="space-y-6">
      {exam.sections?.map((sec, secIdx) => (
        <div key={secIdx} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">{sec.title}</h3>
            <div className="h-[1px] flex-1 bg-slate-200" />
          </div>

          <div className="space-y-4">
            {sec.questions?.map((q, qIdx) => {
              const isEditing = editingQ?.secIndex === secIdx && editingQ?.qIndex === qIdx;
              const qLabel = `Question ${qIdx + 1}`;
              
              return (
                <div key={qIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded" title="Move"><GripVertical className="w-4 h-4" /></button>
                    {!isEditing && <button onClick={() => setEditingQ({ secIndex: secIdx, qIndex: qIdx })} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Edit2 className="w-4 h-4" /></button>}
                    <button onClick={() => deleteQuestion(secIdx, qIdx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded uppercase tracking-wider border border-primary-100">{qLabel}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider border border-slate-200">{q.type}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-auto uppercase tracking-tighter">{q.marks} Marks</span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-4 pt-2">
                        <textarea 
                          value={q.text} 
                          onChange={(e) => updateQuestionField(secIdx, qIdx, 'text', e.target.value)}
                          className="input-field h-24 font-medium"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
                            <select value={q.type} onChange={(e) => updateQuestionField(secIdx, qIdx, 'type', e.target.value)} className="select-field">
                              <option value="mcq">MCQ</option>
                              <option value="subjective">Subjective</option>
                              <option value="coding">Coding</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Weightage</label>
                            <input type="number" value={q.marks} onChange={(e) => updateQuestionField(secIdx, qIdx, 'marks', parseInt(e.target.value)||1)} className="input-field" />
                          </div>
                        </div>
                        <button onClick={() => setEditingQ(null)} className="btn-primary w-full shadow-none bg-slate-900 hover:bg-black rounded-lg py-2">Confirm Edit</button>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-lg font-semibold text-slate-800 leading-snug mb-4 pr-20">{String(q.text || '')}</h4>
                        
                        {q.type === 'mcq' && (
                          <div className="grid md:grid-cols-2 gap-3">
                            {q.options?.map((opt, oIdx) => (
                              <div key={oIdx} className={`p-3 rounded-lg border text-sm flex items-center gap-3 ${
                                opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                  opt.isCorrect ? 'border-emerald-500 bg-emerald-100' : 'border-slate-300 bg-white'
                                }`}>
                                  {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                                {String(opt.text || '')}
                              </div>
                            ))}
                          </div>
                        )}

                        {(q.type === 'coding' || q.type === 'subjective') && q.modelAnswer && (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mt-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{q.type === 'coding' ? 'Reference Code' : 'Model Answer'}</p>
                            <div className="font-mono text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                              {typeof q.modelAnswer === 'string' ? q.modelAnswer : JSON.stringify(q.modelAnswer, null, 2)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
