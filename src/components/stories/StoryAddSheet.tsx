import { useState, useRef } from "react";
import { Camera, Image, X, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface StoryAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File, caption?: string) => Promise<void>;
  isUploading: boolean;
}

export const StoryAddSheet = ({
  open,
  onOpenChange,
  onSubmit,
  isUploading,
}: StoryAddSheetProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await onSubmit(selectedFile, caption.trim() || undefined);
    resetState();
  };

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Add to Your Story</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col h-[calc(100%-4rem)]">
          {!preview ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="flex gap-4">
                {/* Camera option */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brand-green to-brand-green/70 flex flex-col items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
                >
                  <Camera className="w-10 h-10" />
                  <span className="text-sm font-medium">Camera</span>
                </button>

                {/* Gallery option */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex flex-col items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
                >
                  <Image className="w-10 h-10" />
                  <span className="text-sm font-medium">Gallery</span>
                </button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Choose a photo or video to share<br />
                Stories disappear after 24 hours
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Preview */}
              <div className="relative flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden">
                <button
                  onClick={resetState}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {selectedFile?.type.startsWith('video/') ? (
                  <video
                    src={preview}
                    className="max-w-full max-h-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Caption input */}
              <div className="mt-4">
                <Textarea
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="resize-none"
                  rows={2}
                  maxLength={500}
                />
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                className="mt-4 w-full bg-brand-green hover:bg-brand-green/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  "Share to Story"
                )}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
