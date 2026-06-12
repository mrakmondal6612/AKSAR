import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Zap, Users, Target, TrendingUp, Globe } from "lucide-react";

const AksarFeaturesSection: React.FC = () => {
  const features = [
    {
      id: 1,
      icon: <BookOpen className="w-12 h-12" />,
      title: "Comprehensive Study Materials",
      description: "Access curated notes, textbooks, and resources for all subjects and competitive exams.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 2,
      icon: <Zap className="w-12 h-12" />,
      title: "AI-Powered Learning",
      description: "Personalized study recommendations and adaptive learning paths based on your progress.",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 3,
      icon: <Users className="w-12 h-12" />,
      title: "Active Community",
      description: "Connect with peers, join study groups, and get support from expert mentors.",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 4,
      icon: <Target className="w-12 h-12" />,
      title: "Exam Preparation",
      description: "Mock tests, previous year papers, and exam strategy sessions to crack your goals.",
      color: "from-orange-500 to-red-500",
    },
    {
      id: 5,
      icon: <TrendingUp className="w-12 h-12" />,
      title: "Progress Tracking",
      description: "Real-time analytics and detailed performance insights to track your improvement.",
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: 6,
      icon: <Globe className="w-12 h-12" />,
      title: "Career Support",
      description: "Career guidance, interview prep, and industry connections for your future.",
      color: "from-teal-500 to-blue-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section
      className="w-full mx-auto px-4 md:px-6 py-16 md:py-24 bg-gradient-to-b from-transparent via-slate-50/30 to-transparent dark:via-slate-900/20"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-16 md:mb-20 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-sm uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400 font-semibold mb-3">
          AKSAR Features
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold font-ubuntu text-slate-950 dark:text-white mb-4 leading-tight">
          Everything You Need to Excel
        </h2>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          AKSAR provides comprehensive learning solutions designed to help students achieve their academic and career goals.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.id}
            variants={cardVariants}
            className="group relative"
          >
            {/* Gradient background glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
            />

            {/* Card */}
            <div className="relative h-full p-6 md:p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-slate-300 dark:group-hover:border-slate-700">
              {/* Icon Container */}
              <div
                className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-extrabold text-slate-950 dark:text-white mb-3">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Arrow */}
              <motion.div
                className="mt-4 inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: -8 }}
                whileHover={{ x: 4 }}
              >
                Learn More <span>→</span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Section */}
      <motion.div
        className="mt-16 md:mt-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-6">
          Ready to transform your learning journey?
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-full shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
          onClick={() => window.location.href = '/signup'}
        >
          Start Learning Today →
        </motion.button>
      </motion.div>
    </motion.section>
  );
};

export default AksarFeaturesSection;
