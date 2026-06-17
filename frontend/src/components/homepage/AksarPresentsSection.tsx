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

  const getGradientColors = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ["from-blue-600", "to-cyan-600"],
      ["from-purple-600", "to-pink-600"],
      ["from-orange-600", "to-red-600"],
      ["from-green-600", "to-teal-600"],
      ["from-indigo-600", "to-blue-600"],
      ["from-rose-600", "to-pink-600"],
    ];
    return gradients[index % gradients.length];
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
        className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {displayCourses.length > 0 ? (
          displayCourses.map((course, index) => {
            const discount =
              course.originalPrice === course.sellingPrice
                ? 0
                : Math.round(
                    ((course.originalPrice - course.sellingPrice) /
                      course.originalPrice) *
                      100
                  );
            const [gradFrom, gradTo] = getGradientColors(index);

            return (
              <motion.div
                key={course.courseId}
                variants={cardVariants}
                className="group relative h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                whileHover={{ y: -8 }}
                onClick={() =>
                  navigate(`/course-intro-page?c=${course.courseId}`)
                }
              >
                {/* Background Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradFrom} ${gradTo} opacity-0 group-hover:opacity-10 transition-all duration-300 z-0`}
                />

                {/* Course Image Container */}
                <div className="relative w-full h-40 overflow-hidden">
                  <Image
                    src={course.thumbnail}
                    alt={course.courseName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />

                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{discount}%
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="relative z-10 p-3 md:p-4">
                  {/* Title */}
                  <h3 className="text-base md:text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-sky-400 group-hover:to-blue-500 group-hover:bg-clip-text transition-all duration-300">
                    {course.courseName}
                  </h3>

                  {/* Price Section */}
                  {/* Description */}
                  {course.description && (
                    <p className="text-xs md:text-sm text-gray-400 mb-3 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg md:text-xl font-extrabold text-white">
                      ₹{course.sellingPrice}
                    </span>
                    {discount > 0 && (
                      <span className="text-xs md:text-sm text-gray-400 line-through">
                        ₹{course.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Rating (if available) */}
                  {course.rating && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-base ${
                              i < Math.floor(course.rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-600"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-300">
                        {course.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  <button className="w-full py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm rounded-lg hover:shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0">
                    Explore Course →
                  </button>
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
