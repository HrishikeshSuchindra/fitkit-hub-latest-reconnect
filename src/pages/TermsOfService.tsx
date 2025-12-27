import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 pt-12 pb-8 px-5">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-primary-foreground hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-primary-foreground" />
          <h1 className="text-2xl font-bold text-primary-foreground">Terms of Service</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Last updated: January 2025</p>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        <div className="bg-card rounded-2xl shadow-soft p-5 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing and using Fitkits, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Use of Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              You agree to use the service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Use the service in any way that violates any applicable law or regulation</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with the proper working of the service</li>
              <li>Attempt to gain unauthorized access to any portion of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Booking and Payments</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              When you make a booking through Fitkits:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>You agree to pay the listed price for the booking</li>
              <li>Cancellation policies vary by venue and will be displayed at booking</li>
              <li>Refunds are processed according to our refund policy</li>
              <li>You are responsible for arriving on time for your booking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Content Guidelines</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              When posting content on Fitkits, you agree not to post:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Offensive, harmful, or inappropriate content</li>
              <li>Content that infringes on intellectual property rights</li>
              <li>Spam or promotional content</li>
              <li>False or misleading information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fitkits shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Changes to Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For any questions regarding these Terms of Service, please contact us at:
            </p>
            <p className="text-sm text-primary mt-2">legal@fitkits.app</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
