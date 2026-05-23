import { useState, useEffect } from 'react';
import { resourceAPI } from '../../api';
import { Upload, FolderOpen, Trash2, Download, Search, File, FileText, Image } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResourcesList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await resourceAPI.getAll({}); setResources(res.data.resources); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tags', JSON.stringify([]));
    setUploading(true);
    try { await resourceAPI.upload(formData); toast.success('Uploaded!'); load(); }
    catch (err) { toast.error(err.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resource?')) return;
    try { await resourceAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const getIcon = (mime) => {
    if (mime?.startsWith('image')) return Image;
    if (mime?.includes('pdf')) return FileText;
    return File;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-display font-bold">Resources</h1>
          <p className="text-surface-500">{resources.length} files</p></div>
        <label className="btn-primary cursor-pointer">
          <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload File'}
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.docx,.doc,.csv,.jpg,.jpeg,.png,.webp,.txt" />
        </label>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : resources.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <h3 className="font-semibold text-lg mb-1">No resources yet</h3>
          <p className="text-surface-400 mb-4">Upload PDFs, documents, or images for AI-grounded generation</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => {
            const Icon = getIcon(r.mimetype);
            return (
              <div key={r._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-surface-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.originalName}</p>
                    <p className="text-xs text-surface-400">{(r.size / 1024).toFixed(1)} KB</p>
                    <div className="flex gap-1 mt-2">
                      {r.useForAi && <span className="badge-primary text-xs">AI-enabled</span>}
                      {r.tags?.map((t, i) => <span key={i} className="badge-neutral text-xs">{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-3">
                  <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
