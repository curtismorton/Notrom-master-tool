import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Proposal } from '@shared/schema';

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  signed: 'bg-green-500/20 text-green-400 border-green-500/50',
  declined: 'bg-red-500/20 text-red-400 border-red-500/50'
};

const packageColors = {
  starter: 'bg-blue-500/20 text-blue-400',
  standard: 'bg-purple-500/20 text-purple-400',
  premium: 'bg-yellow-500/20 text-yellow-400'
};

async function getProposals(): Promise<Proposal[]> {
  const q = query(collection(db, 'proposals'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));
}

export default function Proposals() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: proposals, isLoading } = useQuery<Proposal[]>({
    queryKey: ['/api/proposals'],
    queryFn: getProposals,
    refetchInterval: 30000,
  });

  const filteredProposals = proposals?.filter(proposal => {
    const matchesSearch = proposal.proposalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (proposal.clientId && proposal.clientId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (proposal.leadId && proposal.leadId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    const matchesPackage = packageFilter === 'all' || proposal.package === packageFilter;
    return matchesSearch && matchesStatus && matchesPackage;
  }) || [];

  const statusCounts = proposals?.reduce((acc, proposal) => {
    acc[proposal.status] = (acc[proposal.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalValue = proposals?.reduce((sum, proposal) => {
    return proposal.status === 'signed' ? sum + proposal.price : sum;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="bg-gray-950 text-white min-h-screen">
        <Sidebar />
        <div className="ml-64">
          <Header title="Proposals" subtitle="Loading proposals..." />
          <main className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-800 rounded-xl"></div>
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
          title="Proposal Management" 
          subtitle="Create, send, and track project proposals" 
        />
        
        <main className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Proposals</p>
                    <p className="text-2xl font-bold text-white">
                      {proposals?.length || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-file-contract text-blue-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Awaiting Response</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.sent || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-yellow-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Signed</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.signed || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check-circle text-green-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Value</p>
                    <p className="text-2xl font-bold text-white">
                      ${totalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-purple-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Proposal List */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>All Proposals</CardTitle>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <Input
                    placeholder="Search proposals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-64"
                    data-testid="search-proposals-input"
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={packageFilter} onValueChange={setPackageFilter}>
                    <SelectTrigger 
                      className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-48"
                      data-testid="package-filter-select"
                    >
                      <SelectValue placeholder="Filter by package" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Packages</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                    data-testid="create-proposal-button"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    New Proposal
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredProposals.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-file-contract text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No proposals found</h3>
                  <p className="text-gray-400 mb-6">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Create your first proposal to get started'}
                  </p>
                  <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
                    Create First Proposal
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all"
                      data-testid={`proposal-item-${proposal.id}`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-file-contract text-white"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/admin/proposals/${proposal.id}`}>
                              <h3 className="font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                {proposal.proposalNumber}
                              </h3>
                            </Link>
                            <p className="text-gray-400 text-sm">
                              {proposal.clientId ? `Client: ${proposal.clientId}` : `Lead: ${proposal.leadId}`}
                            </p>
                            <p className="text-gray-500 text-sm">Version {proposal.version}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <Badge className={packageColors[proposal.package]}>
                            {proposal.package}
                          </Badge>

                          <div className="text-center">
                            <p className="text-xs text-gray-400">Value</p>
                            <p className="text-sm font-medium">
                              ${proposal.price.toLocaleString()} {proposal.currency}
                            </p>
                          </div>

                          <Badge className={statusColors[proposal.status]}>
                            {proposal.status}
                          </Badge>

                          <div className="text-center">
                            <p className="text-xs text-gray-400">Created</p>
                            <p className="text-sm">
                              {new Date(proposal.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {proposal.signedAt && (
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Signed</p>
                              <p className="text-sm">
                                {new Date(proposal.signedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Link href={`/admin/proposals/${proposal.id}`}>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`view-proposal-${proposal.id}`}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                            </Link>
                            {proposal.pdfUrl && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => window.open(proposal.pdfUrl, '_blank')}
                                data-testid={`download-proposal-${proposal.id}`}
                              >
                                <i className="fas fa-download"></i>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`edit-proposal-${proposal.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
