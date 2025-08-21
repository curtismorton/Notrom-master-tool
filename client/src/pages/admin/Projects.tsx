import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { getProjects } from '@/lib/firestore';
import type { Project } from '@shared/schema';

const statusColors = {
  intake: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  copy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  design: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  build: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  qa: 'bg-green-500/20 text-green-400 border-green-500/50',
  review: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  live: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  closed: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
};

const packageColors = {
  starter: 'bg-blue-500/20 text-blue-400',
  standard: 'bg-purple-500/20 text-purple-400',
  premium: 'bg-gold-500/20 text-yellow-400'
};

function calculateProgress(project: Project): number {
  const statusOrder = ['intake', 'copy', 'design', 'build', 'qa', 'review', 'live'];
  const currentIndex = statusOrder.indexOf(project.status);
  return Math.round(((currentIndex + 1) / statusOrder.length) * 100);
}

export default function Projects() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', statusFilter],
    queryFn: () => getProjects(
      undefined, 
      statusFilter === 'all' ? undefined : [statusFilter]
    ),
    refetchInterval: 10000,
  });

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.clientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPackage = packageFilter === 'all' || project.package === packageFilter;
    return matchesSearch && matchesPackage;
  }) || [];

  const statusCounts = projects?.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="bg-gray-950 text-white min-h-screen">
        <Sidebar />
        <div className="ml-64">
          <Header title="Projects" subtitle="Loading projects..." />
          <main className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
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
          title="Project Management" 
          subtitle="Track project progress and deliverables" 
        />
        
        <main className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Projects</p>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(statusCounts).reduce((a, b) => a + b, 0) - (statusCounts.closed || 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-rocket text-purple-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">In Development</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.build || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-code text-blue-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">In QA</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.qa || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-bug text-green-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Live Projects</p>
                    <p className="text-2xl font-bold text-white">
                      {statusCounts.live || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-globe text-emerald-400"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Project List */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>All Projects</CardTitle>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 focus:border-purple-500 w-full md:w-64"
                    data-testid="search-projects-input"
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
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="copy">Copy</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="build">Development</SelectItem>
                      <SelectItem value="qa">QA</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
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
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-project-diagram text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search criteria' : 'Projects will appear here when clients sign proposals'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredProjects.map((project) => {
                    const progress = calculateProgress(project);
                    const dueDate = project.milestones.liveDate 
                      ? new Date(project.milestones.liveDate).toLocaleDateString()
                      : 'TBD';
                    
                    return (
                      <div
                        key={project.id}
                        className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all"
                        data-testid={`project-item-${project.id}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-building text-white"></i>
                            </div>
                            <div>
                              <Link href={`/admin/projects/${project.id}`}>
                                <h3 className="font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                  Project #{project.id.slice(-6)}
                                </h3>
                              </Link>
                              <p className="text-gray-400 text-sm">Client: {project.clientId}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={packageColors[project.package]}>
                                  {project.package}
                                </Badge>
                                <Badge className="bg-gray-700/50 text-gray-300">
                                  {project.tech}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Badge className={statusColors[project.status]}>
                            {project.status}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Created</p>
                              <p className="text-white">
                                {new Date(project.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400">Due Date</p>
                              <p className="text-white">{dueDate}</p>
                            </div>
                          </div>

                          {(project.stagingUrl || project.productionUrl) && (
                            <div className="flex gap-2 pt-2">
                              {project.stagingUrl && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-gray-600 hover:border-purple-500"
                                  onClick={() => window.open(project.stagingUrl, '_blank')}
                                  data-testid={`staging-link-${project.id}`}
                                >
                                  <i className="fas fa-eye mr-2"></i>
                                  Staging
                                </Button>
                              )}
                              {project.productionUrl && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-gray-600 hover:border-green-500"
                                  onClick={() => window.open(project.productionUrl, '_blank')}
                                  data-testid={`production-link-${project.id}`}
                                >
                                  <i className="fas fa-globe mr-2"></i>
                                  Live Site
                                </Button>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                            <div className="flex space-x-2">
                              <Link href={`/admin/projects/${project.id}`}>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  data-testid={`view-project-${project.id}`}
                                >
                                  <i className="fas fa-eye mr-2"></i>
                                  View
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`edit-project-${project.id}`}
                              >
                                <i className="fas fa-edit mr-2"></i>
                                Edit
                              </Button>
                            </div>
                            <div className="text-xs text-gray-400">
                              Updated {new Date(project.updatedAt).toLocaleDateString()}
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
