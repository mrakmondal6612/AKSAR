import React from "react";
import { motion } from "framer-motion";

const PremiumCardsSection: React.FC = () => {
  const features = [
    "AI Study Recommendations",
    "Mock Tests & Quizzes",
    "Career Preparation",
    "Interview Practice",
    "Progress Tracking",
    "Community Learning",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const featurePillVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      className="max-w-6xl w-full mx-auto px-4 md:px-6 py-12 md:py-16"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Card */}
        <motion.div
          variants={cardVariants}
          className="relative group h-full"
        >
          {/* Glassmorphism background with gradient border */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-blue-500/20 to-purple-600/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative h-full p-8 md:p-10 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 overflow-hidden shadow-2xl hover:shadow-purple-500/30 transition-shadow duration-500">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-blue-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              {/* Title */}
              <motion.h2 className="text-3xl md:text-4xl font-extrabold font-ubuntu bg-gradient-to-r from-purple-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-3 leading-tight">
                Learn Smarter with AKSAR
              </motion.h2>

              {/* Subtitle */}
              <motion.p className="text-base md:text-lg text-neutral-600 dark:text-neutral-300 font-libre mb-8 leading-relaxed">
                One platform for notes, quizzes, mock tests, career preparation
                and AI-powered learning.
              </motion.p>

              {/* Feature Pills */}
              <motion.div
                className="flex flex-wrap gap-3"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {features.map((feature, index) => (
                  <motion.span
                    key={index}
                    variants={featurePillVariants}
                    className="px-4 py-2 bg-white/15 dark:bg-white/10 backdrop-blur-sm rounded-full text-sm md:text-base font-medium text-neutral-700 dark:text-neutral-200 border border-white/30 dark:border-white/20 hover:bg-white/25 dark:hover:bg-white/15 transition-all duration-300 hover:scale-105"
                  >
                    ✓ {feature}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right Card */}
        <motion.div
          variants={cardVariants}
          className="relative group h-full"
        >
          {/* Glassmorphism background with gradient border */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-teal-600/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative h-full p-8 md:p-10 bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 overflow-hidden shadow-2xl hover:shadow-blue-500/30 transition-shadow duration-500">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-cyan-500/5 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              {/* Title */}
              <motion.h2 className="text-3xl md:text-4xl font-extrabold font-ubuntu bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent mb-3 leading-tight">
                Empowering India's Next Generation Learners
              </motion.h2>

              {/* Subtitle */}
              <motion.p className="text-base md:text-lg text-neutral-600 dark:text-neutral-300 font-libre mb-8 leading-relaxed">
                From School to PhD, Competitive Exams and Career Success.
              </motion.p>

              {/* Stats Section */}
              <motion.div className="grid grid-cols-2 gap-4">
                {[
                  { number: "50K+", label: "Active Learners" },
                  { number: "500+", label: "Courses" },
                  { number: "10K+", label: "Study Materials" },
                  { number: "24/7", label: "Community Support" },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    variants={featurePillVariants}
                    className="p-4 bg-white/15 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-white/20 hover:bg-white/25 dark:hover:bg-white/15 transition-all duration-300 text-center hover:scale-105"
                  >
                    <p className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                      {stat.number}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* View All Courses Button */}
      <motion.div
        className="flex justify-center mt-12 md:mt-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          onClick={() => window.location.href = '/courses'}
        >
          View All Courses →
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default PremiumCardsSection;
