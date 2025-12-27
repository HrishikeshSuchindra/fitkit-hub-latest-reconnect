import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

const PrivacyPolicy = () => {
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
          <Shield className="w-12 h-12 mx-auto mb-3 text-primary-foreground" />
          <h1 className="text-2xl font-bold text-primary-foreground">Privacy Policy</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Last updated: January 2025</p>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-6">
        <div className="bg-card rounded-2xl shadow-soft p-5 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              We collect information you provide directly to us, including:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Profile information (avatar, bio, username)</li>
              <li>Booking and payment information</li>
              <li>Communications with us and other users</li>
              <li>Location data (with your permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Develop new features and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Information Sharing</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to outside parties except to trusted third parties who assist us in operating our platform, conducting our business, or servicing you, as long as those parties agree to keep this information confidential.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              You have the right to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Cookies</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use cookies to enhance your experience, gather general visitor information, and track visits to our website. You can choose to disable cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-sm text-primary mt-2">privacy@fitkits.app</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
