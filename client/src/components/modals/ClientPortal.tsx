import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ClientPortalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export default function ClientPortal({ isOpen, onClose, projectId }: ClientPortalProps) {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (files: FileList) => {
    // Simulate file upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  if (!user || user.role !== 'client') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Client Portal - {user.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-6">
          {/* Project Status */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Your Project Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Design Phase</span>
                <span className="text-purple-400 font-medium">In Progress</span>
              </div>
              <Progress value={65} className="h-3" />
              <p className="text-sm text-gray-400">
                Your design mockups are being finalized. Expected completion: December 15th
              </p>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card className="glass border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Upload Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-purple-500 transition-colors cursor-pointer"
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (files.length > 0) handleFileUpload(files);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    if (target.files) handleFileUpload(target.files);
                  };
                  input.click();
                }}
                data-testid="file-upload-zone"
              >
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-400 mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-gray-500">Supports images, documents, and brand assets</p>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <Progress value={uploadProgress} />
                  <p className="text-sm text-gray-400 mt-2">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Support Tickets */}
          <Card className="glass border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Support Tickets</CardTitle>
              <Button 
                className="bg-purple-500 hover:bg-purple-600"
                data-testid="new-ticket-button"
              >
                New Ticket
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Logo placement question</h4>
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                      Resolved
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Need guidance on logo placement for mobile version
                  </p>
                </div>
                <div className="text-center py-8 text-gray-400">
                  <i className="fas fa-ticket-alt text-2xl mb-2"></i>
                  <p>No open tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
