import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  duration?: number;
  theme: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  suffix = "",
  duration = 2.5,
  theme,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const increment = end / (duration * 60);
    let animationFrame: NodeJS.Timeout;

    const animate = () => {
      startValue += increment;
      if (startValue < end) {
        setCount(Math.floor(startValue));
        animationFrame = setTimeout(animate, 1000 / 60);
      } else {
        setCount(end);
      }
    };

    animate();

    return () => clearTimeout(animationFrame);
  }, [end, duration]);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "k";
    }
    return num.toString();
  };

  return (
    <motion.span
      className={`text-2xl md:text-4xl font-ubuntu font-bold text-transparent bg-clip-text
        ${
          theme === "dark"
            ? "bg-gradient-to-r from-purple-400 to-pink-400"
            : "bg-gradient-to-r from-purple-600 to-pink-600"
        }
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {formatNumber(count)}
      {suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
