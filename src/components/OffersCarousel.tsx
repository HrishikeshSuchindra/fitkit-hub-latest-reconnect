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
];

export function OffersCarousel() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrolling = useRef(false);

  const totalSlides = offers.length;

  // Auto-scroll functionality
  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    autoScrollRef.current = setInterval(() => {
      if (!isUserScrolling.current) {
        setActiveIndex((prev) => (prev + 1) % totalSlides);
      }
    }, 4000); // 4 seconds per slide
  }, [totalSlides]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  // Scroll to active index
  useEffect(() => {
    if (scrollRef.current && !isUserScrolling.current) {
      const slideWidth = scrollRef.current.scrollWidth / totalSlides;
      scrollRef.current.scrollTo({
        left: slideWidth * activeIndex,
        behavior: "smooth",
      });
    }
  }, [activeIndex, totalSlides]);

  // Start auto-scroll on mount
  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  // Handle scroll events to sync indicators
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const scrollLeft = scrollRef.current.scrollLeft;
    const slideWidth = scrollRef.current.scrollWidth / totalSlides;
    const newIndex = Math.round(scrollLeft / slideWidth);
    
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < totalSlides) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, totalSlides]);

  // Handle touch/mouse interactions
  const handleInteractionStart = () => {
    isUserScrolling.current = true;
    stopAutoScroll();
  };

  const handleInteractionEnd = () => {
    // Delay to allow scroll to settle
    setTimeout(() => {
      isUserScrolling.current = false;
      startAutoScroll();
    }, 100);
  };

  // Click on indicator to navigate
  const handleIndicatorClick = (index: number) => {
    setActiveIndex(index);
    isUserScrolling.current = false;
  };

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
            className="min-w-[85%] h-56 rounded-2xl p-5 flex flex-col justify-between text-white relative overflow-hidden cursor-pointer snap-center"
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
      <div className="flex justify-center items-center gap-2 mt-3">
        {offers.map((_, index) => {
          // Calculate distance from active index for diminishing effect
          const distance = Math.abs(index - activeIndex);
          
          // Determine size and opacity based on distance
          let sizeClass = "w-2 h-2";
          let opacityClass = "opacity-100";
          
          if (distance === 0) {
            sizeClass = "w-2.5 h-2.5";
            opacityClass = "opacity-100";
          } else if (distance === 1) {
            sizeClass = "w-2 h-2";
            opacityClass = "opacity-60";
          } else {
            sizeClass = "w-1.5 h-1.5";
            opacityClass = "opacity-30";
          }

          return (
            <button
              key={index}
              onClick={() => handleIndicatorClick(index)}
              className={cn(
                "rounded-full transition-all duration-300 ease-out",
                sizeClass,
                opacityClass,
                index === activeIndex
                  ? "bg-primary scale-110"
                  : "bg-muted-foreground/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </section>
  );
}
