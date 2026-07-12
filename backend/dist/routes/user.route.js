"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
// import { upload } from "../middleware/multer.middleware";
const googleAuth_controllers_1 = require("../controllers/auth/googleAuth.controllers");
const githubAuth_controllers_1 = require("../controllers/auth/githubAuth.controllers");
const localAuth_controllers_1 = require("../controllers/auth/localAuth.controllers");
const userContactUpdate_controllers_1 = require("../controllers/user/userContactUpdate.controllers");
const userDataDelete_controllers_1 = require("../controllers/user/userDataDelete.controllers");
const userDataUpdate_controllers_1 = require("../controllers/user/userDataUpdate.controllers");
const userEmailVerification_controllers_1 = require("../controllers/user/userEmailVerification.controllers");
const userGetData_controllers_1 = require("../controllers/user/userGetData.controllers");
const todo_controllers_1 = require("../controllers/user/todo.controllers");
const todo_production_controllers_1 = require("../controllers/user/todo.production.controllers");
const notification_controllers_1 = require("../controllers/user/notification.controllers");
const userProfileUpdate_controllers_1 = require("../controllers/user/userProfileUpdate.controllers");
const userResetPassword_controllers_1 = require("../controllers/user/userResetPassword.controllers");
const userCourseHandlers_controllers_1 = require("../controllers/user/userCourseHandlers.controllers");
const userChangeRole_controllers_1 = require("../controllers/user/userChangeRole.controllers");
const userInterests_controllers_1 = require("../controllers/user/userInterests.controllers");
const community_controllers_1 = require("../controllers/user/community.controllers");
const feedback_controllers_1 = require("../controllers/user/feedback.controllers");
const communityManagement_controllers_1 = require("../controllers/admin/communityManagement.controllers");
const studentManagement_controllers_1 = require("../controllers/user/studentManagement.controllers");
const mailTest_controllers_1 = require("../controllers/admin/mailTest.controllers");
const teacherManagement_controllers_1 = require("../controllers/user/teacherManagement.controllers");
const rateLimiters_1 = require("../validchecks/rateLimiters");
const multer_1 = __importDefault(require("multer"));
const requests_controllers_1 = require("../controllers/user/requests.controllers");
const contactMessage_controllers_1 = require("../controllers/user/contactMessage.controllers");
const userRoute = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({ storage: storage });
// User Data Get
userRoute.get("/get-user", auth_middleware_1.authenticateToken, userGetData_controllers_1.handleGetUserDataFunction);
// User Bookmarked Videos
userRoute.post("/get-bookmarked-videos", auth_middleware_1.authenticateToken, userGetData_controllers_1.handleGetUsersBookmarkedVideo);
userRoute.post("/get-bookmarked-courses", auth_middleware_1.authenticateToken, userGetData_controllers_1.handleGetUsersBookmarkedCourses);
userRoute.post("/get-user-history", auth_middleware_1.authenticateToken, userGetData_controllers_1.handleGetUserHistoryVideos);
userRoute.post("/add-video-to-history", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleUserHistoryVideoOrder);
userRoute.post("/delete-user-history-video", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleRemoveHistoryVideo);
userRoute.delete("/delete-user-entire-history", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleRemoveUserEntireHistory);
userRoute.post("/delete-history-by-date-range", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleRemoveHistoryByDateRange);
userRoute.post("/unenrolled-in-course", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleUserUnenrolledCourseFunction);
// User Signup/Login Routes
userRoute.post("/signup", localAuth_controllers_1.handleSignUpFunction);
userRoute.get("/signup-google", googleAuth_controllers_1.handleGoogleSignUpFunction);
userRoute.get("/signup-google/callback", googleAuth_controllers_1.handleGoogleSignUpCallbackFunction);
userRoute.get("/signup-github", githubAuth_controllers_1.handleGithubSignUpFunction);
userRoute.get("/signup-github/callback", githubAuth_controllers_1.handleGithubSignUpCallbackFunction);
userRoute.post("/login", rateLimiters_1.loginRateLimiter, localAuth_controllers_1.handleLoginFunction);
// Email Verification Routes
userRoute.post("/verify-email", userEmailVerification_controllers_1.handleResendVerficationOTPFunction);
userRoute.post("/verify-email-otp", userEmailVerification_controllers_1.handleEmailVerificationOTP);
// Mobile Number Verification Routes
userRoute.post("/verify-mobile-number-otp-check", auth_middleware_1.authenticateToken, userContactUpdate_controllers_1.handlePhoneNumberOTPCheckFunction);
userRoute.post("/verify-mobile-number-send-otp", auth_middleware_1.authenticateToken, userContactUpdate_controllers_1.handlePhoneNumberOTPSendFunction);
// Password Reset Routes
userRoute.post("/reset-password", userResetPassword_controllers_1.handleResetPasswordFunction);
userRoute.post("/reset-password-otp", userResetPassword_controllers_1.handleResetPasswordVerificationOTP);
// User Update Image or Upload Image
userRoute.post("/update-user-image", auth_middleware_1.authenticateToken, exports.upload.single("image"), userProfileUpdate_controllers_1.handleUpdateUserImageFunction);
// User Update and Deletion Routes
userRoute.put("/update-user", auth_middleware_1.authenticateToken, rateLimiters_1.userUpdateRateLimiter, userDataUpdate_controllers_1.handleUpdateUserFunction);
userRoute.put("/update-role", auth_middleware_1.authenticateToken, userChangeRole_controllers_1.handleChangeRoleRequestFunction);
userRoute.post("/delete-account", auth_middleware_1.authenticateToken, userDataDelete_controllers_1.handleDeleteAccountFunction);
//User added bookmarks to the course
userRoute.post("/user-course-bookmarks", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleUserCourseBookmarkfunction);
userRoute.post("/user-video-bookmarks", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleUserVideoBookmarkfunction);
//User added completed Video
userRoute.post("/user-video-progress", auth_middleware_1.authenticateToken, userCourseHandlers_controllers_1.handleUserCourseProgress);
// Todo list routes
userRoute.get("/todos", auth_middleware_1.authenticateToken, todo_controllers_1.handleGetTodos);
userRoute.post("/todos", auth_middleware_1.authenticateToken, todo_controllers_1.handleCreateTodo);
userRoute.put("/todos/:id", auth_middleware_1.authenticateToken, todo_controllers_1.handleUpdateTodo);
userRoute.delete("/todos/:id", auth_middleware_1.authenticateToken, todo_controllers_1.handleDeleteTodo);
userRoute.delete("/todos/clear-completed", auth_middleware_1.authenticateToken, todo_controllers_1.handleClearCompletedTodos);
// Subtask routes
userRoute.post("/todos/:id/subtasks", auth_middleware_1.authenticateToken, todo_controllers_1.handleAddSubtask);
userRoute.put("/todos/:id/subtasks/:subtaskId", auth_middleware_1.authenticateToken, todo_controllers_1.handleToggleSubtask);
userRoute.delete("/todos/:id/subtasks/:subtaskId", auth_middleware_1.authenticateToken, todo_controllers_1.handleDeleteSubtask);
// Stats route
userRoute.get("/todos/stats", auth_middleware_1.authenticateToken, todo_controllers_1.handleGetTodoStats);
// Time tracking routes
userRoute.post("/todos/:id/time-session/start", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleStartTimeSession);
userRoute.post("/todos/:id/time-session/stop", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleStopTimeSession);
// Bulk operations
userRoute.put("/todos/bulk-update", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleBulkUpdateTodos);
userRoute.delete("/todos/bulk-delete", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleBulkDeleteTodos);
userRoute.post("/todos/reorder", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleReorderTodos);
// Advanced analytics
userRoute.get("/todos/insights/productivity", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleGetProductivityInsights);
// Import/Export
userRoute.get("/todos/export/csv", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleExportTodos);
userRoute.post("/todos/import", auth_middleware_1.authenticateToken, todo_production_controllers_1.handleImportTodos);
// Notification routes
userRoute.get("/notifications", auth_middleware_1.authenticateToken, notification_controllers_1.handleGetNotifications);
userRoute.put("/notifications/:id/read", auth_middleware_1.authenticateToken, notification_controllers_1.handleMarkAsRead);
userRoute.put("/notifications/mark-all-read", auth_middleware_1.authenticateToken, notification_controllers_1.handleMarkAllAsRead);
userRoute.delete("/notifications/:id", auth_middleware_1.authenticateToken, notification_controllers_1.handleDeleteNotification);
// User interests / onboarding
userRoute.put("/update-interests", auth_middleware_1.authenticateToken, userInterests_controllers_1.handleUpdateInterestsFunction);
// Course timeline routes
userRoute.get("/course-timeline", auth_middleware_1.authenticateToken, notification_controllers_1.handleGetCourseTimeline);
userRoute.post("/course-enrollment", auth_middleware_1.authenticateToken, notification_controllers_1.handleCreateCourseEnrollment);
// Community Management routes (Admin only)
userRoute.get("/admin/community/posts", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleGetAllPosts);
userRoute.get("/admin/community/stats", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleGetCommunityStats);
userRoute.get("/admin/community/posts/:postId", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleGetPostById);
userRoute.post("/admin/community/posts", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleCreatePost);
userRoute.put("/admin/community/posts/:postId", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleUpdatePost);
userRoute.patch("/admin/community/posts/:postId/approve", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleApprovePost);
userRoute.patch("/admin/community/posts/:postId/reject", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleRejectPost);
userRoute.delete("/admin/community/posts/:postId", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleDeletePost);
userRoute.patch("/admin/community/posts/:postId/flag", auth_middleware_1.authenticateAdminOrInstructorToken, communityManagement_controllers_1.handleFlagPost);
// Student Management routes (Admin/Instructor only)
userRoute.get("/admin/students", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleGetAllStudents);
userRoute.get("/admin/students/stats", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleGetStudentStats);
userRoute.get("/admin/students/:studentId", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleGetStudentById);
userRoute.get("/admin/students/:studentId/courses", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleGetStudentEnrolledCourses);
userRoute.post("/admin/students", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleCreateStudent);
userRoute.put("/admin/students/:studentId", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleUpdateStudent);
userRoute.patch("/admin/students/:studentId/email-verification", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleToggleStudentEmailVerification);
userRoute.delete("/admin/students/:studentId", auth_middleware_1.authenticateAdminOrInstructorToken, studentManagement_controllers_1.handleDeleteStudent);
// Teacher Management routes (Admin/Instructor only)
userRoute.get("/admin/teachers", auth_middleware_1.authenticateAdminOrInstructorToken, teacherManagement_controllers_1.handleGetAllTeachers);
userRoute.get("/admin/teachers/stats", auth_middleware_1.authenticateAdminOrInstructorToken, teacherManagement_controllers_1.handleGetTeacherStats);
userRoute.get("/admin/teachers/:teacherId", auth_middleware_1.authenticateAdminOrInstructorToken, teacherManagement_controllers_1.handleGetTeacherById);
userRoute.post("/admin/teachers", auth_middleware_1.authenticateAdminOrInstructorToken, teacherManagement_controllers_1.handleCreateTeacher);
userRoute.put("/admin/teachers/:teacherId", auth_middleware_1.authenticateAdminOrInstructorToken, teacherManagement_controllers_1.handleUpdateTeacher);
userRoute.patch("/admin/teachers/:teacherId/email-verification", auth_middleware_1.authenticateAdminOrInstructorToken, teacherManagement_controllers_1.handleToggleTeacherEmailVerification);
userRoute.delete("/admin/teachers/:teacherId", auth_middleware_1.authenticateAdminOrInstructorToken, teacherManagement_controllers_1.handleDeleteTeacher);
userRoute.post("/admin/send-test-email", auth_middleware_1.authenticateAdminOrInstructorToken, mailTest_controllers_1.handleSendTestEmailFunction);
// User Community routes (authenticated general users)
userRoute.get("/community/posts", community_controllers_1.handleGetApprovedPosts);
userRoute.post("/community/posts", auth_middleware_1.authenticateToken, community_controllers_1.handleCreateUserPost);
userRoute.patch("/community/posts/:postId/like", auth_middleware_1.authenticateToken, community_controllers_1.handleToggleLikePost);
userRoute.post("/community/posts/:postId/comment", auth_middleware_1.authenticateToken, community_controllers_1.handleAddCommentPost);
// User Feedback/Testimonial routes
userRoute.post("/feedback", auth_middleware_1.authenticateToken, feedback_controllers_1.handleCreateFeedback);
userRoute.get("/feedback", feedback_controllers_1.handleGetFeedbacks);
// Student routes (Instructor Requests)
userRoute.post("/instructor-request", auth_middleware_1.authenticateToken, requests_controllers_1.handleSubmitInstructorRequestFunction);
userRoute.get("/instructor-request/my", auth_middleware_1.authenticateToken, requests_controllers_1.handleGetMyInstructorRequestFunction);
userRoute.get("/admin/instructor-requests", auth_middleware_1.authenticateAdminOrInstructorToken, requests_controllers_1.handleGetAllInstructorRequestsFunction);
userRoute.patch("/admin/instructor-requests/:requestId/approve", auth_middleware_1.authenticateAdminOrInstructorToken, requests_controllers_1.handleApproveInstructorRequestFunction);
userRoute.patch("/admin/instructor-requests/:requestId/reject", auth_middleware_1.authenticateAdminOrInstructorToken, requests_controllers_1.handleRejectInstructorRequestFunction);
// Public - Contact Us
userRoute.post("/contact", contactMessage_controllers_1.handleSubmitContactMessageFunction);
// Admin - Inbox
userRoute.get("/admin/contact-messages", auth_middleware_1.authenticateAdminOrInstructorToken, contactMessage_controllers_1.handleGetContactMessagesFunction);
userRoute.patch("/admin/contact-messages/:messageId/read", auth_middleware_1.authenticateAdminOrInstructorToken, contactMessage_controllers_1.handleMarkMessageReadFunction);
userRoute.delete("/admin/contact-messages/:messageId", auth_middleware_1.authenticateAdminOrInstructorToken, contactMessage_controllers_1.handleDeleteContactMessageFunction);
exports.default = userRoute;
