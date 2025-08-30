import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getProjects } from '@/lib/firestoreDemo';
import type { Project } from '@shared/schema';

const statusColors = {
  intake: 'bg-blue-500/20 text-blue-400',
  copy: 'bg-yellow-500/20 text-yellow-400',
  design: 'bg-orange-500/20 text-orange-400',
  build: 'bg-purple-500/20 text-purple-400',
  qa: 'bg-green-500/20 text-green-400',
  review: 'bg-cyan-500/20 text-cyan-400',
  live: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-gray-500/20 text-gray-400'
};

const statusLabels = {
  intake: 'Intake',
  copy: 'Copy Phase',
  design: 'Design Phase',
  build: 'Development',
  qa: 'QA Testing',
  review: 'Review',
  live: 'Live',
  closed: 'Closed'
};

function calculateProgress(project: Project): number {
  const statusOrder = ['intake', 'copy', 'design', 'build', 'qa', 'review', 'live'];
  const currentIndex = statusOrder.indexOf(project.status);
  return Math.round(((currentIndex + 1) / statusOrder.length) * 100);
}

export default function ProjectPipeline() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', 'active'],
    queryFn: () => getProjects(undefined, ['intake', 'copy', 'design', 'build', 'qa', 'review']),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="lg:col-span-2 glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Project Pipeline</h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl p-4 animate-pulse">
              <div className="h-16 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeProjects = projects?.slice(0, 5) || [];

  return (
    <div className="lg:col-span-2 glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Project Pipeline</h3>
        <Link href="/admin/projects">
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium" data-testid="view-all-projects">
            View All <i className="fas fa-arrow-right ml-1"></i>
          </button>
        </Link>
      </div>
      
      <div className="space-y-4">
        {activeProjects.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-tasks text-4xl mb-4"></i>
            <p>No active projects</p>
          </div>
        ) : (
          activeProjects.map((project) => {
            const progress = calculateProgress(project);
            const dueDate = project.milestones.liveDate 
              ? new Date(project.milestones.liveDate).toLocaleDateString()
              : 'TBD';
            
            return (
              <Link key={project.id} href={`/admin/projects/${project.id}`}>
                <div 
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all group cursor-pointer"
                  data-testid={`project-${project.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <i className="fas fa-building text-white"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold group-hover:text-purple-400 transition-colors">
                          Project #{project.id.slice(-6)}
                        </h4>
                        <p className="text-sm text-gray-400 capitalize">{project.package} Package</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
                        {statusLabels[project.status]}
                      </span>
                      <span className="text-gray-400 text-sm">Due {dueDate}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
