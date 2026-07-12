"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetTestForAttemptFunction = exports.handleGetTestsByInstructorFunction = exports.handleGetAllTestsFunction = exports.handleGetTestsByCourseFunction = exports.handleGetTestByIdFunction = void 0;
const Test_model_1 = __importDefault(require("../../models/Test.model"));
const TestAttempt_model_1 = __importDefault(require("../../models/TestAttempt.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const handleGetTestByIdFunction = async (req, res) => {
    try {
        const { testId } = req.params;
        const userId = req.user?.uniqueId;
        const test = await Test_model_1.default.findOne({ testId });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }
        // If user is not the creator, don't show correct answers
        let responseData = test.toObject();
        if (userId && test.createdBy !== userId) {
            const user = await User_model_1.default.findOne({ uniqueId: userId });
            if (user && user.role !== "ADMIN" && user.role !== "MASTER") {
                responseData.questions = responseData.questions.map((q) => ({
                    ...q,
                    correctAnswer: undefined,
                    explanation: undefined,
                }));
            }
        }
        res.status(200).json({
            success: true,
            data: responseData,
        });
    }
    catch (error) {
        console.error("Error fetching test:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetTestByIdFunction = handleGetTestByIdFunction;
const handleGetTestsByCourseFunction = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user?.uniqueId;
        const tests = await Test_model_1.default.find({ course: courseId }).sort({ createdAt: -1 });
        // If user is not instructor/admin, filter to show only published tests
        let filteredTests = tests;
        if (userId) {
            const user = await User_model_1.default.findOne({ uniqueId: userId });
            if (user && user.role !== "ADMIN" && user.role !== "MASTER" && user.role !== "INSTRUCTOR") {
                filteredTests = tests.filter(test => test.status === "PUBLISHED");
            }
        }
        res.status(200).json({
            success: true,
            data: filteredTests,
        });
    }
    catch (error) {
        console.error("Error fetching tests by course:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetTestsByCourseFunction = handleGetTestsByCourseFunction;
const handleGetAllTestsFunction = async (req, res) => {
    try {
        const userId = req.user?.uniqueId;
        const { status, difficulty } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (difficulty)
            filter.difficulty = difficulty;
        const tests = await Test_model_1.default.find(filter).sort({ createdAt: -1 });
        // If user is student, show only published tests
        let filteredTests = tests;
        if (userId) {
            const user = await User_model_1.default.findOne({ uniqueId: userId });
            if (user && user.role === "STUDENT") {
                filteredTests = tests.filter(test => test.status === "PUBLISHED");
            }
        }
        // Manually populate course details using courseId
        const courseIds = filteredTests.map(t => t.course).filter(Boolean);
        const courses = await Course_model_1.default.find({ courseId: { $in: courseIds } });
        const courseMap = new Map(courses.map(c => [c.courseId, c]));
        const populatedTests = filteredTests.map(t => {
            const testObj = t.toObject();
            const courseDoc = courseMap.get(t.course);
            testObj.course = courseDoc ? {
                _id: courseDoc.courseId,
                courseName: courseDoc.courseName
            } : null;
            return testObj;
        });
        res.status(200).json({
            success: true,
            data: populatedTests,
        });
    }
    catch (error) {
        console.error("Error fetching all tests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetAllTestsFunction = handleGetAllTestsFunction;
const handleGetTestsByInstructorFunction = async (req, res) => {
    try {
        const userId = req.userUniqueId;
        const tests = await Test_model_1.default.find({ createdBy: userId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: tests,
        });
    }
    catch (error) {
        console.error("Error fetching instructor tests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetTestsByInstructorFunction = handleGetTestsByInstructorFunction;
const handleGetTestForAttemptFunction = async (req, res) => {
    try {
        const { testId } = req.params;
        const userId = req.user?.uniqueId || req.userUniqueId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User ID not found",
            });
        }
        const test = await Test_model_1.default.findOne({ testId });
        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }
        if (test.status !== "PUBLISHED") {
            return res.status(400).json({
                success: false,
                message: "Test is not available for taking",
            });
        }
        // Check if user has exceeded max attempts
        const previousAttempts = await TestAttempt_model_1.default.countDocuments({
            test: testId,
            user: userId,
            status: { $in: ["COMPLETED", "TIMED_OUT"] },
        });
        if (previousAttempts >= test.maxAttempts) {
            return res.status(400).json({
                success: false,
                message: "You have exceeded the maximum number of attempts",
            });
        }
        // Shuffle questions if enabled
        let questions = test.questions;
        if (test.shuffleQuestions) {
            questions = [...test.questions].sort(() => Math.random() - 0.5);
        }
        // Remove correct answers and explanations
        const sanitizedQuestions = questions.map((q) => ({
            questionId: q._id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            points: q.points,
            order: q.order,
        }));
        res.status(200).json({
            success: true,
            data: {
                testId: test.testId,
                title: test.title,
                description: test.description,
                duration: test.duration,
                totalPoints: test.totalPoints,
                passingScore: test.passingScore,
                difficulty: test.difficulty,
                instructions: test.instructions,
                questions: sanitizedQuestions,
                attemptNumber: previousAttempts + 1,
            },
        });
    }
    catch (error) {
        console.error("Error fetching test for attempt:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetTestForAttemptFunction = handleGetTestForAttemptFunction;
