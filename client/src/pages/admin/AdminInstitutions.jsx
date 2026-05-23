import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { GraduationCap, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const res = await adminAPI.getInstitutions(); setInstitutions(res.data.institutions); }
      catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold">Institutions</h1>
      {institutions.length === 0 ? (
        <div className="card p-8 text-center text-surface-400"><GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No institutions</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50"><tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Created</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {institutions.map((i) => (
                <tr key={i._id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-medium text-sm">{i.name}</td>
                  <td className="px-4 py-3 text-sm"><span className="badge-info">{i.type}</span></td>
                  <td className="px-4 py-3 text-sm text-surface-500">{i.owner?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-surface-400">{new Date(i.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
