import express from "express";
import { authenticateToken, authenticateAdminOrInstructorToken } from "../middleware/auth.middleware";
// import { upload } from "../middleware/multer.middleware";
import { handleGoogleSignUpCallbackFunction, handleGoogleSignUpFunction } from "../controllers/auth/googleAuth.controllers";
import { handleGithubSignUpCallbackFunction, handleGithubSignUpFunction } from "../controllers/auth/githubAuth.controllers";
import { handleSignUpFunction, handleLoginFunction } from "../controllers/auth/localAuth.controllers";
import { handlePhoneNumberOTPCheckFunction, handlePhoneNumberOTPSendFunction } from "../controllers/user/userContactUpdate.controllers";
import { handleDeleteAccountFunction } from "../controllers/user/userDataDelete.controllers";
import { handleUpdateUserFunction } from "../controllers/user/userDataUpdate.controllers";
import { handleResendVerficationOTPFunction, handleEmailVerificationOTP } from "../controllers/user/userEmailVerification.controllers";
import { handleGetUserDataFunction, handleGetUserHistoryVideos, handleGetUsersBookmarkedCourses, handleGetUsersBookmarkedVideo } from "../controllers/user/userGetData.controllers";
import { handleGetTodos, handleCreateTodo, handleUpdateTodo, handleDeleteTodo, handleClearCompletedTodos, handleAddSubtask, handleToggleSubtask, handleDeleteSubtask, handleGetTodoStats } from "../controllers/user/todo.controllers";
import {
  handleBulkUpdateTodos,
  handleBulkDeleteTodos,
  handleReorderTodos,
  handleStartTimeSession,
  handleStopTimeSession,
  handleGetProductivityInsights,
  handleExportTodos,
  handleImportTodos,
} from "../controllers/user/todo.production.controllers";

import { handleGetNotifications, handleMarkAsRead, handleMarkAllAsRead, handleDeleteNotification, handleGetCourseTimeline, handleCreateCourseEnrollment } from "../controllers/user/notification.controllers";
import { handleUpdateUserImageFunction } from "../controllers/user/userProfileUpdate.controllers";
import { handleResetPasswordFunction, handleResetPasswordVerificationOTP } from "../controllers/user/userResetPassword.controllers";
import { handleRemoveHistoryVideo, handleRemoveUserEntireHistory, handleRemoveHistoryByDateRange, handleUserCourseBookmarkfunction , handleUserCourseProgress, handleUserHistoryVideoOrder, handleUserUnenrolledCourseFunction, handleUserVideoBookmarkfunction} from "../controllers/user/userCourseHandlers.controllers";
import { handleChangeRoleRequestFunction } from "../controllers/user/userChangeRole.controllers";
import { handleUpdateInterestsFunction } from "../controllers/user/userInterests.controllers";
import {
  handleGetAllPosts,
  handleApprovePost,
  handleRejectPost,
  handleDeletePost,
  handleFlagPost,
  handleGetCommunityStats,
  handleGetPostById,
  handleCreatePost,
  handleUpdatePost,
} from "../controllers/admin/communityManagement.controllers";
import {
  handleGetAllStudents,
  handleGetStudentById,
  handleUpdateStudent,
  handleDeleteStudent,
  handleGetStudentStats,
  handleToggleStudentEmailVerification,
  handleGetStudentEnrolledCourses,
  handleCreateStudent,
} from "../controllers/user/studentManagement.controllers";
import { handleSendTestEmailFunction } from "../controllers/admin/mailTest.controllers";
import {
  handleGetAllTeachers,
  handleGetTeacherById,
  handleUpdateTeacher,
  handleDeleteTeacher,
  handleGetTeacherStats,
  handleToggleTeacherEmailVerification,
  handleCreateTeacher,
} from "../controllers/user/teacherManagement.controllers";
import { loginRateLimiter, userUpdateRateLimiter } from "../validchecks/rateLimiters";
import multer from "multer";

const userRoute = express.Router();

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

// User Data Get
userRoute.get("/get-user", authenticateToken , handleGetUserDataFunction);

