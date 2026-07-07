import { createContext, useState, useContext, ReactNode } from "react"; // Import the utility function
import React from "react";
import { ICourseData } from "@/constants";
import axios from "axios";
import { COURSE_API } from "@/lib/env";
import { ErrorToast } from "@/lib/toasts";

interface CourseContextType {
  coursesData: ICourseData[];
  setCoursesData: React.Dispatch<React.SetStateAction<ICourseData[]>>;
  updatedCourseData: ICourseData[];
  setupdatedCourseData: React.Dispatch<React.SetStateAction<ICourseData[]>>;
  searchYouTubeCourses: (query: string) => Promise<void>;
  fetchCourseData: (category?: string) => Promise<void>;
}

export const CourseContext = createContext<CourseContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an CourseContextProvider");
  }
  return context;
};

export const CourseContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coursesData, setCoursesData] = useState<ICourseData[]>([]);
  const [updatedCourseData, setupdatedCourseData] = useState<ICourseData[]>([]);

  const fetchCourseData = React.useCallback(async (category = "") => {
    try {
      let allCourses: ICourseData[] = [];

      // Fetch regular database courses (with error handling)
      try {
        const regularCoursesResponse = await axios.get(`${COURSE_API}/get-all-courses`);
        if (regularCoursesResponse?.data?.success && regularCoursesResponse.data.data) {
          allCourses = [...allCourses, ...regularCoursesResponse.data.data];
        }
      } catch (error) {
        console.log("No database courses found, trying YouTube courses...");
      }
      // Fetch YouTube courses (with error handling)
      try {
        const youtubeCoursesResponse = await axios.get(`${COURSE_API}/youtube/all-courses`);
        if (youtubeCoursesResponse?.data?.success && youtubeCoursesResponse.data.data) {
          allCourses = [...allCourses, ...youtubeCoursesResponse.data.data];
        }
      } catch (error) {
        console.log("YouTube courses not available");
      }

      // Filter by category if specified
      if (category && category !== "ALL") {
        allCourses = allCourses.filter((course: any) => {
          if (category === "SEMESTER") {
            return course.category === "SEMESTER" || course.courseType === "SEMESTER";
          }
          if (category === "TECH") {
            return course.category === "TECH" || course.courseType === "TECH";
          }
          return course.courseType === category;
        });
      }

      if (allCourses && allCourses.length > 0) {
        setCoursesData(allCourses);
      }
      else {
        ErrorToast("No courses found");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      ErrorToast(error?.response?.data?.message || "Error fetching courses");
    }
  }, [])

  const searchYouTubeCourses = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      // If search is empty, fetch all courses again
      await fetchCourseData();
      return;
    }

    try {
      const response = await axios.get(`${COURSE_API}/youtube/search`, {
        params: { searchQuery: query, maxResults: 20 }
      });

      if (response?.data?.success && response.data.data) {
        setCoursesData(response.data.data);
      }
      else {
        ErrorToast(response?.data?.message || "No courses found");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error searching YouTube courses:", error);
      ErrorToast(error?.response?.data?.message || "Error searching courses");
    }
  }, [fetchCourseData])

  React.useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData])

  return (
    <CourseContext.Provider
      value={{
        coursesData,
        setCoursesData,
        updatedCourseData,
        setupdatedCourseData,
        searchYouTubeCourses,
        fetchCourseData
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
