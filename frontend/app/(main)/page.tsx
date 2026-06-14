import { 
  Users, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  ShieldAlert, 
  Layers,
  ArrowRight,
  CheckCircle2,
  Cpu
} from "lucide-react";

export default async function Home() {

  // TODO: Replace mock data with actual API calls
  // Mock stats and activities for visual excellence - replace with real data
  const stats = [
    {
      title: "Active Sessions",
      value: "1,248",
      change: "+12% vs last hour",
      icon: Users,
      gradient: "from-blue-600 to-indigo-600",
      accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "System Performance",
      value: "99.94%",
      change: "All systems operational",
      icon: Cpu,
      gradient: "from-emerald-500 to-teal-600",
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
      isLive: true,
    },
    {
      title: "Task Completion",
      value: "94.2%",
      change: "+4.1% this week",
      icon: Activity,
      gradient: "from-purple-500 to-pink-600",
      accent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Resource Efficiency",
      value: "84.3x",
      change: "Optimized",
      icon: Layers,
      gradient: "from-amber-500 to-orange-600",
      accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  const activities = [
    {
      id: 1,
      title: "Security protocol automated",
      time: "2 minutes ago",
      type: "success",
      detail: "IP firewalls updated successfully.",
    },
    {
      id: 2,
      title: "Database index optimized",
      time: "15 minutes ago",
      type: "info",
      detail: "Query latencies reduced by 24ms.",
    },
    {
      id: 3,
      title: "API Gateway rate limit adjusted",
      time: "1 hour ago",
      type: "warning",
      detail: "Config set to 10k requests/min.",
    },
  ];

  return (
    <div className="space-y-8 py-6">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-linear-to-br from-slate-50 to-slate-100/50 dark:from-[#0f172a] dark:to-[#1e293b]/40 p-8 md:p-10 shadow-xs">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Platform Active</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Your platform control dashboard is up and running. Use this centralized hub to monitor performance, manage integrations, and keep track of system logs.
            </p>
          </div>
          
          <div className="flex shrink-0 gap-3">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
              <span>View System Logs</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={stat.title}
              className="group relative overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-card p-6 shadow-xs transition-all duration-300 hover:border-slate-300/80 dark:hover:border-slate-700/80 hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.accent} transition-transform duration-300 group-hover:scale-110`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{stat.value}</span>
                  {stat.isLive && (
                    <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Layout section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Updates Panel */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent System Activities</h2>
              <p className="text-xs text-slate-500">Live feed of automated checks and actions</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">View all</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-4 py-4.5 first:pt-2 last:pb-2">
                <div className="mt-0.5 shrink-0">
                  {act.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {act.type === "info" && <Activity className="h-5 w-5 text-blue-500" />}
                  {act.type === "warning" && <ShieldAlert className="h-5 w-5 text-amber-500" />}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.title}</h3>
                    <span className="text-xs text-slate-400 font-medium">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Reference / Status Box */}
        <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Environment Node</h2>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Deployment mode</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">development</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Next.js Version</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">16.2.6</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Turbopack compiler</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
            <p className="text-xs text-slate-400 leading-normal">
              Need technical documentation? Access the local guide references inside the workspace directory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
