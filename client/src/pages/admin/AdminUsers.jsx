import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { const res = await adminAPI.getUsers({ role: filter }); setUsers(res.data.users); }
      catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, [filter]);

  const roleColor = { super_admin: 'badge-danger', institution_owner: 'badge-success', faculty: 'badge-primary', evaluator: 'badge-warning', student: 'badge-info' };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold">All Users</h1>
      <div className="flex gap-2 flex-wrap">
        {['', 'super_admin', 'institution_owner', 'faculty', 'evaluator', 'student'].map(r => (
          <button key={r} onClick={() => setFilter(r)} className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === r ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
            {r ? r.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50"><tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Joined</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-medium text-sm">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-surface-500">{u.email}</td>
                  <td className="px-4 py-3"><span className={roleColor[u.role] || 'badge-neutral'}>{u.role?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-sm text-surface-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
