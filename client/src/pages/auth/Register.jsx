import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Brain } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', institutionName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.role === 'institution_owner' && !form.institutionName) return toast.error('Institution name is required');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-accent-600/5" />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">Quizify</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white mb-2">Create your account</h1>
          <p className="text-surface-400">Free forever. No credit card required.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
              className="input-field !bg-white/5 !border-white/10 !text-white" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className="input-field !bg-white/5 !border-white/10 !text-white" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
              className="input-field !bg-white/5 !border-white/10 !text-white" placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">I am a</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}
              className="select-field !bg-white/5 !border-white/10 !text-white">
              <option value="student">Student</option>
              <option value="faculty">Faculty / Teacher</option>
              <option value="institution_owner">Institution Owner</option>
            </select>
          </div>
          {form.role === 'institution_owner' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Institution Name</label>
              <input type="text" value={form.institutionName} onChange={(e) => set('institutionName', e.target.value)}
                className="input-field !bg-white/5 !border-white/10 !text-white" placeholder="Your University / Institute" />
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 !mt-6">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-surface-400 mt-6">
          Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
