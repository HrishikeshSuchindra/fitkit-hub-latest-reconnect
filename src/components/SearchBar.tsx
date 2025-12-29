import { Search, Mic, SlidersHorizontal, X, MapPin, Clock, Building2, Users, Gamepad2, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-mobile";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions?: string[];
  context?: "master" | "courts" | "recovery" | "studio" | "social" | "hub";
  onSearch?: (query: string) => void;
}

interface SearchResult {
  id: string;
  name: string;
  type: 'venue' | 'event' | 'game' | 'user';
  category?: string;
  slug?: string;
  sport?: string;
}

export const SearchBar = ({ 
  placeholder = "Search venues, events, games...", 
  className = "", 
  value, 
  onChange,
  suggestions,
  context = "master",
  onSearch
}: SearchBarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Search database when query changes
  useEffect(() => {
    const searchDatabase = async () => {
      if (debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results: SearchResult[] = [];

      try {
        // Search venues
        const { data: venues } = await supabase
          .from('venues')
          .select('id, name, slug, sport, category')
          .ilike('name', `%${debouncedQuery}%`)
          .eq('is_active', true)
          .limit(5);

        if (venues) {
          venues.forEach(v => results.push({
            id: v.id,
            name: v.name,
            type: 'venue',
            category: v.category,
            slug: v.slug,
            sport: v.sport,
          }));
        }

        // Search events
        const { data: events } = await supabase
          .from('events')
          .select('id, title, sport, event_type')
          .ilike('title', `%${debouncedQuery}%`)
          .neq('status', 'cancelled')
          .limit(5);

        if (events) {
          events.forEach(e => results.push({
            id: e.id,
            name: e.title,
            type: 'event',
            category: e.event_type,
            sport: e.sport,
          }));
        }

        // Search public games (bookings with public visibility)
        const { data: games } = await supabase
          .from('bookings')
          .select('id, venue_name, sport, slot_date')
          .eq('visibility', 'public')
          .eq('status', 'confirmed')
          .ilike('venue_name', `%${debouncedQuery}%`)
          .gte('slot_date', new Date().toISOString().split('T')[0])
          .limit(5);

        if (games) {
          games.forEach(g => results.push({
            id: g.id,
            name: `${g.sport || 'Game'} at ${g.venue_name}`,
            type: 'game',
            sport: g.sport || undefined,
          }));
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    searchDatabase();
  }, [debouncedQuery]);

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

  const handleResultClick = (result: SearchResult) => {
    setShowSuggestions(false);
    setQuery("");
    
    switch (result.type) {
      case 'venue':
        navigate(`/venue/${result.slug}`);
        break;
      case 'event':
        navigate(`/social/event/${result.id}`);
        break;
      case 'game':
        navigate(`/hub/game/${result.id}`);
        break;
      case 'user':
        navigate('/profile/friends');
        break;
    }
  };

  const clearQuery = () => {
    setQuery("");
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'venue':
        return <Building2 className="w-4 h-4 text-brand-green" />;
      case 'event':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-text-tertiary" />;
    }
  };

  const getCategoryLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'venue':
        return 'Venues';
      case 'event':
        return 'Social';
      case 'game':
        return 'Hub';
      default:
        return '';
    }
  };

  // Group results by type
  const groupedResults = searchResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

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
        {isSearching && (
          <Loader2 className="w-4 h-4 text-text-secondary animate-spin" />
        )}
        {query && !isSearching && (
          <button onClick={clearQuery} className="p-1">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        )}
        <Mic className="w-4 h-4 text-text-secondary flex-shrink-0" />
        <SlidersHorizontal className="w-4 h-4 text-text-secondary flex-shrink-0" />
      </div>

      {/* Results Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border border-border/50 overflow-hidden z-50">
          {query.length === 0 && (
            <div className="px-4 py-2 border-b border-border/30">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <MapPin className="w-3 h-3" />
                <span>Searching in Chennai</span>
              </div>
            </div>
          )}
          
          <div className="max-h-80 overflow-y-auto">
            {query.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="px-4 py-6 text-center">
                <Search className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No results found for "{query}"</p>
                <p className="text-xs text-text-tertiary mt-1">Try a different search term</p>
              </div>
            )}

            {Object.entries(groupedResults).map(([type, results]) => (
              <div key={type}>
                <div className="px-4 py-2 bg-muted/50">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    {getCategoryLabel(type as SearchResult['type'])}
                  </span>
                </div>
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{result.name}</p>
                      {result.sport && (
                        <p className="text-xs text-text-tertiary capitalize">{result.sport}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {query.length > 0 && query.length < 2 && (
            <div className="px-4 py-2 border-t border-border/30">
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Clock className="w-3 h-3" />
                <span>Type at least 2 characters to search</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
