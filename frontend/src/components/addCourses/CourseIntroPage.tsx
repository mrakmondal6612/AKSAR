/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import MDEditor from "@uiw/react-md-editor";
import { Button, Switch } from "@nextui-org/react";
import { courseDataTemplate, ICourseData, IUpdateCourse } from "@/constants";
import rehypeSanitize from "rehype-sanitize";
import EditPersonalCourseForm from "./EditPersonalCourseForm";
import EditYoutubeCourseForm from "./EditYoutubeCourseForm";
import EditRedirectingCourseForm from "./EditRedirectingCourseForm";
import { COURSE_API, USER_API, VIDEO_API } from "@/lib/env";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import { useAuthContext } from "@/context/authContext";
import { getVerifiedToken } from "@/lib/cookieService";
import { getUserData } from "@/lib/authService";
import RatingComponent from "../RatingComponent";
import { Clock, Users, BarChart, Lock, Play } from "lucide-react";

const CourseIntroPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get("c");
  const [courseData, setCourseData] = useState<ICourseData>(courseDataTemplate);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [activeEditor, setActiveEditor] = useState("markdown");
  const [markdown, setMarkdown] = useState<string>("");
  const [preview, setPreview] = useState<string>(courseData?.thumbnail);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const { userData, setUserData } = useAuthContext();

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;

    try {
      const response = await axios.post(`${COURSE_API}/get-course`, {
        courseId,
      });

      if (!response.data.success) {
        ErrorToast(response.data.message);
      }
      const fetchedCourseData = response.data.course;
      setCourseData(fetchedCourseData);
      setMarkdown(fetchedCourseData.markdownContent || "");
      setPreview(fetchedCourseData.thumbnail);

    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Something went wrong");
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

  // Check if user is already enrolled
  useEffect(() => {
    if (courseId && userData?.enrolledIn?.includes(courseId)) {
      setIsEnrolled(true);
    } else {
      setIsEnrolled(false);
    }
  }, [userData?.enrolledIn, courseId]);

  const handleSave = async () => {
    const jwt = getVerifiedToken();
    if (!courseId) return;
    const type = courseData.courseType.toLowerCase();

    if (!["youtube", "redirect", "personal"].includes(type)) {
      return;
    }
    try {
      const updatedCourse: IUpdateCourse = {
        ...courseData,
        markdownContent: markdown,
      };
      console.log("Updated course:", updatedCourse);

      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("courseName", updatedCourse.courseName);
      formData.append("tutorName", updatedCourse.tutorName);
      formData.append("description", updatedCourse.description);
      formData.append("markdownContent", markdown);
      formData.append("redirectLink", updatedCourse.redirectLink ?? "");
      formData.append("sellingPrice", updatedCourse.sellingPrice?.toString() ?? "0");
      formData.append("originalPrice", updatedCourse.originalPrice?.toString() ?? "1");
      formData.append("currency", updatedCourse.currency?.toString() ?? "$");


      if (updatedCourse.thumbnail instanceof File) {
        const blob = new Blob([updatedCourse.thumbnail], {
          type: updatedCourse.thumbnail.type,
        });
        if (type === "youtube") {
          formData.append("youtubeCourseImage", blob, updatedCourse.thumbnail.name);
        }
        else if (type === "personal") {
          formData.append("personalCourseImage", blob, updatedCourse.thumbnail.name);
        }
        else {
          formData.append("redirectCourseImage", blob, updatedCourse.thumbnail.name);
        }
      } else {
        if (type === "youtube") {
          formData.append("youtubeCourseImage", updatedCourse.thumbnail);
        }
        else if (type === "personal") {
          formData.append("personalCourseImage", updatedCourse.thumbnail);
        }
        else {
          formData.append("redirectCourseImage", updatedCourse.thumbnail);
        }
      }

      console.log(formData);
      const response = await axios.put(
        `${COURSE_API}/update-course/${type}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response && response.data && response.data.success) {
        SuccessToast(response.data.message);
      } else {
        ErrorToast(response.data.message);
      }
      setCourseData(updatedCourse as ICourseData);
      fetchCourseData();

    } catch (error: any) {
      ErrorToast(error.response?.data?.message || "Something went wrong");
    }
  };


  const handleEditCourse = (updatedCourse: any) => {
    setCourseData((c) => ({
      ...c,
      ...updatedCourse,
    }));
  };

  const handlePreviewCardImage = (preview: string) => {
    setPreview(preview);
  };

  const handleEnrollCourse = async () => {
    if (!userData?.id) {
      ErrorToast("Please log in to enroll in this course");
      navigate("/login");
      return;
    }

    if (!courseId) {
      ErrorToast("Course ID not found");
      console.error("Course ID is missing:", courseId);
      return;
    }

    // Check if already enrolled
    if (userData?.enrolledIn?.includes(courseId) || isEnrolled) {
      ErrorToast("You are already enrolled in this course");
      return;
    }

    setIsEnrolling(true);
    try {
      const jwt = getVerifiedToken();
      console.log("Enrolling in course:", courseId, "API:", COURSE_API);
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
        // Refresh user data after enrollment
        setTimeout(async () => {
          const updatedUserData = await getUserData();
          if (updatedUserData) {
            setUserData(updatedUserData);
          }
        }, 500);
      } else {
        // Check if payment is required
        if (response.data.requiresPayment) {
          handlePayment(response.data.amount, response.data.currency);
        } else {
          ErrorToast(response.data.message);
        }
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      // Check if payment is required (403 error)
      if (error.response?.status === 403 && error.response?.data?.requiresPayment) {
        handlePayment(error.response.data.amount, error.response.data.currency);
      } else {
        ErrorToast(error.response?.data?.message || "Failed to enroll in course");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePayment = async (_amount: number, _currency: string) => {
    try {
      const jwt = getVerifiedToken();
      console.log("Creating payment order for course:", courseId);
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
        console.log("Razorpay key:", razorpayKey);
        
        if (!razorpayKey) {
          ErrorToast("Razorpay key not configured. Please check environment variables.");
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
            console.log("Payment successful, verifying...");
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
              SuccessToast("Payment successful! You are now enrolled.");
              // Refresh user data after enrollment
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
          modal: {
            ondismiss: function() {
              console.log("Payment modal dismissed");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.error("Payment failed:", response);
          ErrorToast("Payment failed. Please try again.");
        });
        rzp.open();
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      ErrorToast(error.response?.data?.message || "Failed to initiate payment");
    }
  };

  const handleUnenrollToggle = async () => {
    const jwt = getVerifiedToken();
    if (!jwt) {
      ErrorToast("Login required");
      return;
    }

    if (!isEnrolled) {
      return;
    }

    setIsUnenrolling(true);
    try {
      const response = await axios.post(
        `${USER_API}/unenrolled-in-course`,
        { courseId },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      if (response.data.success) {
        setIsEnrolled(false);
        SuccessToast(response.data.message);
        // Refresh user data after unenrollment
        setTimeout(async () => {
          const updatedUserData = await getUserData();
          if (updatedUserData) {
            setUserData(updatedUserData);
          }
        }, 500);
      } else {
        ErrorToast(response.data.message);
      }
    } catch (error: any) {
      console.error("Unenrollment error:", error);
      ErrorToast(error.response?.data?.message || "Failed to unenroll from course");
    } finally {
      setIsUnenrolling(false);
    }
  };

  const handleSaveForLater = async () => {
    if (!userData?.id) {
      ErrorToast("Please log in to save courses");
      return;
    }

    if (!courseId) {
      ErrorToast("Course ID not found");
      console.error("Course ID is missing:", courseId);
      return;
    }

    setIsSavingBookmark(true);
    try {
      const jwt = getVerifiedToken();
      console.log("Bookmarking course:", courseId, "API:", USER_API);
      const response = await axios.post(
        `${USER_API}/user-course-bookmarks`,
        { courseId },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        SuccessToast(response.data.message);
        setIsBookmarked(!isBookmarked);
        // Refresh user data after bookmark
        setTimeout(async () => {
          const updatedUserData = await getUserData();
          if (updatedUserData) {
            setUserData(updatedUserData);
          }
        }, 500);
      } else {
        ErrorToast(response.data.message);
      }
    } catch (error: any) {
      console.error("Bookmark error:", error);
      const errorMessage = error.response?.data?.message || error.response?.statusText || "Failed to save course";
      ErrorToast(errorMessage);
    } finally {
      setIsSavingBookmark(false);
    }
  };

  // Check if course is already bookmarked
  useEffect(() => {
    if (courseId && userData?.bookmarks?.course) {
      const isAlreadyBookmarked = userData.bookmarks.course.includes(courseId);
      setIsBookmarked(isAlreadyBookmarked);
    }
  }, [courseId, userData?.bookmarks?.course]);

  if (!courseData) return <p>Loading course data...</p>;

  const isOwner = courseData.uploadedBy === userData.id;
  const discount = courseData.originalPrice === courseData.sellingPrice
    ? 0
    : Math.round(((courseData.originalPrice - courseData.sellingPrice) / courseData.originalPrice) * 100);

  return (
    <div className="w-full min-h-screen bg-[#0b0f19] text-white">
      {!isOwner ? (
        // ==================== VIEW MODE ====================
        <div className="w-full">
          {/* Top Header Banner */}
          <div className="w-full bg-[#0d1321] border-b border-gray-800/80 pt-24 sm:pt-28 md:pt-36 pb-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-4">
              {/* Type Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white whitespace-nowrap ${
                  courseData.courseType === "YOUTUBE"
                    ? "bg-gradient-to-r from-red-600 to-red-500"
                    : courseData.courseType === "REDIRECT"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500"
                      : "bg-gradient-to-r from-purple-600 to-pink-600"
                }`}>
                  {courseData.courseType === "YOUTUBE" ? "📺 YouTube Course" : courseData.courseType === "REDIRECT" ? "🔗 External Link" : "🎓 Premium Course"}
                </span>
                {discount > 0 && (
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-green-600 to-teal-500">
                    🎉 {discount}% OFF
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {courseData.courseName}
              </h1>

              {/* Short Subtitle */}
              <p className="text-base sm:text-lg text-gray-300 max-w-4xl leading-relaxed">
                {courseData.description ? (courseData.description.length > 200 ? courseData.description.substring(0, 200) + "..." : courseData.description) : "Learn frontend development and master the concepts from scratch"}
              </p>

              {/* Creator Name */}
              <div className="text-sm sm:text-base text-gray-400">
                Created By <span className="text-blue-400 hover:underline cursor-pointer font-semibold">{courseData.tutorName}</span>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-400 pt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Last updated {new Date(courseData.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{courseData.enrolledCount ?? 3} students enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-gray-500" />
                  <span>Level: Medium</span>
                </div>
              </div>

              {/* Reviews and Ranking Badge */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <RatingComponent rating={courseData.rating || 4.5} />
                  <span className="text-yellow-500 font-bold text-base">{courseData.rating || 4.5}</span>
                  <span className="text-gray-400 text-sm">({courseData.ratingCount || 15} reviews)</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold px-3 py-1 rounded-md">
                  🏆 #1 Bestseller
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Column: Description & Course Content */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Description Card */}
                <div className="bg-[#111827]/70 backdrop-blur border border-gray-800 rounded-xl p-6 shadow-md">
                  <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                    <span>📝</span> Description
                  </h2>
                  <div className="text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                    {courseData.description || "No description available"}
                  </div>
                </div>

                {/* Course Content / Lectures List */}
                <div className="bg-[#111827]/70 backdrop-blur border border-gray-800 rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>📖</span> Course Content
                    </h2>
                    <span className="text-sm text-gray-400 font-medium">
                      {videos.length} {videos.length === 1 ? 'lecture' : 'lectures'}
                    </span>
                  </div>

                  {loadingVideos ? (
                    <div className="space-y-3 py-4">
                      <div className="h-10 bg-gray-800/50 animate-pulse rounded border border-gray-800"></div>
                      <div className="h-10 bg-gray-800/50 animate-pulse rounded border border-gray-800"></div>
                      <div className="h-10 bg-gray-800/50 animate-pulse rounded border border-gray-800"></div>
                    </div>
                  ) : videos.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4 italic">No lectures uploaded yet for this course.</p>
                  ) : (
                    <div className="divide-y divide-gray-800/80">
                      {videos.map((video, idx) => {
                        // First lecture is previewable (unlocked), others locked unless enrolled or owner
                        const isUnlocked = idx === 0 || isEnrolled || isOwner;
                        return (
                          <div key={video.videoId || idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group">
                            <div className="flex items-center gap-3">
                              {isUnlocked ? (
                                <Play className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <Lock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              )}
                              <span className={`text-sm ${isUnlocked ? 'text-emerald-400 font-medium' : 'text-gray-400'} group-hover:text-white transition-colors`}>
                                {video.videoName || video.title}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider bg-gray-800/30 px-2 py-0.5 rounded">
                              {video.videoType || "Video"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Markdown Syllabus Content */}
                {markdown && (
                  <div className="bg-[#111827]/70 backdrop-blur border border-gray-800 rounded-xl p-6 shadow-md overflow-hidden">
                    <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                      <span>📖</span> Syllabus
                    </h2>
                    <div className="prose prose-invert max-w-none [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_p]:text-gray-300 [&_li]:text-gray-300 [&_a]:text-blue-400 hover:[&_a]:text-blue-300">
                      <MDEditor.Markdown
                        source={markdown}
                        className="font-ubuntu text-white bg-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Sticky Course Card */}
              <div className="lg:col-span-1">
                <div className="bg-[#111827]/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow-xl sticky top-24">
                  {/* Course Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-900 border-b border-gray-800">
                    <img
                      src={preview || courseData.thumbnail}
                      alt={courseData.courseName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-6">
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
                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500">
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
                        <div className="w-full p-4 bg-emerald-950/20 rounded-lg border-2 border-emerald-500/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="font-semibold text-emerald-400 text-sm">Enrolled Successfully</span>
                          </div>
                          <Switch
                            isSelected={true}
                            disabled={isUnenrolling}
                            isDisabled={isUnenrolling}
                            color="success"
                            onChange={handleUnenrollToggle}
                            classNames={{
                              base: "flex-shrink-0 cursor-pointer",
                              wrapper: "group-data-[selected=true]:bg-emerald-500",
                            }}
                          />
                        </div>
                      ) : (
                        <Button
                          onClick={handleEnrollCourse}
                          disabled={isEnrolling}
                          className="w-full font-bold text-base py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md disabled:opacity-50"
                        >
                          {isEnrolling ? "⏳ Enrolling..." : "Purchase Course"}
                        </Button>
                      )}
                      <Button
                        onClick={handleSaveForLater}
                        disabled={isSavingBookmark}
                        className={`w-full font-bold py-6 rounded-lg transition-all border border-gray-800 disabled:opacity-50 ${
                          isBookmarked
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30"
                            : "bg-gray-900 hover:bg-gray-800 text-white"
                        }`}
                      >
                        {isSavingBookmark ? "⏳ Saving..." : isBookmarked ? "✅ Saved to Bookmarks" : "📌 Save for Later"}
                      </Button>
                    </div>

                    {/* Meta/Category Info */}
                    <div className="pt-4 border-t border-gray-800/80 text-xs text-gray-400 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Category:</span>
                        <span className="text-gray-300 font-semibold">{courseData.courseType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Creator:</span>
                        <span className="text-gray-300 font-semibold">{courseData.tutorName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        // ==================== EDIT MODE ====================
        <div className="pt-20 sm:pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Edit Mode Header */}
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-2xl p-6 md:p-8 mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">✏️ Edit Course Details</h2>
              <p className="text-gray-400">Update your course information, pricing, and content below.</p>
            </div>

            <div className="space-y-8">
              {/* Course Overview Section */}
              <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-2xl p-6 md:p-8 space-y-6">
                <h3 className="text-2xl font-bold text-white">📋 Course Overview</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course Title */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Course Title</label>
                    <p className="text-xl font-bold text-white bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                      {courseData.courseName}
                    </p>
                  </div>

                  {/* Tutor Name */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Instructor Name</label>
                    <p className="text-xl font-bold text-white bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                      {courseData.tutorName}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <p className="text-gray-300 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                    {courseData.description}
                  </p>
                </div>
              </div>

              {/* Edit Forms Based on Course Type */}
              <div className="space-y-6">
                {courseData.courseType === "YOUTUBE" && (
                  <EditYoutubeCourseForm
                    course={courseData}
                    onEditCourse={handleEditCourse}
                    setCourseCardImagePreview={handlePreviewCardImage}
                  />
                )}
                {courseData.courseType === "REDIRECT" && (
                  <EditRedirectingCourseForm
                    course={{
                      ...courseData,
                      redirectLink: courseData.redirectLink || "",
                    }}
                    onEditCourse={handleEditCourse}
                    setCourseCardImagePreview={handlePreviewCardImage}
                  />
                )}
                {courseData.courseType === "PERSONAL" && (
                  <EditPersonalCourseForm
                    course={courseData}
                    onEditCourse={handleEditCourse}
                    setCourseCardImagePreview={handlePreviewCardImage}
                  />
                )}
              </div>

              {/* Markdown Content Editor */}
              <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-2xl p-6 md:p-8 space-y-6">
                <h3 className="text-2xl font-bold text-white">📝 Course Content</h3>
                <p className="text-gray-400">Write detailed course content using Markdown syntax. This will be displayed to students under "Course Content" section.</p>

                {/* Editor Tab Selection */}
                <div className="flex gap-3 flex-col sm:flex-row">
                  <div
                    onClick={() => setActiveEditor("markdown")}
                    className={`flex-1 cursor-pointer p-4 rounded-lg transition-all duration-300 border ${activeEditor === "markdown"
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400 text-white"
                        : "bg-gray-900/50 border-gray-700 text-gray-300 hover:border-gray-600"
                      }`}
                  >
                    <p className="font-bold mb-1">📄 Markdown Editor</p>
                    <p className="text-sm text-gray-300">Use markdown syntax for formatting</p>
                  </div>
                  <div
                    onClick={() => setActiveEditor("quill")}
                    className={`flex-1 cursor-pointer p-4 rounded-lg transition-all duration-300 border ${activeEditor === "quill"
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 border-purple-400 text-white"
                        : "bg-gray-900/50 border-gray-700 text-gray-300 hover:border-gray-600"
                      }`}
                  >
                    <p className="font-bold mb-1">✏️ Rich Text Editor</p>
                    <p className="text-sm text-gray-300">Coming soon - Visual formatting</p>
                  </div>
                </div>

                {/* Editor */}
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  {activeEditor === "markdown" ? (
                    <MDEditor
                      value={markdown}
                      height={600}
                      previewOptions={{
                        rehypePlugins: [[rehypeSanitize]],
                      }}
                      className="rounded-lg"
                      onChange={(value) => setMarkdown(value || "")}
                      preview="edit"
                      hideToolbar={false}
                    />
                  ) : (
                    <div className="w-full bg-gray-900/50 rounded-lg min-h-96 flex items-center justify-center border border-gray-700">
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-300 mb-2">🔄 Under Maintenance</p>
                        <p className="text-gray-400">Rich text editor coming soon. Please use Markdown for now.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  className="w-full py-6 font-bold text-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg transition-all shadow-lg"
                >
                  💾 Save All Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CourseIntroPage;
