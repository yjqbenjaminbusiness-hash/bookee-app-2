import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Play, Bot, MessageSquare, ArrowRight, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function DemoPage() {
  const navigate = useNavigate();

  const labelMapping: Record<string, string> = {
    'organizer': 'Launch Demo',
    'player': 'Launch Demo',
    'chat-org': 'Open Bot',
    'chat-player': 'Open Bot'
  };

  const demoOptions = [
    {
      id: 'organizer',
      title: 'Organizer Demo',
      description: 'Manage events, players, and payments.',
      icon: ShieldCheck,
      color: '#1A7A4A',
      path: '/demo/organizer'
    },
    {
      id: 'player',
      title: 'Player Demo',
      description: 'Discover and join activities.',
      icon: Users,
      color: '#1A7A4A',
      path: '/demo/player'
    },
    {
      id: 'chat-org',
      title: 'Organizer Chat',
      description: 'Bot assisted hosting.',
      icon: Bot,
      color: '#7C3AED',
      path: '/demo/chat?role=organizer'
    },
    {
      id: 'chat-player',
      title: 'Player Chat',
      description: 'Bot assisted discovery.',
      icon: MessageSquare,
      color: '#7C3AED',
      path: '/demo/chat?role=player'
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="container max-w-4xl space-y-10">
        <div className="text-center space-y-3">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: 'Lora, serif' }}
          >
            Experience Bookee
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto"
          >
            Explore our isolated sandbox environment in a 4-quadrant simulation.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-2xl mx-auto">
          {demoOptions.map((option, idx) => (
            <motion.div 
              key={option.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center p-4 md:p-8 rounded-3xl bg-white shadow-xl border border-primary/5 hover:border-primary/20 hover:shadow-2xl transition-all group relative overflow-hidden aspect-square justify-center"
            >
              <div 
                className="p-3 md:p-5 rounded-2xl mb-2 md:mb-4 group-hover:scale-110 transition-transform shadow-inner"
                style={{ background: `${option.color}10` }}
              >
                <option.icon className="h-6 w-6 md:h-10 md:w-10" style={{ color: option.color }} />
              </div>
              <h2 className="text-sm md:text-xl font-bold mb-1 md:mb-2">{option.title}</h2>
              <p className="text-muted-foreground text-[10px] md:text-sm leading-relaxed max-w-[180px] hidden md:block">
                {option.description}
              </p>
              <Button 
                size="sm" 
                className="w-full rounded-xl font-bold text-[10px] md:text-sm h-8 md:h-12 mt-2 md:mt-4" 
                style={{ background: option.color, color: '#fff' }}
                onClick={() => navigate(option.path)}
              >
                {labelMapping[option.id]}
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Button variant="ghost" className="rounded-full font-bold text-primary text-sm" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}