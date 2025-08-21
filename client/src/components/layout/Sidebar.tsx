import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' },
  { name: 'Leads', href: '/admin/leads', icon: 'fas fa-user-plus', badge: '12' },
  { name: 'Projects', href: '/admin/projects', icon: 'fas fa-tasks' },
  { name: 'Clients', href: '/admin/clients', icon: 'fas fa-users' },
  { name: 'Proposals', href: '/admin/proposals', icon: 'fas fa-file-contract' },
  { name: 'Support', href: '/admin/support', icon: 'fas fa-headset', badge: '3', badgeColor: 'bg-red-500' },
  { name: 'Analytics', href: '/admin/analytics', icon: 'fas fa-chart-line' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user || user.role === 'client') {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 glass border-r border-gray-800 z-50">
      <div className="p-6">
        <Link href="/dashboard">
          <div className="flex items-center space-x-3 mb-8 cursor-pointer" data-testid="logo-link">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-bolt text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Notrom
            </h1>
          </div>
        </Link>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
                    isActive 
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <i className={item.icon}></i>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span 
                      className={cn(
                        "ml-auto text-xs px-2 py-1 rounded-full",
                        item.badgeColor || "bg-cyan-500"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-6 left-6 right-6">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" data-testid="user-name">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize" data-testid="user-role">{user?.role}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors"
              data-testid="logout-button"
              title="Sign Out"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
