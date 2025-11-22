import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { BottomNav } from "@/components/BottomNav";

const SocialCommunity = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        <SearchBar placeholder="Search community..." />
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Community</h3>
            <p className="text-sm text-text-secondary">Coming soon...</p>
          </div>
        </div>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialCommunity;
