import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Camera, Sparkles, FileText } from "lucide-react";

const steps = [
  { icon: Globe, text: "Loading your website..." },
  { icon: Camera, text: "Capturing screenshots..." },
  { icon: Sparkles, text: "Running AI analysis..." },
  { icon: FileText, text: "Building your report..." },
];

export function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((current) => (current + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[stepIndex].icon;

  return (
    <div className="flex flex-col items-center p-8">
      <img
        src={`${import.meta.env.BASE_URL}images/design-bees-logo.png`}
        alt="Design Bees"
        className="h-10 w-auto object-contain mb-10"
      />
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 bg-beeswax-cream border border-[#e0dbd0] rounded-2xl flex items-center justify-center shadow-lg mb-8 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <CurrentIcon className="w-10 h-10 text-primary" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="h-8 relative w-full max-w-sm flex justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-lg font-display text-propolis-brown absolute"
          >
            {steps[stepIndex].text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-64 h-1.5 bg-[#e0dbd0] rounded-full mt-8 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #4D7B1B, #05C84B)" }}
          initial={{ width: "0%" }}
          animate={{ width: "90%" }}
          transition={{ duration: 180, ease: "linear" }}
        />
      </div>

      <p className="mt-4 text-sm text-drone-grey text-center max-w-xs">
        This usually takes 1–3 minutes depending on the size of your site.
      </p>
    </div>
  );
}
