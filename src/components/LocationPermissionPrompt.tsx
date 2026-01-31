import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const LocationPermissionPrompt = () => {
  const { permissionState, requestLocation, isLoading, userLocation } = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already seen the prompt
    const hasSeenPrompt = localStorage.getItem('locationPromptDismissed');
    
    // Show prompt if:
    // 1. Permission hasn't been granted
    // 2. User hasn't dismissed it
    // 3. We don't already have location
    if (!hasSeenPrompt && permissionState !== 'granted' && !userLocation && !isDismissed) {
      // Delay showing the prompt for better UX
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [permissionState, userLocation, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('locationPromptDismissed', 'true');
  };

  const handleEnableLocation = async () => {
    await requestLocation();
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-4 right-4 z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-lg p-4">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">
                  Find venues near you
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Enable location to see distances to venues and get personalized recommendations.
                </p>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleEnableLocation}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    {isLoading ? "Getting location..." : "Enable Location"}
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
