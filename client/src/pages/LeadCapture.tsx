import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const leadCaptureSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  projectType: z.string().min(1, 'Please select a project type'),
  timeline: z.string().min(1, 'Please select a timeline'),
  budget: z.string().min(1, 'Please select a budget range'),
  details: z.string().min(10, 'Please provide more details about your project'),
});

type LeadCaptureFormData = z.infer<typeof leadCaptureSchema>;

export default function LeadCapture() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadCaptureFormData>({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      projectType: '',
      timeline: '',
      budget: '',
      details: '',
    },
  });

  const onSubmit = async (data: LeadCaptureFormData) => {
    try {
      setIsSubmitting(true);
      
      // TODO: Replace with actual Firebase function call
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: 'website',
          utm: {
            source: new URLSearchParams(window.location.search).get('utm_source'),
            medium: new URLSearchParams(window.location.search).get('utm_medium'),
            campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          }
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      setIsSubmitted(true);
      toast({
        title: 'Thank you for your interest!',
        description: 'We\'ll be in touch within 24 hours to discuss your project.',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20"></div>
        
        <Card className="glass border border-gray-800 w-full max-w-2xl relative text-center">
          <CardContent className="pt-12 pb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-gray-400 mb-8 text-lg">
              We've received your project details and will be in touch within 24 hours 
              to schedule a discovery call and discuss how we can help bring your vision to life.
            </p>
            <div className="space-y-4">
              <div className="glass rounded-lg p-4 text-left">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-center">
                    <i className="fas fa-clock text-purple-400 mr-2"></i>
                    We'll review your project within 24 hours
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-phone text-purple-400 mr-2"></i>
                    Schedule a 30-minute discovery call
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-file-contract text-purple-400 mr-2"></i>
                    Receive a custom proposal and timeline
                  </li>
                </ul>
              </div>
            </div>
            <Link href="/">
              <Button className="mt-6 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
                Return Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20"></div>
      
      {/* Navigation */}
      <nav className="relative max-w-7xl mx-auto py-6">
        <Link href="/">
          <div className="flex items-center space-x-3 cursor-pointer" data-testid="nav-home">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <i className="fas fa-bolt text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Notrom
            </h1>
          </div>
        </Link>
      </nav>

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Start Your Project
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tell us about your vision and we'll create a custom solution that exceeds your expectations.
          </p>
        </div>

        <Card className="glass border border-gray-800 relative">
          <CardHeader>
            <CardTitle className="text-2xl">Project Details</CardTitle>
            <p className="text-gray-400">
              Share your project requirements and we'll get back to you with a personalized proposal.
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                            data-testid="name-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Corporation"
                            className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                            data-testid="company-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@acme.com"
                            className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                            data-testid="email-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                            data-testid="phone-input"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger 
                              className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                              data-testid="project-type-select"
                            >
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="website">New Website</SelectItem>
                            <SelectItem value="redesign">Website Redesign</SelectItem>
                            <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                            <SelectItem value="webapp">Web Application</SelectItem>
                            <SelectItem value="landing">Landing Page</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeline *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger 
                              className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                              data-testid="timeline-select"
                            >
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="asap">ASAP (Rush)</SelectItem>
                            <SelectItem value="1-2weeks">1-2 weeks</SelectItem>
                            <SelectItem value="1month">1 month</SelectItem>
                            <SelectItem value="2-3months">2-3 months</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger 
                              className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                              data-testid="budget-select"
                            >
                              <SelectValue placeholder="Select budget" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="5-10k">$5,000 - $10,000</SelectItem>
                            <SelectItem value="10-25k">$10,000 - $25,000</SelectItem>
                            <SelectItem value="25-50k">$25,000 - $50,000</SelectItem>
                            <SelectItem value="50-100k">$50,000 - $100,000</SelectItem>
                            <SelectItem value="100k+">$100,000+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Details *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your project goals, target audience, key features, design preferences, and any specific requirements..."
                          className="bg-gray-800/50 border-gray-700 focus:border-purple-500 min-h-32"
                          data-testid="details-textarea"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-center pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 px-12 py-6 text-lg"
                    data-testid="submit-project"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Project <i className="fas fa-paper-plane ml-2"></i>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
