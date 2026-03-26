import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Clock, Shuffle, CalendarDays, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrganizeLanding() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login?redirect=/organize');
    return null;
  }

  const options = [
    {
      title: 'Activity Session',
      description: 'Create a bookable activity with timeslots, pricing, and payment policy.',
      icon: Clock,
      color: 'primary',
      route: '/organizer/create-event',
    },
    {
      title: 'Ballot Session',
      description: 'Create a ballot where users join and get randomly selected. No payment required.',
      icon: Shuffle,
      color: 'accent',
      route: '/organizer/create-ballot',
    },
    {
      title: 'Event Session',
      description: 'Create a one-off event with date, venue, and participant management.',
      icon: CalendarDays,
      color: 'secondary',
      route: '/organizer/create-event',
    },
  ];

  return (
    <div className="container py-10 px-4 max-w-4xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground">Create</h1>
        <p className="text-muted-foreground mt-2">What type of session would you like to create?</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {options.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Card
                className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg transition-all h-full"
                onClick={() => navigate(opt.route)}
              >
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className={`h-16 w-16 rounded-2xl bg-${opt.color}/10 flex items-center justify-center`}>
                    <Icon className={`h-8 w-8 text-${opt.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">{opt.title}</h2>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
