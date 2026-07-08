import express from "express";
import { authenticateAdminToken, authenticateAdminOrInstructorToken, authenticateToken } from "../middleware/auth.middleware";
import {
  handleCreateTestFunction,
  handleUpdateTestFunction,
  handlePublishTestFunction,
  handleDeleteTestFunction,
} from "../controllers/test/createTest.controllers";
import {
  handleGetTestByIdFunction,
  handleGetTestsByCourseFunction,
  handleGetAllTestsFunction,
  handleGetTestsByInstructorFunction,
  handleGetTestForAttemptFunction,
} from "../controllers/test/getTest.controllers";
import {
  handleStartTestAttemptFunction,
  handleSubmitTestAttemptFunction,
  handleGetTestAttemptFunction,
  handleGetUserAttemptsFunction,
} from "../controllers/test/submitTest.controllers";
import {
  handleGetUserMarksheetsFunction,
  handleGetMarksheetByIdFunction,
  handleDownloadCertificateFunction,
  handleGetLeaderboardFunction,
  handleGetUserStatsFunction,
} from "../controllers/test/marksheet.controllers";
import {
  handleAutoAssignTestFunction,
  handleCheckCourseCompletionFunction,
  handleCompleteCourseAndAssignTestFunction,
} from "../controllers/test/autoAssignTest.controllers";
import {
  handleGetAllTestStatsFunction,
  handleManageTestStatusFunction,
  handleBulkDeleteTestsFunction,
  handleGetAllMarksheetsAdminFunction,
  handleRevokeCertificateFunction,
  handleUpdateGamificationSettingsFunction,
  handleGetUserTestHistoryAdminFunction,
} from "../controllers/test/adminTest.controllers";
import {
  handleVerifyCertificateFunction,
  handlePublicVerifyCertificateFunction,
} from "../controllers/test/certificateVerification.controllers";
import {
  handleGetAllCertificates,
  handleRevokeCertificate,
  handleRestoreCertificate,
  handleGetCertificateStats,
  handleGetCertificateById,
  handleCreateCertificate,
  handleDeleteCertificate,
  handleGetUsersForCertificate,
  handleGetTestsForCertificate,
  handleGetCoursesForCertificate,
  handleDownloadCertificate,
} from "../controllers/admin/certificateManagement.controllers";
import {
  handleGenerateTestWithAI,
  handleEvaluateSAQWithAI,
  handleGenerateQuestionsWithAI,
} from "../controllers/test/aiTestGeneration.controllers";

const testRoute = express.Router();

// Test Management Routes (Admin/Instructor)
testRoute.post("/create", authenticateAdminToken, handleCreateTestFunction);
testRoute.put("/update/:testId", authenticateAdminToken, handleUpdateTestFunction);
testRoute.patch("/publish/:testId", authenticateAdminToken, handlePublishTestFunction);
testRoute.delete("/delete/:testId", authenticateAdminToken, handleDeleteTestFunction);

// Test Retrieval Routes
testRoute.get("/get/:testId", authenticateToken, handleGetTestByIdFunction);
testRoute.get("/course/:courseId", authenticateToken, handleGetTestsByCourseFunction);
testRoute.get("/all", authenticateToken, handleGetAllTestsFunction);
testRoute.get("/instructor", authenticateToken, handleGetTestsByInstructorFunction);
testRoute.get("/attempt/:testId", authenticateToken, handleGetTestForAttemptFunction);

// Test Attempt Routes
testRoute.post("/attempt/start/:testId", authenticateToken, handleStartTestAttemptFunction);
testRoute.post("/attempt/submit/:attemptId", authenticateToken, handleSubmitTestAttemptFunction);
testRoute.get("/attempt/:attemptId", authenticateToken, handleGetTestAttemptFunction);
testRoute.get("/attempts/user", authenticateToken, handleGetUserAttemptsFunction);

// Marksheet & Certificate Routes
testRoute.get("/marksheet/user", authenticateToken, handleGetUserMarksheetsFunction);
testRoute.get("/marksheet/:marksheetId", authenticateToken, handleGetMarksheetByIdFunction);
testRoute.post("/certificate/download/:marksheetId", authenticateToken, handleDownloadCertificateFunction);

// Gamification Routes
testRoute.get("/leaderboard", authenticateToken, handleGetLeaderboardFunction);
testRoute.get("/stats/user", authenticateToken, handleGetUserStatsFunction);

// Auto-assignment Routes
testRoute.post("/auto-assign", authenticateToken, handleAutoAssignTestFunction);
testRoute.get("/check-completion/:courseId/:userId", authenticateToken, handleCheckCourseCompletionFunction);
testRoute.post("/complete-and-assign/:courseId", authenticateToken, handleCompleteCourseAndAssignTestFunction);

// Admin Routes
testRoute.get("/admin/stats", authenticateAdminToken, handleGetAllTestStatsFunction);
testRoute.patch("/admin/status/:testId", authenticateAdminToken, handleManageTestStatusFunction);
testRoute.delete("/admin/bulk", authenticateAdminToken, handleBulkDeleteTestsFunction);
testRoute.get("/admin/marksheets", authenticateAdminToken, handleGetAllMarksheetsAdminFunction);
testRoute.patch("/admin/revoke/:marksheetId", authenticateAdminToken, handleRevokeCertificateFunction);
testRoute.put("/admin/gamification", authenticateAdminToken, handleUpdateGamificationSettingsFunction);
testRoute.get("/admin/user-history/:userId", authenticateAdminToken, handleGetUserTestHistoryAdminFunction);

// Certificate Verification Routes (Public)
testRoute.post("/verify/public", handlePublicVerifyCertificateFunction);
testRoute.get("/verify/:certificateId", authenticateToken, handleVerifyCertificateFunction);

// AI Test Generation Routes
testRoute.post("/ai/generate", authenticateAdminToken, handleGenerateTestWithAI);
testRoute.post("/ai/evaluate-saq", authenticateToken, handleEvaluateSAQWithAI);
testRoute.post("/ai/generate-questions", authenticateAdminToken, handleGenerateQuestionsWithAI);

// Certificate Management Routes (Admin)
testRoute.get("/admin/certificates", authenticateAdminToken, handleGetAllCertificates);
testRoute.get("/admin/certificates/stats", authenticateAdminToken, handleGetCertificateStats);
testRoute.get("/admin/certificates/:marksheetId", authenticateAdminToken, handleGetCertificateById);
testRoute.post("/admin/certificates", authenticateAdminToken, handleCreateCertificate);
testRoute.delete("/admin/certificates/:marksheetId", authenticateAdminToken, handleDeleteCertificate);
testRoute.patch("/admin/certificates/:marksheetId/revoke", authenticateAdminToken, handleRevokeCertificate);
testRoute.patch("/admin/certificates/:marksheetId/restore", authenticateAdminToken, handleRestoreCertificate);
testRoute.get("/admin/certificates/dropdown/users", authenticateAdminToken, handleGetUsersForCertificate);
testRoute.get("/admin/certificates/dropdown/tests", authenticateAdminToken, handleGetTestsForCertificate);
testRoute.get("/admin/certificates/dropdown/courses", authenticateAdminToken, handleGetCoursesForCertificate);
testRoute.post("/admin/certificates/:marksheetId/download", authenticateAdminToken, handleDownloadCertificate);

export default testRoute;
