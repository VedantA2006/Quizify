import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionAPI } from '../../api';
import { Plus, Search, Filter, BookOpen, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuestionsList() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', difficulty: '', subject: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await questionAPI.getAll({ ...filters, search, page, limit: 20 });
      setQuestions(res.data.questions);
      setPagination(res.pagination);
    } catch { toast.error('Failed to load questions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filters]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try { await questionAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const typeColor = { mcq: 'badge-primary', subjective: 'badge-warning', coding: 'badge-info' };
  const diffColor = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger', expert: 'badge-danger' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Question Bank</h1>
          <p className="text-surface-500">{pagination?.total || 0} questions</p>
        </div>
        <Link to="/app/questions/create" className="btn-primary"><Plus className="w-4 h-4" /> Add Question</Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..."
            className="input-field !pl-9" />
        </form>
        <select value={filters.type} onChange={(e) => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}
          className="select-field !w-auto">
          <option value="">All Types</option>
          <option value="mcq">MCQ</option><option value="subjective">Subjective</option><option value="coding">Coding</option>
        </select>
        <select value={filters.difficulty} onChange={(e) => { setFilters(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}
          className="select-field !w-auto">
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : questions.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <h3 className="font-semibold text-lg mb-1">No questions yet</h3>
          <p className="text-surface-400 mb-4">Start building your question bank</p>
          <Link to="/app/questions/create" className="btn-primary">Create First Question</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q._id} className="card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">{q.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={typeColor[q.type] || 'badge-neutral'}>{q.type}</span>
                  <span className={diffColor[q.difficulty] || 'badge-neutral'}>{q.difficulty}</span>
                  {q.subject && <span className="badge-neutral">{q.subject}</span>}
                  {q.topic && <span className="badge-neutral">{q.topic}</span>}
                  <span className="badge-info">{q.marks} marks</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleDelete(q._id)} className="p-2 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm">Previous</button>
          <span className="px-4 py-2 text-sm text-surface-500">Page {pagination.page} of {pagination.pages}</span>
          <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">Next</button>
        </div>
      )}
    </div>
  );
}
