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
import { getClients } from '@/lib/firestore';
import type { Client } from '@shared/schema';

const planColors = {
  none: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  care_basic: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  care_plus: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  care_pro: 'bg-gold-500/20 text-yellow-400 border-yellow-500/50'
};

const planLabels = {
  none: 'No Plan',
  care_basic: 'Care Basic',
  care_plus: 'Care Plus',
  care_pro: 'Care Pro'
};

export default function Clients() {
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    queryFn: () => getClients(),
    refetchInterval: 30000,
  });

  const filteredClients = clients?.filter(client => {
    const matchesSearch = client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.billingEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || client.plan === planFilter;
    return matchesSearch && matchesPlan;
  }) || [];

  const planCounts = clients?.reduce((acc, client) => {
    acc[client.plan] = (acc[client.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="bg-gray-950 text-white min-h-screen">
        <Sidebar />
        <div className="ml-64">
          <Header title="Clients" subtitle="Loading clients..." />
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
          title="Client Management" 
          subtitle="Manage client relationships and care plans" 
        />
        
        <main className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Clients</p>
                    <p className="text-2xl font-bold text-white">
                      {clients?.length || 0}
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
                    <p className="text-gray-400 text-sm">Care Basic</p>
                    <p className="text-2xl font-bold text-white">
                      {planCounts.care_basic || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-shield text-blue-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Care Plus</p>
                    <p className="text-2xl font-bold text-white">
                      {planCounts.care_plus || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-shield-alt text-purple-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Care Pro</p>
                    <p className="text-2xl font-bold text-white">
                      {planCounts.care_pro || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-crown text-yellow-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Client List */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>All Clients</CardTitle>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-64"
                    data-testid="search-clients-input"
                  />
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger 
                      className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-48"
                      data-testid="plan-filter-select"
                    >
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="none">No Plan</SelectItem>
                      <SelectItem value="care_basic">Care Basic</SelectItem>
                      <SelectItem value="care_plus">Care Plus</SelectItem>
                      <SelectItem value="care_pro">Care Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No clients found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Clients will appear here when leads are converted'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all"
                      data-testid={`client-item-${client.id}`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold">
                              {client.company.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/admin/clients/${client.id}`}>
                              <h3 className="font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                {client.company}
                              </h3>
                            </Link>
                            <p className="text-gray-400 text-sm">{client.legalName}</p>
                            <p className="text-gray-500 text-sm">{client.billingEmail}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <Badge className={planColors[client.plan]}>
                            {planLabels[client.plan]}
                          </Badge>

                          <div className="text-center">
                            <p className="text-xs text-gray-400">Contacts</p>
                            <p className="text-sm font-medium">{client.contacts.length}</p>
                          </div>

                          {client.stripeCustomerId && (
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Stripe</p>
                              <i className="fas fa-check text-green-400"></i>
                            </div>
                          )}

                          <div className="text-center">
                            <p className="text-xs text-gray-400">Since</p>
                            <p className="text-sm">
                              {new Date(client.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <Link href={`/admin/clients/${client.id}`}>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`view-client-${client.id}`}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`edit-client-${client.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Link href={`/portal/${client.id}`}>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`portal-client-${client.id}`}
                              >
                                <i className="fas fa-external-link-alt"></i>
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {client.contacts.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Contacts:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {client.contacts.map((contact, index) => (
                              <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                                <p className="font-medium text-sm">{contact.name}</p>
                                <p className="text-xs text-gray-400">{contact.role}</p>
                                <p className="text-xs text-gray-500">{contact.email}</p>
                              </div>
                            ))}
                          </div>
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
    </div>
  );
}
