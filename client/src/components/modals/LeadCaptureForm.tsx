import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createLead } from '@/lib/firestore';
import type { Lead } from '@shared/schema';

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  notes: z.string().optional(),
  budgetRange: z.string(),
  source: z.string().default('manual'),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadCaptureFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadCaptureForm({ isOpen, onClose }: LeadCaptureFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      notes: '',
      budgetRange: '',
      source: 'manual',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const leadData: Omit<Lead, 'id'> = {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone || '',
        source: data.source,
        notes: `${data.notes || ''}\nBudget: ${data.budgetRange}`,
        leadFingerprint: `${data.email.toLowerCase()}-${data.company.toLowerCase()}`,
        utm: {},
        score: 50, // Default score, would be calculated by AI
        status: 'new',
        bookedMeetingId: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isDeleted: false,
      };

      return await createLead(leadData);
    },
    onSuccess: () => {
      toast({
        title: 'Lead Created',
        description: 'New lead has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please try again.',
        variant: 'destructive',
      });
      console.error('Lead creation error:', error);
    },
  });

  const onSubmit = (data: LeadFormData) => {
    createLeadMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border border-gray-800">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">New Lead</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        className="bg-gray-800/50 border-gray-700 focus:border-purple-500" 
                        data-testid="lead-name-input"
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
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Acme Corp" 
                        className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                        data-testid="lead-company-input"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@company.com" 
                        className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                        data-testid="lead-email-input"
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
                        data-testid="lead-phone-input"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your project needs..." 
                      className="bg-gray-800/50 border-gray-700 focus:border-purple-500 h-24"
                      data-testid="lead-notes-textarea"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                        data-testid="lead-budget-select"
                      >
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="50k+">$50,000+</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-4">
              <Button 
                type="button" 
                variant="secondary" 
                className="flex-1"
                onClick={onClose}
                data-testid="cancel-lead-button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                disabled={createLeadMutation.isPending}
                data-testid="create-lead-button"
              >
                {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
