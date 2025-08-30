import { useState } from 'react';
import { useAuth } from '@/hooks/useAuthDemo';
import { useLocation } from 'wouter';

interface HeaderProps {
  title: string;
  subtitle: string;
  onMenuClick?: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="glass border-b border-gray-800 px-4 lg:px-8 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              data-testid="mobile-menu-button"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
          )}
          
          <div>
            <h2 className="text-xl lg:text-2xl font-bold" data-testid="page-title">{title}</h2>
            <p className="text-gray-400 text-sm lg:text-base hidden sm:block" data-testid="page-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="relative hidden md:block">
            <input
              type="search"
              placeholder="Search projects, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 pl-10 w-48 lg:w-64 focus:outline-none focus:border-purple-500 transition-colors"
              data-testid="search-input"
            />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
          
          <button 
            className="p-2 text-gray-400 hover:text-white transition-colors"
            data-testid="settings-button"
          >
            <i className="fas fa-cog text-lg"></i>
          </button>
          
          <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-sm text-gray-300">{user?.name}</span>
            </div>
            
            {/* Prominent Sign Out Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200"
              data-testid="header-logout-button"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
