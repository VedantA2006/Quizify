import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomAPI, scheduleAPI } from '../../api';
import { CalendarRange, X, ShieldAlert, CheckCircle2, Clock, Info, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ScheduleModal({ examId, examTitle, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [lateSubmissionWindow, setLateSubmissionWindow] = useState('30');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch faculty classrooms
  const { data: classroomsData, isLoading } = useQuery({
    queryKey: ['myClassrooms'],
    queryFn: () => classroomAPI.getAll(),
    enabled: isOpen
  });

  const classrooms = classroomsData?.data?.data?.classrooms || [];

  // Schedule Mutation
  const scheduleMutation = useMutation({
    mutationFn: (payload) => scheduleAPI.create(payload),
    onSuccess: () => {
      toast.success('Exam scheduled to classroom successfully!');
      queryClient.invalidateQueries(['shareLinks', examId]);
      queryClient.invalidateQueries(['classSchedules']);
      resetForm();
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to schedule exam');
    }
  });

  const resetForm = () => {
    setClassId('');
    setScheduledStart('');
    setScheduledEnd('');
    setAllowLateSubmission(false);
    setLateSubmissionWindow('30');
    setNotes('');
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!classId) return setErrorMsg('Please select a target classroom');
    if (!scheduledStart) return setErrorMsg('Scheduled start time is required');
    if (!scheduledEnd) return setErrorMsg('Scheduled end time is required');

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (start >= end) {
      return setErrorMsg('Scheduled start time must be chronologically before the end time.');
    }

    scheduleMutation.mutate({
      examId,
      classId,
      scheduledStart,
      scheduledEnd,
      timezone,
      notes,
      allowLateSubmission,
      lateSubmissionWindow: allowLateSubmission ? Number(lateSubmissionWindow) : 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-50 text-primary-600">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Schedule to Classroom</h3>
              <p className="text-xs text-slate-500">Assign "{examTitle}" to students in a specific batch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Classroom */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Classroom</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">-- Choose Classroom Batch --</option>
              {isLoading ? (
                <option disabled>Loading batches...</option>
              ) : classrooms.length === 0 ? (
                <option disabled>No active classrooms found. Create one first!</option>
              ) : (
                classrooms.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.coverEmoji || '📚'} {c.name} ({c.subject || 'Class'})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Scheduled Start</label>
              <input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Scheduled End</label>
              <input
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" /> Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500 font-mono"
            />
          </div>

          {/* Late Submissions Toggle */}
          <div className="border border-slate-100 p-4 rounded-xl space-y-3 bg-slate-50/30">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 block">Allow Late Submission</span>
                <span className="text-[10px] text-slate-400 block">Allow students to start or submit after the end time</span>
              </div>
              <input
                type="checkbox"
                checked={allowLateSubmission}
                onChange={(e) => setAllowLateSubmission(e.target.checked)}
                className="rounded text-primary-600 border-slate-300 focus:ring-primary-500"
              />
            </label>

            {allowLateSubmission && (
              <div className="flex items-center gap-2.5 animate-in slide-in-from-top-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">Late Grace Window:</span>
                <input
                  type="number"
                  value={lateSubmissionWindow}
                  onChange={(e) => setLateSubmissionWindow(e.target.value)}
                  min="1"
                  required
                  className="w-20 text-xs border border-slate-200 rounded-lg px-2 py-1 text-center font-bold"
                />
                <span className="text-xs text-slate-400 font-semibold">minutes</span>
              </div>
            )}
          </div>

          {/* Instructions Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Special Notes / Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Please join 10 minutes early. Sandbox camera tracking will be active."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
            />
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-extrabold shadow-md shadow-primary-500/25 disabled:bg-slate-200"
            >
              {scheduleMutation.isPending ? 'Scheduling...' : 'Lock Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
