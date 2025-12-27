import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Users, Target, Award } from "lucide-react";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 pt-12 pb-16 px-5">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-primary-foreground hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-foreground">Fitkits</h1>
          <p className="text-primary-foreground/80 text-sm mt-2">Play. Connect. Thrive.</p>
        </div>
      </div>

      <div className="px-5 -mt-8 space-y-6">
        {/* Mission Card */}
        <div className="bg-card rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            At Fitkits, we believe that sports bring people together. Our mission is to make it easy for everyone to book courts, join games, and connect with fellow sports enthusiasts in their community.
          </p>
        </div>

        {/* Story */}
        <div className="bg-card rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Our Story</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Founded in 2024, Fitkits started with a simple idea: what if finding a badminton court was as easy as ordering food? We noticed that sports enthusiasts often struggled to find available courts, organize games, and meet new players.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Today, we're proud to connect thousands of players across India, helping them stay active, make friends, and enjoy their favorite sports.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl shadow-soft p-4 text-center">
            <p className="text-2xl font-bold text-primary">50+</p>
            <p className="text-xs text-muted-foreground">Venues</p>
          </div>
          <div className="bg-card rounded-xl shadow-soft p-4 text-center">
            <p className="text-2xl font-bold text-primary">5K+</p>
            <p className="text-xs text-muted-foreground">Players</p>
          </div>
          <div className="bg-card rounded-xl shadow-soft p-4 text-center">
            <p className="text-2xl font-bold text-primary">10K+</p>
            <p className="text-xs text-muted-foreground">Bookings</p>
          </div>
        </div>

        {/* Values */}
        <div className="bg-card rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Our Values</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">Community First</h4>
              <p className="text-sm text-muted-foreground">We prioritize building a supportive community of sports lovers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Accessibility</h4>
              <p className="text-sm text-muted-foreground">Sports should be accessible to everyone, regardless of skill level.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Quality</h4>
              <p className="text-sm text-muted-foreground">We partner only with venues that meet our quality standards.</p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-card rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">The Team</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            We're a team of sports enthusiasts, designers, and engineers who are passionate about making sports more accessible. Every team member plays at least one sport regularly!
          </p>
        </div>

        {/* Contact */}
        <div className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Have questions or feedback?</p>
          <Button onClick={() => navigate("/contact")} variant="outline">
            Get in Touch
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Fitkits. All rights reserved.</p>
          <p className="mt-1">Made with ❤️ in India</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
