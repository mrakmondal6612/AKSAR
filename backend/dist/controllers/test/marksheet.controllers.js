"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetUserStatsFunction = exports.handleGetLeaderboardFunction = exports.handleDownloadCertificateFunction = exports.handleGetMarksheetByIdFunction = exports.handleGetUserMarksheetsFunction = void 0;
const Marksheet_model_1 = __importDefault(require("../../models/Marksheet.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const Test_model_1 = __importDefault(require("../../models/Test.model"));
const TestAttempt_model_1 = __importDefault(require("../../models/TestAttempt.model"));
const handleGetUserMarksheetsFunction = async (req, res) => {
    try {
        const userId = req.userUniqueId || req.user?.uniqueId;
        const mongoUserId = req.userId; // MongoDB _id
        const { courseId } = req.query;
        console.log("Fetching marksheets for userId:", userId, "mongoUserId:", mongoUserId);
        // Admin-created certificates may store user.uniqueId OR user._id.toString()
        // So we must query for both to ensure all certificates are shown
        const userValues = [userId, mongoUserId].filter(Boolean);
        const filter = { user: { $in: userValues } };
        if (courseId)
            filter.course = courseId;
        const marksheets = await Marksheet_model_1.default.find(filter).sort({ completionDate: -1 });
        console.log(`[Marksheet] Found ${marksheets.length} marksheets for user: ${userId}`);
        // Manually populate test & course details by matching custom string IDs
        const testIds = marksheets.map((m) => m.test).filter(Boolean);
        const courseIds = marksheets.map((m) => m.course).filter(Boolean);
        const [tests, courses] = await Promise.all([
            Test_model_1.default.find({ testId: { $in: testIds } }),
            Course_model_1.default.find({ courseId: { $in: courseIds } }),
        ]);
        const testMap = new Map(tests.map((t) => [t.testId, t]));
        const courseMap = new Map(courses.map((c) => [c.courseId, c]));
        const populatedMarksheets = marksheets.map((m) => {
            const marksheetObj = m.toObject();
            const testDoc = testMap.get(m.test || "");
            const courseDoc = courseMap.get(m.course);
            marksheetObj.test = testDoc
                ? {
                    _id: testDoc.testId,
                    title: testDoc.title,
                    description: testDoc.description,
                    difficulty: testDoc.difficulty,
                }
                : null;
            marksheetObj.course = courseDoc
                ? {
                    _id: courseDoc.courseId,
                    courseName: courseDoc.courseName,
                    thumbnail: courseDoc.thumbnail,
                }
                : null;
            return marksheetObj;
        });
        res.status(200).json({
            success: true,
            data: populatedMarksheets,
        });
    }
    catch (error) {
        console.error("Error fetching marksheets:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetUserMarksheetsFunction = handleGetUserMarksheetsFunction;
const handleGetMarksheetByIdFunction = async (req, res) => {
    try {
        const { marksheetId } = req.params;
        const userId = req.userUniqueId || req.user?.uniqueId;
        const marksheet = await Marksheet_model_1.default.findOne({ marksheetId });
        if (!marksheet) {
            return res.status(404).json({
                success: false,
                message: "Marksheet not found",
            });
        }
        // Verify ownership
        if (userId && marksheet.user.toString() !== userId) {
            const user = await User_model_1.default.findOne({ uniqueId: userId });
            if (user && user.role !== "ADMIN" && user.role !== "MASTER") {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to view this marksheet",
                });
            }
        }
        // Manually query and populate: test, course, testAttempt, user
        const [testDoc, courseDoc, attemptDoc, userDoc] = await Promise.all([
            marksheet.test ? Test_model_1.default.findOne({ testId: marksheet.test }) : null,
            marksheet.course ? Course_model_1.default.findOne({ courseId: marksheet.course }) : null,
            marksheet.testAttempt ? TestAttempt_model_1.default.findOne({ attemptId: marksheet.testAttempt }) : null,
            User_model_1.default.findOne({ uniqueId: marksheet.user }),
        ]);
        const marksheetObj = marksheet.toObject();
        marksheetObj.test = testDoc ? testDoc.toObject() : null;
        marksheetObj.course = courseDoc ? courseDoc.toObject() : null;
        marksheetObj.testAttempt = attemptDoc ? attemptDoc.toObject() : null;
        marksheetObj.user = userDoc
            ? {
                firstName: userDoc.firstName,
                lastName: userDoc.lastName,
                email: userDoc.email,
                profileImageUrl: userDoc.profileImageUrl,
            }
            : null;
        res.status(200).json({
            success: true,
            data: marksheetObj,
        });
    }
    catch (error) {
        console.error("Error fetching marksheet:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetMarksheetByIdFunction = handleGetMarksheetByIdFunction;
const handleDownloadCertificateFunction = async (req, res) => {
    try {
        const { marksheetId } = req.params;
        const userId = req.userUniqueId || req.user?.uniqueId;
        const mongoUserId = req.userId; // MongoDB _id
        const marksheet = await Marksheet_model_1.default.findOne({ marksheetId });
        if (!marksheet) {
            return res.status(404).json({
                success: false,
                message: "Marksheet not found",
            });
        }
        // Allow validation against both uniqueId and MongoDB _id
        const userValues = [userId, mongoUserId].filter(Boolean);
        if (!userValues.includes(marksheet.user)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to download this certificate",
            });
        }
        if (!marksheet.passed) {
            return res.status(400).json({
                success: false,
                message: "Certificate is only available for passed tests",
            });
        }
        // Update certificate status
        marksheet.certificateStatus = "DOWNLOADED";
        await marksheet.save();
        // In a real implementation, you would generate a PDF certificate here
        // For now, return the certificate URL if it exists
        res.status(200).json({
            success: true,
            message: "Certificate download initiated",
            data: {
                certificateUrl: marksheet.certificateUrl,
                certificateId: marksheet.certificateId,
            },
        });
    }
    catch (error) {
        console.error("Error downloading certificate:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleDownloadCertificateFunction = handleDownloadCertificateFunction;
const handleGetLeaderboardFunction = async (req, res) => {
    try {
        const { testId, courseId, limit = 10 } = req.query;
        const filter = { passed: true };
        if (testId)
            filter.test = testId;
        if (courseId)
            filter.course = courseId;
        const leaderboard = await Marksheet_model_1.default.find(filter)
            .sort({ percentage: -1, completionDate: 1 })
            .limit(Number(limit));
        // Manually populate leaderboard entry fields
        const userIds = leaderboard.map((l) => l.user).filter(Boolean);
        const testIds = leaderboard.map((l) => l.test).filter(Boolean);
        const courseIds = leaderboard.map((l) => l.course).filter(Boolean);
        const [users, tests, courses] = await Promise.all([
            User_model_1.default.find({ uniqueId: { $in: userIds } }),
            Test_model_1.default.find({ testId: { $in: testIds } }),
            Course_model_1.default.find({ courseId: { $in: courseIds } }),
        ]);
        const userMap = new Map(users.map((u) => [u.uniqueId, u]));
        const testMap = new Map(tests.map((t) => [t.testId, t]));
        const courseMap = new Map(courses.map((c) => [c.courseId, c]));
        const populatedLeaderboard = leaderboard.map((l) => {
            const obj = l.toObject();
            const userDoc = userMap.get(l.user || "");
            const testDoc = testMap.get(l.test || "");
            const courseDoc = courseMap.get(l.course);
            obj.user = userDoc
                ? {
                    firstName: userDoc.firstName,
                    lastName: userDoc.lastName,
                    userName: userDoc.userName,
                    profileImageUrl: userDoc.profileImageUrl,
                }
                : {
                    firstName: "Unknown",
                    lastName: "User",
                    userName: "unknown",
                    profileImageUrl: null,
                };
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
            data: populatedLeaderboard,
        });
    }
    catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetLeaderboardFunction = handleGetLeaderboardFunction;
const handleGetUserStatsFunction = async (req, res) => {
    try {
        const userId = req.user?.uniqueId || req.userUniqueId;
        const marksheets = await Marksheet_model_1.default.find({ user: userId });
        const totalTests = marksheets.length;
        const passedTests = marksheets.filter((m) => m.passed).length;
        const totalPoints = marksheets.reduce((sum, m) => sum + m.pointsEarned, 0);
        const averagePercentage = totalTests > 0
            ? marksheets.reduce((sum, m) => sum + m.percentage, 0) / totalTests
            : 0;
        // Get badges based on achievements
        const badges = [];
        if (passedTests >= 1)
            badges.push("First Test Passed");
        if (passedTests >= 5)
            badges.push("Test Champion");
        if (passedTests >= 10)
            badges.push("Test Master");
        if (averagePercentage >= 90)
            badges.push("High Achiever");
        if (totalPoints >= 1000)
            badges.push("Point Collector");
        res.status(200).json({
            success: true,
            data: {
                totalTests,
                passedTests,
                totalPoints,
                averagePercentage: Math.round(averagePercentage),
                passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
                badges,
            },
        });
    }
    catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetUserStatsFunction = handleGetUserStatsFunction;
