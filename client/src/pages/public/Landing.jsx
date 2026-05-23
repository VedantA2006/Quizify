import { Link } from 'react-router-dom';
import { Brain, Sparkles, BookOpen, BarChart3, Shield, Zap, ArrowRight, CheckCircle2, GraduationCap, Users, FileText } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'AI-Powered Generation', desc: 'Generate complete exams, questions, and rubrics using NVIDIA DeepSeek R1 AI in seconds.' },
  { icon: BookOpen, title: 'Smart Question Bank', desc: 'Organize thousands of questions with Bloom taxonomy tagging, difficulty levels, and quality scores.' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Track performance with score distributions, topic analysis, and completion metrics.' },
  { icon: Shield, title: 'Secure Assessments', desc: 'Access codes, scheduling, auto-save, and tamper-resistant exam delivery.' },
  { icon: Users, title: 'Multi-Role Platform', desc: 'Dedicated dashboards for admins, faculty, evaluators, and students.' },
  { icon: Zap, title: 'Instant Evaluation', desc: 'Auto-evaluate MCQs, manual scoring with rubrics, and one-click result publishing.' },
];

const steps = [
  { num: '01', title: 'Create Your Organization', desc: 'Set up your institution, departments, and invite your team.' },
  { num: '02', title: 'Build or Generate Content', desc: 'Use AI to generate exams from prompts, blueprints, or uploaded syllabi.' },
  { num: '03', title: 'Publish & Assess', desc: 'Share exam codes with students. They take exams with a modern player. You get results.' },
];

const stats = [
  { value: '100%', label: 'Free to Use' },
  { value: '5', label: 'User Roles' },
  { value: 'AI', label: 'Powered by DeepSeek R1' },
  { value: '∞', label: 'Exams & Questions' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Quzify</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-surface-400 hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-sm text-surface-400 hover:text-white transition">How It Works</a>
            <a href="#use-cases" className="text-sm text-surface-400 hover:text-white transition">Use Cases</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-surface-300 hover:text-white transition px-3 py-2">Log in</Link>
            <Link to="/register" className="btn-primary text-sm !py-2 !px-5">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-600/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary-600/20 to-accent-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" /> Powered by NVIDIA DeepSeek R1 AI
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            The Future of<br />
            <span className="bg-gradient-to-r from-primary-400 via-accent-400 to-primary-300 bg-clip-text text-transparent">
              AI Assessments
            </span>
          </h1>
          <p className="text-lg md:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create, deliver, and evaluate exams with AI-powered precision. Built for colleges, coaching institutes, and educators who demand excellence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base !py-3 !px-8 group">
              Start Building Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/join" className="btn-secondary text-base !py-3 !px-8 !bg-white/5 !border-white/10 !text-white hover:!bg-white/10">
              Join an Exam
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold gradient-text mb-1">{s.value}</div>
              <div className="text-sm text-surface-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-surface-400 text-lg max-w-xl mx-auto">A complete platform for creating, managing, and analyzing assessments at scale.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary-500/30 hover:bg-white/[0.05] transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 flex items-center justify-center mb-4 group-hover:from-primary-600/30 group-hover:to-accent-600/30 transition">
                  <f.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-surface-400 text-lg">Three simple steps to transform your assessment workflow.</p>
          </div>
          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.num} className="flex gap-6 items-start p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="font-display text-4xl font-bold gradient-text shrink-0">{s.num}</div>
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-surface-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Built For Everyone</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: GraduationCap, title: 'Colleges & Universities', desc: 'Department-wise exam management, secure delivery, and institutional analytics.' },
              { icon: BookOpen, title: 'Coaching Institutes', desc: 'AI-powered test series, question banks, and performance tracking.' },
              { icon: Users, title: 'Training Companies', desc: 'Employee assessments, certifications, and skill evaluation at scale.' },
              { icon: FileText, title: 'Independent Educators', desc: 'Quick exam creation, student management, and result tracking.' },
            ].map((uc) => (
              <div key={uc.title} className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center shrink-0">
                  <uc.icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{uc.title}</h3>
                  <p className="text-sm text-surface-400">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-accent-600/5" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Assessments?</h2>
              <p className="text-surface-300 mb-8">Start creating AI-powered exams today. It&apos;s completely free.</p>
              <Link to="/register" className="btn-primary text-lg !py-3 !px-10">Get Started Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-400" />
            <span className="font-display font-bold">Quzify</span>
          </div>
          <p className="text-sm text-surface-500">© 2024 Quzify. AI-Powered Assessment Platform. Free forever.</p>
        </div>
      </footer>
    </div>
  );
}
