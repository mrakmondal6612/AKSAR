import FavoriteIcon from "@/Icons/FavoriteIcon";
import { Button, Image } from "@nextui-org/react";
import { motion } from "framer-motion";
import React from "react";
import RatingComponent from "../RatingComponent";
import { useCourseContext } from "@/context/courseContext";
import { useNavigate } from "react-router-dom";
import YoutubeIcon from "@/Icons/YoutubeIcon";
import RedirectLinkIcon from "@/Icons/RedirectLinkIcon";

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

  const { coursesData } = useCourseContext();

  const handleCheckboxChange = (courseId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const getTutorInitial = (tutorName: string): string => {
    return tutorName.charAt(0).toUpperCase();
  };

  const getGradientColors = (index: number): string[] => {
    const gradients = [
      ["from-blue-600", "to-cyan-600"],
      ["from-purple-600", "to-pink-600"],
      ["from-orange-600", "to-red-600"],
      ["from-green-600", "to-teal-600"],
      ["from-indigo-600", "to-blue-600"],
    ];
    return gradients[index % gradients.length];
  };

  const navigate = useNavigate();

  return (
    <>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-5"
        initial="hidden"
        animate="visible"
      >
        {coursesData.length !== 0 ? (
          coursesData.map((course: any, i: number) => {
            const [gradFrom, gradTo] = getGradientColors(i);
            const discount = course.originalPrice === course.sellingPrice
              ? 0
              : Math.round(((course.originalPrice - course.sellingPrice) / course.originalPrice) * 100);

            return (
              <motion.div
                key={course.courseId}
                className="group relative h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer border border-gray-700/50 hover:border-purple-500/50"
                custom={i}
                variants={cardVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(`/course-intro-page?c=${course.courseId}`)}
              >
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradFrom} ${gradTo} opacity-0 group-hover:opacity-5 transition-all duration-300 z-0`} />

                {/* Course Image Container */}
                <div className="relative w-full h-52 overflow-hidden">
                  <Image
                    src={course.thumbnail}
                    alt="course-img"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-80" />

                  {/* Favorite Button */}
                  <label
                    htmlFor={`favourite-${course.courseId}`}
                    className="absolute top-3 right-3 cursor-pointer z-10 hover:scale-110 transition-transform"
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
                      fillColor={checkedItems[course.courseId] ? "rgb(239 68 68)" : "none"}
                    />
                  </label>

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${gradFrom} ${gradTo} shadow-lg`}>
                      {course.courseType === "YOUTUBE" ? "📺 YouTube" : course.courseType === "REDIRECT" ? "🔗 External" : "🎓 Premium"}
                    </span>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3 z-10">
                    {course.sellingPrice === 0 ? (
                      <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg animate-pulse">
                        FREE
                      </span>
                    ) : (
                      <div className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                        {course.currency} {course.sellingPrice}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-5 space-y-4 flex flex-col justify-between relative z-5 flex-grow">
                  {/* Title */}
                  <div>
                    <h2 className="text-xl font-bold text-white line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-300">
                      {course.courseName}
                    </h2>
                  </div>

                  {/* Tutor Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradFrom} ${gradTo} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                      {getTutorInitial(course.tutorName)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-300 font-semibold">{course.tutorName}</p>
                      <p className="text-xs text-gray-500">Instructor</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 bg-gradient-to-br from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-700/50">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <RatingComponent rating={course.rating ?? 0} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Rating</p>
                    </div>
                    <div className="text-center border-l border-r border-gray-600">
                      <p className="text-sm font-bold text-blue-400">{course.ratingCount}</p>
                      <p className="text-xs text-gray-400">Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                        {discount}%
                      </p>
                      <p className="text-xs text-gray-400">Off</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-auto pt-2">
                    <Button
                      className="flex-1 font-semibold bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500 text-sm py-2.5 rounded-lg shadow-lg"
                      onClick={() => navigate(`/course-intro-page?c=${course.courseId}`)}
                    >
                      Details
                    </Button>
                    <Button
                      className={`flex-1 font-semibold text-white text-sm flex items-center justify-center gap-2 py-2.5 rounded-lg shadow-lg ${course.courseType === "YOUTUBE"
                          ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
                          : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                        }`}
                      onClick={() => navigate(`/course-intro-page?c=${course.courseId}`)}
                    >
                      {course.courseType === "YOUTUBE" ? (
                        <YoutubeIcon fillColor="white" size={18} />
                      ) : course.courseType === "REDIRECT" ? (
                        <RedirectLinkIcon fillColor="white" />
                      ) : (
                        <Image src="/logo/logo.png" className="aspect-square size-4" />
                      )}
                      Enroll
                    </Button>
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
