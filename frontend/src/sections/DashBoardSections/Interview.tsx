import React from "react";
import { motion } from "framer-motion";
import { 
  Terminal, 
  ExternalLink, 
  Sparkles, 
  Laptop, 
  FileText, 
  TrendingUp, 
  Award,
  ShieldCheck
} from "lucide-react";

const InterviewPage: React.FC = () => {
  const features = [
    {
      icon: <Laptop className="w-6 h-6 text-indigo-500" />,
      title: "Realtime Mock Interviews",
      desc: "Practice with highly realistic mock interviews tailored to your target roles and experience levels."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-fuchsia-500" />,
      title: "AI-Powered Recommendations",
      desc: "Get instant, actionable feedback on your answers, coding efficiency, and behavioral responses."
    },
    {
      icon: <FileText className="w-6 h-6 text-teal-500" />,
      title: "Resume & Portfolio Review",
      desc: "Ensure your profile stands out to top tech recruiters with AI-guided resume optimization tools."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: "Topic-wise Preparation",
      desc: "Master key concepts in Data Structures & Algorithms, System Design, and Core Engineering subjects."
    }
  ];

  return (
    <motion.div
      className="w-full relative dark:bg-[#0b0f19]/40 bg-white border border-gray-200 dark:border-gray-800/80 rounded-2xl p-6 sm:p-10 space-y-10 overflow-hidden shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Decorative background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[350px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[350px] h-[350px] bg-fuchsia-500/10 dark:bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 text-center max-w-2xl mx-auto space-y-4 font-ubuntu">
        <motion.div 
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Special Integration</span>
        </motion.div>
        
        <motion.h1 
          className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Interview Orbit
        </motion.h1>
        
        <motion.p 
          className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Your ultimate destination to excel in technical and behavioral interviews. Partnered with AKSAR to supercharge your career.
        </motion.p>
      </div>

      {/* Landing Highlight Card */}
      <motion.div 
        className="relative z-10 p-1 rounded-3xl bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-fuchsia-500/30 shadow-2xl dark:shadow-indigo-950/20 font-ubuntu"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
      >
        <div className="bg-white/80 dark:bg-[#0b0f19]/90 backdrop-blur-xl rounded-[22px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20 dark:border-white/5">
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Verified Platform</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ready to land your dream role?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-noto-sans">
              Launch Interview Orbit now to start practicing. Get realistic company-specific interview questions, optimize your resumes, and run unlimited mock rounds.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <motion.a
              href="https://interview-orbit.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg hover:shadow-indigo-500/20 dark:shadow-indigo-950/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Launch Interview Orbit</span>
              <ExternalLink className="w-4 h-4" />
            </motion.a>
          </div>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 font-ubuntu">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            className="group flex gap-4 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#0f1422]/50 hover:bg-white dark:hover:bg-[#111728] hover:border-indigo-500/20 dark:hover:border-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <div className="flex-shrink-0 p-3 rounded-xl bg-white dark:bg-[#161c2e] border border-gray-200/50 dark:border-gray-800 group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                {feature.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-noto-sans">
                {feature.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Footer Info */}
      <motion.div 
        className="relative z-10 text-center text-xs text-gray-400 dark:text-gray-500 flex justify-center items-center gap-1.5 pt-4 font-ubuntu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>Powered by Interview Orbit & AKSAR Partners</span>
      </motion.div>
    </motion.div>
  );
};

export default InterviewPage;
