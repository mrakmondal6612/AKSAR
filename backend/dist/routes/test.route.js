"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const createTest_controllers_1 = require("../controllers/test/createTest.controllers");
const getTest_controllers_1 = require("../controllers/test/getTest.controllers");
const submitTest_controllers_1 = require("../controllers/test/submitTest.controllers");
const marksheet_controllers_1 = require("../controllers/test/marksheet.controllers");
const autoAssignTest_controllers_1 = require("../controllers/test/autoAssignTest.controllers");
const adminTest_controllers_1 = require("../controllers/test/adminTest.controllers");
const certificateVerification_controllers_1 = require("../controllers/test/certificateVerification.controllers");
const certificateManagement_controllers_1 = require("../controllers/admin/certificateManagement.controllers");
const aiTestGeneration_controllers_1 = require("../controllers/test/aiTestGeneration.controllers");
const emailTest_controllers_1 = require("../controllers/test/emailTest.controllers");
const smsTest_controllers_1 = require("../controllers/test/smsTest.controllers");
const notificationTest_controllers_1 = require("../controllers/test/notificationTest.controllers");
const testRoute = express_1.default.Router();
// Test Management Routes (Admin/Instructor)
testRoute.post("/create", auth_middleware_1.authenticateAdminToken, createTest_controllers_1.handleCreateTestFunction);
testRoute.put("/update/:testId", auth_middleware_1.authenticateAdminToken, createTest_controllers_1.handleUpdateTestFunction);
testRoute.patch("/publish/:testId", auth_middleware_1.authenticateAdminToken, createTest_controllers_1.handlePublishTestFunction);
testRoute.delete("/delete/:testId", auth_middleware_1.authenticateAdminToken, createTest_controllers_1.handleDeleteTestFunction);
// Test Retrieval Routes
testRoute.get("/get/:testId", auth_middleware_1.authenticateToken, getTest_controllers_1.handleGetTestByIdFunction);
testRoute.get("/course/:courseId", auth_middleware_1.authenticateToken, getTest_controllers_1.handleGetTestsByCourseFunction);
testRoute.get("/all", auth_middleware_1.authenticateToken, getTest_controllers_1.handleGetAllTestsFunction);
testRoute.get("/instructor", auth_middleware_1.authenticateToken, getTest_controllers_1.handleGetTestsByInstructorFunction);
testRoute.get("/attempt/:testId", auth_middleware_1.authenticateToken, getTest_controllers_1.handleGetTestForAttemptFunction);
// Test Attempt Routes
testRoute.post("/attempt/start/:testId", auth_middleware_1.authenticateToken, submitTest_controllers_1.handleStartTestAttemptFunction);
testRoute.post("/attempt/submit/:attemptId", auth_middleware_1.authenticateToken, submitTest_controllers_1.handleSubmitTestAttemptFunction);
testRoute.get("/attempt/:attemptId", auth_middleware_1.authenticateToken, submitTest_controllers_1.handleGetTestAttemptFunction);
testRoute.get("/attempts/user", auth_middleware_1.authenticateToken, submitTest_controllers_1.handleGetUserAttemptsFunction);
// Marksheet & Certificate Routes
testRoute.get("/marksheet/user", auth_middleware_1.authenticateToken, marksheet_controllers_1.handleGetUserMarksheetsFunction);
testRoute.get("/marksheet/:marksheetId", auth_middleware_1.authenticateToken, marksheet_controllers_1.handleGetMarksheetByIdFunction);
testRoute.post("/certificate/download/:marksheetId", auth_middleware_1.authenticateToken, marksheet_controllers_1.handleDownloadCertificateFunction);
// Gamification Routes
testRoute.get("/leaderboard", auth_middleware_1.authenticateToken, marksheet_controllers_1.handleGetLeaderboardFunction);
testRoute.get("/stats/user", auth_middleware_1.authenticateToken, marksheet_controllers_1.handleGetUserStatsFunction);
// Auto-assignment Routes
testRoute.post("/auto-assign", auth_middleware_1.authenticateToken, autoAssignTest_controllers_1.handleAutoAssignTestFunction);
testRoute.get("/check-completion/:courseId/:userId", auth_middleware_1.authenticateToken, autoAssignTest_controllers_1.handleCheckCourseCompletionFunction);
testRoute.post("/complete-and-assign/:courseId", auth_middleware_1.authenticateToken, autoAssignTest_controllers_1.handleCompleteCourseAndAssignTestFunction);
// Admin Routes
testRoute.get("/admin/stats", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleGetAllTestStatsFunction);
testRoute.patch("/admin/status/:testId", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleManageTestStatusFunction);
testRoute.delete("/admin/bulk", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleBulkDeleteTestsFunction);
testRoute.get("/admin/marksheets", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleGetAllMarksheetsAdminFunction);
testRoute.patch("/admin/revoke/:marksheetId", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleRevokeCertificateFunction);
testRoute.put("/admin/gamification", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleUpdateGamificationSettingsFunction);
testRoute.get("/admin/user-history/:userId", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleGetUserTestHistoryAdminFunction);
testRoute.get("/admin/attempts", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleGetAllAttemptsAdminFunction);
testRoute.delete("/admin/attempts/:attemptId", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleDeleteAttemptAdminFunction);
testRoute.post("/admin/attempts", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleCreateAttemptAdminFunction);
testRoute.put("/admin/attempts/:attemptId", auth_middleware_1.authenticateAdminToken, adminTest_controllers_1.handleUpdateAttemptAdminFunction);
// Certificate Verification Routes (Public)
testRoute.post("/verify/public", certificateVerification_controllers_1.handlePublicVerifyCertificateFunction);
testRoute.get("/verify/:certificateId", auth_middleware_1.authenticateToken, certificateVerification_controllers_1.handleVerifyCertificateFunction);
// AI Test Generation Routes
testRoute.post("/ai/generate", auth_middleware_1.authenticateAdminToken, aiTestGeneration_controllers_1.handleGenerateTestWithAI);
testRoute.post("/ai/evaluate-saq", auth_middleware_1.authenticateToken, aiTestGeneration_controllers_1.handleEvaluateSAQWithAI);
testRoute.post("/ai/generate-questions", auth_middleware_1.authenticateAdminToken, aiTestGeneration_controllers_1.handleGenerateQuestionsWithAI);
// Certificate Management Routes (Admin)
testRoute.get("/admin/certificates", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleGetAllCertificates);
testRoute.get("/admin/certificates/stats", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleGetCertificateStats);
testRoute.get("/admin/certificates/:marksheetId", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleGetCertificateById);
testRoute.post("/admin/certificates", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleCreateCertificate);
testRoute.delete("/admin/certificates/:marksheetId", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleDeleteCertificate);
testRoute.patch("/admin/certificates/:marksheetId/revoke", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleRevokeCertificate);
testRoute.patch("/admin/certificates/:marksheetId/restore", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleRestoreCertificate);
testRoute.get("/admin/certificates/dropdown/users", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleGetUsersForCertificate);
testRoute.get("/admin/certificates/dropdown/tests", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleGetTestsForCertificate);
testRoute.get("/admin/certificates/dropdown/courses", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleGetCoursesForCertificate);
testRoute.post("/admin/certificates/:marksheetId/download", auth_middleware_1.authenticateAdminToken, certificateManagement_controllers_1.handleDownloadCertificate);
// Email Test Routes (Admin only - for testing SMTP configuration)
testRoute.get("/email/test-connection", auth_middleware_1.authenticateAdminToken, emailTest_controllers_1.testEmailConnection);
testRoute.post("/email/send-test", auth_middleware_1.authenticateAdminToken, emailTest_controllers_1.sendTestEmail);
// SMS Test Routes (Admin only - for testing SMS)
testRoute.post("/sms/test-verification", auth_middleware_1.authenticateToken, smsTest_controllers_1.testSMSVerification);
testRoute.post("/sms/test-password-reset", auth_middleware_1.authenticateToken, smsTest_controllers_1.testSMSPasswordReset);
testRoute.post("/sms/test-notification", auth_middleware_1.authenticateToken, smsTest_controllers_1.testSMSNotification);
// Notification Test Routes (for testing different notification types via email)
testRoute.post("/notification/test", auth_middleware_1.authenticateAdminToken, notificationTest_controllers_1.sendTestNotification);
exports.default = testRoute;
