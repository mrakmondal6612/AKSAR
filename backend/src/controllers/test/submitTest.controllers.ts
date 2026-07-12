import { Response, Request } from "express";
import Test from "../../models/Test.model";
import TestAttempt from "../../models/TestAttempt.model";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";
import { nanoid } from "nanoid";

export const handleStartTestAttemptFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId } = req.params;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;
    const { ipAddress, browserInfo } = req.body;

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

    // Check if user has an active attempt
    const activeAttempt = await TestAttempt.findOne({
      test: testId,
      user: userId,
      status: "IN_PROGRESS",
    });

    if (activeAttempt) {
      return res.status(400).json({
        success: false,
        message: "You already have an active attempt for this test",
        data: activeAttempt,
      });
    }

    // Check max attempts
    const completedAttempts = await TestAttempt.countDocuments({
      test: testId,
      user: userId,
      status: { $in: ["COMPLETED", "TIMED_OUT"] },
    });

    if (completedAttempts >= test.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: "You have exceeded the maximum number of attempts",
      });
    }

    const attemptId = nanoid();
    const attemptNumber = completedAttempts + 1;

    const newAttempt = new TestAttempt({
      attemptId,
      test: testId,
      user: userId,
      course: test.course,
      status: "IN_PROGRESS",
      answers: [],
      score: 0,
      totalPoints: test.totalPoints,
      percentage: 0,
      passed: false,
      startTime: new Date(),
      timeSpent: 0,
      attemptNumber,
      ipAddress,
      browserInfo,
    });

    await newAttempt.save();

    res.status(201).json({
      success: true,
      message: "Test attempt started",
      data: newAttempt,
    });
  } catch (error) {
    console.error("Error starting test attempt:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleSubmitTestAttemptFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const attempt = await TestAttempt.findOne({ attemptId });
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found",
      });
    }

    if (attempt.user !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to submit this attempt",
      });
    }

    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({
        success: false,
        message: "This attempt has already been submitted",
      });
    }

    const test = await Test.findOne({ testId: attempt.test });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Calculate score
    let totalScore = 0;
    const processedAnswers = answers.map((answer: any) => {
      const question = test.questions.find(
        (q: any) => q._id.toString() === answer.questionId || q.questionId === answer.questionId
      );

      if (!question) {
        return {
          ...answer,
          isCorrect: false,
          pointsEarned: 0,
        };
      }

      let isCorrect = false;
      if (question.questionType === "MCQ") {
        // Handle both single and multiple correct answers
        if (Array.isArray(question.correctAnswer)) {
          isCorrect =
            Array.isArray(answer.selectedAnswer) &&
            answer.selectedAnswer.sort().toString() ===
              question.correctAnswer.sort().toString();
        } else {
          isCorrect = answer.selectedAnswer === question.correctAnswer;
        }
      } else if (question.questionType === "SAQ") {
        // Case-insensitive comparison for SAQ
        isCorrect =
          answer.selectedAnswer.toString().toLowerCase().trim() ===
          question.correctAnswer.toString().toLowerCase().trim();
      }

      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        pointsEarned,
        timeSpent: answer.timeSpent || 0,
      };
    });

    // Calculate total time spent
    const endTime = new Date();
    const timeSpent = Math.floor(
      (endTime.getTime() - attempt.startTime.getTime()) / 1000
    );

    // Update attempt
    attempt.answers = processedAnswers;
    attempt.score = totalScore;
    attempt.totalPoints = test.totalPoints;
    attempt.percentage = (totalScore / test.totalPoints) * 100;
    attempt.passed = attempt.percentage >= test.passingScore;
    attempt.status = "COMPLETED";
    attempt.endTime = endTime;
    attempt.timeSpent = timeSpent;

    await attempt.save();

    // Generate marksheet
    const marksheetId = nanoid();
    const grade = getGrade(attempt.percentage);

    // Calculate rank and percentile
    const allAttempts = await TestAttempt.find({
      test: attempt.test,
      status: "COMPLETED",
    }).sort({ percentage: -1 });

    const rank = allAttempts.findIndex(
      (a) => a.attemptId === attemptId
    ) + 1;
    const percentile = (1 - (rank - 1) / allAttempts.length) * 100;

    const newMarksheet = new Marksheet({
      marksheetId,
      user: userId,
      test: attempt.test,
      course: test.course,
      testAttempt: attemptId,
      score: totalScore,
      totalPoints: test.totalPoints,
      percentage: attempt.percentage,
      passed: attempt.passed,
      grade,
      rank,
      percentile,
      completionDate: endTime,
      pointsEarned: attempt.passed ? Math.round(totalScore * 10) : 0,
      skillsDemonstrated: test.tags,
    });

    await newMarksheet.save();

    // Update user's bookmarks to include this test
    await User.findOneAndUpdate(
      { uniqueId: userId },
      {
        $push: { "bookmarks.test": test.testId },
      }
    );

    res.status(200).json({
      success: true,
      message: "Test submitted successfully",
      data: {
        attempt,
        marksheet: newMarksheet,
      },
    });
  } catch (error) {
    console.error("Error submitting test attempt:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetTestAttemptFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { attemptId } = req.params;
    const userId = (req as any).user?.uniqueId;

    const attempt = await TestAttempt.findOne({ attemptId });
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found",
      });
    }

    // If user is not the attempt owner, don't show answers
    let responseData = attempt.toObject();
    if (userId && attempt.user !== userId) {
      const user = await User.findOne({ uniqueId: userId });
      if (user && user.role !== "ADMIN" && user.role !== "MASTER") {
        responseData.answers = responseData.answers.map((a: any) => ({
          ...a,
          selectedAnswer: undefined,
        }));
      }
    }

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching test attempt:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetUserAttemptsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;
    const { testId } = req.query;

    const filter: any = { user: userId };
    if (testId) filter.test = testId;

    const attempts = await TestAttempt.find(filter).sort({ createdAt: -1 });

    // Manually populate test details using testId string matching
    const testIds = attempts.map(a => a.test).filter(Boolean);
    const tests = await Test.find({ testId: { $in: testIds } });
    const testMap = new Map(tests.map(t => [t.testId, t]));

    const populatedAttempts = attempts.map(a => {
      const attemptObj = a.toObject();
      const testDoc = testMap.get(a.test);
      attemptObj.test = testDoc ? {
        _id: testDoc.testId,
        title: testDoc.title,
        description: testDoc.description
      } : null;
      return attemptObj;
    });

    res.status(200).json({
      success: true,
      data: populatedAttempts,
    });
  } catch (error) {
    console.error("Error fetching user attempts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

function getGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}
