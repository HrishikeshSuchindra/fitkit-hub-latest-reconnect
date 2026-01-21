import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import promoGreen from "@/assets/promo-green-bg.jpg";
import promoPurple from "@/assets/promo-purple-bg.jpg";

interface OfferSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonClass: string;
  route: string;
}

const offers: OfferSlide[] = [
  {
    id: 0,
    image: promoGreen,
    title: "20% OFF",
    subtitle: "First booking discount",
    buttonText: "Claim Now",
    buttonClass: "text-brand-green",
    route: "/venues/courts",
  },
  {
    id: 1,
    image: promoPurple,
    title: "Premium Access",
    subtitle: "Unlock all venues",
    buttonText: "Book Now",
    buttonClass: "text-chip-purple-text",
    route: "/venues/recovery",
  },
  {
    id: 2,
    image: promoGreen,
    title: "Weekend Special",
    subtitle: "Book 2 hours, get 1 free",
    buttonText: "Explore",
    buttonClass: "text-brand-green",
    route: "/venues/courts",
  },
  {
    id: 3,
    image: promoPurple,
    title: "Refer & Earn",
    subtitle: "Get ₹200 for every friend",
    buttonText: "Share Now",
    buttonClass: "text-chip-purple-text",
    route: "/social",
  },
  {
    id: 4,
    image: promoGreen,
    title: "Recovery Zone",
    subtitle: "Spa & wellness packages",
    buttonText: "Discover",
    buttonClass: "text-brand-green",
    route: "/venues/recovery",
  },
];

export function OffersCarousel() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);
  const isManualScrolling = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const totalSlides = offers.length;

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const slideWidth = container.firstElementChild?.clientWidth || 0;
    const gap = 12; // gap-3 = 12px
    const scrollPosition = index * (slideWidth + gap);
    
    container.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    });
  }, []);

  // Start auto-scroll
  const startAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      window.clearInterval(autoScrollIntervalRef.current);
    }
    
    autoScrollIntervalRef.current = window.setInterval(() => {
      if (!isManualScrolling.current) {
        setActiveIndex((prev) => {
          const nextIndex = (prev + 1) % totalSlides;
          scrollToIndex(nextIndex);
          return nextIndex;
        });
      }
    }, 4000);
  }, [totalSlides, scrollToIndex]);

  // Stop auto-scroll
  const stopAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      window.clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  // Initialize auto-scroll on mount
  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [startAutoScroll, stopAutoScroll]);

  // Handle scroll events to detect current slide
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const slideWidth = container.firstElementChild?.clientWidth || 0;
    const gap = 12;
    const scrollLeft = container.scrollLeft;
    const newIndex = Math.round(scrollLeft / (slideWidth + gap));
    
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < totalSlides) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, totalSlides]);

  // Handle touch/interaction start
  const handleInteractionStart = useCallback(() => {
    isManualScrolling.current = true;
    stopAutoScroll();
    
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
  }, [stopAutoScroll]);

  // Handle touch/interaction end
  const handleInteractionEnd = useCallback(() => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = window.setTimeout(() => {
      isManualScrolling.current = false;
      startAutoScroll();
    }, 500);
  }, [startAutoScroll]);

  // Click on indicator
  const handleIndicatorClick = useCallback((index: number) => {
    setActiveIndex(index);
    scrollToIndex(index);
    
    // Reset auto-scroll timer
    stopAutoScroll();
    isManualScrolling.current = false;
    startAutoScroll();
  }, [scrollToIndex, stopAutoScroll, startAutoScroll]);

  // Show all indicators - active one is larger
  const allIndicators = offers.map((_, index) => index);

  return (
    <section>
      {/* Scrollable Offers */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        onScroll={handleScroll}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
      >
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="min-w-[85%] h-56 rounded-2xl p-5 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer snap-center flex-shrink-0"
            style={{
              backgroundImage: `url(${offer.image})`,
              backgroundSize: "cover",
            }}
            onClick={() => navigate(offer.route)}
          >
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">{offer.title}</h3>
              <p className="text-sm opacity-90">{offer.subtitle}</p>
            </div>
            <button
              className={cn(
                "relative z-10 self-start px-5 py-2 bg-white rounded-lg font-semibold text-sm",
                offer.buttonClass
              )}
            >
              {offer.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Bubble Indicators */}
      <div className="flex justify-center items-center gap-1.5 mt-3">
        {allIndicators.map((indicatorIndex) => {
          const isActive = indicatorIndex === activeIndex;
          
          return (
            <button
              key={`indicator-${indicatorIndex}`}
              onClick={() => handleIndicatorClick(indicatorIndex)}
              className={cn(
                "rounded-full transition-all duration-300 ease-out",
                isActive
                  ? "w-2.5 h-2.5 bg-primary"
                  : "w-1.5 h-1.5 bg-muted-foreground/40"
              )}
              aria-label={`Go to slide ${indicatorIndex + 1}`}
            />
          );
        })}
      </div>
    </section>
  );
}
