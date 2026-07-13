import { Response, Request } from "express";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";
import Course from "../../models/Course.model";
import Test from "../../models/Test.model";
import TestAttempt from "../../models/TestAttempt.model";

export const handleGetUserMarksheetsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userUniqueId || (req as any).user?.uniqueId;
    const mongoUserId = (req as any).userId; // MongoDB _id
    const { courseId } = req.query;

    console.log("Fetching marksheets for userId:", userId, "mongoUserId:", mongoUserId);

    // Admin-created certificates may store user.uniqueId OR user._id.toString()
    // So we must query for both to ensure all certificates are shown
    const userValues = [userId, mongoUserId].filter(Boolean);
    const filter: any = { user: { $in: userValues } };
    if (courseId) filter.course = courseId;

    const marksheets = await Marksheet.find(filter).sort({ completionDate: -1 });
    console.log(`[Marksheet] Found ${marksheets.length} marksheets for user: ${userId}`);

    // Manually populate test & course details by matching custom string IDs
    const testIds = marksheets.map((m) => m.test).filter(Boolean);
    const courseIds = marksheets.map((m) => m.course).filter(Boolean);

    const [tests, courses] = await Promise.all([
      Test.find({ testId: { $in: testIds } }),
      Course.find({ courseId: { $in: courseIds } }),
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
  } catch (error) {
    console.error("Error fetching marksheets:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetMarksheetByIdFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { marksheetId } = req.params;
    const userId = (req as any).userUniqueId || (req as any).user?.uniqueId;

    const marksheet = await Marksheet.findOne({ marksheetId });

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Marksheet not found",
      });
    }

    // Verify ownership
    if (userId && marksheet.user.toString() !== userId) {
      const user = await User.findOne({ uniqueId: userId });
      if (user && user.role !== "ADMIN" && user.role !== "MASTER") {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this marksheet",
        });
      }
    }

    // Manually query and populate: test, course, testAttempt, user
    const [testDoc, courseDoc, attemptDoc, userDoc] = await Promise.all([
      marksheet.test ? Test.findOne({ testId: marksheet.test }) : null,
      marksheet.course ? Course.findOne({ courseId: marksheet.course }) : null,
      marksheet.testAttempt ? TestAttempt.findOne({ attemptId: marksheet.testAttempt }) : null,
      User.findOne({ uniqueId: marksheet.user }),
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
  } catch (error) {
    console.error("Error fetching marksheet:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleDownloadCertificateFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { marksheetId } = req.params;
    const userId = (req as any).userUniqueId || (req as any).user?.uniqueId;
    const mongoUserId = (req as any).userId; // MongoDB _id

    const marksheet = await Marksheet.findOne({ marksheetId });
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
  } catch (error) {
    console.error("Error downloading certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetLeaderboardFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId, courseId, limit = 10 } = req.query;

    const filter: any = { passed: true };
    if (testId) filter.test = testId;
    if (courseId) filter.course = courseId;

    const leaderboard = await Marksheet.find(filter)
      .sort({ percentage: -1, completionDate: 1 })
      .limit(Number(limit));

    // Manually populate leaderboard entry fields
    const userIds = leaderboard.map((l) => l.user).filter(Boolean);
    const testIds = leaderboard.map((l) => l.test).filter(Boolean);
    const courseIds = leaderboard.map((l) => l.course).filter(Boolean);

    const [users, tests, courses] = await Promise.all([
      User.find({ uniqueId: { $in: userIds } }),
      Test.find({ testId: { $in: testIds } }),
      Course.find({ courseId: { $in: courseIds } }),
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
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetUserStatsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const marksheets = await Marksheet.find({ user: userId });

    const totalTests = marksheets.length;
    const passedTests = marksheets.filter((m) => m.passed).length;
    const totalPoints = marksheets.reduce((sum, m) => sum + m.pointsEarned, 0);
    const averagePercentage =
      totalTests > 0
        ? marksheets.reduce((sum, m) => sum + m.percentage, 0) / totalTests
        : 0;

    // Get badges based on achievements
    const badges = [];
    if (passedTests >= 1) badges.push("First Test Passed");
    if (passedTests >= 5) badges.push("Test Champion");
    if (passedTests >= 10) badges.push("Test Master");
    if (averagePercentage >= 90) badges.push("High Achiever");
    if (totalPoints >= 1000) badges.push("Point Collector");

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
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
