import { Search, Mic, SlidersHorizontal, X, MapPin, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions?: string[];
  context?: "master" | "courts" | "recovery" | "studio" | "social" | "hub";
  onSearch?: (query: string) => void;
}

const masterSuggestions = [
  "Football turf near me",
  "Badminton courts",
  "Swimming pools",
  "Yoga studios",
  "Massage centers",
  "Community games",
  "Public matches",
  "Fitness classes",
  "Recovery centers",
  "Sports events",
];

const courtsSuggestions = [
  "Football turf near me",
  "Badminton courts",
  "Cricket nets",
  "Tennis courts",
  "Basketball courts",
  "Pickleball",
  "Squash courts",
  "Table tennis",
];

const recoverySuggestions = [
  "Swimming pools",
  "Ice bath therapy",
  "Massage centers",
  "Sauna & steam",
  "Yoga studios",
  "Physiotherapy",
  "Spa & wellness",
  "Aqua therapy",
];

const studioSuggestions = [
  "Yoga classes",
  "Gym & fitness",
  "Pilates studio",
  "CrossFit box",
  "Dance studio",
  "Meditation classes",
  "Personal training",
  "Group fitness",
];

const socialSuggestions = [
  "FitDates events",
  "Coffee raves",
  "Community meetups",
  "Wellness workshops",
  "Social events",
  "Group activities",
];

const hubSuggestions = [
  "Public games",
  "Join a match",
  "Football games",
  "Badminton matches",
  "Find players",
  "Tournaments",
  "Community games",
];

const getSuggestionsByContext = (context: string) => {
  switch (context) {
    case "courts": return courtsSuggestions;
    case "recovery": return recoverySuggestions;
    case "studio": return studioSuggestions;
    case "social": return socialSuggestions;
    case "hub": return hubSuggestions;
    default: return masterSuggestions;
  }
};

export const SearchBar = ({ 
  placeholder = "Search venues, events, games...", 
  className = "", 
  value, 
  onChange,
  suggestions,
  context = "master",
  onSearch
}: SearchBarProps) => {
  const [query, setQuery] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseSuggestions = suggestions || getSuggestionsByContext(context);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = baseSuggestions.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered.length > 0 ? filtered : baseSuggestions.slice(0, 5));
    } else {
      setFilteredSuggestions(baseSuggestions.slice(0, 6));
    }
  }, [query, baseSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange?.(e);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onSearch?.(suggestion);
  };

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="w-full h-11 bg-card rounded-full shadow-ultralight flex items-center px-4 gap-3">
        <Search className="w-4 h-4 text-text-secondary flex-shrink-0" />
        <input 
          ref={inputRef}
          type="text" 
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-tertiary"
        />
        {query && (
          <button onClick={clearQuery} className="p-1">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        )}
        <Mic className="w-4 h-4 text-text-secondary flex-shrink-0" />
        <SlidersHorizontal className="w-4 h-4 text-text-secondary flex-shrink-0" />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border border-border/50 overflow-hidden z-50">
          {query.length === 0 && (
            <div className="px-4 py-2 border-b border-border/30">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <MapPin className="w-3 h-3" />
                <span>Searching near your location</span>
              </div>
            </div>
          )}
          
          <div className="max-h-64 overflow-y-auto">
            {filteredSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <Search className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <span className="text-sm text-foreground">{suggestion}</span>
              </button>
            ))}
          </div>

          {query.length > 0 && (
            <div className="px-4 py-2 border-t border-border/30">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                <span>Press Enter to search for "{query}"</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
