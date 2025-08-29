import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ProjectPipeline from '@/components/dashboard/ProjectPipeline';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import LeadManagement from '@/components/dashboard/LeadManagement';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import ClientPortal from '@/components/modals/ClientPortal';
import LeadCaptureForm from '@/components/modals/LeadCaptureForm';
import { useState } from 'react';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [showClientPortal, setShowClientPortal] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [, navigate] = useLocation();

  const handleQuickLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
          <p className="text-xs text-gray-500 mt-2">Demo mode available at /dev</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // This should redirect to login
  }

  return (
    <div className="bg-gray-950 text-white font-sans overflow-x-hidden min-h-screen">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={user.role === 'client' ? 'min-h-screen' : 'ml-64 min-h-screen'}>
        <Header 
          title={user.role === 'client' ? 'Your Project' : 'Dashboard'}
          subtitle={user.role === 'client' ? 'Track your project progress and communicate with our team' : "Welcome back! Here's what's happening today."}
        />

        {/* Dashboard Content */}
        <main className="p-8 space-y-8">
          {/* Quick Actions Bar with Easy Sign Out */}
          <div className="glass rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLeadForm(true)}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-all duration-200"
                    data-testid="quick-add-lead"
                  >
                    <i className="fas fa-user-plus mr-2"></i>
                    Add Lead
                  </button>
                  {user?.role === 'client' && (
                    <button
                      onClick={() => setShowClientPortal(true)}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all duration-200"
                      data-testid="quick-client-portal"
                    >
                      <i className="fas fa-user-circle mr-2"></i>
                      Client Portal
                    </button>
                  )}
                </div>
              </div>
              
              {/* Prominent Sign Out Button */}
              <button
                onClick={handleQuickLogout}
                className="flex items-center space-x-2 px-6 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 rounded-lg text-red-400 hover:text-red-300 transition-all duration-200 font-medium"
                data-testid="dashboard-logout-button"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          {user.role === 'client' ? (
            <>
              {/* Client Portal Content */}
              <div className="glass rounded-2xl p-6">
                <div className="text-center py-12">
                  <i className="fas fa-user-circle text-6xl text-purple-400 mb-4"></i>
                  <h2 className="text-2xl font-bold mb-2">Welcome, {user.name}!</h2>
                  <p className="text-gray-400 mb-6">
                    Access your project status, upload assets, and get support
                  </p>
                  <button
                    onClick={() => setShowClientPortal(true)}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-cyan-600 transition-all"
                    data-testid="open-client-portal"
                  >
                    Open Client Portal
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Admin Dashboard */}
              <StatsOverview />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <ProjectPipeline />
                <ActivityFeed />
              </div>

              <LeadManagement />

              <AnalyticsCharts />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <ClientPortal 
        isOpen={showClientPortal}
        onClose={() => setShowClientPortal(false)}
      />
      
      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
      />

      {/* Floating Action Button - Only for admins */}
      {user.role !== 'client' && (
        <button
          onClick={() => setShowLeadForm(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-40"
          data-testid="floating-add-button"
        >
          <i className="fas fa-plus text-white text-xl group-hover:rotate-90 transition-transform duration-300"></i>
        </button>
      )}
    </div>
  );
}
