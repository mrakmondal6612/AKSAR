/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useState, useMemo } from "react";
import { IVideoData } from "@/constants";
import { Button, Image, Input, Select, SelectItem, Chip } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import { getVerifiedToken } from "@/lib/cookieService";
import axios from "axios";
import { USER_API } from "@/lib/env";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import Seperator from "../Seperator";
import YoutubeIcon from "@/Icons/YoutubeIcon";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import { Search, Calendar, Clock, TrendingUp, Filter, X } from "lucide-react";

const cardVariants = {
  hidden: (i: number) => ({
    opacity: 1,
    scale: 1,
    x: i * -500,
    filter: "blur(8px)",
  }),
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    x: 0,
    transition: {
      delay: i * 0.2,
      ease: [0.7, 0, 0.84, 0],
    },
  }),
};

const UserHistoryVideos: React.FC<{ history: { video: string; time: string }[]; onHistoryChange?: () => void } > = ({ history, onHistoryChange }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [videoData, setVideoData] = useState<IVideoData[] | []>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [groupBy, setGroupBy] = useState("none");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Format the time difference
  function formatTimeDifference(dateString: string) {
    const timestamp = new Date(dateString).getTime();
    const currentTime = Date.now();
  
    if (isNaN(timestamp) || timestamp > currentTime) {
      return "Just now";
    }
  
    const seconds = Math.floor((currentTime - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
  
  // Fetch video data from the backend based on video IDs in userData.history
  const getUserHistory = useCallback(async () => {
    const jwt = getVerifiedToken();
    
    // Check if history is empty
    if (!history || history.length === 0) {
      setVideoData([]);
      return;
    }
    
    try {
      const videoIds = history.map((item) => item.video);
      const response = await axios.post(
        `${USER_API}/get-user-history`,
        { videoIds },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.data && response.data.success) {
        setVideoData(response.data.videos); // Assuming response.data.videos is an array of IVideoData
      } else {
        ErrorToast(response.data.message || "Failed to fetch video data");
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Something went wrong");
    }
  }, [history]);

  // Call getUserHistory on component mount
  useEffect(() => {
    getUserHistory();
  }, [getUserHistory]);

  // Delete video from history
  async function confirmDelete(videoId: string) {
    const jwt = getVerifiedToken();
    try {
      const response = await axios.post(
        `${USER_API}/delete-user-history-video`,
        { videoId },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response && response.data && response.data.success) {
        SuccessToast(response.data.message);
        setVideoData((prev) => prev.filter((video) => video.videoId !== videoId)); // Remove deleted video from state
        // Call parent callback to refresh user data
        if (onHistoryChange) {
          onHistoryChange();
        }
      } else {
        ErrorToast(response.data.message || "Failed to delete video");
      }
    } catch (error: any) {
      ErrorToast(error?.response?.data?.message || "Something went wrong");
    }
  }

  // Filter and sort history
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.time);
      switch (dateFilter) {
        case "today":
          return itemDate >= today;
        case "week":
          return itemDate >= weekAgo;
        case "month":
          return itemDate >= monthAgo;
        default:
          return true;
      }
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const video = videoData.find((v) => v.videoId === item.video);
        if (!video) return false;
        return (
          video.videoName?.toLowerCase().includes(query) ||
          video.tutorName?.toLowerCase().includes(query) ||
          video.description?.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      const videoA = videoData.find((v) => v.videoId === a.video);
      const videoB = videoData.find((v) => v.videoId === b.video);

      switch (sortBy) {
        case "newest":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        case "mostWatched":
          return (videoB?.watchCount || 0) - (videoA?.watchCount || 0);
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [history, videoData, searchQuery, dateFilter, sortBy]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalVideos = history.length;
    const uniqueCourses = new Set(
      history
        .map((item) => videoData.find((v) => v.videoId === item.video)?.courseId)
        .filter(Boolean)
    ).size;
    
    return {
      totalVideos,
      uniqueCourses,
    };
  }, [history, videoData]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setSortBy("newest");
    setGroupBy("none");
  };

  const hasActiveFilters = searchQuery || dateFilter !== "all" || sortBy !== "newest" || groupBy !== "none";

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter, sortBy, groupBy]);

  // Pagination logic
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedHistory.slice(startIndex, endIndex);
  }, [filteredAndSortedHistory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);

  // Group history by course
  const groupedHistory = useMemo(() => {
    if (groupBy === "none") {
      return { "All Videos": paginatedHistory };
    }

    const groups: Record<string, typeof history> = {};
    paginatedHistory.forEach((item) => {
      const video = videoData.find((v) => v.videoId === item.video);
      const courseName = video?.courseId || "Other Videos";
      if (!groups[courseName]) {
        groups[courseName] = [];
      }
      groups[courseName].push(item);
    });

    return groups;
  }, [paginatedHistory, videoData, groupBy]);

  return (
    <motion.div 
      className="w-full relative" 
      initial="hidden"
      animate="visible"
    >
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg font-ubuntu">
            No watch history yet
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Start watching videos to build your history
          </p>
        </div>
      ) : (
        <>
          {/* Statistics Bar */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {statistics.totalVideos} videos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {statistics.uniqueCourses} courses
              </span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              className="flex-1"
              classNames={{
                input: "bg-transparent",
                inputWrapper: "bg-white dark:bg-gray-800",
              }}
            />
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              startContent={<Filter className="w-4 h-4" />}
            >
              Filters
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                className="bg-red-500/20 text-red-600 dark:text-red-400"
                startContent={<X className="w-4 h-4" />}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg"
            >
              <Select
                label="Date Filter"
                selectedKeys={[dateFilter]}
                onSelectionChange={(keys) => setDateFilter(Array.from(keys)[0] as string)}
                startContent={<Calendar className="w-4 h-4 text-gray-400" />}
              >
                <SelectItem key="all">All Time</SelectItem>
                <SelectItem key="today">Today</SelectItem>
                <SelectItem key="week">This Week</SelectItem>
                <SelectItem key="month">This Month</SelectItem>
              </Select>

              <Select
                label="Sort By"
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
              >
                <SelectItem key="newest">Newest First</SelectItem>
                <SelectItem key="oldest">Oldest First</SelectItem>
                <SelectItem key="mostWatched">Most Watched</SelectItem>
              </Select>

              <Select
                label="Group By"
                selectedKeys={[groupBy]}
                onSelectionChange={(keys) => setGroupBy(Array.from(keys)[0] as string)}
              >
                <SelectItem key="none">No Grouping</SelectItem>
                <SelectItem key="course">By Course</SelectItem>
              </Select>
            </motion.div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchQuery && (
                <Chip onClose={() => setSearchQuery("")} variant="flat">
                  Search: {searchQuery}
                </Chip>
              )}
              {dateFilter !== "all" && (
                <Chip onClose={() => setDateFilter("all")} variant="flat">
                  Date: {dateFilter}
                </Chip>
              )}
              {sortBy !== "newest" && (
                <Chip onClose={() => setSortBy("newest")} variant="flat">
                  Sort: {sortBy}
                </Chip>
              )}
              {groupBy !== "none" && (
                <Chip onClose={() => setGroupBy("none")} variant="flat">
                  Group: {groupBy}
                </Chip>
              )}
            </div>
          )}

          {/* History Content */}
          {Object.entries(groupedHistory).map(([groupName, items]) => (
            <div key={groupName} className="mb-6">
              {groupBy !== "none" && (
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 font-ubuntu">
                  {groupName} ({items.length})
                </h3>
              )}
              
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No videos match your filters
                  </p>
                </div>
              ) : (
                items.map((item, i) => {
                  const video = videoData.find((video) => video.videoId === item.video);
                  if (!video) return null;

                  return (
                    <motion.div className="w-full relative flex flex-col py-1" key={`${item.video}-${i}`} custom={i} variants={cardVariants}>
                      <Seperator text={formatTimeDifference(item.time)} />
                      <div className="w-full h-auto flex md:flex-row flex-col gap-2 justify-start items-center relative px-2">
                        <div className="md:w-1/4 w-full">
                          <Image
                            isBlurred
                            src={video.thumbnail}
                            alt="course-img"
                            className="z-0 object-cover p-2 aspect-video"
                          />
                        </div>
                        <div className="flex flex-col justify-between items-start xl:space-y-4 md:space-y-2 md:w-1/2 w-full relative">
                          <h2 className="max-sm:line-clamp-2 lg:text-2xl text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                            {video.videoName}
                          </h2>
                          <h4 className="text-lg text-gray-600 dark:text-white font-ubuntu">
                            {video.tutorName}
                          </h4>
                          <i className="line-clamp-3 max-lg:hidden w-full text-gray-600 dark:text-gray-400 text-sm font-extralight font-libre line-clamp-3s break-words">
                            {video.description}
                          </i>
                          <div className="flex justify-start items-center gap-2">
                            {video.watchCount}
                            <span className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                              views
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-4 text-base font-medium font-ubuntu justify-end md:w-1/4 w-full max-md:px-2 items-center">
                          <Button
                            className="
                              w-full py-3 font-ubuntu text-base font-medium 
                              bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                              shadow-md hover:shadow-lg transition-all duration-300
                              hover:bg-gradient-to-r hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500
                              text-white"
                            onClick={() => navigate(`/user/video-player?v=${video.videoId}`)}
                          >
                            <YoutubeIcon fillColor={theme === "dark" ? "white" : "black"} /> Watch Now
                          </Button>
                          <Button
                            className="w-full py-3 font-ubuntu text-base font-medium 
                              bg-red-300/50 dark:bg-red-500/50 
                              hover:bg-red-400 hover:dark:bg-red-600
                              transition-colors duration-300 shadow-md hover:shadow-lg
                              text-black dark:text-white/80"
                            onClick={() => confirmDelete(video.videoId)}
                          >
                            Remove from history
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedHistory.length)} of {filteredAndSortedHistory.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  isDisabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="bg-gray-200 dark:bg-gray-700"
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        isDisabled={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-indigo-500 text-white" : "bg-gray-200 dark:bg-gray-700"}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  isDisabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="bg-gray-200 dark:bg-gray-700"
                >
                  Next
                </Button>
              </div>
              <Select
                size="sm"
                label="Items per page"
                selectedKeys={[itemsPerPage.toString()]}
                onSelectionChange={(keys) => {
                  setItemsPerPage(Number(Array.from(keys)[0]));
                  setCurrentPage(1);
                }}
                className="w-32"
              >
                <SelectItem key="5">5</SelectItem>
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="20">20</SelectItem>
                <SelectItem key="50">50</SelectItem>
              </Select>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default UserHistoryVideos;
