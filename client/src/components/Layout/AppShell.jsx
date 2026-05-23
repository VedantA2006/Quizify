import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Brain, FileText, Users,
  BarChart3, Settings, Shield, LogOut, Menu, X, Bell,
  GraduationCap, ClipboardCheck, ChevronDown, Sparkles
} from 'lucide-react';

const navItems = {
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Institutions', icon: GraduationCap, path: '/app/admin/institutions' },
    { label: 'Users', icon: Users, path: '/app/admin/users' },
    { label: 'Settings', icon: Settings, path: '/app/admin/settings' },
    { label: 'Analytics', icon: BarChart3, path: '/app/analytics' },
  ],
  institution_owner: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'AI Studio', icon: Sparkles, path: '/app/ai-studio' },
    { label: 'Exams', icon: FileText, path: '/app/exams' },
    { label: 'Evaluation', icon: ClipboardCheck, path: '/app/evaluations' },
    { label: 'Members', icon: Users, path: '/app/institution/members' },
    { label: 'Settings', icon: Settings, path: '/app/settings' },
  ],
  faculty: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'AI Studio', icon: Sparkles, path: '/app/ai-studio' },
    { label: 'Exams', icon: FileText, path: '/app/exams' },
    { label: 'Evaluation', icon: ClipboardCheck, path: '/app/evaluations' },
    { label: 'Analytics', icon: BarChart3, path: '/app/analytics' },
  ],
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'My Exams', icon: FileText, path: '/app/my-attempts' },
    { label: 'Results', icon: BarChart3, path: '/app/my-results' },
  ],
};

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const items = navItems[user?.role] || navItems.student;
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 bg-slate-950/20">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">Quzify</span>
          <button className="lg:hidden ml-auto p-1 text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs uppercase">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 flex items-center px-4 lg:px-8 gap-4 bg-white border-b border-slate-200 shadow-sm relative">
          <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 truncate">
              {items.find(i => location.pathname.startsWith(i.path))?.label || 'Quzify'}
            </h1>
            {!user?.institution && user?.role !== 'super_admin' && (
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 uppercase tracking-wider">
                <ShieldAlert className="w-3 h-3" /> No Institution Linked
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                  <Link to="/app/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
