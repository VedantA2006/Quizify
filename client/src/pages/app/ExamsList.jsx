import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examAPI } from '../../api';
import { 
  Plus, Search, Filter, MoreVertical, 
  Calendar, Users, Clock, CheckCircle2, 
  AlertCircle, ArrowRight, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamsList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchExams();
  }, [page]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await examAPI.getAll({ search, page, limit: 12 });
      setExams(res.data.exams);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExams();
  };


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all your scheduled exams.</p>
        </div>
        <Link to="/app/ai-studio" className="btn-primary">
          <Plus className="w-4 h-4" /> Create Assessment
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search exams, subjects..."
            className="input-field pl-10 h-10 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <button className="btn-secondary h-10 flex gap-2">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam._id} className="card group flex flex-col h-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    exam.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 
                    exam.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {exam.status}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-50"><MoreVertical className="w-4 h-4" /></button>
                </div>

                <Link to={`/app/exams/${exam._id}`} className="block group-hover:text-primary-600 transition-colors">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2 truncate">{exam.title}</h3>
                </Link>
                <div className="flex items-center gap-2 text-primary-600 text-xs font-bold mb-4 uppercase">
                  <BookOpen className="w-3.5 h-3.5" /> {exam.subject}
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{exam.settings?.startDate ? new Date(exam.settings.startDate).toLocaleDateString() : 'Not scheduled'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{exam.attendeesCount || 0} Registered</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{exam.duration || exam.settings?.duration} Minutes</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Code: <span className="text-slate-600">{exam.accessCode}</span>
                </div>
                <Link to={`/app/exams/${exam._id}`} className="text-primary-600 hover:text-primary-700 font-bold text-sm flex items-center gap-1 group/btn">
                  Manage <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm">Previous</button>
          <span className="px-4 py-2 text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</span>
          <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm">Next</button>
        </div>
      )}

    </div>
  );
}
