import { useState, useEffect } from 'react';
import { institutionAPI } from '../../api';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try { const res = await institutionAPI.getMembers({ role: filter }); setMembers(res.data.members); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Fill all fields');
    try { await institutionAPI.addMember(form); toast.success('Member added!'); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'student' }); load(); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this member?')) return;
    try { await institutionAPI.removeMember(id); toast.success('Removed'); load(); }
    catch { toast.error('Failed'); }
  };

  const roleColor = { faculty: 'badge-primary', evaluator: 'badge-warning', student: 'badge-info', institution_owner: 'badge-success' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-display font-bold">Members</h1><p className="text-surface-500">{members.length} members</p></div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary"><Plus className="w-4 h-4" /> Add Member</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="card p-6 space-y-4 animate-slide-up">
          <h3 className="font-semibold">Add New Member</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="input-field" />
            <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="input-field" />
            <input value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Password" className="input-field" type="password" />
            <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} className="select-field">
              <option value="student">Student</option><option value="faculty">Faculty</option><option value="evaluator">Evaluator</option>
            </select>
          </div>
          <div className="flex gap-2"><button type="submit" className="btn-primary">Add</button><button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button></div>
        </form>
      )}

      <div className="flex gap-2">
        {['', 'faculty', 'evaluator', 'student'].map(r => (
          <button key={r} onClick={() => setFilter(r)} className={`px-3 py-1.5 rounded-lg text-sm ${filter === r ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
            {r || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : members.length === 0 ? (
        <div className="card p-8 text-center text-surface-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No members found</p></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-50"><tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 uppercase">Role</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-surface-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {members.map((m) => (
                <tr key={m._id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 text-sm font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-surface-500">{m.email}</td>
                  <td className="px-4 py-3"><span className={roleColor[m.role] || 'badge-neutral'}>{m.role?.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => handleRemove(m._id)} className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
