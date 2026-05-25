import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, Users, Sparkles, PlusCircle, Check, Copy, ArrowRight,
  BookOpen, PlusIcon, Compass, FolderOpen, CalendarRange
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLOR_PRESETS = ['#4f46e5', '#0ea5e9', '#0d9488', '#e11d48', '#d97706', '#7c3aed'];
const EMOJI_PRESETS = ['📚', '💻', '🔬', '🧠', '🎨', '🧪', '📊', '🌐'];

export default function Classrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [copiedCode, setCopiedCode] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Classroom creation form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [coverEmoji, setCoverEmoji] = useState(EMOJI_PRESETS[0]);
  const [maxStudents, setMaxStudents] = useState('');

  // Fetch classrooms list
  const { data, isLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => classroomAPI.getAll()
  });

  const classrooms = data?.data?.data?.classrooms || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload) => classroomAPI.create(payload),
    onSuccess: () => {
      toast.success('Classroom batch created successfully!');
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      setIsCreating(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create classroom');
    }
  });

  // Join Mutation
  const joinMutation = useMutation({
    mutationFn: (payload) => classroomAPI.join(payload),
    onSuccess: (res) => {
      toast.success(`Successfully enrolled in ${res.data.classroom?.name}!`);
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      setInviteCodeInput('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Invalid or expired invitation code');
    }
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setSubject('');
    setDepartment('');
    setColor(COLOR_PRESETS[0]);
    setCoverEmoji(EMOJI_PRESETS[0]);
    setMaxStudents('');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Classroom name is required');
    createMutation.mutate({
      name,
      description,
      subject,
      department: department || null,
      color,
      coverEmoji,
      maxStudents: maxStudents ? Number(maxStudents) : null
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return toast.error('Please enter an invitation code');
    joinMutation.mutate({ inviteCode: inviteCodeInput.trim().toUpperCase() });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isFaculty = user?.role !== 'student';

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classrooms & Batches</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage schedules, attendance, announcements, and classroom invitations</p>
        </div>

        {/* Dynamic upper right action */}
        {isFaculty ? (
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="btn-primary flex items-center gap-2 text-xs font-bold py-2.5 px-4 shadow-lg shadow-primary-500/20">
            <Plus className="w-4 h-4" /> Create Classroom
          </button>
        ) : (
          /* Student self enroll panel */
          <form onSubmit={handleJoin} className="flex items-center gap-2">
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="Enter Invitation Code (e.g. CS-X8F4)"
              className="text-xs font-bold font-mono tracking-wider border border-slate-200 rounded-lg px-3 py-2 bg-white w-56 focus:outline-none focus:border-primary-500"
            />
            <button 
              type="submit"
              disabled={joinMutation.isPending}
              className="btn-primary !py-2 !px-4 text-xs font-bold shadow-md">
              {joinMutation.isPending ? 'Enrolling...' : 'Join Class'}
            </button>
          </form>
        )}
      </div>

      {/* Classroom Creation Wizard Form */}
      {isCreating && (
        <div className="card p-6 border border-slate-200/80 bg-white animate-in slide-in-from-top-3 duration-300">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
            <h3 className="font-bold text-slate-800 text-sm">Create New Classroom Batch</h3>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="text-xs text-slate-400 hover:text-slate-600 font-semibold">Cancel</button>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Classroom Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Classroom Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. B.Tech Computer Science - Section A"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Course / Subject Code</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. CS-301 (Operating Systems)"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description about course objectives or batch requirements"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Enrollment Cap (Optional)</label>
                <input
                  type="number"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                  placeholder="e.g. 60 students max"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {/* Custom Emoji and Color Theming */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl">
              {/* Cover Emojis */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Class Emoji Cover</label>
                <div className="flex flex-wrap gap-2.5">
                  {EMOJI_PRESETS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCoverEmoji(emoji)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all ${
                        coverEmoji === emoji ? 'border-primary-500 bg-white ring-2 ring-primary-500/20 scale-105' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Branding Color</label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : 'hover:scale-[1.03]'
                      }`}>
                      {color === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => { setIsCreating(false); resetForm(); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-extrabold shadow-md shadow-primary-500/25">
                {createMutation.isPending ? 'Generating...' : 'Build Classroom'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classroom batches list */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
          <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-white max-w-lg mx-auto">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 text-sm">No Classrooms Available</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {isFaculty 
              ? "Create your first classroom batch using the create button to start scheduling secure exams."
              : "Enter the invitation code provided by your course faculty to enroll in a batch."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((c) => {
            const hasCap = !!c.maxStudents;
            const size = c.students?.length || 0;
            const capPercent = hasCap ? Math.min(100, (size / c.maxStudents) * 100) : 0;
            const isCodeCopied = copiedCode === c.inviteCode;

            return (
              <div 
                key={c._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-md transition-all flex flex-col group relative"
                style={{ borderTop: `4px solid ${c.color || '#0ea5e9'}` }}>
                
                {/* Upper banner section */}
                <div className="p-5 flex-1 space-y-4">
                  
                  {/* Emoji & Invite code header */}
                  <div className="flex justify-between items-start">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ backgroundColor: `${c.color || '#0ea5e9'}12` }}>
                      {c.coverEmoji || '📚'}
                    </div>

                    {/* Invitation Code for Faculty */}
                    {isFaculty && c.inviteCode && (
                      <button 
                        onClick={() => handleCopyCode(c.inviteCode)}
                        title="Copy Invitation Code"
                        className={`flex items-center gap-1 py-1 px-2 border rounded-lg text-[10px] font-extrabold tracking-wide font-mono transition-colors bg-white ${
                          isCodeCopied ? 'border-green-200 text-green-700 bg-green-50' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}>
                        {isCodeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {c.inviteCode}
                      </button>
                    )}
                  </div>

                  {/* Class Info */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 block mb-0.5">
                      {c.subject || 'COURSE'}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight leading-snug group-hover:text-primary-600 transition-colors">
                      {c.name}
                    </h3>
                  </div>

                  {/* Student Counter */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span><strong>{size}</strong> enrolled students</span>
                    </span>
                    {hasCap && (
                      <span className="text-[10px] font-bold text-slate-400">Cap: {c.maxStudents}</span>
                    )}
                  </div>

                  {/* Capacity progress bar */}
                  {hasCap && (
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ backgroundColor: c.color || '#0ea5e9', width: `${capPercent}%` }} />
                    </div>
                  )}
                </div>

                {/* Bottom link button */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-extrabold uppercase text-green-700 tracking-wider">Active</span>
                  </div>

                  {/* Navigation click action */}
                  <button 
                    onClick={() => navigate(`/app/classrooms/${c._id}`)}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline">
                    Enter Classroom <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
