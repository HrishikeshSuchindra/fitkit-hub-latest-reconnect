import { Search, Mic, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SearchBar = ({ placeholder = "Search venues, events, games...", className = "", value, onChange }: SearchBarProps) => {
  return (
    <div className={`w-full h-11 bg-card rounded-full shadow-ultralight flex items-center px-4 gap-3 ${className}`}>
      <Search className="w-4 h-4 text-text-secondary flex-shrink-0" />
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-tertiary"
      />
      <Mic className="w-4 h-4 text-text-secondary flex-shrink-0" />
      <SlidersHorizontal className="w-4 h-4 text-text-secondary flex-shrink-0" />
    </div>
  );
};