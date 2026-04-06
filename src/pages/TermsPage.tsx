import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="container py-10 px-4 max-w-3xl">
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-3xl font-bold mb-8 text-foreground">Terms & Conditions</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <p className="text-foreground font-medium">
          By using Bookee, you agree to the following terms. These terms apply to all users — players, organizers, and administrators.
        </p>

        <section>
          <h2 className="text-lg font-bold text-foreground">1. Acceptable Use</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You may only use Bookee for lawful purposes related to sports and recreational activities.</li>
            <li>You must not use the platform to organize, promote, or facilitate any unlawful activities.</li>
            <li>You must not post harmful, threatening, abusive, or misleading content.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">2. Prohibited Content</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>No illegal services, gambling, or prohibited substances may be advertised or facilitated.</li>
            <li>No impersonation of other users or organizations.</li>
            <li>No spam, phishing, or distribution of malware.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">3. Safety & Responsibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Organizers are responsible for ensuring their events are safe and comply with local regulations.</li>
            <li>Players participate in activities at their own risk.</li>
            <li>Bookee is a platform facilitator and is not liable for injuries, damages, or disputes arising from activities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">4. Privacy (PDPA)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We collect and use personal data (name, email, phone) solely for platform functionality.</li>
            <li>Your data will not be sold or shared with third parties without your consent.</li>
            <li>You may request deletion of your account and associated data at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">5. Account Termination</h2>
          <p>
            Bookee reserves the right to suspend or terminate accounts that violate these terms, engage in harmful behavior, or misuse the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground">6. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform constitutes acceptance of any changes.
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-4 border-t">
          Last updated: April 2026 · Questions? Contact us at yjqbenjaminbusiness@gmail.com
        </p>
      </div>
    </div>
  );
}
