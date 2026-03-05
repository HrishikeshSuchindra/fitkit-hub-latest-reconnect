import { Rocket } from "lucide-react";

interface ComingSoonProps {
  message?: string;
}

const ComingSoon = ({ message }: ComingSoonProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
        <Rocket className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">We're Coming Soon!</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {message || "We're working hard to bring you amazing experiences. Stay tuned!"}
      </p>
    </div>
  );
};

export default ComingSoon;
