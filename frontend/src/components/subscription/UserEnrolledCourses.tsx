import { motion } from "framer-motion";
import { Button, Image, Input, Select, SelectItem, Chip, Spinner } from "@nextui-org/react";
import { useTheme } from "@/context/ThemeProvider";
import { getVerifiedToken } from "@/lib/cookieService";
import axios from "axios";
import { COURSE_API, USER_API } from "@/lib/env";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import React from "react";
import { useAuthContext } from "@/context/authContext";
import { debounce } from "@/lib/debounce";
import CircularProgressBar from "../CircularProgressBar";
import { IUserCourseData } from "@/constants";
import { useNavigate } from "react-router-dom";
import AlertIcon from "@/Icons/AlertIcon";
import SearchIcon from "@/Icons/SearchIcon";

const cardVariants = {
  hidden: (i: number) => ({
    opacity: 1,
    scale: 1,
    x: i * -420,
    filter: "blur(8px)",
    zIndex: i * -1,
  }),
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    zIndex: i * 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      ease: [0.7, 0, 0.84, 0],
    },
  }),
};

const UserEnrolledCourses: React.FC = () => {
  const { theme } = useTheme();
  const { userData } = useAuthContext();
  const [userCourses , setUserCourses] = React.useState<IUserCourseData[] | []>([])
  const [filteredCourses, setFilteredCourses] = React.useState<IUserCourseData[] | []>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [searchTerm, setSearchTerm] = React.useState<string>("")
  const [sortBy, setSortBy] = React.useState<string>("recent")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const navigate = useNavigate();

  const fetchUserEnrolledCourses = React.useCallback(async() => {
    const jwt = getVerifiedToken();
    setLoading(true);

    try {
      const response = await axios.get(`${COURSE_API}/get-user-enrolled-courses`, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      })

      if(response && response.data && response.data.success){
        setUserCourses(response.data.data)
        setFilteredCourses(response.data.data)
      }
      else{
        ErrorToast(response.data.message);
        setUserCourses([]);
        setFilteredCourses([]);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error : any) {
      ErrorToast(error?.response.data.message || "Something went wrong")
      setUserCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }

  }, [])

  React.useEffect(() => {
    fetchUserEnrolledCourses();
  } , [fetchUserEnrolledCourses])

  const debouncedHandleBookmark = debounce(async (courseId: string) => {
    const jwt = getVerifiedToken();
    if (!courseId) return;
    try {
      const response = await axios.post(
        `${USER_API}/unenrolled-in-course`,
        { courseId },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.data && response.data.success) {
        SuccessToast(response.data.message);
        setTimeout(async () => {
          await fetchUserEnrolledCourses();
        }, 100);
      } else {
        ErrorToast(response.data.message);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      ErrorToast(error?.response.data.message || "Something went wrong");
    }
  }, 500);

  const handleUnenrolledClick = (courseId: string | undefined) => {
    if (!courseId) return;
    debouncedHandleBookmark(courseId);
  };

  // Filter and sort courses
  React.useEffect(() => {
    let filtered = [...userCourses];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus === "completed") {
      filtered = filtered.filter(course => {
        const progress = userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0;
        return progress === 100;
      });
    } else if (filterStatus === "in-progress") {
      filtered = filtered.filter(course => {
        const progress = userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0;
        return progress > 0 && progress < 100;
      });
    } else if (filterStatus === "not-started") {
      filtered = filtered.filter(course => {
        const progress = userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0;
        return progress === 0;
      });
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.courseName.localeCompare(b.courseName));
    } else if (sortBy === "progress") {
      filtered.sort((a, b) => {
        const progressA = userData.progress?.find((p) => p.courseId === a.courseId)?.count || 0;
        const progressB = userData.progress?.find((p) => p.courseId === b.courseId)?.count || 0;
        return progressB - progressA;
      });
    }

    setFilteredCourses(filtered);
  }, [userCourses, searchTerm, sortBy, filterStatus, userData.progress]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = userCourses.length;
    const completed = userCourses.filter(course => {
      const progress = userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0;
      return progress === 100;
    }).length;
    const inProgress = userCourses.filter(course => {
      const progress = userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0;
      return progress > 0 && progress < 100;
    }).length;
    const notStarted = total - completed - inProgress;
    const avgProgress = total > 0 
      ? Math.round(userCourses.reduce((acc, course) => {
          return acc + (userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0);
        }, 0) / total)
      : 0;

    return { total, completed, inProgress, notStarted, avgProgress };
  }, [userCourses, userData.progress]);

  return (
    <motion.div
      className="w-full relative py-5 "
      initial="hidden"
      animate="visible"
    >
      {/* Statistics Cards */}
      {!loading && userCourses.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-4 text-white shadow-lg">
            <p className="text-sm opacity-80">Total Enrolled</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl p-4 text-white shadow-lg">
            <p className="text-sm opacity-80">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 rounded-xl p-4 text-white shadow-lg">
            <p className="text-sm opacity-80">In Progress</p>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 rounded-xl p-4 text-white shadow-lg">
            <p className="text-sm opacity-80">Not Started</p>
            <p className="text-2xl font-bold">{stats.notStarted}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-4 text-white shadow-lg">
            <p className="text-sm opacity-80">Avg Progress</p>
            <p className="text-2xl font-bold">{stats.avgProgress}%</p>
          </div>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      {!loading && userCourses.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between"
        >
          <div className="flex-1 w-full">
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<SearchIcon fillColor={theme === "dark" ? "white" : "black"} size={20} />}
              className="w-full"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select
              placeholder="Filter by status"
              selectedKeys={[filterStatus]}
              onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
              className="w-full md:w-40"
            >
              <SelectItem key="all">All</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="in-progress">In Progress</SelectItem>
              <SelectItem key="not-started">Not Started</SelectItem>
            </Select>
            <Select
              placeholder="Sort by"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(keys.currentKey as string)}
              className="w-full md:w-40"
            >
              <SelectItem key="recent">Recent</SelectItem>
              <SelectItem key="name">Name</SelectItem>
              <SelectItem key="progress">Progress</SelectItem>
            </Select>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="w-full flex justify-center items-center py-20">
          <Spinner size="lg" color="primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCourses.length === 0 && userCourses.length === 0 ? 
      <div className="w-full flex flex-col justify-center items-center gap-4 p-6 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-md shadow-md">
            <p className="text-lg font-ubuntu text-center text-yellow-800 dark:text-yellow-200">
            Oops! It seems like you haven't enrolled any course yet.
            </p>
            <Button 
              color="primary" 
              onClick={() => navigate("/courses")}
              className="mt-2"
            >
              Browse Courses
            </Button>
        </div>
        : !loading && filteredCourses.length === 0 ? (
          <div className="w-full flex flex-col justify-center items-center gap-4 p-6 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md">
            <p className="text-lg font-ubuntu text-center text-gray-800 dark:text-gray-200">
            No courses match your search criteria.
            </p>
            <Button 
              color="primary" 
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setSortBy("recent");
              }}
              className="mt-2"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCourses.map((course, i) => (
            course && course.courseId  && 
            <motion.div
               key={i}
               className="w-full sm:space-y-2 space-y-1 relative bg-white text-start dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer"
               custom={i}
               variants={cardVariants}
               onClick={() => navigate(`/user/view-course?c=${course.courseId}`)}
             >
               <div className="w-full relative bg-transparent">
                 <Image
                   isBlurred
                   src={course.thumbnail}
                   alt="NextUI Album Cover"
                   className="z-0 object-cover aspect-video"
                 />
                 <div className="absolute bottom-1 right-1">
                    <CircularProgressBar progress={(userData.progress?.find((p) => p.courseId === course.courseId)?.count) || 0} />
                  </div>
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <Chip 
                      size="sm" 
                      color={(() => {
                        const progress = userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0;
                        if (progress === 100) return "success";
                        if (progress > 0) return "warning";
                        return "default";
                      })()}
                      variant="solid"
                      className="text-xs"
                    >
                      {(() => {
                        const progress = userData.progress?.find((p) => p.courseId === course.courseId)?.count || 0;
                        if (progress === 100) return "Completed";
                        if (progress > 0) return `${progress}%`;
                        return "Not Started";
                      })()}
                    </Chip>
                  </div>
               </div>
     
               <div className="sm:p-3 p-1 space-y-1 overflow-hidden">
                 <h2 className="text-xl font-bold line-clamp-1 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                   {course.courseName}
                 </h2>
     
                 <h4 className="text-base text-gray-600 dark:text-white font-ubuntu">
                   {course.tutorName}
                 </h4>
     
                 <i className="text-gray-600 dark:text-gray-400 text-sm font-extralight font-libre line-clamp-3 mb-3">
                   {course.description}
                 </i>
               </div>
              
                 <Button className="w-full font-medium sm:text-lg text-base font-ubuntu bg-blue-500 text-white hover:bg-blue-600" onClick={() => navigate(`/user/view-course?c=${course.courseId}`)}>
                   View Course
                 </Button>
              
               <div className="flex w-full sm:flex-row flex-col ">
                {userData.id === course.uploadedBy ? 
                <Button
                    isDisabled={true}
                    className="w-full font-medium sm:text-base text-sm font-ubuntu  bg-white-700 hover:bg-white-800 text-black  dark:bg-gray-700 dark:text-white dark:hover:bg-gray-900"
                >
                    <AlertIcon
                        fillColor={
                        theme === "dark" ? "rgb(220 38 38)" : "rgb(127 29 29)"
                        }
                        size={24}
                    />
                    <span className="">Since, creator can't unenrolled</span>
                </Button>
                 :
                <Button
                    className="w-full font-medium sm:text-base text-sm font-ubuntu bg-white-700 hover:bg-white-800 text-black  dark:bg-gray-700 dark:text-white dark:hover:bg-gray-900"
                    onClick={() => handleUnenrolledClick(course.courseId)}
                >
                     <AlertIcon
                        fillColor={
                        theme === "dark" ? "rgb(220 38 38)" : "rgb(127 29 29)"
                        }
                        size={24}
                    />
                    <span className="">Unenroll ??</span>
                </Button>
                 }
                 
               </div>
             </motion.div>
           ))}
        </div>
        )}
    </motion.div>
  );
};

export default UserEnrolledCourses;
