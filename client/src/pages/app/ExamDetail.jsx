import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examAPI } from '../../api';
import { 
  Calendar, Clock, Users, Shield, 
  Settings, ChevronRight, Copy, Share2,
  AlertCircle, CheckCircle2, FileText, BarChart3,
  History, Eye, ArrowLeftRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import VersionDiff from '../../components/exams/VersionDiff';

export default function ExamDetail() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, questions, history
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await examAPI.getOne(id);
      setExam(res.data.exam);
    } catch (err) {
      toast.error('Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await examAPI.publish(id);
      setExam(res.data.exam);
      toast.success('Exam published successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish exam');
    }
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-slate-100 rounded-xl" />
    <div className="grid grid-cols-3 gap-6"><div className="h-24 bg-slate-100 rounded-xl" /><div className="h-24 bg-slate-100 rounded-xl" /><div className="h-24 bg-slate-100 rounded-xl" /></div>
  </div>;

  if (!exam) return <div className="text-center py-20"><p className="text-slate-500">Exam not found</p></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/app/exams" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-primary">{exam.subject}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{exam.status}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Settings className="w-4 h-4" /> Manage
          </button>
          {exam.status !== 'published' && (
            <button className="btn-primary" onClick={handlePublish}>
              Publish Exam
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {['overview', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={Calendar} label="Scheduled Date" value={exam.settings?.startDate ? new Date(exam.settings.startDate).toLocaleDateString() : 'Not Set'} />
            <StatCard icon={Clock} label="Duration" value={`${exam.settings?.duration || 0} Minutes`} />
            <StatCard icon={Users} label="Attendees" value={exam.attendeesCount || '0 Registered'} />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" /> Description
                </h2>
                <p className="text-slate-600 leading-relaxed">{exam.description || 'No description provided.'}</p>
              </div>

              <div className="card overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="font-bold text-slate-800">Assessment Structure</h2>
                  <span className="text-xs font-bold text-slate-400">{exam.sections?.length || 0} Sections</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {exam.sections?.map((section, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900">{section.title}</h3>
                        <span className="text-xs font-bold text-primary-600">{section.questions?.length || 0} Questions</span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">{section.instructions || 'Standard section instructions apply.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Exam Access Code</h3>
                  <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                    <span className="text-2xl font-black tracking-widest">{exam.accessCode}</span>
                    <button onClick={() => { navigator.clipboard.writeText(exam.accessCode); toast.success('Code copied!'); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-slate-400 group-hover:text-primary-600" />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-primary-700">Detailed Analytics</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-primary-600" /> Version History
                </h2>
                <div className="space-y-3">
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        !selectedVersion ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`} onClick={() => setSelectedVersion(null)}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Current Version</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Live Revision</p>
                            </div>
                            {!selectedVersion && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                        </div>
                    </div>
                    {exam.versions?.slice().reverse().map((v, i) => (
                        <div key={i} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedVersion?._id === v._id ? 'border-primary-500 bg-primary-50' : 'border-slate-100 bg-white hover:border-slate-200'
                        }`} onClick={() => setSelectedVersion(v)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">Version {exam.versions.length - i}</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">
                                        {new Date(v.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                                {selectedVersion?._id === v._id && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 card p-6">
                {selectedVersion ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <ArrowLeftRight className="w-5 h-5 text-primary-600" /> Comparison View
                            </h2>
                            <button className="btn-secondary !py-1 !px-3 !text-xs" onClick={() => setSelectedVersion(null)}>Reset</button>
                        </div>
                        <VersionDiff oldVersion={selectedVersion} newVersion={exam} />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 px-10">
                        <History className="w-12 h-12 text-slate-200 mb-4" />
                        <h3 className="font-bold text-slate-800">Select a version to compare</h3>
                        <p className="text-sm text-slate-500 mt-2">Pick an older version from the list on the left to see what changed in the current exam structure.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-6 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

