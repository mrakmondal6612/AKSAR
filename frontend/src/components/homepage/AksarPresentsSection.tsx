import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useCourseContext } from "@/context/courseContext";
import { useNavigate } from "react-router-dom";
import { Image } from "@nextui-org/react";

interface Course {
  courseId: string;
  courseName: string;
  thumbnail: string;
  originalPrice: number;
  sellingPrice: number;
  rating?: number;
  description?: string;
  instructor?: string;
  tutorName?: string;
  ratingCount?: number;
  courseLevel?: string;
  category?: string;
  courseType?: string;
  currency?: string;
}

const AksarPresentsSection: React.FC = () => {
  const { coursesData } = useCourseContext();
  const navigate = useNavigate();
  const [displayCourses, setDisplayCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (coursesData && coursesData.length > 0) {
      // Show first 6 courses
      setDisplayCourses(coursesData.slice(0, 6));
    }
  }, [coursesData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  const getTutorInitial = (name: string): string => {
    return name?.charAt(0).toUpperCase() || "T";
  };

  return (
    <motion.section
      className="w-full mx-auto px-4 md:px-6 py-16 md:py-24"
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
          Curated Selection
        </p>
        <h2 className="text-4xl md:text-5xl font-extrabold font-ubuntu text-slate-950 dark:text-white mb-4 leading-tight">
          AKSAR PRESENTS
        </h2>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Explore our best-selling and most-rated courses to accelerate your learning journey.
        </p>
      </motion.div>

      {/* Courses Grid */}
      <motion.div
        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {displayCourses.length > 0 ? (
          displayCourses.map((course) => {
            return (
              <motion.div
                key={course.courseId}
                variants={cardVariants}
                className="group relative h-full flex flex-col bg-[#1e293b] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-800"
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/course-details?c=${course.courseId}`)}
              >
                {/* Course Image Container */}
                <div className="relative w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={course.thumbnail}
                    alt="course-img"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Text Overlays on Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4 space-y-1">
                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                      {course.category || course.courseType}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white text-lg font-bold drop-shadow-lg">
                      {course.courseName?.split(' ')[0] || 'WEB'} DEV
                    </div>
                    <div className="text-white/90 text-sm font-medium drop-shadow-md">
                      FULL ROADMAP
                    </div>
                    <div className="text-white/80 text-xs drop-shadow-sm">
                      {new Date().getFullYear()}
                    </div>
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-4 space-y-3 flex flex-col flex-grow bg-[#1e293b]">
                  {/* Title */}
                  <h2 className="text-lg font-bold text-white line-clamp-1">
                    {course.courseName}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Creator Info & Level Badge */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0 font-ubuntu">
                        {getTutorInitial(course.tutorName || "")}
                      </div>
                      <p className="text-sm font-semibold text-slate-300">{course.tutorName || "Instructor"}</p>
                    </div>
                    {course.courseLevel && (
                      <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full font-ubuntu">
                        {course.courseLevel}
                      </span>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="pt-3 mt-auto border-t border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-200">Course Price</span>
                    <div className="flex items-center gap-2">
                      {course.sellingPrice === 0 ? (
                        <span className="text-lg font-bold text-green-400">FREE</span>
                      ) : (() => {
                        const currencySymbol = course.currency && (course.currency.includes("INR") || course.currency.includes("₹")) ? "₹" : (course.currency === "$" ? "$" : "₹");
                        return (
                          <>
                            {course.originalPrice > course.sellingPrice && (
                              <span className="text-xs text-slate-500 line-through">
                                {currencySymbol}{course.originalPrice}
                              </span>
                            )}
                            <span className="text-lg font-bold text-white">
                              {currencySymbol}{course.sellingPrice}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Loading courses...
            </p>
          </div>
        )}
      </motion.div>

      {/* View All CTA */}
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
          onClick={() => navigate("/courses")}
        >
          View All Courses →
        </motion.button>
      </motion.div>
    </motion.section>
  );
};

export default AksarPresentsSection;
