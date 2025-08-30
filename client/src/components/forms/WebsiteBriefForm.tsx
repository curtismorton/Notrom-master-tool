import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { WebsiteBrief } from '@shared/schema';

const websiteBriefSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  industry: z.string().min(2, 'Industry is required'),
  targetAudience: z.string().min(10, 'Please describe your target audience'),
  goals: z.array(z.string()).min(1, 'Select at least one goal'),
  competitors: z.array(z.string()).optional(),
  brandPersonality: z.string().min(5, 'Describe your brand personality'),
  preferredColors: z.array(z.string()).optional(),
  contentNeeds: z.array(z.string()).min(1, 'Select content needs'),
  specialRequirements: z.string().optional(),
});

type WebsiteBriefFormData = z.infer<typeof websiteBriefSchema>;

const goalOptions = [
  'Generate more leads',
  'Increase online sales',
  'Build brand awareness',
  'Showcase portfolio/work',
  'Provide customer support',
  'Educate audience',
  'Collect customer data',
  'Improve user experience'
];

const contentOptions = [
  'Homepage copy',
  'About page content',
  'Service descriptions',
  'Product descriptions',
  'Blog content strategy',
  'Case studies',
  'Testimonials strategy',
  'FAQ content',
  'Legal pages',
  'Contact information'
];

const colorOptions = [
  'Blue', 'Green', 'Purple', 'Red', 'Orange', 'Yellow', 
  'Pink', 'Teal', 'Gray', 'Black', 'White', 'Gold'
];

interface WebsiteBriefFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  projectId?: string;
}

export default function WebsiteBriefForm({ isOpen, onClose, clientId, projectId }: WebsiteBriefFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [competitorInput, setCompetitorInput] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);

  const form = useForm<WebsiteBriefFormData>({
    resolver: zodResolver(websiteBriefSchema),
    defaultValues: {
      businessName: '',
      industry: '',
      targetAudience: '',
      goals: [],
      competitors: [],
      brandPersonality: '',
      preferredColors: [],
      contentNeeds: [],
      specialRequirements: '',
    },
  });

  const createBriefMutation = useMutation({
    mutationFn: async (data: WebsiteBriefFormData) => {
      const briefData: Omit<WebsiteBrief, 'id'> = {
        clientId: clientId || 'demo-client',
        projectId,
        businessName: data.businessName,
        industry: data.industry,
        targetAudience: data.targetAudience,
        goals: data.goals,
        competitors: competitors,
        brandPersonality: data.brandPersonality,
        preferredColors: data.preferredColors || [],
        contentNeeds: data.contentNeeds,
        specialRequirements: data.specialRequirements || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // In demo mode, just return success
      return { id: `brief-${Date.now()}`, ...briefData };
    },
    onSuccess: () => {
      toast({
        title: 'Website Brief Created',
        description: 'Your website planning brief has been saved. AI content generation will begin shortly.',
      });
      form.reset();
      setCompetitors([]);
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/briefs'] });
    },
  });

  const addCompetitor = () => {
    if (competitorInput.trim() && !competitors.includes(competitorInput.trim())) {
      setCompetitors([...competitors, competitorInput.trim()]);
      setCompetitorInput('');
    }
  };

  const removeCompetitor = (competitor: string) => {
    setCompetitors(competitors.filter(c => c !== competitor));
  };

  const handleSubmit = (data: WebsiteBriefFormData) => {
    createBriefMutation.mutate({
      ...data,
      competitors
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Website Planning Brief
          </DialogTitle>
          <p className="text-gray-400">
            Tell us about your business so we can create the perfect website plan with AI-generated copy and content strategy.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Your Company Name"
                        data-testid="input-business-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g. E-commerce, Healthcare, Technology"
                        data-testid="input-industry"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe your ideal customers: demographics, interests, pain points, buying behavior..."
                      rows={3}
                      data-testid="textarea-target-audience"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website Goals (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {goalOptions.map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal}`}
                          checked={field.value?.includes(goal)}
                          onCheckedChange={(checked) => {
                            const updatedGoals = checked
                              ? [...(field.value || []), goal]
                              : (field.value || []).filter((g) => g !== goal);
                            field.onChange(updatedGoals);
                          }}
                          data-testid={`checkbox-goal-${goal.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <label 
                          htmlFor={`goal-${goal}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {goal}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium">Competitors (Optional)</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  placeholder="Enter competitor website or company name"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  data-testid="input-competitor"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addCompetitor}
                  data-testid="button-add-competitor"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {competitors.map((competitor) => (
                  <Badge 
                    key={competitor} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeCompetitor(competitor)}
                    data-testid={`badge-competitor-${competitor.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {competitor} ×
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="brandPersonality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Personality</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="How would you describe your brand? (e.g. Professional and trustworthy, Fun and energetic, Innovative and cutting-edge...)"
                      rows={2}
                      data-testid="textarea-brand-personality"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredColors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Colors (Optional)</FormLabel>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {colorOptions.map((color) => (
                      <div key={color} className="flex items-center space-x-2">
                        <Checkbox
                          id={`color-${color}`}
                          checked={field.value?.includes(color)}
                          onCheckedChange={(checked) => {
                            const updatedColors = checked
                              ? [...(field.value || []), color]
                              : (field.value || []).filter((c) => c !== color);
                            field.onChange(updatedColors);
                          }}
                          data-testid={`checkbox-color-${color.toLowerCase()}`}
                        />
                        <label 
                          htmlFor={`color-${color}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {color}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Needs (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {contentOptions.map((content) => (
                      <div key={content} className="flex items-center space-x-2">
                        <Checkbox
                          id={`content-${content}`}
                          checked={field.value?.includes(content)}
                          onCheckedChange={(checked) => {
                            const updatedContent = checked
                              ? [...(field.value || []), content]
                              : (field.value || []).filter((c) => c !== content);
                            field.onChange(updatedContent);
                          }}
                          data-testid={`checkbox-content-${content.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <label 
                          htmlFor={`content-${content}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {content}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requirements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Any specific features, integrations, or requirements? (e.g. e-commerce, booking system, multi-language...)"
                      rows={3}
                      data-testid="textarea-special-requirements"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel-brief"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createBriefMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                data-testid="button-submit-brief"
              >
                {createBriefMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating Plan...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Generate Website Plan
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}