import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  return (
    <header className="glass border-b border-gray-800 px-8 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" data-testid="page-title">{title}</h2>
          <p className="text-gray-400" data-testid="page-subtitle">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search projects, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 pl-10 w-64 focus:outline-none focus:border-purple-500 transition-colors"
              data-testid="search-input"
            />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
          <button 
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
            data-testid="notifications-button"
          >
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-white transition-colors"
            data-testid="settings-button"
          >
            <i className="fas fa-cog text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
