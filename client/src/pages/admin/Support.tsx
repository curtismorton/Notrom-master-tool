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
// Firebase disabled - using demo data
import type { Ticket } from '@shared/schema';

const priorityColors = {
  low: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-red-500/20 text-red-400 border-red-500/50'
};

const statusColors = {
  open: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  waiting: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
};

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  closed: 'Closed'
};

async function getTickets(statusFilter?: string): Promise<Ticket[]> {
  let q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
  
  if (statusFilter && statusFilter !== 'all') {
    q = query(q, where('status', '==', statusFilter));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
}

function formatTimeRemaining(slaDueAt: number): string {
  const now = Date.now();
  const diff = slaDueAt - now;
  
  if (diff <= 0) return 'Overdue';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export default function Support() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets', statusFilter],
    queryFn: () => getTickets(statusFilter),
    refetchInterval: 15000,
  });

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.clientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  }) || [];

  const statusCounts = tickets?.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const overdueTickets = tickets?.filter(ticket => 
    ticket.status !== 'closed' && Date.now() > ticket.slaDueAt
  ).length || 0;

  if (isLoading) {
    return (
      <div className="bg-gray-950 text-white min-h-screen">
        <Sidebar />
        <div className="ml-64">
          <Header title="Support" subtitle="Loading tickets..." />
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
          title="Support Management" 
          subtitle="Manage customer support tickets and SLA tracking" 
        />
        
        <main className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Open Tickets</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.open || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-ticket-alt text-blue-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.in_progress || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-cog text-purple-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Overdue</p>
                    <p className="text-2xl font-bold text-red-400">
                      {overdueTickets}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-red-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Response</p>
                    <p className="text-2xl font-bold text-white">2.3h</p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-green-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Ticket List */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>Support Tickets</CardTitle>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-64"
                    data-testid="search-tickets-input"
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
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger 
                      className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-48"
                      data-testid="priority-filter-select"
                    >
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-headset text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No support tickets yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => {
                    const timeRemaining = formatTimeRemaining(ticket.slaDueAt);
                    const isOverdue = Date.now() > ticket.slaDueAt && ticket.status !== 'closed';
                    
                    return (
                      <div
                        key={ticket.id}
                        className={`bg-gray-800/50 rounded-xl p-6 border transition-all ${
                          isOverdue 
                            ? 'border-red-500/50 bg-red-500/5' 
                            : 'border-gray-700 hover:border-purple-500/50'
                        }`}
                        data-testid={`ticket-item-${ticket.id}`}
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isOverdue ? 'bg-red-500/20' : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                            }`}>
                              <i className={`fas ${isOverdue ? 'fa-exclamation-triangle text-red-400' : 'fa-ticket-alt text-white'}`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link href={`/admin/support/${ticket.id}`}>
                                <h3 className="font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                  {ticket.subject}
                                </h3>
                              </Link>
                              <p className="text-gray-400 text-sm">Client: {ticket.clientId}</p>
                              <p className="text-gray-500 text-sm line-clamp-2">
                                {ticket.body.substring(0, 120)}...
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 flex-wrap">
                            <Badge className={priorityColors[ticket.priority]}>
                              {ticket.priority}
                            </Badge>

                            <Badge className={statusColors[ticket.status]}>
                              {statusLabels[ticket.status]}
                            </Badge>

                            <div className="text-center">
                              <p className="text-xs text-gray-400">SLA</p>
                              <p className={`text-sm font-medium ${
                                isOverdue ? 'text-red-400' : 'text-white'
                              }`}>
                                {timeRemaining}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-xs text-gray-400">Created</p>
                              <p className="text-sm">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            {ticket.lastCustomerReplyAt && (
                              <div className="text-center">
                                <p className="text-xs text-gray-400">Last Reply</p>
                                <p className="text-sm">
                                  {new Date(ticket.lastCustomerReplyAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}

                            <div className="flex space-x-2">
                              <Link href={`/admin/support/${ticket.id}`}>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  data-testid={`view-ticket-${ticket.id}`}
                                >
                                  <i className="fas fa-eye"></i>
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`reply-ticket-${ticket.id}`}
                              >
                                <i className="fas fa-reply"></i>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`close-ticket-${ticket.id}`}
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
