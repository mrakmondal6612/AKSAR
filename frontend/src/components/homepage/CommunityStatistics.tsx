import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { useNavigate } from "react-router-dom";
import AnimatedCounter from "./AnimatedCounter";

interface StatCardProps {
  number: number;
  label: string;
  icon: React.ReactNode;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ number, label, icon, delay }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true, amount: 0.3 }}
      className={`relative flex flex-col items-center justify-center p-4 md:p-8 rounded-2xl backdrop-blur-xl border group overflow-hidden
        ${
          theme === "dark"
            ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-400/50"
            : "bg-gradient-to-br from-purple-100/50 to-pink-100/50 border-purple-200/50 hover:border-purple-300/80"
        }
        transition-all duration-300 hover:shadow-2xl transform hover:scale-105
      `}
    >
      {/* Background glow effect */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl
        ${
          theme === "dark"
            ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
            : "bg-gradient-to-br from-purple-200/30 to-pink-200/30"
        }
      `}
      />

      {/* Icon */}
      <motion.div
        className="relative z-10 mb-3 text-2xl md:text-4xl transform group-hover:scale-110 transition-transform duration-300"
        whileHover={{ rotate: 10, scale: 1.2 }}
      >
        {icon}
      </motion.div>

      {/* Number */}
      <motion.h3
        className={`relative z-10 mb-2 text-transparent bg-clip-text`}
        whileHover={{ scale: 1.05 }}
      >
        <AnimatedCounter end={number} suffix="+" theme={theme} />
      </motion.h3>

      {/* Label */}
      <p
        className={`relative z-10 text-center text-xs md:text-sm font-noto-sans font-medium
        ${theme === "dark" ? "text-gray-300" : "text-gray-700"}
      `}
      >
        {label}
      </p>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left w-full`}
      />
    </motion.div>
  );
};

const CommunityStatistics: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const statistics = [
    {
      number: 40,
      label: "Happy Learners",
      icon: "👨‍🎓",
    },
    {
      number: 30,
      label: "Monthly Views",
      icon: "👁️",
    },
    {
      number: 25,
      label: "New Monthly Subscribers",
      icon: "⭐",
    },
  ];

  return (
    <section
      className={`relative w-full py-12 md:py-16 lg:py-20 px-5 overflow-hidden
        ${theme === "dark" ? "bg-black" : "bg-white"}
      `}
    >
      {/* Premium Gradient Background */}
      <div
        className={`absolute inset-0 opacity-30
        ${
          theme === "dark"
            ? "bg-gradient-to-b from-purple-900/40 via-transparent to-pink-900/40"
            : "bg-gradient-to-b from-purple-200/30 via-transparent to-pink-200/30"
        }
      `}
      />

      {/* Animated gradient orbs */}
      <motion.div
        className={`absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20
        ${theme === "dark" ? "bg-purple-500" : "bg-purple-400"}
      `}
        animate={{
          y: [0, 50, 0],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className={`absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20
        ${theme === "dark" ? "bg-pink-500" : "bg-pink-400"}
      `}
        animate={{
          y: [0, -50, 0],
          x: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-10 md:mb-14"
        >
          <h2
            className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-ubuntu font-extrabold mb-4 text-transparent bg-clip-text tracking-wider letter-spacing
            ${
              theme === "dark"
                ? "bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"
                : "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
            }
          `}
            style={{ letterSpacing: "0.05em" }}
          >
            INDIA'S MOST LOVED LEARNING COMMUNITY
          </h2>
          <motion.div
            className={`h-1.5 w-20 md:w-24 mx-auto rounded-full
            ${theme === "dark" ? "bg-gradient-to-r from-purple-400 to-pink-400" : "bg-gradient-to-r from-purple-600 to-pink-600"}
          `}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          />
        </motion.div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {statistics.map((stat, index) => (
            <StatCard
              key={index}
              number={stat.number}
              label={stat.label}
              icon={stat.icon}
              delay={index * 0.2}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mt-10 md:mt-14"
        >
          <p
            className={`text-sm md:text-base font-noto-sans mb-6
            ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
          `}
          >
            Join thousands of learners growing their coding skills with us
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 md:px-10 py-2 md:py-3 rounded-full font-ubuntu font-semibold text-sm md:text-base text-white
            bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
            transition-all duration-300 shadow-lg hover:shadow-2xl
          `}
            onClick={() => navigate("/community")}
          >
            Become Part of Our Community
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default React.memo(CommunityStatistics);
