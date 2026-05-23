import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Shield, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const res = await adminAPI.getAuditLogs({ limit: 50 }); setLogs(res.data.logs); }
      catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold">Audit Logs</h1>
      {loading ? <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div> : logs.length === 0 ? (
        <div className="card p-8 text-center text-surface-400"><Shield className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No audit logs yet</p></div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log._id} className="card p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-surface-500" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{log.action}</p>
                <p className="text-xs text-surface-400">{log.user?.name || 'System'} · {log.details || ''}</p>
              </div>
              <span className="text-xs text-surface-400 flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
