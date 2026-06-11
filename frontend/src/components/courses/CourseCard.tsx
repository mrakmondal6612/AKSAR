import FavoriteIcon from "@/Icons/FavoriteIcon";
import { Button, Image } from "@nextui-org/react";
import { motion } from "framer-motion";
import React from "react";
import RatingComponent from "../RatingComponent";
import { useCourseContext } from "@/context/courseContext";
import { useNavigate } from "react-router-dom";
import YoutubeIcon from "@/Icons/YoutubeIcon";
import RedirectLinkIcon from "@/Icons/RedirectLinkIcon";
import SkeletonCard from "../SkeletonCard";

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
                className="group relative h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                custom={i}
                variants={cardVariants}
                whileHover={{ y: -8 }}
                onClick={() => navigate(`/course-intro-page?c=${course.courseId}`)}
              >
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradFrom} ${gradTo} opacity-0 group-hover:opacity-10 transition-all duration-300 z-0`} />

                {/* Course Image Container */}
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={course.thumbnail}
                    alt="course-img"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />

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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${gradFrom} ${gradTo}`}>
                      {course.courseType === "YOUTUBE" ? "YouTube" : course.courseType === "REDIRECT" ? "External" : "Premium"}
                    </span>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-3 right-3 z-10">
                    {course.sellingPrice === 0 ? (
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r from-green-500 to-teal-500">
                        FREE
                      </span>
                    ) : (
                      <div className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600">
                        {course.currency} {course.sellingPrice}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-4 space-y-3 flex flex-col justify-between relative z-5 flex-grow">
                  {/* Title */}
                  <div>
                    <h2 className="text-lg font-bold text-white line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all">
                      {course.courseName}
                    </h2>
                  </div>

                  {/* Tutor Info */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradFrom} ${gradTo} flex items-center justify-center text-white text-xs font-bold`}>
                      {getTutorInitial(course.tutorName)}
                    </div>
                    <p className="text-sm text-gray-300 font-medium">{course.tutorName}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-2 bg-gray-700/30 rounded-lg">
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
                      <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">
                        {discount}%
                      </p>
                      <p className="text-xs text-gray-400">Off</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 line-clamp-2 italic">
                    {course.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button
                      className="flex-1 font-medium bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-600 hover:to-gray-500 text-sm"
                      onClick={() => navigate(`/course-intro-page?c=${course.courseId}`)}
                    >
                      Details
                    </Button>
                    <Button
                      className={`flex-1 font-medium text-white text-sm flex items-center justify-center gap-1 ${course.courseType === "YOUTUBE"
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
          [1, 2, 3].map((_, i) => (
            <motion.div
              key={i}
              className="w-full"
              custom={i}
              variants={cardVariants}
            >
              <SkeletonCard />
            </motion.div>
          ))
        )}
      </motion.div>
    </>
  );
};

export default CourseCard;
