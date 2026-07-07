import CourseCard from "@/components/courses/CourseCard";
import React from "react";
import CoursesNavbar from "@/components/courses/CoursesNav";
// SemesterFilter removed per request (All/S1.. and Technical only removed)
import Seperator from "@/components/Seperator";
import { CourseContextProvider } from "@/context/courseContext";
import { motion } from "framer-motion";
// import VideoCard from "@/components/courses/VideoCard";

const Courses: React.FC = () => {
  return (
    <CourseContextProvider>
      <section className="max-w-7xl mx-auto flex-col flex xl:pt-24 md:pt-56 pt-28 px-4 sm:px-5 md:px-6">
        {/* Hero Header */}
        <motion.div
          className="text-center mb-6 md:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-3">
            Explore Courses
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Discover premium courses to master new skills and advance your career
          </p>
        </motion.div>

        <CoursesNavbar />
        {/* SemesterFilter removed: semester buttons and technical-only checkbox hidden */}
        <Seperator text="COURSES" />
        <CourseCard />
        {/* <VideoCard /> */}
      </section>
    </CourseContextProvider>
  );
};

export default Courses;
