import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateWebsitePlan } from '@/lib/websitePlanner';
import WebsiteBriefForm from '@/components/forms/WebsiteBriefForm';
import type { WebsiteBrief, WebsitePlan } from '@shared/schema';

// Demo data for development
const mockBriefs: WebsiteBrief[] = [
  {
    id: 'brief-1',
    clientId: 'client-1',
    projectId: 'project-1',
    businessName: 'TechFlow Solutions',
    industry: 'Software Development',
    targetAudience: 'Small to medium businesses looking for custom software solutions',
    goals: ['Generate more leads', 'Build brand awareness', 'Showcase portfolio/work'],
    competitors: ['competitor1.com', 'rival-tech.com'],
    brandPersonality: 'Professional, innovative, and reliable with a modern tech-forward approach',
    preferredColors: ['Blue', 'Gray', 'White'],
    contentNeeds: ['Homepage copy', 'About page content', 'Service descriptions', 'Case studies'],
    specialRequirements: 'Need integration with CRM system and client portal',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now()
  }
];

const mockPlans: Record<string, WebsitePlan> = {
  'brief-1': {
    id: 'plan-1',
    briefId: 'brief-1',
    copyPlan: {
      homepage: {
        headline: 'Custom Software That Drives Results',
        subheadline: 'Transform your business with tailored solutions that scale',
        heroDescription: 'We build powerful, scalable software that solves real business problems. From web applications to mobile apps, our expert team delivers solutions that grow with your business.',
        ctaText: 'Start Your Project'
      },
      about: {
        story: 'Founded by experienced developers who understand the challenges of growing businesses, TechFlow Solutions bridges the gap between complex technology and practical business needs.',
        mission: 'To empower businesses with custom software solutions that drive growth and efficiency.',
        values: ['Innovation', 'Reliability', 'Partnership']
      },
      services: [
        {
          name: 'Custom Web Development',
          description: 'Scalable web applications built with modern frameworks',
          benefits: ['Fast loading times', 'Mobile responsive', 'SEO optimized']
        },
        {
          name: 'Mobile App Development',
          description: 'Native and cross-platform mobile solutions',
          benefits: ['Cross-platform compatibility', 'Offline functionality', 'Push notifications']
        }
      ],
      testimonials: {
        strategy: 'Focus on specific results and ROI achieved for clients',
        sampleQuestions: ['What specific results did you achieve?', 'How did this impact your business?', 'Would you recommend us to others?']
      }
    },
    assetRequirements: {
      photography: ['Team headshots', 'Office environment', 'Product screenshots'],
      graphics: ['Company logo variations', 'Service icons', 'Process infographics'],
      videos: ['Company introduction video', 'Service explanation videos'],
      documents: ['Case study PDFs', 'Service brochures', 'Technical specifications']
    },
    contentStrategy: {
      brandVoice: 'Professional yet approachable, confident without being arrogant',
      tonalGuidelines: ['Use active voice', 'Focus on benefits over features', 'Include social proof'],
      messagingPillars: ['Expertise', 'Results', 'Partnership'],
      contentPriorities: ['Lead generation', 'Trust building', 'Portfolio showcase']
    },
    technicalSpecs: {
      features: ['Contact forms', 'Portfolio showcase', 'Client testimonials', 'Blog system'],
      integrations: ['CRM integration', 'Analytics tracking', 'Email marketing'],
      performanceTargets: ['Page load under 3 seconds', '95+ Lighthouse score', 'Mobile-first design']
    },
    status: 'approved',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now()
  }
};

