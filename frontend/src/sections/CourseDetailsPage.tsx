import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Image } from "@nextui-org/react";
import { COURSE_API, VIDEO_API } from "@/lib/env";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import { useAuthContext } from "@/context/authContext";
import { getVerifiedToken } from "@/lib/cookieService";
import { getUserData } from "@/lib/authService";
import RatingComponent from "@/components/RatingComponent";
import { Clock, Users, BarChart, Lock, Play, Trophy, Calendar } from "lucide-react";

const CourseDetailsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get("c");
  const [courseData, setCourseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { userData, setUserData } = useAuthContext();

  const fetchCourseData = useCallback(async () => {
    if (!courseId) {
      setError("No course ID provided in the URL.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post(`${COURSE_API}/get-course`, {
        courseId,
      });

      if (!response.data.success) {
        setError(response.data.message || "Failed to fetch course data");
        return;
      }

      const fetchedCourseData = response.data.course || response.data.data;
      if (!fetchedCourseData) {
        setError("Course data is missing or unavailable");
        return;
      }
      setCourseData(fetchedCourseData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong while fetching the course.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const fetchVideos = useCallback(async () => {
    if (!courseId) return;
    setLoadingVideos(true);
    try {
      const response = await axios.get(`${VIDEO_API}/get-videos?courseId=${courseId}`);
      if (response && response.data && response.data.success) {
        setVideos(response.data.videos || []);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
    fetchVideos();
  }, [fetchCourseData, fetchVideos]);

  useEffect(() => {
    if (courseId && userData?.enrolledIn?.includes(courseId)) {
      setIsEnrolled(true);
    } else {
      setIsEnrolled(false);
    }
  }, [userData?.enrolledIn, courseId]);

  const handleEnrollCourse = async () => {
    if (!userData?.id) {
      ErrorToast("Please log in to enroll in this course");
      navigate("/login");
      return;
    }

    if (!courseId) {
      ErrorToast("Course ID not found");
      return;
    }

    if (userData?.enrolledIn?.includes(courseId) || isEnrolled) {
      ErrorToast("You are already enrolled in this course");
      return;
    }

    setIsEnrolling(true);
    try {
      const jwt = getVerifiedToken();
      const response = await axios.post(
          `${COURSE_API}/enroll-in-course`,
          { courseId },
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
      );

      if (response.data.success) {
        setIsEnrolled(true);
        SuccessToast(response.data.message);
        setTimeout(async () => {
          const updatedUserData = await getUserData();
          if (updatedUserData) {
            setUserData(updatedUserData);
          }
        }, 500);
      } else {
        if (response.data.requiresPayment) {
          handlePayment();
        } else {
          ErrorToast(response.data.message);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.requiresPayment) {
        handlePayment();
      } else {
        ErrorToast(error.response?.data?.message || "Failed to enroll in course");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePayment = async () => {
    try {
      const jwt = getVerifiedToken();
      const response = await axios.post(
          `${COURSE_API}/payment/create-order`,
          { courseId },
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
      );

      if (response.data.success) {
        const { order, courseName } = response.data;
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        console.log("Razorpay key from env:", razorpayKey);

        if (!razorpayKey || razorpayKey === "YOUR_RAZORPAY_KEY_ID") {
          ErrorToast("Razorpay key not configured. Please add VITE_RAZORPAY_KEY_ID to frontend .env file and restart server");
          return;
        }

        const options = {
          key: razorpayKey,
          amount: order.amount,
          currency: order.currency,
          name: "AKSAR",
          description: `Payment for ${courseName}`,
          order_id: order.id,
          handler: async function (response: any) {
            const verifyResponse = await axios.post(
                `${COURSE_API}/payment/verify`,
                {
                  orderId: order.id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  courseId: courseId,
                },
                {
                  headers: {
                    Authorization: `Bearer ${jwt}`,
                  },
                }
            );

            if (verifyResponse.data.success) {
              setIsEnrolled(true);
              SuccessToast("Payment successful!");
              setTimeout(async () => {
                const updatedUserData = await getUserData();
                if (updatedUserData) {
                  setUserData(updatedUserData);
                }
              }, 500);
            } else {
              ErrorToast("Payment verification failed");
            }
          },
          prefill: {
            name: userData?.fullName || "",
            email: userData?.email || "",
          },
          theme: {
            color: "#6366f1",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Failed to initiate payment");
    }
  };

  if (isLoading) {
    return (
        <div className="w-full min-h-screen bg-[#0b0f19] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 font-medium animate-pulse">Loading course data...</p>
          </div>
        </div>
    );
  }

  if (error || !courseData) {
    return (
        <div className="w-full min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center px-4">
          <div className="max-w-md w-full bg-[#111827]/80 backdrop-blur border border-gray-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4">Course Unavailable</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {error || "We couldn't find the course you're looking for. It may have been removed, or the link is incorrect."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-all"
              >
                Go Back
              </button>
              <button
                  onClick={() => navigate("/courses")}
                  className="px-6 py-3 font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/25"
              >
                Browse Courses
              </button>
            </div>
          </div>
        </div>
    );
  }

  const discount = courseData.originalPrice === courseData.sellingPrice
      ? 0
      : Math.round(((courseData.originalPrice - courseData.sellingPrice) / courseData.originalPrice) * 100);

  const courseContent = courseData.courseContent || videos.map((v: any) => v.videoName || v.title);
  const lectureCount = courseContent.length;

  return (
      <div className="w-full min-h-screen bg-[#0b0f19] text-white">
        {/* Course Top Section */}
        <div className="w-full bg-[#0d1321] border-b border-gray-800/80 pt-24 sm:pt-28 md:pt-36 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
            {/* Course Name */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {courseData.courseName}
            </h1>

            {/* Course Tagline */}
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-4xl leading-relaxed">
              {courseData.description || "Learn from scratch"}
            </p>

            {/* Course Creator */}
            <div className="text-xs sm:text-sm md:text-base text-gray-400">
              Created By <span className="text-blue-400 hover:underline cursor-pointer font-semibold">{courseData.tutorName}</span>
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 text-xs sm:text-sm text-gray-400 pt-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Last updated {courseData.lastUpdated ? new Date(courseData.lastUpdated).toLocaleDateString('en-GB') : new Date(courseData.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{courseData.enrolledCount ?? 3} students enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4 text-gray-500" />
                <span>Level: {courseData.courseLevel || "Medium"}</span>
              </div>
              {courseData.courseDuration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Duration: {courseData.courseDuration}</span>
                  </div>
              )}
            </div>

            {/* Reviews and Ranking Badge */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <RatingComponent rating={courseData.rating || 4.5} />
                <span className="text-yellow-500 font-bold text-base">{courseData.rating || 4.5}</span>
                <span className="text-gray-400 text-sm">({courseData.ratingCount || 15} reviews)</span>
              </div>
              {courseData.ranking && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold px-3 py-1 rounded-md flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    #{courseData.ranking} Ranking
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* Left Column: Description & Course Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">

              {/* Description Card */}
              <div className="bg-[#111827]/70 backdrop-blur border border-gray-800 rounded-xl p-4 sm:p-6 shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                  <span>📝</span> Description
                </h2>
                <div className="text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                  {courseData.description || "No description available"}
                </div>
              </div>

              {/* Course Content / Lectures List */}
              <div className="bg-[#111827]/70 backdrop-blur border border-gray-800 rounded-xl p-4 sm:p-6 shadow-md">
                <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-800 pb-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span>📖</span> Course Content
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-400 font-medium">
                  {lectureCount} {lectureCount === 1 ? 'lecture' : 'lectures'}
                </span>
                </div>

                {loadingVideos ? (
                    <div className="space-y-3 py-4">
                      <div className="h-10 bg-gray-800/50 animate-pulse rounded border border-gray-800"></div>
                      <div className="h-10 bg-gray-800/50 animate-pulse rounded border border-gray-800"></div>
                      <div className="h-10 bg-gray-800/50 animate-pulse rounded border border-gray-800"></div>
                    </div>
                ) : courseContent.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4 italic">No lectures uploaded yet for this course.</p>
                ) : (
                    <div className="divide-y divide-gray-800/80">
                      {courseContent.map((lecture: string, idx: number) => {
                        const isUnlocked = idx === 0 || isEnrolled;
                        return (
                            <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group">
                              <div className="flex items-center gap-3">
                                {isUnlocked ? (
                                    <Play className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <Lock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                )}
                                <span className={`text-sm ${isUnlocked ? 'text-emerald-400 font-medium' : 'text-gray-400'} group-hover:text-white transition-colors`}>
                            {lecture}
                          </span>
                              </div>
                              <span className="text-xs text-gray-500 uppercase tracking-wider bg-gray-800/30 px-2 py-0.5 rounded">
                          Video
                        </span>
                            </div>
                        );
                      })}
                    </div>
                )}
              </div>

              {/* Tech Stack */}
              {courseData.courseTechStack && courseData.courseTechStack.length > 0 && (
                  <div className="bg-[#111827]/70 backdrop-blur border border-gray-800 rounded-xl p-6 shadow-md">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                      <span>🛠️</span> Tech Stack
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {courseData.courseTechStack.map((tech: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      {tech}
                    </span>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            {/* Right Column: Sticky Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-[#111827]/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow-xl sticky top-20 lg:top-24">
                {/* Course Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-900 border-b border-gray-800">
                  <Image
                      src={courseData.thumbnail}
                      alt={courseData.courseName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Price Block */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <span>💰</span> Pricing Details
                    </div>
                    {courseData.sellingPrice === 0 ? (
                        <div className="text-3xl font-black text-emerald-400">FREE</div>
                    ) : (() => {
                      const currencySymbol = courseData.currency && (courseData.currency.includes("INR") || courseData.currency.includes("₹")) ? "₹" : (courseData.currency === "$" ? "$" : "₹");
                      const savings = courseData.originalPrice - courseData.sellingPrice;
                      return (
                          <div className="space-y-2">
                            <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl font-black text-white">
                            {currencySymbol}{courseData.sellingPrice}
                          </span>
                              {discount > 0 && (
                                  <span className="text-base line-through text-gray-500 font-semibold">
                              {currencySymbol}{courseData.originalPrice}
                            </span>
                              )}
                            </div>
                            {discount > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500">
                              {discount}% OFF
                            </span>
                                  <span className="text-sm font-semibold text-emerald-400">
                              Save {currencySymbol}{savings}
                            </span>
                                </div>
                            )}
                          </div>
                      );
                    })()}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {isEnrolled ? (
                        <button
                            onClick={() => navigate(`/user/view-course?c=${courseId}`)}
                            className="w-full font-bold text-base py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md"
                        >
                          🎓 Go to Course
                        </button>
                    ) : (
                        <button
                            onClick={handleEnrollCourse}
                            disabled={isEnrolling}
                            className="w-full font-bold text-base py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md disabled:opacity-50"
                        >
                          {isEnrolling ? "⏳ Enrolling..." : "Purchase Course"}
                        </button>
                    )}
                  </div>

                  {/* Meta/Category Info */}
                  <div className="pt-4 border-t border-gray-800/80 text-xs text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Category:</span>
                      <span className="text-gray-300 font-semibold">{courseData.category || courseData.courseType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Creator:</span>
                      <span className="text-gray-300 font-semibold">{courseData.tutorName}</span>
                    </div>
                    {courseData.startingDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Start Date:</span>
                          <span className="text-gray-300 font-semibold">{new Date(courseData.startingDate).toLocaleDateString()}</span>
                        </div>
                    )}
                    {courseData.endingDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">End Date:</span>
                          <span className="text-gray-300 font-semibold">{new Date(courseData.endingDate).toLocaleDateString()}</span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
  );
};

export default CourseDetailsPage;