import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Brain,
  Wifi,
  WifiOff,
  Users,
  Mail,
  CalendarDays,
  BarChart3,
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  CircleDot,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  ListTodo,
  Calendar,
  PieChart,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Plus,
  ChevronRight,
  Play,
  Square,
  Timer,
  UserCircle,
  Sparkles,
  Send,
  FileImage,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { AIChat } from './AIChat';
import { BannerGenerator } from './BannerGenerator';
import { usePanelStore } from '../panelStore';
import {
  checkAIStatus,
  setAIModel,
  getActivityLog,
  AI_MODELS,
  type AIStatus,
  type AIActivity,
} from '../utils/aiClient';

// ============================================================
// Dashboard Sub-components
// ============================================================

// --- Metric Card with colored accent ---
function MetricCard({
  value,
  label,
  sublabel,
  accentColor,
  trend,
}: {
  value: string | number;
  label: string;
  sublabel?: string;
  accentColor: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
      style={{ backgroundColor: accentColor + '15', borderColor: accentColor + '30', borderWidth: 1 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: accentColor + '25' }}
        >
          {trend === 'up' && <ArrowUpRight className="w-4 h-4" style={{ color: accentColor }} />}
          {trend === 'down' && <ArrowDownRight className="w-4 h-4" style={{ color: accentColor }} />}
          {(!trend || trend === 'neutral') && (
            <ChevronRight className="w-4 h-4" style={{ color: accentColor }} />
          )}
        </div>
      </div>
      {sublabel && (
        <p className="text-xs mt-2" style={{ color: accentColor }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}

// --- Bar Chart (weekly style like the screenshot) ---
function WeeklyBarChart({
  data,
  color,
}: {
  data: number[];
  color: string;
}) {
  const max = Math.max(...data, 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      <div className="flex items-end gap-2 h-32">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex justify-center">
              <div
                className="w-5 rounded-t-md transition-all"
                style={{
                  height: `${(val / max) * 100}%`,
                  minHeight: val > 0 ? 4 : 2,
                  backgroundColor: val > 0 ? color : '#e2e8f0',
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-slate-400 font-medium">
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Donut/Progress Circle ---
function ProgressDonut({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = '#FF90E8',
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
        <span className="text-[10px] text-slate-400">Completed</span>
      </div>
    </div>
  );
}

// --- Team Member Row ---
function TeamMemberRow({
  name,
  task,
  status,
  color,
}: {
  name: string;
  task: string;
  status: string;
  color: string;
}) {
  const statusColors: Record<string, string> = {
    Completed: 'bg-pink-100 text-pink-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Pending: 'bg-amber-100 text-amber-700',
    Blocked: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
        style={{ backgroundColor: color }}
      >
        {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
        <p className="text-xs text-slate-400 truncate">{task}</p>
      </div>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[status] ?? 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    </div>
  );
}

// --- Task Item ---
function TaskItem({
  title,
  date,
  color,
}: {
  title: string;
  date: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">{title}</p>
        <p className="text-[10px] text-slate-400">due date: {date}</p>
      </div>
    </div>
  );
}

// --- Time Tracker ---
function TimeTracker() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');

  return (
    <div className="rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 p-5 text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/10" />

      <p className="text-xs font-medium text-pink-100 mb-2">Time Tracker</p>
      <p className="text-4xl font-mono font-bold tracking-wider mb-4">{h}:{m}:{s}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning(!running)}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          {running ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>
        <button
          onClick={() => { setRunning(false); setSeconds(0); }}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        >
          <Timer className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Sidebar Navigation
// ============================================================

type DashboardView = 'dashboard' | 'tasks' | 'calendar' | 'analytics' | 'team' | 'ai-chat' | 'flyer' | 'settings';

function DashboardSidebar({
  activeView,
  onViewChange,
  aiConnected,
}: {
  activeView: DashboardView;
  onViewChange: (v: DashboardView) => void;
  aiConnected: boolean;
}) {
  const menuItems: { icon: React.ComponentType<{ className?: string }>; label: string; view: DashboardView }[] = [
    { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
    { icon: ListTodo, label: 'Tasks', view: 'tasks' },
    { icon: Calendar, label: 'Calendar', view: 'calendar' },
    { icon: PieChart, label: 'Analytics', view: 'analytics' },
    { icon: Users, label: 'Team', view: 'team' },
    { icon: Sparkles, label: 'AI Chat', view: 'ai-chat' },
    { icon: FileImage, label: 'Flyer', view: 'flyer' },
  ];

  const generalItems: { icon: React.ComponentType<{ className?: string }>; label: string; view: DashboardView }[] = [
    { icon: Settings, label: 'Settings', view: 'settings' },
  ];

  return (
    <div className="w-52 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FF90E8' }}>
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold text-slate-800">VET Panel</span>
      </div>

      {/* Menu */}
      <div className="px-3 mt-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
          Menu
        </p>
        {menuItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
              activeView === item.view
                ? 'bg-pink-50 text-pink-600 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            {item.view === 'ai-chat' && (
              <span className={`ml-auto w-1.5 h-1.5 rounded-full ${aiConnected ? 'bg-pink-400' : 'bg-red-400'}`} />
            )}
          </button>
        ))}
      </div>

      {/* General */}
      <div className="px-3 mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
          General
        </p>
        {generalItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
              activeView === item.view
                ? 'bg-pink-50 text-pink-600 font-medium'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* AI Status footer */}
      <div className="px-3 pb-4">
        <div className={`rounded-lg px-3 py-2.5 text-xs ${
          aiConnected
            ? 'bg-pink-50 text-pink-600'
            : 'bg-red-50 text-red-600'
        }`}>
          <div className="flex items-center gap-1.5">
            {aiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="font-medium">{aiConnected ? 'AI Connected' : 'AI Offline'}</span>
          </div>
          <p className="text-[10px] mt-0.5 opacity-75">
            {aiConnected ? 'Local AI CLI ready' : 'Run npm run server'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main AIDashboard Export
// ============================================================

export function AIDashboard() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [activityLog, setActivityLog] = useState<AIActivity[]>([]);
  const [dashView, setDashView] = useState<DashboardView>('dashboard');
  const [quickActionPrompt, setQuickActionPrompt] = useState<string | undefined>();

  const panelEvents = usePanelStore((s) => s.panelEvents);
  const eventPanelTrackers = usePanelStore((s) => s.eventPanelTrackers);
  const eventChecklists = usePanelStore((s) => s.eventChecklists);
  const theme = usePanelStore((s) => s.ui.theme);
  const setTheme = usePanelStore((s) => s.setTheme);

  useEffect(() => {
    checkAIStatus().then((s) => {
      setStatus(s);
      if (s.model) setSelectedModel(s.model);
    });
  }, []);

  useEffect(() => {
    setActivityLog(getActivityLog());
    const interval = setInterval(() => setActivityLog(getActivityLog()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    await setAIModel(model);
  };

  // --- Compute VET metrics ---
  const metrics = useMemo(() => {
    const totalEvents = panelEvents.length;
    const totalPanelists = panelEvents.reduce((sum, e) => sum + e.panelists.length, 0);
    const totalEmails = panelEvents.reduce((sum, e) => sum + e.generatedEmails.length, 0);
    const totalRegistrations = eventPanelTrackers.reduce((sum, t) => sum + t.totalRegistrations, 0);
    const totalAttendees = eventPanelTrackers.reduce((sum, t) => sum + t.totalAttendees, 0);
    const totalICP = eventPanelTrackers.reduce((sum, t) => sum + t.totalIcpRegistrations, 0);
    const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttendees / totalRegistrations) * 100) : 0;

    // Checklist completion
    let totalTasks = 0;
    let completedTasks = 0;
    for (const cl of eventChecklists) {
      for (const t of cl.tasks) {
        totalTasks++;
        if (t.status === 'Completed') completedTasks++;
      }
    }
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { totalEvents, totalPanelists, totalEmails, totalRegistrations, totalAttendees, totalICP, attendanceRate, completionRate, totalTasks, completedTasks };
  }, [panelEvents, eventPanelTrackers, eventChecklists]);

  // Weekly email data (last 7 days)
  const weeklyEmails = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });
    return days.map((day) => {
      let count = 0;
      for (const event of panelEvents) {
        for (const email of event.generatedEmails) {
          if (email.generatedAt?.slice(0, 10) === day) count++;
        }
      }
      return count;
    });
  }, [panelEvents]);

  // Recent events sorted
  const recentEvents = useMemo(() => {
    return [...panelEvents]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [panelEvents]);

  // Panelist team data
  const panelistTeam = useMemo(() => {
    const all: { name: string; task: string; status: string; color: string }[] = [];
    const colors = ['#FF90E8', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
    let ci = 0;
    for (const event of panelEvents.slice(0, 3)) {
      for (const p of event.panelists) {
        const hasQuestions = p.questions?.some((q) => q?.trim());
        const hasEmail = !!p.email;
        const st = hasQuestions ? 'Completed' : hasEmail ? 'In Progress' : 'Pending';
        all.push({
          name: p.fullName || p.firstName || 'Unknown',
          task: `${event.name} - Panel Prep`,
          status: st,
          color: colors[ci % colors.length],
        });
        ci++;
      }
    }
    return all.slice(0, 4);
  }, [panelEvents]);

  // Upcoming events for tasks
  const upcomingTasks = useMemo(() => {
    const tasks: { title: string; date: string; color: string }[] = [];
    const colors = ['#FF90E8', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
    panelEvents.forEach((e, i) => {
      tasks.push({
        title: e.panelTitle || e.name,
        date: e.eventDateFull || e.eventDate || 'TBD',
        color: colors[i % colors.length],
      });
    });
    return tasks.slice(0, 5);
  }, [panelEvents]);

  // Nearest event for reminder
  const nextEvent = panelEvents.find((e) => e.eventDateFull || e.eventDate);

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <DashboardSidebar
        activeView={dashView}
        onViewChange={setDashView}
        aiConnected={status?.connected ?? false}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="flex items-center gap-2 flex-1 px-3 py-1.5 bg-slate-100 rounded-lg">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search task"
                className="bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none flex-1"
              />
              <kbd className="text-[10px] text-slate-400 bg-white rounded px-1.5 py-0.5 border border-gray-200">
                ⌘ F
              </kbd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:outline-none"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            {/* Theme toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-white shadow-sm text-amber-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-white shadow-sm text-indigo-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === 'system'
                    ? 'bg-white shadow-sm text-pink-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="System preference"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-slate-500" />
              {activityLog.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: '#FF90E8' }}>
                VB
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-slate-700">VBI Team</p>
                <p className="text-[10px] text-slate-400">panel@vbi.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {dashView === 'dashboard' && (
            <div className="p-6 space-y-6 max-w-[1400px]">
              {/* Page header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Plan, prioritize, and accomplish your panel events with ease.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDashView('ai-chat')}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#FF90E8' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Ask AI
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors text-slate-700">
                    Import Data
                  </button>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                  value={metrics.totalEvents}
                  label="Total Events"
                  sublabel={metrics.totalEvents > 0 ? `${metrics.totalPanelists} panelists total` : undefined}
                  accentColor="#FF90E8"
                  trend="up"
                />
                <MetricCard
                  value={metrics.totalEmails}
                  label="Emails Generated"
                  sublabel={metrics.totalEmails > 0 ? 'Across all events' : undefined}
                  accentColor="#6b7280"
                  trend="neutral"
                />
                <MetricCard
                  value={metrics.totalRegistrations}
                  label="Registrations"
                  sublabel={metrics.totalICP > 0 ? `${metrics.totalICP} ICP confirmed` : undefined}
                  accentColor="#3b82f6"
                  trend="up"
                />
                <MetricCard
                  value={metrics.totalAttendees}
                  label="Attendees"
                  sublabel={metrics.attendanceRate > 0 ? `${metrics.attendanceRate}% attendance rate` : undefined}
                  accentColor="#8b5cf6"
                  trend={metrics.attendanceRate >= 50 ? 'up' : 'down'}
                />
              </div>

              {/* Middle row: Analytics + Reminders + Projects */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Email Analytics */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Email Analytics
                    </h3>
                    <span className="text-[10px] text-slate-400">This week</span>
                  </div>
                  <WeeklyBarChart data={weeklyEmails} color="#FF90E8" />
                </div>

                {/* Reminders */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">
                    Reminders
                  </h3>
                  {nextEvent ? (
                    <div>
                      <p className="text-base font-semibold text-slate-800">
                        {nextEvent.panelTitle || nextEvent.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {nextEvent.eventDateFull || nextEvent.eventDate || 'Date TBD'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {nextEvent.panelists.length} panelists &middot; {nextEvent.generatedEmails.length} emails ready
                      </p>
                      <button
                        onClick={() => { setQuickActionPrompt('Analyze this upcoming panel event and give me a preparation checklist with timeline.'); setDashView('ai-chat'); }}
                        className="mt-3 flex items-center gap-2 px-3 py-1.5 text-white text-xs rounded-lg font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: '#FF90E8' }}
                      >
                        <Sparkles className="w-3 h-3" />
                        AI Prep Guide
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No upcoming events</p>
                  )}
                </div>

                {/* Projects / Events list */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Events
                    </h3>
                    <span className="text-[10px] text-pink-500 cursor-pointer hover:underline">
                      + New
                    </span>
                  </div>
                  {upcomingTasks.length === 0 ? (
                    <p className="text-sm text-slate-400">No events yet</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {upcomingTasks.map((t, i) => (
                        <TaskItem key={i} title={t.title} date={t.date} color={t.color} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom row: Team + Progress + Time Tracker */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Team Collaboration */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Panelist Collaboration
                    </h3>
                    <span className="text-[10px] text-pink-500 cursor-pointer hover:underline">
                      + Add Panelist
                    </span>
                  </div>
                  {panelistTeam.length === 0 ? (
                    <p className="text-sm text-slate-400">Import panelists to see collaboration status</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {panelistTeam.map((m, i) => (
                        <TeamMemberRow key={i} name={m.name} task={m.task} status={m.status} color={m.color} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Event Progress */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col items-center justify-center">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 self-start">
                    Event Progress
                  </h3>
                  <ProgressDonut percentage={metrics.completionRate} color="#FF90E8" />
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF90E8' }} />
                      Completed
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      In Progress
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Pending
                    </span>
                  </div>
                </div>

                {/* Time Tracker */}
                <TimeTracker />
              </div>
            </div>
          )}

          {/* AI Chat view */}
          {dashView === 'ai-chat' && (
            <div className="h-full flex flex-col">
              {status?.connected ? (
                <AIChat
                  model={selectedModel}
                  initialPrompt={quickActionPrompt}
                  onInitialPromptConsumed={() => setQuickActionPrompt(undefined)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-sm">
                    <WifiOff className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold mb-2 text-slate-800">AI Server Not Connected</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      {status?.error || 'The AI server is not running.'}
                    </p>
                    <div className="text-left bg-slate-100 rounded-lg p-4 text-xs text-slate-600 space-y-2">
                      <p className="font-medium">To get started:</p>
                      <code className="block bg-white rounded px-2 py-1">npm run ai-server</code>
                      <p>Or run everything:</p>
                      <code className="block bg-white rounded px-2 py-1">npm run dev:full</code>
                    </div>
                    <button
                      onClick={() => checkAIStatus().then(setStatus)}
                      className="mt-4 px-4 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90"
                      style={{ backgroundColor: '#FF90E8' }}
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Placeholder views */}
          {dashView === 'tasks' && (
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Tasks</h1>
              <p className="text-sm text-slate-400 mb-6">Manage your panel event tasks and checklists.</p>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                {panelEvents.length === 0 ? (
                  <p className="text-sm text-slate-400">No tasks yet. Create a panel event to get started.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {panelEvents.map((event, i) => (
                      <div key={event.id} className="py-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${event.generatedEmails.length > 0 ? 'bg-pink-400' : 'bg-amber-500'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{event.name}</p>
                          <p className="text-xs text-slate-400">{event.panelists.length} panelists &middot; {event.generatedEmails.length} emails</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          event.generatedEmails.length > 0
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {event.generatedEmails.length > 0 ? 'Emails Ready' : 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {dashView === 'calendar' && (
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Calendar</h1>
              <p className="text-sm text-slate-400 mb-6">Upcoming panel events and deadlines.</p>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                {panelEvents.length === 0 ? (
                  <p className="text-sm text-slate-400">No events scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {panelEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                        <CalendarDays className="w-5 h-5 text-pink-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{event.name}</p>
                          <p className="text-xs text-slate-400">{event.eventDateFull || event.eventDate || 'Date TBD'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {dashView === 'analytics' && (
            <div className="p-6 space-y-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Analytics</h1>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard value={metrics.totalRegistrations} label="Total Registrations" accentColor="#3b82f6" sublabel={`${metrics.totalICP} ICP`} trend="up" />
                <MetricCard value={metrics.totalAttendees} label="Total Attendees" accentColor="#FF90E8" sublabel={`${metrics.attendanceRate}% rate`} trend="up" />
                <MetricCard value={metrics.totalEmails} label="Emails Sent" accentColor="#8b5cf6" trend="neutral" />
                <MetricCard value={`${metrics.completionRate}%`} label="Task Completion" accentColor="#f59e0b" trend={metrics.completionRate >= 50 ? 'up' : 'down'} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Weekly Email Activity</h3>
                <WeeklyBarChart data={weeklyEmails} color="#3b82f6" />
              </div>
            </div>
          )}

          {dashView === 'team' && (
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Team</h1>
              <p className="text-sm text-slate-400 mb-6">Panelists and their preparation status.</p>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                {panelistTeam.length === 0 ? (
                  <p className="text-sm text-slate-400">No panelists imported yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {panelistTeam.map((m, i) => (
                      <TeamMemberRow key={i} name={m.name} task={m.task} status={m.status} color={m.color} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {dashView === 'flyer' && (
            <BannerGenerator />
          )}

          {dashView === 'settings' && (
            <div className="p-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">Settings</h1>
              <p className="text-sm text-slate-400 mb-6">AI model and preferences.</p>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 max-w-lg space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">AI Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    {AI_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} - {m.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">AI Status</label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    status?.connected
                      ? 'bg-pink-50 text-pink-600'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {status?.connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    {status?.connected ? `Connected - ${status.bin}` : (status?.error || 'Disconnected')}
                  </div>
                </div>
                <button
                  onClick={() => checkAIStatus().then(setStatus)}
                  className="px-4 py-2 text-sm text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#FF90E8' }}
                >
                  Test Connection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
