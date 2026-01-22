import { motion, AnimatePresence } from "framer-motion";
import fitkitsBrandLogo from "@/assets/fitkits-brand-logo.png";

interface SplashScreenProps {
  isLoading: boolean;
}

const SplashScreen = ({ isLoading }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1E1A16]"
        >
          {/* Logo with fade-in and scale animation */}
          <motion.img
            src={fitkitsBrandLogo}
            alt="FitKits"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-72 object-contain drop-shadow-2xl"
          />

          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="mt-6 flex flex-col items-center"
          >
            <span
              className="text-3xl tracking-[0.15em] text-[#F3F0EB]"
              style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}
            >
              FITKITS
            </span>
            <span
              className="mt-2 text-sm tracking-widest text-[#C2A26B]"
              style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
            >
              wellness reimagined +
            </span>
          </motion.div>

          {/* Subtle loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-[#C2A26B]"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
