import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';



const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  activitySize: z.string({ required_error: 'Please select an activity size.' }),
  organizeFrequency: z.string({ required_error: 'Please select an organization frequency.' }),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to participate in the beta.',
  }),
});

export function BetaRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      activitySize: '',
      organizeFrequency: '',
      consent: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // TODO: Replace with Supabase insert when backend is connected
      console.log('Beta registration:', values);
      toast.success('Thanks! We\'ll reach out to invite you for early beta testing.');
      form.reset();
    } catch (error: any) {
      console.error('Beta registration error:', error);
      toast.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div id="beta-form" className="max-w-md mx-auto p-8 rounded-3xl bg-white shadow-xl border border-primary/10">
      <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'Lora, serif' }}>Register for Beta</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="activitySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Average Activity Size</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      {...field}
                    >
                      <option value="">Select size...</option>
                      <option value="5-10">5–10 players</option>
                      <option value="10-20">10–20 players</option>
                      <option value="20-50">20–50 players</option>
                      <option value="50+">50+ players</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizeFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How often do you organize per month?</FormLabel>
                  <FormControl>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      {...field}
                    >
                      <option value="">Select frequency...</option>
                      <option value="1-2">1–2 times</option>
                      <option value="3-5">3–5 times</option>
                      <option value="6-10">6–10 times</option>
                      <option value="10+">10+ times</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    I consent to my data being stored for beta testing updates in accordance with PDPA.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full py-6 rounded-xl font-bold" 
            style={{ background: '#1A7A4A', color: '#fff' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register for Beta'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
