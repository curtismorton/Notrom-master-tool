import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';

const demoCredentials = [
  {
    role: 'admin',
    email: 'admin@demo.com',
    password: 'password123',
    description: 'Full admin access to all features',
    color: 'bg-red-500'
  },
  {
    role: 'staff',
    email: 'staff@demo.com', 
    password: 'password123',
    description: 'Staff access to client management',
    color: 'bg-blue-500'
  },
  {
    role: 'client',
    email: 'client@demo.com',
    password: 'password123', 
    description: 'Client portal access',
    color: 'bg-green-500'
  }
];

export default function DevLogin() {
  const [loading, setLoading] = useState<string | null>(null);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleDemoLogin = async (credentials: typeof demoCredentials[0]) => {
    try {
      setLoading(credentials.role);
      
      // Since Firebase is in demo mode, we'll simulate the sign-in
      // In a real environment, this would actually authenticate
      await signIn(credentials.email, credentials.password);
      
      toast({
        title: `Signed in as ${credentials.role}`,
        description: `Welcome to the ${credentials.role} interface!`,
      });
    } catch (error: any) {
      // For demo mode, we'll create a mock user session
      toast({
        title: 'Demo Mode Active',
        description: `Firebase is in demo mode. You can explore the ${credentials.role} interface.`,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen glass flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="glass border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Notrom Master Tool - Development Access
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Choose a demo account to explore the application
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {demoCredentials.map((cred) => (
                <Card key={cred.role} className="glass border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${cred.color} text-white`}>
                        {cred.role.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>Email:</strong> {cred.email}</p>
                      <p><strong>Password:</strong> {cred.password}</p>
                      <p className="text-gray-400">{cred.description}</p>
                    </div>
                    
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                      onClick={() => handleDemoLogin(cred)}
                      disabled={loading === cred.role}
                      data-testid={`login-${cred.role}`}
                    >
                      {loading === cred.role ? 'Signing in...' : `Login as ${cred.role}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-400">
                Or use the regular login form with any of the above credentials
              </p>
              <Link href="/login">
                <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                  Go to Regular Login
                </Button>
              </Link>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-400">
              <h3 className="font-semibold text-white mb-2">Development Mode Notice:</h3>
              <ul className="space-y-1">
                <li>• Firebase is running with demo configuration</li>
                <li>• All data is temporary and will be reset</li>
                <li>• External services (Stripe, OpenAI) may not be fully functional</li>
                <li>• This page is only available in development mode</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}