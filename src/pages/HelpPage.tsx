import { MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

export default function HelpPage() {
  return (
    <div className="container py-20 px-4 max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: 'Lora, serif' }}>
          How can we help?
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Need assistance with your booking, or have feedback for our development team? We're here to help.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-primary/5 p-12 rounded-[2.5rem] text-center space-y-6 border-2 border-primary/5"
      >
        <MessageSquare className="h-12 w-12 text-primary mx-auto opacity-20" />
        <h2 className="text-3xl font-bold" style={{ fontFamily: 'Lora, serif' }}>Join our Beta Community</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Help us build the future of sports booking in Singapore. We value every bit of feedback from our early users.
        </p>
        <Button 
          variant="outline" 
          className="rounded-full px-8 font-bold border-primary text-primary hover:bg-primary/10"
          onClick={() => window.open('mailto:yjqbenjaminbusiness@gmail.com')}
        >
          Send Feedback
        </Button>
      </motion.div>
    </div>
  );
}
