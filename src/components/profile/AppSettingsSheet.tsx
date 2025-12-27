import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Bell, BellOff, Globe, Volume2, VolumeX, Vibrate } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface AppSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppSettingsSheet({ open, onOpenChange }: AppSettingsSheetProps) {
  const { theme, toggleTheme } = useTheme();
  const { isSubscribed, isSupported, isLoading, subscribe, unsubscribe } = usePushNotifications();
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [language, setLanguage] = useState("en");

  const handleNotificationToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    toast.success(enabled ? "Sound enabled" : "Sound disabled");
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    if (enabled && navigator.vibrate) {
      navigator.vibrate(50);
    }
    toast.success(enabled ? "Vibration enabled" : "Vibration disabled");
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    toast.success(`Language changed to ${lang === "en" ? "English" : lang === "hi" ? "Hindi" : "Tamil"}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>App Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Appearance */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Appearance</h4>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle dark/light theme</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Notifications</h4>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                {isSubscribed ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {isSupported ? "Receive booking & game alerts" : "Not supported on this device"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={handleNotificationToggle}
                disabled={!isSupported || isLoading}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Sound</p>
                  <p className="text-xs text-muted-foreground">In-app notification sounds</p>
                </div>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Vibrate className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Vibration</p>
                  <p className="text-xs text-muted-foreground">Haptic feedback</p>
                </div>
              </div>
              <Switch checked={vibrationEnabled} onCheckedChange={handleVibrationToggle} />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Language</h4>
            
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">App Language</p>
                  <p className="text-xs text-muted-foreground">Choose your preferred language</p>
                </div>
              </div>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
