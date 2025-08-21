import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getClientById, getProjects, subscribeToProjects } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { Client, Project, Ticket } from '@shared/schema';

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
  intake: 'Project Setup',
  copy: 'Content Creation',
  design: 'Design Phase',
  build: 'Development',
  qa: 'Quality Assurance',
  review: 'Client Review',
  live: 'Live & Active',
  closed: 'Completed'
};

function calculateProgress(project: Project): number {
  const statusOrder = ['intake', 'copy', 'design', 'build', 'qa', 'review', 'live'];
  const currentIndex = statusOrder.indexOf(project.status);
  return Math.round(((currentIndex + 1) / statusOrder.length) * 100);
}

interface FileUploadProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

function FileUploadZone({ onUpload, uploading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
        dragActive 
          ? 'border-purple-500 bg-purple-500/10' 
          : 'border-gray-600 hover:border-purple-500'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,.pdf,.doc,.docx,.txt';
        input.onchange = handleFileSelect;
        input.click();
      }}
      data-testid="file-upload-zone"
    >
      {uploading ? (
        <div className="space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400">Uploading...</p>
        </div>
      ) : (
        <>
          <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-400 mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-gray-500">
            Supports images, documents, and brand assets (Max 10MB)
          </p>
        </>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketBody, setTicketBody] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery<Client | null>({
    queryKey: ['/api/clients', clientId],
    queryFn: () => getClientById(clientId!),
    enabled: !!clientId,
  });

  // Fetch projects for this client
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', clientId],
    queryFn: () => getProjects(clientId),
    enabled: !!clientId,
    refetchInterval: 10000,
  });

  // Check if user has access to this client
  useEffect(() => {
    if (!authLoading && user && user.role === 'client' && user.clientId !== clientId) {
      toast({
        title: 'Access Denied',
        description: 'You do not have access to this client portal.',
        variant: 'destructive',
      });
    }
  }, [user, clientId, authLoading, toast]);

  const handleFileUpload = async (file: File) => {
    if (!clientId || !user) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Create a reference to the file in Firebase Storage
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `clients/${clientId}/assets/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create asset record in Firestore
      // This would typically be done via a Cloud Function
      const assetData = {
        clientId,
        projectId: projects?.[0]?.id, // Associate with active project
        kind: file.type.startsWith('image/') ? 'media' : 'copy',
        storagePath: snapshot.ref.fullPath,
        externalUrl: downloadURL,
        status: 'draft',
        createdAt: Date.now(),
      };

      // TODO: Call Cloud Function to create asset record
      console.log('Asset uploaded:', assetData);

      toast({
        title: 'File Uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });

      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleTicketSubmit = async () => {
    if (!clientId || !ticketSubject.trim() || !ticketBody.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both subject and description.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmittingTicket(true);

      const ticketData = {
        clientId,
        projectId: projects?.[0]?.id,
        subject: ticketSubject,
        body: ticketBody,
        priority: 'medium' as const,
        status: 'open' as const,
        slaDueAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // TODO: Call Cloud Function to create ticket
      console.log('Ticket created:', ticketData);

      toast({
        title: 'Support Ticket Created',
        description: 'We\'ll respond within 24 hours.',
      });

      setTicketSubject('');
      setTicketBody('');
    } catch (error) {
      console.error('Ticket creation error:', error);
      toast({
        title: 'Failed to Create Ticket',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (authLoading || clientLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="glass rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h2 className="text-xl font-bold mb-2">Client Not Found</h2>
          <p className="text-gray-400">The requested client portal could not be found.</p>
        </div>
      </div>
    );
  }

  const activeProject = projects?.find(p => p.status !== 'closed');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20"></div>
      
      {/* Header */}
      <header className="relative glass border-b border-gray-800 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {client.company.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{client.company} Portal</h1>
                <p className="text-gray-400">Welcome back! Track your project progress below.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                {client.plan.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto p-8 space-y-8">
        {/* Project Status Overview */}
        {activeProject ? (
          <Card className="glass border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Project Status</span>
                <Badge className={statusColors[activeProject.status]}>
                  {statusLabels[activeProject.status]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Overall Progress</span>
                      <span>{calculateProgress(activeProject)}%</span>
                    </div>
                    <Progress value={calculateProgress(activeProject)} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Package</p>
                      <p className="text-white font-medium capitalize">{activeProject.package}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Technology</p>
                      <p className="text-white font-medium">{activeProject.tech}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Started</p>
                      <p className="text-white font-medium">
                        {new Date(activeProject.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Expected Launch</p>
                      <p className="text-white font-medium">
                        {activeProject.milestones.liveDate 
                          ? new Date(activeProject.milestones.liveDate).toLocaleDateString()
                          : 'TBD'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Project Links</h4>
                  {activeProject.stagingUrl && (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-600 hover:border-purple-500"
                      onClick={() => window.open(activeProject.stagingUrl, '_blank')}
                      data-testid="staging-link"
                    >
                      <i className="fas fa-eye mr-2"></i>
                      View Staging Site
                    </Button>
                  )}
                  {activeProject.productionUrl && (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-gray-600 hover:border-green-500"
                      onClick={() => window.open(activeProject.productionUrl, '_blank')}
                      data-testid="production-link"
                    >
                      <i className="fas fa-globe mr-2"></i>
                      View Live Site
                    </Button>
                  )}
                  {!activeProject.stagingUrl && !activeProject.productionUrl && (
                    <p className="text-gray-400 text-sm">
                      Links will appear here as your project progresses
                    </p>
                  )}
                </div>
              </div>

              {activeProject.clientNotes && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="font-semibold mb-2">Project Notes</h4>
                  <p className="text-gray-300 text-sm">{activeProject.clientNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-gray-800">
            <CardContent className="py-12 text-center">
              <i className="fas fa-rocket text-4xl text-gray-400 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No Active Projects</h3>
              <p className="text-gray-400">
                Your projects will appear here once development begins.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <CardTitle>Upload Project Assets</CardTitle>
              <p className="text-gray-400">
                Upload logos, brand guidelines, content, and other project materials
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone onUpload={handleFileUpload} uploading={uploading} />
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div>
                  <Progress value={uploadProgress} className="mb-2" />
                  <p className="text-sm text-gray-400">Uploading... {uploadProgress}%</p>
                </div>
              )}

              <div className="text-sm text-gray-400">
                <h4 className="font-medium mb-2">Supported file types:</h4>
                <ul className="space-y-1">
                  <li>• Images: JPG, PNG, SVG, GIF</li>
                  <li>• Documents: PDF, DOC, DOCX, TXT</li>
                  <li>• Brand assets: AI, PSD, SKETCH</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Support Ticket Creation */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <CardTitle>Get Support</CardTitle>
              <p className="text-gray-400">
                Need help or have questions? Create a support ticket below
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  placeholder="Brief description of your request"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                  data-testid="ticket-subject-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  placeholder="Please provide detailed information about your request or issue..."
                  value={ticketBody}
                  onChange={(e) => setTicketBody(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 focus:border-purple-500 h-32"
                  data-testid="ticket-body-textarea"
                />
              </div>

              <Button
                onClick={handleTicketSubmit}
                disabled={submittingTicket || !ticketSubject.trim() || !ticketBody.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                data-testid="submit-ticket-button"
              >
                {submittingTicket ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Support Request
                  </>
                )}
              </Button>

              <div className="text-sm text-gray-400">
                <p className="font-medium">Response times:</p>
                <ul className="mt-1 space-y-1">
                  <li>• General questions: 24 hours</li>
                  <li>• Technical issues: 12 hours</li>
                  <li>• Urgent matters: 4 hours</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Care Plan Information */}
        <Card className="glass border-gray-800">
          <CardHeader>
            <CardTitle>Your Care Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-shield-alt text-purple-400 text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Security Monitoring</h3>
                <p className="text-gray-400 text-sm">
                  24/7 monitoring and automatic security updates
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-tachometer-alt text-cyan-400 text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Performance Optimization</h3>
                <p className="text-gray-400 text-sm">
                  Monthly performance reports and optimizations
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-headset text-green-400 text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Priority Support</h3>
                <p className="text-gray-400 text-sm">
                  Direct access to our technical support team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
