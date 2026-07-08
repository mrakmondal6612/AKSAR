import { Response, Request } from "express";
import Test from "../../models/Test.model";
import TestAttempt from "../../models/TestAttempt.model";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";

export const handleGetTestByIdFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId } = req.params;
    const userId = (req as any).user?.uniqueId;

    const test = await Test.findOne({ testId });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // If user is not the creator, don't show correct answers
    let responseData = test.toObject();
    if (userId && test.createdBy !== userId) {
      const user = await User.findOne({ uniqueId: userId });
      if (user && user.role !== "ADMIN" && user.role !== "MASTER") {
        responseData.questions = responseData.questions.map((q: any) => ({
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
  } catch (error) {
    console.error("Error fetching test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetTestsByCourseFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { courseId } = req.params;
    const userId = (req as any).user?.uniqueId;

    const tests = await Test.find({ course: courseId }).sort({ createdAt: -1 });

    // If user is not instructor/admin, filter to show only published tests
    let filteredTests = tests;
    if (userId) {
      const user = await User.findOne({ uniqueId: userId });
      if (user && user.role !== "ADMIN" && user.role !== "MASTER" && user.role !== "INSTRUCTOR") {
        filteredTests = tests.filter(test => test.status === "PUBLISHED");
      }
    }

    res.status(200).json({
      success: true,
      data: filteredTests,
    });
  } catch (error) {
    console.error("Error fetching tests by course:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetAllTestsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.uniqueId;
    const { status, difficulty } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;

    const tests = await Test.find(filter).sort({ createdAt: -1 });

    // If user is student, show only published tests
    let filteredTests = tests;
    if (userId) {
      const user = await User.findOne({ uniqueId: userId });
      if (user && user.role === "STUDENT") {
        filteredTests = tests.filter(test => test.status === "PUBLISHED");
      }
    }

    res.status(200).json({
      success: true,
      data: filteredTests,
    });
  } catch (error) {
    console.error("Error fetching all tests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetTestsByInstructorFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userUniqueId;

    const tests = await Test.find({ createdBy: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching instructor tests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetTestForAttemptFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId } = req.params;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found",
      });
    }

    const test = await Test.findOne({ testId });
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
    const previousAttempts = await TestAttempt.countDocuments({
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
    const sanitizedQuestions = questions.map((q: any) => ({
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
  } catch (error) {
    console.error("Error fetching test for attempt:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
