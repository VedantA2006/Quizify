import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, PartyPopper } from 'lucide-react';

export default function SubmissionSuccess() {
  const { state } = useLocation();

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="card p-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="font-display text-2xl font-bold text-surface-900 mb-2">Exam Submitted!</h1>
          <p className="text-surface-500 mb-6">
            {state?.examTitle ? `Your answers for "${state.examTitle}" have been submitted successfully.` : 'Your exam has been submitted successfully.'}
          </p>
          <p className="text-sm text-surface-400 mb-8">You&apos;ll be notified when results are published.</p>
          <Link to="/app/dashboard" className="btn-primary">
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