// User Bookmarked Videos
userRoute.post("/get-bookmarked-videos", authenticateToken , handleGetUsersBookmarkedVideo);
userRoute.post("/get-bookmarked-courses", authenticateToken , handleGetUsersBookmarkedCourses);
userRoute.post("/get-user-history", authenticateToken , handleGetUserHistoryVideos);
userRoute.post("/add-video-to-history", authenticateToken , handleUserHistoryVideoOrder);
userRoute.post("/delete-user-history-video", authenticateToken , handleRemoveHistoryVideo);
userRoute.delete("/delete-user-entire-history", authenticateToken , handleRemoveUserEntireHistory);
userRoute.post("/delete-history-by-date-range", authenticateToken , handleRemoveHistoryByDateRange);
userRoute.post("/unenrolled-in-course" , authenticateToken , handleUserUnenrolledCourseFunction);

// User Signup/Login Routes
userRoute.post("/signup", handleSignUpFunction);
userRoute.get("/signup-google", handleGoogleSignUpFunction);
userRoute.get("/signup-google/callback", handleGoogleSignUpCallbackFunction);
userRoute.get("/signup-github", handleGithubSignUpFunction);
userRoute.get("/signup-github/callback", handleGithubSignUpCallbackFunction);
userRoute.post("/login", loginRateLimiter, handleLoginFunction);

// Email Verification Routes
userRoute.post("/verify-email", handleResendVerficationOTPFunction);
userRoute.post("/verify-email-otp", handleEmailVerificationOTP);

// Mobile Number Verification Routes
userRoute.post("/verify-mobile-number-otp-check", authenticateToken ,  handlePhoneNumberOTPCheckFunction);
userRoute.post("/verify-mobile-number-send-otp", authenticateToken , handlePhoneNumberOTPSendFunction);

// Password Reset Routes
userRoute.post("/reset-password", handleResetPasswordFunction);
userRoute.post("/reset-password-otp", handleResetPasswordVerificationOTP);

// User Update Image or Upload Image
userRoute.post("/update-user-image", authenticateToken , upload.single("image"), handleUpdateUserImageFunction);

// User Update and Deletion Routes
userRoute.put("/update-user", authenticateToken, userUpdateRateLimiter,  handleUpdateUserFunction);
userRoute.put("/update-role", authenticateToken, handleChangeRoleRequestFunction);
userRoute.post("/delete-account", authenticateToken, handleDeleteAccountFunction);

//User added bookmarks to the course
userRoute.post("/user-course-bookmarks" , authenticateToken , handleUserCourseBookmarkfunction);
userRoute.post("/user-video-bookmarks" , authenticateToken , handleUserVideoBookmarkfunction);

//User added completed Video
userRoute.post("/user-video-progress" , authenticateToken , handleUserCourseProgress )

// Todo list routes
userRoute.get("/todos", authenticateToken, handleGetTodos);
userRoute.post("/todos", authenticateToken, handleCreateTodo);
userRoute.put("/todos/:id", authenticateToken, handleUpdateTodo);
userRoute.delete("/todos/:id", authenticateToken, handleDeleteTodo);
userRoute.delete("/todos/clear-completed", authenticateToken, handleClearCompletedTodos);

// Subtask routes
userRoute.post("/todos/:id/subtasks", authenticateToken, handleAddSubtask);
userRoute.put("/todos/:id/subtasks/:subtaskId", authenticateToken, handleToggleSubtask);
userRoute.delete("/todos/:id/subtasks/:subtaskId", authenticateToken, handleDeleteSubtask);

// Stats route
userRoute.get("/todos/stats", authenticateToken, handleGetTodoStats);

// Time tracking routes
userRoute.post("/todos/:id/time-session/start", authenticateToken, handleStartTimeSession);
userRoute.post("/todos/:id/time-session/stop", authenticateToken, handleStopTimeSession);

// Bulk operations
userRoute.put("/todos/bulk-update", authenticateToken, handleBulkUpdateTodos);
userRoute.delete("/todos/bulk-delete", authenticateToken, handleBulkDeleteTodos);
userRoute.post("/todos/reorder", authenticateToken, handleReorderTodos);

