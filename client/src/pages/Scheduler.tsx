import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  company: z.string().min(2, 'Company name is required'),
  phone: z.string().optional(),
  meetingType: z.string().min(1, 'Please select meeting type'),
  timezone: z.string().min(1, 'Please select your timezone'),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'
];

const timezones = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney'
];

export default function Scheduler() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const { toast } = useToast();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
      meetingType: '',
      timezone: 'America/New_York',
      notes: '',
    },
  });

  useEffect(() => {
    if (selectedDate) {
      // Simulate available slots based on selected date
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setAvailableSlots([]); // No weekend slots
      } else {
        // Random available slots for demo
        const slots = timeSlots.filter(() => Math.random() > 0.3);
        setAvailableSlots(slots);
      }
    }
  }, [selectedDate]);

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time for your meeting.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // TODO: Replace with actual Firebase function call
      const response = await fetch('/api/meetings/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: selectedDate.toISOString(),
          time: selectedTime,
        }),
      });

      if (!response.ok) throw new Error('Booking failed');

      setIsBooked(true);
      toast({
        title: 'Meeting Scheduled!',
        description: 'Your discovery call has been booked. Check your email for calendar details.',
      });
    } catch (error) {
      toast({
        title: 'Booking Failed',
        description: 'Please try again or contact us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBooked) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20"></div>
        
        <Card className="glass border border-gray-800 w-full max-w-2xl relative text-center">
          <CardContent className="pt-12 pb-12">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-calendar-check text-white text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold mb-4">Meeting Scheduled!</h1>
            <p className="text-gray-400 mb-6 text-lg">
              Your discovery call has been booked successfully. You'll receive a calendar invitation 
              with meeting details and preparation materials shortly.
            </p>
            <div className="glass rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold mb-4">Meeting Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <i className="fas fa-calendar text-purple-400 mr-3 w-4"></i>
                  <span>{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-clock text-purple-400 mr-3 w-4"></i>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-video text-purple-400 mr-3 w-4"></i>
                  <span>Google Meet link will be sent via email</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-user text-purple-400 mr-3 w-4"></i>
                  <span>30-minute discovery call</span>
                </div>
              </div>
            </div>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
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

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Schedule Discovery Call
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Book a 30-minute call to discuss your project goals, timeline, and how we can help bring your vision to life.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar Section */}
          <Card className="glass border border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">Select Date & Time</CardTitle>
              <p className="text-gray-400">Choose your preferred meeting date and time</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const today = new Date();
                  const dayOfWeek = date.getDay();
                  return date < today || dayOfWeek === 0 || dayOfWeek === 6; // Disable past dates and weekends
                }}
                className="rounded-md border border-gray-700"
                data-testid="date-calendar"
              />
              
              {selectedDate && (
                <div>
                  <h3 className="font-semibold mb-3">
                    Available times for {selectedDate.toLocaleDateString()}
                  </h3>
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-400 text-sm">No available slots for this date</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className={selectedTime === time 
                            ? "bg-gradient-to-r from-purple-500 to-cyan-500" 
                            : "border-gray-600 hover:border-purple-500"
                          }
                          data-testid={`time-slot-${time.replace(/[:\s]/g, '-')}`}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card className="glass border border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl">Your Information</CardTitle>
              <p className="text-gray-400">Tell us about yourself and your project</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              data-testid="booking-name-input"
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
                              placeholder="Acme Corp"
                              className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                              data-testid="booking-company-input"
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
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@acme.com"
                              className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                              data-testid="booking-email-input"
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
                              data-testid="booking-phone-input"
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
                      name="meetingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger 
                                className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                                data-testid="meeting-type-select"
                              >
                                <SelectValue placeholder="Select meeting type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              <SelectItem value="discovery">Discovery Call</SelectItem>
                              <SelectItem value="consultation">Project Consultation</SelectItem>
                              <SelectItem value="demo">Product Demo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger 
                                className="bg-gray-800/50 border-gray-700 focus:border-purple-500"
                                data-testid="timezone-select"
                              >
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-800 border-gray-700">
                              {timezones.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your project or any specific topics you'd like to discuss..."
                            className="bg-gray-800/50 border-gray-700 focus:border-purple-500 h-24"
                            data-testid="booking-notes-textarea"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || !selectedDate || !selectedTime}
                    className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                    data-testid="book-meeting-button"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Booking...
                      </>
                    ) : (
                      <>
                        Book Meeting <i className="fas fa-calendar-check ml-2"></i>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