export default function WebsitePlanner() {
  const [showBriefForm, setShowBriefForm] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<WebsiteBrief | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // In demo mode, just use mock data
  const briefs = mockBriefs;

  const handleGeneratePlan = async (brief: WebsiteBrief) => {
    setGeneratingPlan(true);
    try {
      // This would call the AI service
      // const plan = await generateWebsitePlan(brief);
      // For demo, just use mock data
      setTimeout(() => {
        setGeneratingPlan(false);
        setSelectedBrief(brief);
      }, 2000);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      setGeneratingPlan(false);
    }
  };

  const selectedPlan = selectedBrief ? mockPlans[selectedBrief.id] : null;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Website Planning</h3>
            <p className="text-gray-400 text-sm">AI-powered content and asset planning for client websites</p>
          </div>
          <Button 
            onClick={() => setShowBriefForm(true)}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            data-testid="button-new-brief"
          >
            <i className="fas fa-plus mr-2"></i>
            New Website Brief
          </Button>
        </div>

        {briefs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-clipboard-list text-4xl mb-4"></i>
            <p>No website briefs yet</p>
            <p className="text-sm">Create your first brief to start AI-powered planning</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {briefs.map((brief) => (
              <Card key={brief.id} className="glass border-gray-800 hover:border-purple-500/50 transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{brief.businessName}</CardTitle>
                  <p className="text-sm text-gray-400">{brief.industry}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Goals:</p>
                    <div className="flex flex-wrap gap-1">
                      {brief.goals.slice(0, 2).map((goal) => (
                        <Badge key={goal} variant="outline" className="text-xs">
                          {goal}
                        </Badge>
                      ))}
                      {brief.goals.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{brief.goals.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-xs text-gray-400">
                      {new Date(brief.createdAt).toLocaleDateString()}
                    </span>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedBrief(brief)}
                        data-testid={`button-view-plan-${brief.id}`}
                      >
                        View Plan
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleGeneratePlan(brief)}
                        disabled={generatingPlan}
                        data-testid={`button-generate-plan-${brief.id}`}
                      >
                        {generatingPlan ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-magic"></i>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Website Plan Display */}
      {selectedPlan && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">Website Plan: {selectedBrief?.businessName}</h3>
              <Badge 
                variant={selectedPlan.status === 'approved' ? 'default' : 'secondary'}
                className="mt-2"
              >
                {selectedPlan.status}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedBrief(null)}
              data-testid="button-close-plan"
            >
              <i className="fas fa-times mr-2"></i>
              Close
            </Button>
          </div>

          <Tabs defaultValue="copy" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="copy" data-testid="tab-copy">Copy Plan</TabsTrigger>
              <TabsTrigger value="assets" data-testid="tab-assets">Assets</TabsTrigger>
              <TabsTrigger value="strategy" data-testid="tab-strategy">Strategy</TabsTrigger>
              <TabsTrigger value="technical" data-testid="tab-technical">Technical</TabsTrigger>
            </TabsList>

            <TabsContent value="copy" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Homepage Copy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Headline</p>
                      <p className="text-lg font-semibold">{selectedPlan.copyPlan.homepage.headline}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Subheadline</p>
                      <p>{selectedPlan.copyPlan.homepage.subheadline}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Description</p>
                      <p className="text-sm text-gray-300">{selectedPlan.copyPlan.homepage.heroDescription}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Call to Action</p>
                      <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500">
                        {selectedPlan.copyPlan.homepage.ctaText}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">About Section</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Brand Story</p>
                      <p className="text-sm text-gray-300">{selectedPlan.copyPlan.about.story}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Mission</p>
                      <p className="text-sm text-gray-300">{selectedPlan.copyPlan.about.mission}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Core Values</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlan.copyPlan.about.values.map((value) => (
                          <Badge key={value} variant="outline">{value}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Services Copy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedPlan.copyPlan.services.map((service, index) => (
                      <div key={index} className="border border-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{service.name}</h4>
                        <p className="text-sm text-gray-300 mb-3">{service.description}</p>
                        <div>
                          <p className="text-xs font-medium text-purple-400 mb-2">Key Benefits:</p>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {service.benefits.map((benefit, i) => (
                              <li key={i}>• {benefit}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(selectedPlan.assetRequirements).map(([category, items]) => (
                  <Card key={category} className="glass border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-lg capitalize">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {items.map((item, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <i className="fas fa-circle text-purple-400 text-xs mr-3"></i>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Brand Voice & Messaging</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Brand Voice</p>
                      <p className="text-sm text-gray-300">{selectedPlan.contentStrategy.brandVoice}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Messaging Pillars</p>
                      <div className="space-y-1">
                        {selectedPlan.contentStrategy.messagingPillars.map((pillar) => (
                          <Badge key={pillar} variant="outline" className="mr-2">
                            {pillar}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-400 mb-2">Tonal Guidelines</p>
                      <ul className="text-sm text-gray-300 space-y-1">
                        {selectedPlan.contentStrategy.tonalGuidelines.map((guideline, index) => (
                          <li key={index}>• {guideline}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Content Priorities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedPlan.contentStrategy.contentPriorities.map((priority, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{priority}</span>
                          <Badge variant="outline">Priority {index + 1}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPlan.technicalSpecs.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <i className="fas fa-check text-green-400 text-xs mr-3"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Integrations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPlan.technicalSpecs.integrations.map((integration, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <i className="fas fa-plug text-cyan-400 text-xs mr-3"></i>
                          {integration}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="glass border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Targets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedPlan.technicalSpecs.performanceTargets.map((target, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <i className="fas fa-target text-orange-400 text-xs mr-3"></i>
                          {target}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <WebsiteBriefForm
        isOpen={showBriefForm}
        onClose={() => setShowBriefForm(false)}
        clientId="demo-client"
      />
    </div>
  );
}