import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { getLeads, updateLead } from '@/lib/firestore';
import LeadCaptureForm from '@/components/modals/LeadCaptureForm';
import type { Lead } from '@shared/schema';

const statusColors = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  qualified: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  discovery_booked: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  proposal_sent: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  won: 'bg-green-500/20 text-green-400 border-green-500/50',
  lost: 'bg-red-500/20 text-red-400 border-red-500/50'
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export default function Leads() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads', statusFilter],
    queryFn: () => getLeads({ 
      status: statusFilter === 'all' ? undefined : statusFilter 
    }),
    refetchInterval: 30000,
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      updateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: 'Lead Updated',
        description: 'Lead status has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const filteredLeads = leads?.filter(lead => 
    lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const statusCounts = leads?.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="bg-gray-950 text-white min-h-screen">
        <Sidebar />
        <div className="ml-64">
          <Header title="Leads" subtitle="Loading leads..." />
          <main className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Sidebar />
      
      <div className="ml-64">
        <Header 
          title="Leads Management" 
          subtitle="Track and convert leads into clients" 
        />
        
        <main className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Leads</p>
                    <p className="text-2xl font-bold text-white">
                      {leads?.length || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-users text-blue-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Qualified</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.qualified || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check-circle text-orange-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Proposals Sent</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.proposal_sent || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-file-contract text-purple-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Won</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.won || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-trophy text-green-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>All Leads</CardTitle>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-64"
                    data-testid="search-leads-input"
                  />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger 
                      className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-48"
                      data-testid="status-filter-select"
                    >
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="discovery_booked">Discovery Booked</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setShowLeadForm(true)}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                    data-testid="add-lead-button"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Lead
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-user-plus text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No leads found</h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first lead'}
                  </p>
                  <Button
                    onClick={() => setShowLeadForm(true)}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                  >
                    Add Your First Lead
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all"
                      data-testid={`lead-item-${lead.id}`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/admin/leads/${lead.id}`}>
                              <h3 className="font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                {lead.name}
                              </h3>
                            </Link>
                            <p className="text-gray-400 text-sm">{lead.company}</p>
                            <p className="text-gray-500 text-sm">{lead.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Score</p>
                            <p className={`font-semibold ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </p>
                          </div>

                          <Badge className={statusColors[lead.status]}>
                            {lead.status.replace('_', ' ')}
                          </Badge>

                          <div className="text-center">
                            <p className="text-xs text-gray-400">Source</p>
                            <p className="text-sm capitalize">{lead.source}</p>
                          </div>

                          <div className="text-center">
                            <p className="text-xs text-gray-400">Created</p>
                            <p className="text-sm">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <Select
                            value={lead.status}
                            onValueChange={(newStatus) =>
                              updateLeadMutation.mutate({
                                id: lead.id,
                                updates: { status: newStatus as Lead['status'] }
                              })
                            }
                          >
                            <SelectTrigger 
                              className="w-40 bg-gray-700/50 border-gray-600"
                              data-testid={`status-select-${lead.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="discovery_booked">Discovery Booked</SelectItem>
                              <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                              <SelectItem value="won">Won</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex space-x-2">
                            <Link href={`/admin/leads/${lead.id}`}>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`view-lead-${lead.id}`}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`edit-lead-${lead.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {lead.notes && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <p className="text-sm text-gray-400">{lead.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <LeadCaptureForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
      />
    </div>
  );
}