// Advanced analytics
userRoute.get("/todos/insights/productivity", authenticateToken, handleGetProductivityInsights);

// Import/Export
userRoute.get("/todos/export/csv", authenticateToken, handleExportTodos);
userRoute.post("/todos/import", authenticateToken, handleImportTodos);

// Notification routes
userRoute.get("/notifications", authenticateToken, handleGetNotifications);
userRoute.put("/notifications/:id/read", authenticateToken, handleMarkAsRead);
userRoute.put("/notifications/mark-all-read", authenticateToken, handleMarkAllAsRead);
userRoute.delete("/notifications/:id", authenticateToken, handleDeleteNotification);

// User interests / onboarding
userRoute.put("/update-interests", authenticateToken, handleUpdateInterestsFunction);

// Course timeline routes
userRoute.get("/course-timeline", authenticateToken, handleGetCourseTimeline);
userRoute.post("/course-enrollment", authenticateToken, handleCreateCourseEnrollment);

// Community Management routes (Admin only)
userRoute.get("/admin/community/posts", authenticateAdminOrInstructorToken, handleGetAllPosts);
userRoute.get("/admin/community/stats", authenticateAdminOrInstructorToken, handleGetCommunityStats);
userRoute.get("/admin/community/posts/:postId", authenticateAdminOrInstructorToken, handleGetPostById);
userRoute.post("/admin/community/posts", authenticateAdminOrInstructorToken, handleCreatePost);
userRoute.put("/admin/community/posts/:postId", authenticateAdminOrInstructorToken, handleUpdatePost);
userRoute.patch("/admin/community/posts/:postId/approve", authenticateAdminOrInstructorToken, handleApprovePost);
userRoute.patch("/admin/community/posts/:postId/reject", authenticateAdminOrInstructorToken, handleRejectPost);
userRoute.delete("/admin/community/posts/:postId", authenticateAdminOrInstructorToken, handleDeletePost);
userRoute.patch("/admin/community/posts/:postId/flag", authenticateAdminOrInstructorToken, handleFlagPost);

// Student Management routes (Admin/Instructor only)
userRoute.get("/admin/students", authenticateAdminOrInstructorToken, handleGetAllStudents);
userRoute.get("/admin/students/stats", authenticateAdminOrInstructorToken, handleGetStudentStats);
userRoute.get("/admin/students/:studentId", authenticateAdminOrInstructorToken, handleGetStudentById);
userRoute.get("/admin/students/:studentId/courses", authenticateAdminOrInstructorToken, handleGetStudentEnrolledCourses);
userRoute.post("/admin/students", authenticateAdminOrInstructorToken, handleCreateStudent);
userRoute.put("/admin/students/:studentId", authenticateAdminOrInstructorToken, handleUpdateStudent);
userRoute.patch("/admin/students/:studentId/email-verification", authenticateAdminOrInstructorToken, handleToggleStudentEmailVerification);
userRoute.delete("/admin/students/:studentId", authenticateAdminOrInstructorToken, handleDeleteStudent);

// Teacher Management routes (Admin/Instructor only)
userRoute.get("/admin/teachers", authenticateAdminOrInstructorToken, handleGetAllTeachers);
userRoute.get("/admin/teachers/stats", authenticateAdminOrInstructorToken, handleGetTeacherStats);
userRoute.get("/admin/teachers/:teacherId", authenticateAdminOrInstructorToken, handleGetTeacherById);
userRoute.post("/admin/teachers", authenticateAdminOrInstructorToken, handleCreateTeacher);
userRoute.put("/admin/teachers/:teacherId", authenticateAdminOrInstructorToken, handleUpdateTeacher);
userRoute.patch("/admin/teachers/:teacherId/email-verification", authenticateAdminOrInstructorToken, handleToggleTeacherEmailVerification);
userRoute.delete("/admin/teachers/:teacherId", authenticateAdminOrInstructorToken, handleDeleteTeacher);
userRoute.post("/admin/send-test-email", authenticateAdminOrInstructorToken, handleSendTestEmailFunction);

export default userRoute;