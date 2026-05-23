import { CheckCircle2, AlertCircle, Plus, Minus, ArrowRight } from 'lucide-react';

export default function VersionDiff({ oldVersion, newVersion }) {
  if (!oldVersion || !newVersion) return null;

  const compareSections = () => {
    const oldSecs = oldVersion.sections || [];
    const newSecs = newVersion.sections || [];
    
    // Simple diff logic for questions
    const diffs = [];
    
    // Check for title/description changes
    if (oldVersion.title !== newVersion.title) {
        diffs.push({ type: 'setting', label: 'Title', old: oldVersion.title, new: newVersion.title });
    }
    if (oldVersion.settings?.duration !== newVersion.settings?.duration) {
        diffs.push({ type: 'setting', label: 'Duration', old: `${oldVersion.settings?.duration}m`, new: `${newVersion.settings?.duration}m` });
    }

    // Question diffing
    const oldQs = oldSecs.flatMap(s => s.questions?.map(q => q.question?._id || q.question) || []);
    const newQs = newSecs.flatMap(s => s.questions?.map(q => q.question?._id || q.question) || []);

    const added = newQs.filter(id => !oldQs.includes(id));
    const removed = oldQs.filter(id => !newQs.includes(id));

    return { diffs, addedCount: added.length, removedCount: removed.length, sections: newSecs };
  };

  const { diffs, addedCount, removedCount } = compareSections();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Comparison Summary</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
               <Plus className="w-4 h-4" /> {addedCount} New Questions
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-red-600">
               <Minus className="w-4 h-4" /> {removedCount} Removed
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {diffs.map((d, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg text-sm">
            <span className="font-bold text-slate-500 min-w-[80px]">{d.label}</span>
            <span className="text-slate-400 line-through">{d.old}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-primary-600">{d.new}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-400 font-medium italic">
        * Detailed question-level diffing is available in the individual question view.
      </div>
    </div>
  );
}
