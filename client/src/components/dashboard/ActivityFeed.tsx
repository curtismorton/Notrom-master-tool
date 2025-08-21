import { useQuery } from '@tanstack/react-query';
import { getRecentActivities } from '@/lib/firestore';
import type { Activity } from '@shared/schema';

const activityIcons = {
  project: 'fas fa-check',
  payment: 'fas fa-dollar-sign', 
  lead: 'fas fa-file-contract',
  support: 'fas fa-exclamation-triangle'
};

const activityColors = {
  project: 'bg-green-500/20 text-green-400',
  payment: 'bg-purple-500/20 text-purple-400',
  lead: 'bg-blue-500/20 text-blue-400',
  support: 'bg-orange-500/20 text-orange-400'
};

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent'],
    queryFn: () => getRecentActivities(10),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
                  <i className={`${activityIcons[activity.type]} text-xs`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: activity.message }} />
                  <p className="text-xs text-gray-400 mt-1">{formatTimestamp(activity.timestamp)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <i className="fas fa-clock text-2xl mb-2"></i>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
        <div className="space-y-3">
          <button 
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl px-4 py-3 text-left flex items-center space-x-3 transition-all"
            data-testid="create-proposal-button"
          >
            <i className="fas fa-file-contract"></i>
            <span>Create New Proposal</span>
          </button>
          <button 
            className="w-full bg-gray-800 hover:bg-gray-750 rounded-xl px-4 py-3 text-left flex items-center space-x-3 transition-all"
            data-testid="schedule-call-button"
          >
            <i className="fas fa-calendar-plus"></i>
            <span>Schedule Discovery Call</span>
          </button>
          <button 
            className="w-full bg-gray-800 hover:bg-gray-750 rounded-xl px-4 py-3 text-left flex items-center space-x-3 transition-all"
            data-testid="generate-report-button"
          >
            <i className="fas fa-chart-bar"></i>
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
