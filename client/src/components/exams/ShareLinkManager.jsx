import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareLinkAPI } from '../../api';
import { 
  Share2, Copy, Check, QrCode, Trash2, ShieldAlert,
  Globe, Lock, Mail, ToggleLeft, ToggleRight, Calendar, Users, BarChart3, Plus, X, ArrowUpRight
} from 'lucide-react';

export default function ShareLinkManager({ examId, examTitle, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [showQrSlug, setShowQrSlug] = useState(null);
  const [showAnalyticsSlug, setShowAnalyticsSlug] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // New Link Form State
  const [label, setLabel] = useState('Main Link');
  const [type, setType] = useState('open');
  const [password, setPassword] = useState('');
  const [allowedEmailsText, setAllowedEmailsText] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [isUnlimitedUses, setIsUnlimitedUses] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Inline edit state
  const [editingSlug, setEditingSlug] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');

  // Fetch links
  const { data, isLoading } = useQuery({
    queryKey: ['shareLinks', examId],
    queryFn: () => shareLinkAPI.getForExam(examId),
    enabled: isOpen && !!examId
  });

  const links = data?.data?.links || [];

  // Create Link Mutation
  const createMutation = useMutation({
    mutationFn: (newLink) => shareLinkAPI.create(newLink),
    onSuccess: () => {
      queryClient.invalidateQueries(['shareLinks', examId]);
      setIsCreating(false);
      resetForm();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create share link');
    }
  });

  // Update Link Mutation
  const updateMutation = useMutation({
    mutationFn: ({ slug, payload }) => shareLinkAPI.update(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['shareLinks', examId]);
      setEditingSlug(null);
    }
  });

  // Delete Link Mutation
  const deleteMutation = useMutation({
    mutationFn: (slug) => shareLinkAPI.delete(slug),
    onSuccess: () => {
      queryClient.invalidateQueries(['shareLinks', examId]);
    }
  });

  // Fetch Analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['shareLinkAnalytics', showAnalyticsSlug],
    queryFn: () => shareLinkAPI.analytics(showAnalyticsSlug),
    enabled: !!showAnalyticsSlug
  });

  const analytics = analyticsData?.data || null;

  if (!isOpen) return null;

  const resetForm = () => {
    setLabel('Main Link');
    setType('open');
    setPassword('');
    setAllowedEmailsText('');
    setMaxUses('');
    setIsUnlimitedUses(true);
    setExpiresAt('');
    setUtmSource('');
    setErrorMsg('');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const allowedEmails = allowedEmailsText
      ? allowedEmailsText.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    if (type === 'invite_only' && allowedEmails.length === 0) {
      setErrorMsg('For Invite Only links, at least one whitelisted email is required.');
      return;
    }

    if (type === 'password' && !password) {
      setErrorMsg('A password is required for Password Protected links.');
      return;
    }

    createMutation.mutate({
      examId,
      label,
      type,
      password: type === 'password' ? password : null,
      maxUses: isUnlimitedUses ? null : Number(maxUses),
      expiresAt: expiresAt || null,
      allowedEmails,
      utmSource: utmSource || null
    });
  };

  const handleCopy = (slug, instructions = false) => {
    const url = `${window.location.origin}/e/${slug}`;
    const text = instructions
      ? `You are invited to take the exam "${examTitle}". Click the link below to start:\n${url}`
      : url;

    navigator.clipboard.writeText(text);
    setCopiedSlug(slug + (instructions ? '-inst' : ''));
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleToggleActive = (slug, currentActive) => {
    updateMutation.mutate({
      slug,
      payload: { isActive: !currentActive }
    });
  };

  const handleSaveLabel = (slug) => {
    if (!editingLabel.trim()) return;
    updateMutation.mutate({
      slug,
      payload: { label: editingLabel }
    });
  };

  const getExpiryStyle = (dateStr) => {
    if (!dateStr) return { text: 'Never expires', color: 'text-slate-500 bg-slate-50' };
    const diff = new Date(dateStr) - new Date();
    if (diff < 0) return { text: 'Expired', color: 'text-red-700 bg-red-50 border-red-100 border' };
    if (diff < 24 * 60 * 60 * 1000) return { text: 'Expires within 24h', color: 'text-red-600 bg-red-50 font-medium' };
    if (diff < 7 * 24 * 60 * 60 * 1000) return { text: `Expires in ${Math.round(diff / (24 * 3600000))} days`, color: 'text-amber-700 bg-amber-50 font-medium' };
    return { text: `Expires ${new Date(dateStr).toLocaleDateString()}`, color: 'text-slate-500 bg-slate-50' };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Share Exam: {examTitle}</h3>
              <p className="text-xs text-slate-500">Create public share links, whitelists, or secure access with passwords</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Expandable creation wizard */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/60 hover:bg-slate-50 border-b border-slate-100 transition-colors">
              <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                <Plus className={`w-4 h-4 text-primary-600 transition-transform ${isCreating ? 'rotate-45' : ''}`} />
                Create a Shareable Link
              </span>
              <span className="text-xs text-primary-600 font-medium">
                {isCreating ? 'Close Form' : 'Configure New link'}
              </span>
            </button>

            {isCreating && (
              <form onSubmit={handleCreate} className="p-5 space-y-4 bg-white border-t border-slate-100">
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Label */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Link Label / Purpose</label>
                    <input 
                      type="text" 
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      required
                      placeholder="e.g. Morning Batch, WhatsApp Share, LMS Link"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* UTM Source */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">UTM Source (Optional Campaign ID)</label>
                    <input 
                      type="text" 
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="e.g. whatsapp, email, telegram, teams"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Link Access Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Access Level</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${type === 'open' ? 'border-primary-500 bg-primary-50/20 ring-1 ring-primary-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="linkType" value="open" checked={type === 'open'} onChange={() => setType('open')} className="sr-only" />
                      <Globe className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-xs text-slate-800">🌐 Public / Open</p>
                        <p className="text-[10px] text-slate-500">Anyone with link joins</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${type === 'password' ? 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="linkType" value="password" checked={type === 'password'} onChange={() => setType('password')} className="sr-only" />
                      <Lock className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-semibold text-xs text-slate-800">🔒 Password Needed</p>
                        <p className="text-[10px] text-slate-500">Requires passcode to enter</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${type === 'invite_only' ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="linkType" value="invite_only" checked={type === 'invite_only'} onChange={() => setType('invite_only')} className="sr-only" />
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-xs text-slate-800">📋 Whitelisted Emails</p>
                        <p className="text-[10px] text-slate-500">Only matching email addresses</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Conditional Fields */}
                {type === 'password' && (
                  <div className="animate-in slide-in-from-top-1 duration-200">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Secure Passcode</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter a secret password for this link"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                )}

                {type === 'invite_only' && (
                  <div className="animate-in slide-in-from-top-1 duration-200">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Whitelisted Student Emails (Comma Separated)</label>
                    <textarea 
                      value={allowedEmailsText}
                      onChange={(e) => setAllowedEmailsText(e.target.value)}
                      required
                      rows={2}
                      placeholder="e.g. student1@univ.edu, student2@univ.edu, third@gmail.com"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                )}

                {/* Limit Enrollments & Expiry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Max uses */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Enrollment Cap / Max Uses</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={maxUses}
                        onChange={(e) => setMaxUses(e.target.value)}
                        disabled={isUnlimitedUses}
                        placeholder="e.g. 50"
                        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                        <input 
                          type="checkbox" 
                          checked={isUnlimitedUses} 
                          onChange={(e) => setIsUnlimitedUses(e.target.checked)} 
                          className="rounded text-primary-600 border-slate-300 focus:ring-primary-500" 
                        />
                        Unlimited (∞)
                      </label>
                    </div>
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Deactivation Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setIsCreating(false); resetForm(); }}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-md shadow-primary-500/20 disabled:bg-slate-300">
                    {createMutation.isPending ? 'Generating...' : 'Generate Shareable Link'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Active Links list */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span>Active Share Links ({links.length})</span>
            </h4>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : links.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg">
                <p className="text-sm text-slate-400">No active links created yet. Click above to configure one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {links.map((link) => {
                  const url = `${window.location.origin}/e/${link.slug}`;
                  const isCopied = copiedSlug === link.slug;
                  const isCopiedInst = copiedSlug === `${link.slug}-inst`;
                  const expiry = getExpiryStyle(link.expiresAt);

                  return (
                    <div key={link._id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col bg-white">
                      {/* Top banner summary */}
                      <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 gap-4 bg-slate-50/30">
                        <div className="flex-1 min-w-0">
                          {editingSlug === link.slug ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                className="text-sm border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500"
                              />
                              <button onClick={() => handleSaveLabel(link.slug)} className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-semibold">Save</button>
                              <button onClick={() => setEditingSlug(null)} className="px-2 py-1 border border-slate-200 rounded text-xs text-slate-500">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{link.label}</span>
                              <button onClick={() => { setEditingSlug(link.slug); setEditingLabel(link.label); }} className="text-[10px] text-primary-600 hover:underline">Rename</button>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">{url}</p>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {/* Type badge */}
                          {link.type === 'open' && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-200">🌐 Open</span>
                          )}
                          {link.type === 'password' && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded border border-amber-200">🔒 Passcode</span>
                          )}
                          {link.type === 'invite_only' && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded border border-blue-200">📋 Whitelist</span>
                          )}

                          {/* Expiry Badge */}
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${expiry.color}`}>
                            {expiry.text}
                          </span>

                          {/* Active Switch */}
                          <button 
                            onClick={() => handleToggleActive(link.slug, link.isActive)}
                            className="p-1 rounded hover:bg-slate-100">
                            {link.isActive ? (
                              <ToggleRight className="w-8 h-8 text-primary-600" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-300" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Middle summary stats */}
                      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 border-b border-slate-100 gap-4 text-slate-700 text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>Joined: <strong>{link.usedCount}</strong> {link.maxUses ? `/ ${link.maxUses} max` : 'students'}</span>
                        </div>
                        {link.utmSource && (
                          <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                            <span>Campaign Source: <strong>{link.utmSource}</strong></span>
                          </div>
                        )}
                        {link.maxUses && (
                          <div className="sm:col-span-1 flex flex-col justify-center">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary-600 h-full rounded-full" style={{ width: `${Math.min(100, (link.usedCount / link.maxUses) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom utility footer */}
                      <div className="px-5 py-3 flex justify-between items-center bg-slate-50/20 text-xs gap-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleCopy(link.slug)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {isCopied ? 'Copied Link' : 'Copy Link'}
                          </button>

                          <button 
                            onClick={() => handleCopy(link.slug, true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                            {isCopiedInst ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                            Share Instructions
                          </button>

                          <button 
                            onClick={() => setShowQrSlug(showQrSlug === link.slug ? null : link.slug)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                            <QrCode className="w-3.5 h-3.5" />
                            QR Code
                          </button>

                          <button 
                            onClick={() => setShowAnalyticsSlug(showAnalyticsSlug === link.slug ? null : link.slug)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Analytics
                          </button>
                        </div>

                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to deactivate this share link? This cannot be undone.')) {
                              deleteMutation.mutate(link.slug);
                            }
                          }}
                          className="p-1.5 border border-slate-200 hover:bg-red-50 hover:border-red-200 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* QR Popover Panel */}
                      {showQrSlug === link.slug && (
                        <div className="px-5 py-4 border-t border-slate-100 flex flex-col items-center bg-slate-50/40 animate-in slide-in-from-top-1">
                          <p className="text-xs text-slate-500 mb-3">Scan this code to jump directly into the exam</p>
                          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`} 
                              alt="Exam QR Code" 
                              className="w-[180px] h-[180px]"
                            />
                          </div>
                          <a 
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-3 text-xs text-primary-600 hover:underline flex items-center gap-1">
                            Download High-Res QR <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Analytics Popover Panel */}
                      {showAnalyticsSlug === link.slug && (
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 animate-in slide-in-from-top-1 space-y-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">Link Access Reports</span>
                            <span className="text-slate-400">Past 30 Days</span>
                          </div>
                          {analytics ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Joins</p>
                                  <p className="text-lg font-bold text-slate-800">{analytics.totalUses}</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                                  <p className="text-[10px] uppercase font-bold text-slate-400">Unique Students</p>
                                  <p className="text-lg font-bold text-slate-800">{analytics.uniqueStudents}</p>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">Daily Join Analytics:</div>
                              <div className="flex items-end gap-1 h-20 bg-white border border-slate-200 rounded-lg p-2.5">
                                {analytics.usesByDate?.map((d, index) => {
                                  const maxVal = Math.max(...analytics.usesByDate.map(x => x.count), 1);
                                  const height = `${(d.count / maxVal) * 100}%`;
                                  return (
                                    <div 
                                      key={index}
                                      style={{ height }}
                                      title={`${d.date}: ${d.count} joined`}
                                      className="flex-1 bg-primary-600 rounded-t hover:bg-primary-700 transition-all cursor-pointer"
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center items-center py-4">
                              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
}
