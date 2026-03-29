import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RadialProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function RadialProgress({
  score,
  size = 120,
  strokeWidth = 8,
  className,
  label
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = "stroke-primary";
  let textColor = "text-primary";
  if (score >= 80) {
    colorClass = "stroke-action-green";
    textColor = "text-action-green";
  } else if (score < 50) {
    colorClass = "stroke-destructive";
    textColor = "text-destructive";
  }

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none"
            style={{ stroke: '#e0dbd0' }}
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn("fill-none drop-shadow-md", colorClass)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={cn("text-3xl font-display font-bold tracking-tighter", textColor)}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-3 text-sm font-medium text-propolis-brown uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
