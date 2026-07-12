"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpdateAttemptAdminFunction = exports.handleCreateAttemptAdminFunction = exports.handleDeleteAttemptAdminFunction = exports.handleGetAllAttemptsAdminFunction = exports.handleGetUserTestHistoryAdminFunction = exports.handleUpdateGamificationSettingsFunction = exports.handleRevokeCertificateFunction = exports.handleGetAllMarksheetsAdminFunction = exports.handleBulkDeleteTestsFunction = exports.handleManageTestStatusFunction = exports.handleGetAllTestStatsFunction = void 0;
const Test_model_1 = __importDefault(require("../../models/Test.model"));
const TestAttempt_model_1 = __importDefault(require("../../models/TestAttempt.model"));
const Marksheet_model_1 = __importDefault(require("../../models/Marksheet.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const handleGetAllTestStatsFunction = async (req, res) => {
    try {
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        // Get overall statistics
        const totalTests = await Test_model_1.default.countDocuments();
        const publishedTests = await Test_model_1.default.countDocuments({ status: "PUBLISHED" });
        const draftTests = await Test_model_1.default.countDocuments({ status: "DRAFT" });
        const totalAttempts = await TestAttempt_model_1.default.countDocuments();
        const completedAttempts = await TestAttempt_model_1.default.countDocuments({ status: "COMPLETED" });
        const totalMarksheets = await Marksheet_model_1.default.countDocuments();
        const passedTests = await Marksheet_model_1.default.countDocuments({ passed: true });
        // Get recent activity
        const recentTests = await Test_model_1.default.find().sort({ createdAt: -1 }).limit(5);
        const recentAttempts = await TestAttempt_model_1.default.find()
            .sort({ createdAt: -1 })
            .limit(10);
        const testIds = recentAttempts.map((a) => a.test).filter(Boolean);
        const userIds = recentAttempts.map((a) => a.user).filter(Boolean);
        const [tests, users] = await Promise.all([
            Test_model_1.default.find({ testId: { $in: testIds } }),
            User_model_1.default.find({ uniqueId: { $in: userIds } }),
        ]);
        const testMap = new Map(tests.map((t) => [t.testId, t]));
        const userMap = new Map(users.map((u) => [u.uniqueId, u]));
        const populatedRecentAttempts = recentAttempts.map((a) => {
            const obj = a.toObject();
            const testDoc = testMap.get(a.test);
            const userDoc = userMap.get(a.user);
            obj.test = testDoc
                ? {
                    _id: testDoc.testId,
                    title: testDoc.title,
                }
                : null;
            obj.user = userDoc
                ? {
                    firstName: userDoc.firstName,
                    lastName: userDoc.lastName,
                }
                : null;
            return obj;
        });
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalTests,
                    publishedTests,
                    draftTests,
                    totalAttempts,
                    completedAttempts,
                    totalMarksheets,
                    passedTests,
                    passRate: completedAttempts > 0 ? (passedTests / completedAttempts) * 100 : 0,
                },
                recentTests,
                recentAttempts: populatedRecentAttempts,
            },
        });
    }
    catch (error) {
        console.error("Error fetching admin test stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetAllTestStatsFunction = handleGetAllTestStatsFunction;
const handleManageTestStatusFunction = async (req, res) => {
    try {
        const { testId } = req.params;
        const { status } = req.body;
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }
        const test = await Test_model_1.default.findOneAndUpdate({ testId }, { status }, { new: true });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Test status updated successfully",
            data: test,
        });
    }
    catch (error) {
        console.error("Error managing test status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleManageTestStatusFunction = handleManageTestStatusFunction;
const handleBulkDeleteTestsFunction = async (req, res) => {
    try {
        const { testIds } = req.body;
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        if (!Array.isArray(testIds) || testIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid test IDs",
            });
        }
        const result = await Test_model_1.default.deleteMany({ testId: { $in: testIds } });
        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} tests successfully`,
            data: { deletedCount: result.deletedCount },
        });
    }
    catch (error) {
        console.error("Error bulk deleting tests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleBulkDeleteTestsFunction = handleBulkDeleteTestsFunction;
const handleGetAllMarksheetsAdminFunction = async (req, res) => {
    try {
        const userId = req.user?.uniqueId || req.userUniqueId;
        const { page = 1, limit = 20, status, courseId } = req.query;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const filter = {};
        if (status === "passed")
            filter.passed = true;
        if (status === "failed")
            filter.passed = false;
        if (courseId)
            filter.course = courseId;
        const marksheets = await Marksheet_model_1.default.find(filter)
            .sort({ completionDate: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        // Manually populate test & course & user details matching string IDs
        const mTestIds = marksheets.map((m) => m.test).filter(Boolean);
        const mCourseIds = marksheets.map((m) => m.course).filter(Boolean);
        const mUserIds = marksheets.map((m) => m.user).filter(Boolean);
        const [mTests, mCourses, mUsers] = await Promise.all([
            Test_model_1.default.find({ testId: { $in: mTestIds } }),
            Course_model_1.default.find({ courseId: { $in: mCourseIds } }),
            User_model_1.default.find({ uniqueId: { $in: mUserIds } }),
        ]);
        const mTestMap = new Map(mTests.map((t) => [t.testId, t]));
        const mCourseMap = new Map(mCourses.map((c) => [c.courseId, c]));
        const mUserMap = new Map(mUsers.map((u) => [u.uniqueId, u]));
        const populatedMarksheets = marksheets.map((m) => {
            const obj = m.toObject();
            const testDoc = mTestMap.get(m.test || "");
            const courseDoc = mCourseMap.get(m.course);
            const userDoc = mUserMap.get(m.user);
            obj.test = testDoc
                ? {
                    _id: testDoc.testId,
                    title: testDoc.title,
                }
                : null;
            obj.course = courseDoc
                ? {
                    _id: courseDoc.courseId,
                    courseName: courseDoc.courseName,
                }
                : null;
            obj.user = userDoc
                ? {
                    firstName: userDoc.firstName,
                    lastName: userDoc.lastName,
                    email: userDoc.email,
                }
                : null;
            return obj;
        });
        const total = await Marksheet_model_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            data: {
                marksheets: populatedMarksheets,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching admin marksheets:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetAllMarksheetsAdminFunction = handleGetAllMarksheetsAdminFunction;
const handleRevokeCertificateFunction = async (req, res) => {
    try {
        const { marksheetId } = req.params;
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const marksheet = await Marksheet_model_1.default.findOneAndUpdate({ marksheetId }, { certificateStatus: "REVOKED" }, { new: true });
        if (!marksheet) {
            return res.status(404).json({
                success: false,
                message: "Marksheet not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Certificate revoked successfully",
            data: marksheet,
        });
    }
    catch (error) {
        console.error("Error revoking certificate:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleRevokeCertificateFunction = handleRevokeCertificateFunction;
const handleUpdateGamificationSettingsFunction = async (req, res) => {
    try {
        const { pointMultiplier, badgeThresholds, enableLeaderboard } = req.body;
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        // In a real implementation, you would save these to a settings collection
        // For now, we'll just return success
        res.status(200).json({
            success: true,
            message: "Gamification settings updated successfully",
            data: {
                pointMultiplier: pointMultiplier || 10,
                badgeThresholds: badgeThresholds || {
                    firstTest: 1,
                    champion: 5,
                    master: 10,
                    highAchiever: 90,
                    pointCollector: 1000,
                },
                enableLeaderboard: enableLeaderboard !== undefined ? enableLeaderboard : true,
            },
        });
    }
    catch (error) {
        console.error("Error updating gamification settings:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleUpdateGamificationSettingsFunction = handleUpdateGamificationSettingsFunction;
const handleGetUserTestHistoryAdminFunction = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.uniqueId;
        const admin = await User_model_1.default.findOne({ uniqueId: adminId });
        if (!admin || (admin.role !== "ADMIN" && admin.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const attempts = await TestAttempt_model_1.default.find({ user: userId }).sort({ createdAt: -1 });
        const attemptTestIds = attempts.map((a) => a.test).filter(Boolean);
        const attemptCourseIds = attempts.map((a) => a.course).filter(Boolean);
        const [aTests, aCourses] = await Promise.all([
            Test_model_1.default.find({ testId: { $in: attemptTestIds } }),
            Course_model_1.default.find({ courseId: { $in: attemptCourseIds } }),
        ]);
        const aTestMap = new Map(aTests.map((t) => [t.testId, t]));
        const aCourseMap = new Map(aCourses.map((c) => [c.courseId, c]));
        const populatedAttempts = attempts.map((a) => {
            const obj = a.toObject();
            const testDoc = aTestMap.get(a.test);
            const courseDoc = aCourseMap.get(a.course);
            obj.test = testDoc
                ? {
                    _id: testDoc.testId,
                    title: testDoc.title,
                    description: testDoc.description,
                }
                : null;
            obj.course = courseDoc
                ? {
                    _id: courseDoc.courseId,
                    courseName: courseDoc.courseName,
                }
                : null;
            return obj;
        });
        const marksheets = await Marksheet_model_1.default.find({ user: userId }).sort({ completionDate: -1 });
        const marksheetTestIds = marksheets.map((m) => m.test).filter(Boolean);
        const marksheetCourseIds = marksheets.map((m) => m.course).filter(Boolean);
        const [mTests2, mCourses2] = await Promise.all([
            Test_model_1.default.find({ testId: { $in: marksheetTestIds } }),
            Course_model_1.default.find({ courseId: { $in: marksheetCourseIds } }),
        ]);
        const mTestMap2 = new Map(mTests2.map((t) => [t.testId, t]));
        const mCourseMap2 = new Map(mCourses2.map((c) => [c.courseId, c]));
        const populatedMarksheets = marksheets.map((m) => {
            const obj = m.toObject();
            const testDoc = mTestMap2.get(m.test || "");
            const courseDoc = mCourseMap2.get(m.course);
            obj.test = testDoc
                ? {
                    _id: testDoc.testId,
                    title: testDoc.title,
                }
                : null;
            obj.course = courseDoc
                ? {
                    _id: courseDoc.courseId,
                    courseName: courseDoc.courseName,
                }
                : null;
            return obj;
        });
        res.status(200).json({
            success: true,
            data: {
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    userName: user.userName,
                },
                attempts: populatedAttempts,
                marksheets: populatedMarksheets,
                stats: {
                    totalAttempts: attempts.length,
                    completedAttempts: attempts.filter((a) => a.status === "COMPLETED").length,
                    totalMarksheets: marksheets.length,
                    passedTests: marksheets.filter((m) => m.passed).length,
                    totalPoints: marksheets.reduce((sum, m) => sum + m.pointsEarned, 0),
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching user test history:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetUserTestHistoryAdminFunction = handleGetUserTestHistoryAdminFunction;
const handleGetAllAttemptsAdminFunction = async (req, res) => {
    try {
        const userId = req.user?.uniqueId || req.userUniqueId;
        const { page = 1, limit = 20, status, testId, userId: filterUserId } = req.query;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const filter = {};
        if (status)
            filter.status = status;
        if (testId)
            filter.test = testId;
        if (filterUserId)
            filter.user = filterUserId;
        const attempts = await TestAttempt_model_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        // Manually populate test, course, and user details
        const attemptTestIds = attempts.map((a) => a.test).filter(Boolean);
        const attemptCourseIds = attempts.map((a) => a.course).filter(Boolean);
        const attemptUserIds = attempts.map((a) => a.user).filter(Boolean);
        const [aTests, aCourses, aUsers] = await Promise.all([
            Test_model_1.default.find({ testId: { $in: attemptTestIds } }),
            Course_model_1.default.find({ courseId: { $in: attemptCourseIds } }),
            User_model_1.default.find({ uniqueId: { $in: attemptUserIds } }),
        ]);
        const aTestMap = new Map(aTests.map((t) => [t.testId, t]));
        const aCourseMap = new Map(aCourses.map((c) => [c.courseId, c]));
        const aUserMap = new Map(aUsers.map((u) => [u.uniqueId, u]));
        const populatedAttempts = attempts.map((a) => {
            const obj = a.toObject();
            const testDoc = aTestMap.get(a.test);
            const courseDoc = aCourseMap.get(a.course);
            const userDoc = aUserMap.get(a.user);
            obj.test = testDoc
                ? {
                    _id: testDoc.testId,
                    title: testDoc.title,
                }
                : null;
            obj.course = courseDoc
                ? {
                    _id: courseDoc.courseId,
                    courseName: courseDoc.courseName,
                }
                : null;
            obj.user = userDoc
                ? {
                    firstName: userDoc.firstName,
                    lastName: userDoc.lastName,
                    email: userDoc.email,
                    userName: userDoc.userName,
                }
                : null;
            return obj;
        });
        const total = await TestAttempt_model_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            data: {
                attempts: populatedAttempts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching all attempts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetAllAttemptsAdminFunction = handleGetAllAttemptsAdminFunction;
const handleDeleteAttemptAdminFunction = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const attempt = await TestAttempt_model_1.default.findOne({ attemptId });
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: "Attempt not found",
            });
        }
        // Also delete associated marksheet if exists
        await Marksheet_model_1.default.deleteOne({ testAttempt: attemptId });
        await TestAttempt_model_1.default.deleteOne({ attemptId });
        res.status(200).json({
            success: true,
            message: "Attempt deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting attempt:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleDeleteAttemptAdminFunction = handleDeleteAttemptAdminFunction;
const handleCreateAttemptAdminFunction = async (req, res) => {
    try {
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const { targetUserId, testId, status, score, totalPoints, attemptNumber } = req.body;
        const targetUser = await User_model_1.default.findOne({ uniqueId: targetUserId });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "Target user not found",
            });
        }
        const test = await Test_model_1.default.findOne({ testId });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }
        const { nanoid } = await Promise.resolve().then(() => __importStar(require("nanoid")));
        const attemptId = nanoid();
        const finalTotalPoints = totalPoints !== undefined ? Number(totalPoints) : test.totalPoints;
        const finalScore = score !== undefined ? Number(score) : 0;
        const percentage = finalTotalPoints > 0 ? (finalScore / finalTotalPoints) * 100 : 0;
        const passed = percentage >= test.passingScore;
        const newAttempt = new TestAttempt_model_1.default({
            attemptId,
            test: testId,
            user: targetUserId,
            course: test.course,
            status: status || "COMPLETED",
            answers: [],
            score: finalScore,
            totalPoints: finalTotalPoints,
            percentage,
            passed,
            startTime: new Date(),
            endTime: new Date(),
            timeSpent: 0,
            attemptNumber: attemptNumber !== undefined ? Number(attemptNumber) : 1,
        });
        await newAttempt.save();
        res.status(201).json({
            success: true,
            message: "Test attempt created successfully",
            data: newAttempt,
        });
    }
    catch (error) {
        console.error("Error creating test attempt manually:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleCreateAttemptAdminFunction = handleCreateAttemptAdminFunction;
const handleUpdateAttemptAdminFunction = async (req, res) => {
    try {
        const userId = req.user?.uniqueId || req.userUniqueId;
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
        }
        const { attemptId } = req.params;
        const { status, score, totalPoints, attemptNumber } = req.body;
        const attempt = await TestAttempt_model_1.default.findOne({ attemptId });
        if (!attempt) {
            return res.status(404).json({
                success: false,
                message: "Attempt not found",
            });
        }
        const test = await Test_model_1.default.findOne({ testId: attempt.test });
        if (status !== undefined)
            attempt.status = status;
        if (score !== undefined)
            attempt.score = Number(score);
        if (totalPoints !== undefined)
            attempt.totalPoints = Number(totalPoints);
        if (attemptNumber !== undefined)
            attempt.attemptNumber = Number(attemptNumber);
        if (attempt.totalPoints > 0) {
            attempt.percentage = (attempt.score / attempt.totalPoints) * 100;
        }
        if (test) {
            attempt.passed = attempt.percentage >= test.passingScore;
        }
        await attempt.save();
        res.status(200).json({
            success: true,
            message: "Attempt updated successfully",
            data: attempt,
        });
    }
    catch (error) {
        console.error("Error updating test attempt:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleUpdateAttemptAdminFunction = handleUpdateAttemptAdminFunction;
