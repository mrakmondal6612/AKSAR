import FavoriteIcon from "@/Icons/FavoriteIcon";
import { Image } from "@nextui-org/react";
import { motion } from "framer-motion";
import React from "react";
import { useCourseContext } from "@/context/courseContext";
import { useNavigate } from "react-router-dom";

const cardVariants = {
  hidden: (_i: number) => ({
    opacity: 0,
    y: 20,
    scale: 0.95,
  }),
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

const CourseCard: React.FC = () => {
  const [checkedItems, setCheckedItems] = React.useState<{
    [key: string]: boolean;
  }>({});

  const { coursesData, updatedCourseData } = useCourseContext();

  const handleCheckboxChange = (courseId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const getTutorInitial = (tutorName: string): string => {
    return tutorName.charAt(0).toUpperCase();
  };

  const navigate = useNavigate();

  const dataToRender = (updatedCourseData && updatedCourseData.length > 0) ? updatedCourseData : coursesData;

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 py-4"
        initial="hidden"
        animate="visible"
      >
        {dataToRender.length !== 0 ? (
            dataToRender.map((course: any, i: number) => {
            return (
              <motion.div
                key={course.courseId}
                className="group relative h-full flex flex-col bg-[#1e293b] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-800"
                custom={i}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/course-details?c=${course.courseId}`)}
              >
                {/* Course Image Container */}
                <div className="relative w-full h-36 sm:h-40 md:h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
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

                  {/* Favorite Button */}
                  <label
                    htmlFor={`favourite-${course.courseId}`}
                    className="absolute top-4 right-4 cursor-pointer z-10 hover:scale-110 transition-transform"
                  >
                    <input
                      type="checkbox"
                      name={`favourite-${course.courseId}`}
                      id={`favourite-${course.courseId}`}
                      className="absolute inset-0 hidden"
                      onChange={() => handleCheckboxChange(course.courseId)}
                      checked={checkedItems[course.courseId] || false}
                    />
                    <FavoriteIcon
                      fillColor={checkedItems[course.courseId] ? "rgb(239 68 68)" : "white"}
                    />
                  </label>
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
                        {getTutorInitial(course.tutorName)}
                      </div>
                      <p className="text-sm font-semibold text-slate-300">{course.tutorName}</p>
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
          <motion.div
            className="col-span-full text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No Courses Found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default CourseCard;
