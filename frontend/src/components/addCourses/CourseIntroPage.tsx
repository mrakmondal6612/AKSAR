/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import MDEditor from "@uiw/react-md-editor";
import { Button, Switch } from "@nextui-org/react";
import { courseDataTemplate, ICourseData, IUpdateCourse } from "@/constants";
import rehypeSanitize from "rehype-sanitize";
import EditPersonalCourseForm from "./EditPersonalCourseForm";
import EditYoutubeCourseForm from "./EditYoutubeCourseForm";
import EditRedirectingCourseForm from "./EditRedirectingCourseForm";
import { COURSE_API, USER_API } from "@/lib/env";
import { ErrorToast, SuccessToast } from "@/lib/toasts";
import { useAuthContext } from "@/context/authContext";
import { getVerifiedToken } from "@/lib/cookieService";
import { getUserData } from "@/lib/authService";

const CourseIntroPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get("c");
  const [courseData, setCourseData] = useState<ICourseData>(courseDataTemplate);
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

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  // Check if user is already enrolled
  useEffect(() => {
    if (userData?.enrolledIn?.includes(courseId)) {
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
        ErrorToast(response.data.message);
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      ErrorToast(error.response?.data?.message || "Failed to enroll in course");
    } finally {
      setIsEnrolling(false);
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
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {!isOwner ? (
        // ==================== VIEW MODE ====================
        <div className="pt-20 sm:pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-8">
                {/* Course Header */}
                <div className="space-y-4">
                  {/* Type Badge */}
                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold text-white whitespace-nowrap ${courseData.courseType === "YOUTUBE"
                        ? "bg-gradient-to-r from-red-600 to-red-500"
                        : courseData.courseType === "REDIRECT"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500"
                          : "bg-gradient-to-r from-purple-600 to-pink-600"
                      }`}>
                      {courseData.courseType === "YOUTUBE" ? "📺 YouTube Course" : courseData.courseType === "REDIRECT" ? "🔗 External Link" : "🎓 Premium Course"}
                    </span>
                    {discount > 0 && (
                      <span className="inline-block px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-green-600 to-teal-500">
                        🎉 {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 leading-tight">
                    {courseData.courseName}
                  </h1>

                  {/* Tutor Info */}
                  <div className="flex items-center gap-4 pt-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold">
                      {courseData.tutorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Instructor</p>
                      <p className="font-semibold text-lg">{courseData.tutorName}</p>
                    </div>
                  </div>
                </div>

                {/* Description Card */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span>📝</span> About This Course
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {courseData.description || "No description available"}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 border border-blue-700/30 rounded-xl p-6 hover:border-blue-600/50 transition-all">
                    <p className="text-gray-400 text-sm font-medium mb-2">📊 Course Type</p>
                    <p className="text-2xl font-bold">{courseData.courseType}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/10 border border-purple-700/30 rounded-xl p-6 hover:border-purple-600/50 transition-all">
                    <p className="text-gray-400 text-sm font-medium mb-2">✨ Status</p>
                    <p className="text-2xl font-bold text-green-400">Active</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-700/30 rounded-xl p-6 hover:border-green-600/50 transition-all">
                    <p className="text-gray-400 text-sm font-medium mb-2">💰 Discount</p>
                    <p className="text-2xl font-bold text-green-400">{discount}%</p>
                  </div>
                </div>

                {/* Content Sections */}
                {courseData.courseType === "YOUTUBE" && (
                  <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <span>🎬</span> Video Playlist
                    </h3>
                    <p className="text-gray-300 mb-4">
                      This curated YouTube playlist contains comprehensive video lessons on this topic, covering all essential concepts from basics to advanced level.
                    </p>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                      <p className="text-sm text-gray-400">
                        ✓ Access to all playlist videos<br />
                        ✓ Learn at your own pace<br />
                        ✓ No time limits<br />
                        ✓ Lifetime access
                      </p>
                    </div>
                  </div>
                )}

                {/* Markdown Content */}
                {markdown && (
                  <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 rounded-2xl p-6 overflow-hidden">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <span>📖</span> Course Content
                    </h3>
                    <div className="prose prose-invert max-w-none [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_p]:text-gray-300 [&_li]:text-gray-300 [&_a]:text-blue-400 hover:[&_a]:text-blue-300">
                      <MDEditor.Markdown
                        source={markdown}
                        className="font-ubuntu text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Right Side */}
              <div className="lg:col-span-1 space-y-6">
                {/* Course Thumbnail Card */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl hover:shadow-pink-500/20 transition-shadow">
                  <div className="relative">
                    <img
                      src={preview}
                      alt={courseData.courseName}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                  </div>
                  <div className="p-4 space-y-2 bg-gradient-to-b from-gray-800 to-gray-900">
                    <p className="text-sm text-gray-400">Course by</p>
                    <p className="font-bold text-lg">{courseData.tutorName}</p>
                  </div>
                </div>

                {/* Pricing Card - Sticky */}
                <div className="sticky top-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 space-y-6 shadow-2xl">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">💰 Pricing Details</p>

                    {courseData.sellingPrice === 0 ? (
                      <div className="space-y-2">
                        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">
                          FREE
                        </p>
                        <p className="text-sm text-gray-400">No payment required. Access immediately!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Original Price</p>
                          <p className="text-2xl line-through text-gray-500">{courseData.currency}{courseData.originalPrice}</p>
                        </div>
                        {discount > 0 && (
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Discount</p>
                            <p className="text-2xl font-bold text-green-400">-{courseData.currency}{Math.round(courseData.originalPrice - courseData.sellingPrice)}</p>
                          </div>
                        )}
                        <div className="border-t border-gray-700 pt-4">
                          <p className="text-sm text-gray-400 mb-2">Final Price</p>
                          <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400">
                            {courseData.currency}{courseData.sellingPrice}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    {isEnrolled ? (
                      <div className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border-2 border-green-300 dark:border-green-600 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="font-ubuntu font-semibold text-green-700 dark:text-green-300 text-lg">✅ Enrolled Successfully</span>
                        </div>
                        <Switch
                          isSelected={true}
                          disabled={isUnenrolling}
                          isDisabled={isUnenrolling}
                          color="success"
                          onChange={handleUnenrollToggle}
                          classNames={{
                            base: "flex-shrink-0 cursor-pointer",
                            wrapper: "group-data-[selected=true]:bg-green-500",
                          }}
                        />
                      </div>
                    ) : (
                      <Button
                        onClick={handleEnrollCourse}
                        disabled={isEnrolling}
                        className="w-full font-bold text-lg py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
                      >
                        {isEnrolling ? "⏳ Enrolling..." : "✨ Enroll Now"}
                      </Button>
                    )}
                    <Button
                      onClick={handleSaveForLater}
                      disabled={isSavingBookmark}
                      className={`w-full font-bold text-white py-6 rounded-lg transition-all disabled:opacity-50 ${isBookmarked
                          ? "bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500"
                          : "bg-gray-700 hover:bg-gray-600"
                        }`}
                    >
                      {isSavingBookmark ? "⏳ Saving..." : isBookmarked ? "✅ Saved to Bookmark" : "📌 Save for Later"}
                    </Button>
                  </div>

                  {/* Info Badge */}
                  <div className="text-center pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400">
                      ✓ Lifetime Access<br />
                      ✓ Money-back Guarantee
                    </p>
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
