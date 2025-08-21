import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/lib/firestore';
import type { DashboardStats } from '@shared/schema';

const StatCard = ({ title, value, icon, change, trend }: {
  title: string;
  value: string | number;
  icon: string;
  change: string;
  trend: 'up' | 'down';
}) => (
  <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">
          {value}
        </p>
      </div>
      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
        <i className={`${icon} text-purple-400 text-xl`}></i>
      </div>
    </div>
    <div className="flex items-center mt-4 text-sm">
      <i className={`fas fa-arrow-${trend} ${trend === 'up' ? 'text-green-400' : 'text-red-400'} mr-1`}></i>
      <span className={trend === 'up' ? 'text-green-400' : 'text-red-400'}>{change}</span>
      <span className="text-gray-400 ml-2">from last month</span>
    </div>
  </div>
);

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 animate-pulse">
            <div className="h-16 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Active Projects"
        value={stats?.activeProjects || 0}
        icon="fas fa-rocket"
        change="+12%"
        trend="up"
      />
      <StatCard
        title="Monthly Revenue"
        value={`$${stats?.monthlyRevenue ? Math.round(stats.monthlyRevenue / 1000) : 0}K`}
        icon="fas fa-dollar-sign"
        change="+8%"
        trend="up"
      />
      <StatCard
        title="New Leads"
        value={stats?.newLeads || 0}
        icon="fas fa-user-plus"
        change="+23%"
        trend="up"
      />
      <StatCard
        title="Care Subscriptions"
        value={stats?.careSubscriptions || 0}
        icon="fas fa-shield-alt"
        change="+5%"
        trend="up"
      />
    </div>
  );
}
