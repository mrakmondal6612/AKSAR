import { Response, Request } from "express";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";

export const handleGetUserMarksheetsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;
    const { courseId } = req.query;

    const filter: any = { user: userId };
    if (courseId) filter.course = courseId;

    const marksheets = await Marksheet.find(filter)
      .sort({ completionDate: -1 })
      .populate("test", "title description difficulty")
      .populate("course", "courseName thumbnail");

    res.status(200).json({
      success: true,
      data: marksheets,
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
    const userId = (req as any).user?.uniqueId;

    const marksheet = await Marksheet.findOne({ marksheetId })
      .populate("test")
      .populate("course")
      .populate("testAttempt")
      .populate("user", "firstName lastName email profileImageUrl");

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

    res.status(200).json({
      success: true,
      data: marksheet,
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
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const marksheet = await Marksheet.findOne({ marksheetId });
    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Marksheet not found",
      });
    }

    if (marksheet.user !== userId) {
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
      .limit(Number(limit))
      .populate("user", "firstName lastName userName profileImageUrl")
      .populate("test", "title")
      .populate("course", "courseName");

    res.status(200).json({
      success: true,
      data: leaderboard,
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
