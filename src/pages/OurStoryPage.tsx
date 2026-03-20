import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Rocket } from 'lucide-react';

export default function OurStoryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 pt-20 pb-20 px-4">
      <div className="container max-w-3xl space-y-12">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary mb-6"
          >
            <Heart className="h-10 w-10 fill-current" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight"
            style={{ fontFamily: 'Lora, serif' }}
          >
            Our Story
          </motion.h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-primary/5 space-y-8 text-lg leading-relaxed text-muted-foreground"
        >
          <p className="text-foreground font-medium">
            Bookee started from a simple idea — <span className="text-primary font-bold italic">Live More, Work Less.</span>
          </p>

          <p>
            Organizing activities shouldn’t feel so exhausting and time consuming. We noticed too much time is spent managing chats, tracking players, and chasing payments.
          </p>

          <div className="bg-primary/5 p-6 rounded-2xl border-l-4 border-primary">
            <p className="text-foreground italic">
              So we built Bookee to help people focus more on <strong className="text-primary">FUN</strong> and less on <strong className="text-primary">ADMIN</strong>.
            </p>
          </div>

          <p className="text-center text-xl font-bold text-foreground py-4">
            Play more. Enjoy More, Worry less.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button 
              size="lg" 
              className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              onClick={() => navigate('/player/events')}
            >
              <Sparkles className="mr-2 h-5 w-5" /> Explore Activities
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest border-2"
              onClick={() => navigate('/demo')}
            >
              <Rocket className="mr-2 h-5 w-5" /> Try the Demo
            </Button>
          </div>
        </motion.div>

        <div className="text-center text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
          Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for the sports community.
        </div>
      </div>
    </div>
  );
}
