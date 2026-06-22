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
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 py-4"
        initial="hidden"
        animate="visible"
      >
        {dataToRender.length !== 0 ? (
            dataToRender.map((course: any, i: number) => {
            return (
              <motion.div
                key={course.courseId}
                className="group relative h-full flex flex-col bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-800"
                custom={i}
                variants={cardVariants}
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
                <div className="p-4 space-y-3 flex flex-col flex-grow">
                  {/* Title */}
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                    {course.courseName}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Creator Info */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {getTutorInitial(course.tutorName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{course.tutorName}</p>
                    </div>
                  </div>

                  {/* Course Level Badge */}
                  {course.courseLevel && (
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full">
                        {course.courseLevel}
                      </span>
                    </div>
                  )}


                  <div className="pt-3 mt-auto border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Course Price</p>
                    {course.sellingPrice === 0 ? (
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">FREE</p>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {course.currency === "$" || !course.currency ? "₹" : course.currency}{course.sellingPrice}
                        </p>
                        {course.originalPrice > course.sellingPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            {course.currency === "$" || !course.currency ? "₹" : course.currency}{course.originalPrice}
                          </p>
                        )}
                      </div>
                    )}
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
