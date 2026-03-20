import { Mail, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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

      <div className="grid md:grid-cols-2 gap-8 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="h-full border-2 border-primary/5 hover:border-primary/20 transition-all shadow-sm">
            <CardHeader>
              <div className="p-3 rounded-2xl bg-primary/10 w-fit mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Direct Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                For feedback, bug reports, or partnership inquiries, please reach out to our development team directly.
              </p>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Email Support</p>
                <a 
                  href="mailto:yjqbenjaminbusiness@gmail.com" 
                  className="text-lg font-bold text-primary hover:underline flex items-center gap-2"
                >
                  yjqbenjaminbusiness@gmail.com
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full border-2 border-primary/5 hover:border-primary/20 transition-all shadow-sm">
            <CardHeader>
              <div className="p-3 rounded-2xl bg-amber-500/10 w-fit mb-4">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Safety & Trust</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All Bookee organizers are verified through regulated payment providers to prevent scams.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Verified organizer profiles</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Automated payment confirmations</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Secure slot tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="bg-primary/5 p-12 rounded-[2.5rem] text-center space-y-6 border-2 border-primary/5">
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
      </div>
    </div>
  );
}
