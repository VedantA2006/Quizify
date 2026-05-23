import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const res = await adminAPI.getFeatureFlags(); setFlags(res.data.flags); }
      catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const toggle = async (key, enabled) => {
    try {
      await adminAPI.updateFeatureFlag(key, { enabled: !enabled });
      setFlags(f => f.map(flag => flag.key === key ? { ...flag, enabled: !enabled } : flag));
      toast.success(`${key} ${!enabled ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold">Feature Flags</h1>
      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div> : (
        <div className="space-y-3">
          {flags.map((f) => (
            <div key={f.key} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{f.key}</p>
                <p className="text-xs text-surface-400">{f.description}</p>
              </div>
              <button onClick={() => toggle(f.key, f.enabled)} className="p-1">
                {f.enabled ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-surface-300" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
