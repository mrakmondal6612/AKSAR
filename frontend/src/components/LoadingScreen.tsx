import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";

const LoadingScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-black z-50">
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        {/* Logo */}
        <motion.img
          src={theme === "dark" ? "/images/course-yuga-logo-dark-mode-5.png" : "/images/course-yuga-logo-dark-mode-5.png"}
          alt="AKSAR Logo"
          className="w-32 h-32 md:w-48 md:h-48 object-contain"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 blur-3xl opacity-30"
          style={{
            background: theme === "dark"
              ? "radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Loading text */}
      <motion.div
        className="mt-8 flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 0.3,
          ease: "easeOut",
        }}
      >
        <span className={`text-2xl font-bold font-ubuntu ${
          theme === "dark" ? "text-white" : "text-black"
        }`}>
          AKSAR
        </span>
        <motion.div
          className="flex gap-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="mt-6 w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "12rem" }}
        transition={{
          duration: 0.8,
          delay: 0.5,
          ease: "easeOut",
        }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
