import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: 'fas fa-rocket',
    title: 'Automated Lead Processing',
    description: 'Capture, score, and nurture leads with AI-powered automation'
  },
  {
    icon: 'fas fa-calendar-check',
    title: 'Smart Scheduling',
    description: 'Built-in scheduler with automated reminders and transcription'
  },
  {
    icon: 'fas fa-file-contract',
    title: 'Proposal Generation',
    description: 'AI-generated proposals with digital signatures and payment links'
  },
  {
    icon: 'fas fa-code-branch',
    title: 'Project Provisioning',
    description: 'Automatic GitHub repo and Vercel deployment setup'
  },
  {
    icon: 'fas fa-shield-alt',
    title: 'Monthly Care Plans',
    description: 'Automated maintenance with performance reports'
  },
  {
    icon: 'fas fa-headset',
    title: 'Support Automation',
    description: 'AI-powered ticket classification with SLA tracking'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="glass border-b border-gray-800 px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer" data-testid="home-logo">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <i className="fas fa-bolt text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Notrom
              </h1>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="nav-login">
                Sign In
              </Button>
            </Link>
            <Link href="/start">
              <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600" data-testid="nav-start">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-cyan-900/30"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Agency Automation
            <br />
            <span className="text-4xl md:text-6xl">Reimagined</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            From lead capture to monthly care, automate your entire web development agency with AI-powered workflows, smart scheduling, and seamless client experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/start">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-lg px-8 py-6"
                data-testid="hero-cta"
              >
                Start Your Project <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </Link>
            <Link href="/schedule">
              <Button 
                size="lg"
                variant="outline"
                className="border-gray-600 text-lg px-8 py-6"
                data-testid="hero-schedule"
              >
                Book a Demo <i className="fas fa-calendar ml-2"></i>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Complete Agency Automation
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Every step of your agency workflow, from first contact to ongoing maintenance, 
              automated with intelligent systems and beautiful client experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass border-gray-800 hover:border-purple-500/50 transition-all group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-cyan-500/30 transition-all">
                    <i className={`${feature.icon} text-xl text-purple-400 group-hover:text-purple-300`}></i>
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 border border-gray-800">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Ready to Transform Your Agency?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the future of web development agencies. Automate everything, 
              delight your clients, and scale beyond what you thought possible.
            </p>
            <Link href="/start">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-lg px-12 py-6"
                data-testid="cta-button"
              >
                Get Started Today <i className="fas fa-rocket ml-2"></i>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white"></i>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Notrom
            </span>
          </div>
          <p className="text-gray-400">
            © 2024 Notrom. All rights reserved. Automate everything, everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
