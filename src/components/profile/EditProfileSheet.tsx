import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Upload, Image as ImageIcon, Check, X, Loader2, Mail, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStorage } from "@/hooks/useStorage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Import avatar images
import avatarMale1 from "@/assets/avatars/avatar-male-1.png";
import avatarFemale1 from "@/assets/avatars/avatar-female-1.png";
import avatarMale2 from "@/assets/avatars/avatar-male-2.png";
import avatarFemale2 from "@/assets/avatars/avatar-female-2.png";
import avatarMale3 from "@/assets/avatars/avatar-male-3.png";
import avatarFemale3 from "@/assets/avatars/avatar-female-3.png";

const presetAvatars = [
  { id: "male1", src: avatarMale1, label: "Athletic Guy" },
  { id: "female1", src: avatarFemale1, label: "Sporty Girl" },
  { id: "male2", src: avatarMale2, label: "Smart Guy" },
  { id: "female2", src: avatarFemale2, label: "Fit Girl" },
  { id: "male3", src: avatarMale3, label: "Bearded Guy" },
  { id: "female3", src: avatarFemale3, label: "Cool Girl" },
];

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    phone_number?: string | null;
  } | null;
}

export function EditProfileSheet({ open, onOpenChange, profile }: EditProfileSheetProps) {
  const { user } = useAuth();
  const { uploadAvatar, uploading } = useStorage();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "");
  const [email, setEmail] = useState(user?.email || "");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"available" | "taken" | "checking" | null>(null);
  
  // Generate username suggestion from display name
  const generateUsername = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 20);
  };

  // Check username availability
  const checkUsername = async (newUsername: string) => {
    if (!newUsername || newUsername === profile?.username) {
      setUsernameStatus(null);
      return;
    }
    
    setCheckingUsername(true);
    setUsernameStatus("checking");
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", newUsername)
        .neq("user_id", user?.id || "")
        .maybeSingle();
      
      if (error) throw error;
      setUsernameStatus(data ? "taken" : "available");
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameStatus(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Handle display name change - auto-suggest username
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (!profile?.username && value) {
      const suggested = generateUsername(value);
      setUsername(suggested);
      checkUsername(suggested);
    }
  };

  // Handle username change
  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(sanitized);
    
    // Debounce username check
    const timeoutId = setTimeout(() => checkUsername(sanitized), 500);
    return () => clearTimeout(timeoutId);
  };

  // Handle file upload - uploads to Supabase storage and stores URL in DB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Upload using useStorage hook which uploads to 'avatars' bucket
    const url = await uploadAvatar(file);
    if (url) {
      // The URL is a public Supabase storage URL that persists
      setAvatarUrl(url);
      setShowAvatarPicker(false);
      toast.success("Avatar uploaded!");
    }
  };

  // Handle preset avatar selection - store as static asset path
  const handlePresetSelect = async (src: string) => {
    // For preset avatars, we store the static path which works across sessions
    setAvatarUrl(src);
    setShowAvatarPicker(false);
  };

  // Save profile
  const handleSave = async () => {
    if (!user) return;
    
    if (usernameStatus === "taken") {
      toast.error("Username is already taken");
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          username: username,
          bio: bio,
          avatar_url: avatarUrl,
          phone_number: phoneNumber || null, // Store phone in profiles for admin access
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Update email in auth if changed
      if (email && email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          toast.error("Failed to update email: " + emailError.message);
        } else {
          toast.success("Verification email sent to new address");
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Profile updated!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pb-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-primary">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                ) : (
                  <AvatarFallback className="bg-muted text-2xl">
                    {displayName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 bg-primary"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Avatar Picker */}
            {showAvatarPicker && (
              <div className="mt-4 p-4 bg-muted rounded-xl w-full">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Camera
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">Or choose an avatar</p>
                <div className="grid grid-cols-6 gap-2">
                  {presetAvatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => handlePresetSelect(avatar.src)}
                      className={`rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === avatar.src ? "border-primary scale-110" : "border-transparent"
                      }`}
                    >
                      <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="Enter your full name"
              className="bg-muted border-0"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="relative">
              <Input
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Choose a username"
                className="bg-muted border-0 pr-10"
              />
              {checkingUsername && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {usernameStatus === "available" && !checkingUsername && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
              {usernameStatus === "taken" && !checkingUsername && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
              )}
            </div>
            {usernameStatus === "available" && (
              <p className="text-xs text-green-600">This username is unique, go for it!</p>
            )}
            {usernameStatus === "taken" && (
              <p className="text-xs text-destructive">Username already exists</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email Address
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-muted border-0"
            />
            <p className="text-xs text-muted-foreground">Changing email requires verification</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Mobile Number
            </Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="bg-muted border-0"
            />
            <p className="text-xs text-muted-foreground">Used for booking communications</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="bg-muted border-0 min-h-[80px]"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/150</p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || usernameStatus === "taken"}
            className="w-full bg-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
