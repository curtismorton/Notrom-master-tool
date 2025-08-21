import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getLeads } from '@/lib/firestore';
import type { Lead } from '@shared/schema';

const statusColors = {
  new: 'bg-blue-500/20 text-blue-400',
  qualified: 'bg-orange-500/20 text-orange-400',
  discovery_booked: 'bg-cyan-500/20 text-cyan-400',
  proposal_sent: 'bg-purple-500/20 text-purple-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400'
};

const statusLabels = {
  new: 'New',
  qualified: 'Qualified',
  discovery_booked: 'Discovery Booked',
  proposal_sent: 'Proposal Sent',
  won: 'Won',
  lost: 'Lost'
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-400 bg-green-400';
  if (score >= 60) return 'text-yellow-400 bg-yellow-400';
  return 'text-red-400 bg-red-400';
}

export default function LeadManagement() {
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads', 'recent'],
    queryFn: () => getLeads({ limit: 5 }),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Recent Leads</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Recent Leads</h3>
        <div className="flex space-x-2">
          <Link href="/admin/leads/new">
            <button 
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-sm font-medium transition-colors"
              data-testid="add-lead-button"
            >
              <i className="fas fa-plus mr-2"></i>Add Lead
            </button>
          </Link>
          <Link href="/admin/leads">
            <button 
              className="px-4 py-2 bg-gray-800 hover:bg-gray-750 rounded-xl text-sm font-medium transition-colors"
              data-testid="filter-leads-button"
            >
              <i className="fas fa-filter mr-2"></i>Filter
            </button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        {!leads || leads.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-user-plus text-4xl mb-4"></i>
            <p>No leads yet</p>
            <p className="text-sm mt-2">Create your first lead to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 font-medium text-gray-400">Lead</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Company</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Source</th>
                <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  data-testid={`lead-row-${lead.id}`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-sm text-gray-400">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">{lead.company}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getScoreColor(lead.score).split(' ')[1]}`}></div>
                      <span className={`font-medium ${getScoreColor(lead.score).split(' ')[0]}`}>
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[lead.status]}`}>
                      {statusLabels[lead.status]}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-400 capitalize">{lead.source}</td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <Link href={`/admin/leads/${lead.id}`}>
                        <button 
                          className="text-purple-400 hover:text-purple-300 text-sm"
                          data-testid={`view-lead-${lead.id}`}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </Link>
                      <Link href={`/admin/leads/${lead.id}/edit`}>
                        <button 
                          className="text-gray-400 hover:text-white text-sm"
                          data-testid={`edit-lead-${lead.id}`}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
