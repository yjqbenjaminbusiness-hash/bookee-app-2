import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowRight, Calendar, Users, Zap, ShieldCheck, MapPin, Star, CheckCircle2, Clock, Layers, Play, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import MemoriesCarousel from '../components/MemoriesCarousel';
import DemoTour from '../components/DemoTour';
import { BetaRegistrationForm } from '../components/BetaRegistrationForm';
import { useAuth } from '../hooks/useAuth';

const STATS = [
  { value: '500+', label: 'Active Players', color: '#7FFFC4' },
  { value: '120+', label: 'Events Hosted', color: '#7FFFC4' },
  { value: '98%', label: 'Satisfaction', color: '#7FFFC4' },
  { value: '30+', label: 'Venues', color: '#7FFFC4' },
];

const FEATURES = [
  {
    icon: <Calendar className="h-6 w-6" style={{ color: '#1A7A4A' }} />,
    title: 'Real-time Booking',
    description: 'Checklist-style timeslot booking with live capacity bars — see exactly who\'s playing.',
    badge: 'Live',
  },
  {
    icon: <Zap className="h-6 w-6" style={{ color: '#1A7A4A' }} />,
    title: 'Fast Payments',
    description: 'Scan the QR, include your unique reference, and your slot is auto-confirmed within minutes.',
    badge: 'Instant',
  },
  {
    icon: <Users className="h-6 w-6" style={{ color: '#1A7A4A' }} />,
    title: 'Waitlist System',
    description: 'Full? Join the waitlist automatically. Get your spot when a player drops out.',
    badge: 'Smart',
  },
  {
    icon: <Star className="h-6 w-6" style={{ color: '#C47A00' }} />,
    title: 'Ratings & Reviews',
    description: 'Rate organizers after games and discover the best sessions in your area.',
    badge: 'Community',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" style={{ color: '#1A7A4A' }} />,
    title: 'Verified Organizers',
    description: 'Admin-verified organisers means you\'re always booking with trusted community leaders.',
    badge: 'Trusted',
  },
  {
    icon: <Layers className="h-6 w-6" style={{ color: '#1A7A4A' }} />,
    title: 'Exclusive Reveals',
    description: 'Court assignments, door codes and special info unlocked only after confirmed payment.',
    badge: 'Premium',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Browse Events', desc: 'Find sports sessions near you — badminton, basketball, and more.' },
  { step: '02', title: 'Pick a Timeslot', desc: 'Choose from multiple durations. See real-time capacity.' },
  { step: '03', title: 'Pay', desc: 'Scan QR code. Your slot is confirmed within minutes.' },
  { step: '04', title: 'Play!', desc: 'Unlock exclusive venue details and show up ready to go.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTour, setActiveTour] = useState<'player' | 'organizer' | 'chat' | null>(null);
  const { user } = useAuth();

  const scrollToBeta = () => {
    const el = document.getElementById('beta-form');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Demo Tour Overlay */}
      {activeTour && <DemoTour type={activeTour} onClose={() => setActiveTour(null)} />}

      {/* ── Hero Section ── */}
      <section
        className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1f12 0%, #1A7A4A 55%, #0a3520 100%)' }}
      >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=2000&q=80"
            alt="Sports Hall"
            className="w-full h-full object-cover opacity-20"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>

        {/* Decorative dots */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-5" style={{ background: '#7FFFC4', filter: 'blur(80px)' }} />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full opacity-5" style={{ background: '#C47A00', filter: 'blur(60px)' }} />

        <div className="container relative z-10 text-center px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            {/* Headline */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.05]" style={{ color: '#fff', fontFamily: 'Lora, serif' }}>
              Play More,<br />
              <span style={{ color: '#7FFFC4' }}>Work Less.</span>
            </h1>

            {/* Subline */}
            <div className="space-y-6 max-w-2xl mx-auto">
              <p className="text-xl md:text-2xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                Bookee is a coordination platform between participants and activity hosts — helping you focus more on <strong className="font-bold uppercase">FUN</strong> and less on <strong className="font-bold uppercase">ADMIN</strong>.
              </p>
              <div className="text-left bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 space-y-3">
                <p className="font-bold text-sm uppercase tracking-widest text-[#7FFFC4]">We handle the coordination, so you don’t have to:</p>
                <ul className="space-y-2 text-white/80 text-sm md:text-base">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#7FFFC4]" /> Track sign-ups and slots
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#7FFFC4]" /> Manage group communication
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#7FFFC4]" /> Keep tabs on payments and attendance
                  </li>
                </ul>
              </div>
            </div>

            {/* Memories Carousel */}
            <div className="max-w-4xl mx-auto py-8">
              <MemoriesCarousel showSocialLinks={false} />
            </div>

            {/* Demo Tour Buttons (3 demo slides) */}
            <div className="pt-4">
              <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-3">Try it — no sign up required</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                <button
                  onClick={() => setActiveTour('organizer')}
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl"
                  style={{ background: '#fff', color: '#1A7A4A' }}
                >
                  <Play className="h-4 w-4 fill-current" />
                  🎯 Organizer Demo
                </button>
                <button
                  onClick={() => setActiveTour('player')}
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)' }}
                >
                  <Play className="h-4 w-4 fill-current" />
                  🏸 Player Demo
                </button>
                <button
                  onClick={() => setActiveTour('chat')}
                  className="flex items-center justify-center gap-2 px-7 py-4 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{ background: 'rgba(139,92,246,0.25)', color: '#fff', border: '1.5px solid rgba(139,92,246,0.6)' }}
                >
                  <Play className="h-4 w-4 fill-current" />
                  💬 Chat Demo
                </button>
              </div>
            </div>

            {/* CTAs (Action buttons) - Now Below Demo Slides */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
              <Button
                size="lg"
                className="text-xl px-12 py-9 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform"
                style={{ background: '#fff', color: '#1A7A4A' }}
                onClick={() => navigate('/demo')}
              >
                Try It Yourself <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-9 rounded-full font-bold hover:scale-105 transition-transform"
                style={{ borderColor: 'rgba(255,255,255,0.45)', color: '#fff', background: 'rgba(255,255,255,0.08)' }}
                onClick={scrollToBeta}
              >
                Register for Beta
              </Button>
            </div>

            {/* Stats bar */}
            <div
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px rounded-3xl overflow-hidden max-w-3xl mx-auto"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              {STATS.map(({ value, label, color }) => (
                <div key={label} className="flex flex-col items-center justify-center py-6 px-4" style={{ background: 'rgba(0,0,0,0.15)' }}>
                  <span className="text-3xl font-bold" style={{ color }}>{value}</span>
                  <span className="text-xs font-medium mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Beta Registration Form ── */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1A7A4A' }}>Beta Access</p>
          <h2 className="text-3xl md:text-5xl font-bold" style={{ color: '#111', fontFamily: 'Lora, serif' }}>
            Be the First to Join
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mt-4">
            Join our closed beta to get early access to exclusive venues and community features.
          </p>
        </div>
        <BetaRegistrationForm />
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-white">
        <div className="container px-4">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#1A7A4A' }}>Simple 4 Steps</p>
            <h2 className="text-3xl md:text-5xl font-bold" style={{ color: '#111', fontFamily: 'Lora, serif' }}>
              Book in Minutes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col gap-3 p-6 rounded-2xl border-2 bg-white hover:shadow-elegant transition-all group"
                style={{ borderColor: 'rgba(26,122,74,0.12)' }}
              >
                <span className="text-4xl font-bold" style={{ color: 'rgba(26,122,74,0.12)', fontFamily: 'Lora, serif' }}>{step.step}</span>
                <h3 className="font-bold text-lg" style={{ color: '#111' }}>{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24 bg-white">
        <div className="container px-4">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C47A00' }}>Everything you need</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#111', fontFamily: 'Lora, serif' }}>Why Bookee?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              We streamline the booking process so you can focus on the game.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="p-8 rounded-2xl border-2 bg-white hover:shadow-elegant transition-all duration-300 group relative overflow-hidden"
                style={{ borderColor: 'rgba(26,122,74,0.10)' }}
              >
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: 'rgba(26,122,74,0.08)', color: '#1A7A4A' }}>
                    {feature.badge}
                  </span>
                </div>
                <div className="mb-5 p-3 rounded-xl inline-block" style={{ background: '#E8F7EF' }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#111' }}>{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Organizer Callout ── */}
      <section className="py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1A7A4A 0%, #0d5c35 100%)' }}>
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#7FFFC4' }}>For Community Leaders</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: '#fff', fontFamily: 'Lora, serif' }}>
                Manage Your Sports Community
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  'Verified organizer badge for trust and credibility',
                  'Custom timeslot and venue management tools',
                  'Real-time booking and waitlist tracking',
                  'Community announcements and exclusive reveals',
                  'Ratings & reviews from your players',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#7FFFC4' }} />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="rounded-full font-bold hover:scale-105 transition-transform"
                style={{ background: '#fff', color: '#1A7A4A' }}
                onClick={() => navigate('/signup/organizer')}
              >
                Apply to be an Organizer <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Floating stat cards */}
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl rotate-2" style={{ border: '3px solid rgba(255,255,255,0.15)' }}>
                <img
                  src="https://images.unsplash.com/photo-1504450758481-73389ba7524a?w=1000&q=80"
                  alt="Sports Organization"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&q=80'; }}
                />
              </div>
              {/* Overlay stat card */}
              <div
                className="absolute -bottom-4 -left-4 p-4 rounded-2xl shadow-xl"
                style={{ background: '#fff', minWidth: 160 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold" style={{ color: '#1A7A4A' }}>$4,800</p>
                <p className="text-[10px] text-muted-foreground">across 3 events</p>
              </div>
              <div
                className="absolute -top-4 -right-4 p-4 rounded-2xl shadow-xl"
                style={{ background: '#fff', minWidth: 140 }}
              >
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3" style={{ color: '#C47A00', fill: '#C47A00' }} />)}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold" style={{ color: '#111' }}>4.9</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section className="py-12 bg-white border-t">
        <div className="container px-4 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trusted by Singapore athletes</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Badminton', 'Basketball', 'Volleyball', 'Futsal', 'Tennis', 'Swimming', 'Running'].map(sport => (
              <span
                key={sport}
                className="px-5 py-2 rounded-full text-sm font-bold border-2"
                style={{ borderColor: 'rgba(26,122,74,0.18)', color: '#1A7A4A', background: 'rgba(26,122,74,0.04)' }}
              >
                {sport}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-16 border-t" style={{ background: '#0a1f12' }}>
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-4">
              <span className="font-bold text-3xl tracking-tighter" style={{ fontFamily: 'Lora, serif', color: '#7FFFC4' }}>
                Bookee
              </span>
              <p className="text-white/60 max-w-md">
                Singapore's most robust sports booking platform. Streamlining discovery, management, and payments for the local community.
              </p>
            </div>
            <div className="space-y-4 md:text-right">
              <h3 className="text-white font-bold text-lg">Feedback or developer contact</h3>
              <div className="flex items-center md:justify-end gap-2 text-[#7FFFC4]">
                <Mail className="h-5 w-5" />
                <a href="mailto:yjqbenjaminbusiness@gmail.com" className="hover:underline">yjqbenjaminbusiness@gmail.com</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              © 2026 Bookee. Built for the sports community in Singapore.
            </p>
            <div className="flex gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}