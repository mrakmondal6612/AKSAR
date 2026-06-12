import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Users, BarChart3, ShieldCheck } from "lucide-react";

interface CardData {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WhyAksarCarousel: React.FC = () => {
  const cardsData: CardData[] = [
    {
      id: 1,
      title: "Live Interactive Coaching",
      description:
        "Weekend live sessions, mentor Q&A, and small-group guidance crafted for academic confidence and exam readiness.",
      icon: <BookOpen className="w-14 h-14 text-sky-500" />,
    },
    {
      id: 2,
      title: "AI-Powered Study Plans",
      description:
        "Personalized learning paths and smart progress tracking that adapt to each student’s pace and strengths.",
      icon: <Sparkles className="w-14 h-14 text-purple-500" />,
    },
    {
      id: 3,
      title: "Community Study Circles",
      description:
        "Join active peer groups, discuss concepts, share resources, and build motivation with other AKSAR learners.",
      icon: <Users className="w-14 h-14 text-emerald-500" />,
    },
    {
      id: 4,
      title: "Mock Tests & Analytics",
      description:
        "Practice with exam-style tests and clear analytics so every student can track progress and improve faster.",
      icon: <BarChart3 className="w-14 h-14 text-orange-500" />,
    },
    {
      id: 5,
      title: "Career-Ready Preparation",
      description:
        "Build skills for board exams, competitive tests, and future careers with focused content and certification support.",
      icon: <ShieldCheck className="w-14 h-14 text-rose-500" />,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % cardsData.length);
      }, 5000);
    };

    startAutoPlay();
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [cardsData.length]);

  const resetAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cardsData.length);
    }, 5000);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cardsData.length) % cardsData.length);
    resetAutoPlay();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cardsData.length);
    resetAutoPlay();
  };

  const prevCard = cardsData[(currentIndex - 1 + cardsData.length) % cardsData.length];
  const nextCard = cardsData[(currentIndex + 1) % cardsData.length];
  const activeCard = cardsData[currentIndex];

  return (
    <motion.section
      className="w-full mx-auto px-4 md:px-6 py-16 md:py-24"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="text-center mb-16 md:mb-20"
        initial={{ opacity: 0, y: -26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
      >
        <p className="text-xl uppercase tracking-[0.24em] text-sky-600 font-semibold mb-3">
          Why AKSAR?
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold font-ubuntu text-slate-950 dark:text-white mb-4 leading-tight">
          A smarter learning journey for every student.
        </h2>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
          AKSAR brings live coaching, AI personalization, and exam-ready community support together in one modern platform.
        </p>
      </motion.div>

      <div className="w-full flex flex-col items-center justify-center">
        <div className="relative w-full max-w-6xl px-4 md:px-8 lg:px-12">
          <div className="relative h-[380px] md:h-[360px] lg:h-[360px] flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={prevCard.id}
                  initial={{ opacity: 0, x: -80, scale: 0.86 }}
                  animate={{ opacity: 0.35, x: 0, scale: 0.9 }}
                  exit={{ opacity: 0, x: -80, scale: 0.86 }}
                  transition={{ duration: 0.45 }}
                  className="hidden lg:block absolute -left-44 w-72 h-72 rounded-[28px] bg-slate-100 dark:bg-slate-900/80 border border-white/20 shadow-xl"
                >
                  <div className="h-full p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-slate-900 dark:text-white">
                      {prevCard.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {prevCard.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {prevCard.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCard.id}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -40, scale: 0.95 }}
                  transition={{ duration: 0.45 }}
                  className="relative w-80 md:w-96 lg:w-[36rem] h-full rounded-[32px] bg-slate-950 dark:bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-violet-500/5 to-slate-950/10" />
                  <div className="relative z-10 h-full p-8 md:p-10 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-white/10 border border-white/10 text-white">
                        {activeCard.icon}
                      </div>
                      <div className="text-xs uppercase tracking-[0.24em] text-sky-300 font-semibold">
                        AKSAR Feature
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                        {activeCard.title}
                      </h3>
                      <p className="text-sm md:text-base text-slate-300 leading-relaxed">
                        {activeCard.description}
                      </p>
                    </div>
                    <div className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-semibold border border-white/15 shadow-md">
                      Discover AKSAR
                      <span className="text-sky-300">→</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={nextCard.id}
                  initial={{ opacity: 0, x: 80, scale: 0.86 }}
                  animate={{ opacity: 0.35, x: 0, scale: 0.9 }}
                  exit={{ opacity: 0, x: 80, scale: 0.86 }}
                  transition={{ duration: 0.45 }}
                  className="hidden lg:block absolute -right-44 w-72 h-72 rounded-[28px] bg-slate-100 dark:bg-slate-900/80 border border-white/20 shadow-xl"
                >
                  <div className="h-full p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-slate-900 dark:text-white">
                      {nextCard.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {nextCard.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {nextCard.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <motion.button
              onClick={handlePrev}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-slate-950 shadow-lg hover:bg-slate-100 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={handleNext}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-950 text-white shadow-lg hover:bg-slate-800 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <motion.div
            className="flex justify-center gap-2 mt-10 md:mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {cardsData.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  resetAutoPlay();
                }}
                className={`rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-gradient-to-r from-purple-500 to-blue-600 w-8 h-3"
                    : "bg-neutral-300 dark:bg-neutral-600 w-3 h-3 hover:bg-neutral-400 dark:hover:bg-neutral-500"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default WhyAksarCarousel;
