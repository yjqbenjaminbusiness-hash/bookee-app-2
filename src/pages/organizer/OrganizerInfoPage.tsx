import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { motion } from 'framer-motion';
import { Plus, Users, ShieldCheck, Zap, Calendar, ArrowRight } from 'lucide-react';

export default function OrganizerInfoPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full bg-white">
      <section className="relative py-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A7A4A 0%, #0d5c35 100%)' }}>
        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight" style={{ fontFamily: 'Lora, serif' }}>
              Built for Community Leaders
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Bookee helps you manage your sports sessions, track player list, and collect payments effortlessly.
              All organizers must be verified by our MAS regulated payment provider to ensure a safe community.
            </p>
            <Button 
              size="lg" 
              className="px-10 py-7 rounded-full font-bold text-lg" 
              style={{ background: '#fff', color: '#1A7A4A' }}
              onClick={() => navigate('/signup/organizer')}
            >
              Apply to Start Organizing <Plus className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border-2 border-primary/10 hover:shadow-xl transition-all">
              <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-6">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Verified Status</h3>
              <p className="text-muted-foreground">
                Get a verified organizer badge once approved. Players trust verified organizers, leading to more bookings and higher attendance.
              </p>
            </div>
            <div className="p-8 rounded-3xl border-2 border-primary/10 hover:shadow-xl transition-all">
              <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Community Groups</h3>
              <p className="text-muted-foreground">
                Build your own sports groups. Manage member lists and notify players about upcoming activities directly through the platform.
              </p>
            </div>
            <div className="p-8 rounded-3xl border-2 border-primary/10 hover:shadow-xl transition-all">
              <div className="p-4 rounded-2xl bg-primary/10 w-fit mb-6">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Instant Tracking</h3>
              <p className="text-muted-foreground">
                Track payments and capacity in real-time. No more messy spreadsheets or manually checking PayNow references in your bank app.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold" style={{ fontFamily: 'Lora, serif' }}>
                Create Your First Activity Today
              </h2>
              <p className="text-muted-foreground">
                Set your venue, define multiple timeslots, and let Bookee handle the rest. We provide you with a structured booking bar for each slot.
              </p>
              <Button 
                onClick={() => navigate('/signup/organizer')}
                className="rounded-full font-bold px-8"
              >
                Join Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-primary/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">01</div>
                  <p className="font-bold">Register as Organizer</p>
                </div>
                <div className="flex items-center gap-4 mb-6 opacity-50">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold">02</div>
                  <p className="font-bold">Wait for Admin Approval</p>
                </div>
                <div className="flex items-center gap-4 opacity-50">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold">03</div>
                  <p className="font-bold">Create and Manage Activities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
