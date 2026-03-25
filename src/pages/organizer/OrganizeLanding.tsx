import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Users, Calendar, ArrowLeft, Image } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrganizeLanding() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login?redirect=/organize');
    return null;
  }

  return (
    <div className="container py-10 px-4 max-w-3xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground">Organize</h1>
        <p className="text-muted-foreground mt-2">What would you like to create?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg transition-all h-full"
            onClick={() => navigate('/organizer/groups')}
          >
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Create Group</h2>
                <p className="text-sm text-muted-foreground">
                  Build a sports community. Name your group and add a photo banner.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card
            className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg transition-all h-full"
            onClick={() => navigate('/organizer/create-event-type')}
          >
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Create Event</h2>
                <p className="text-sm text-muted-foreground">
                  Set up an activity session or ballot group for your community.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
