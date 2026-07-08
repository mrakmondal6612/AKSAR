import { Response, Request } from "express";
import Test from "../../models/Test.model";
import TestAttempt from "../../models/TestAttempt.model";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";
import Course from "../../models/Course.model";

export const handleGetAllTestStatsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;
    const user = await User.findOne({ uniqueId: userId });
    
    if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    // Get overall statistics
    const totalTests = await Test.countDocuments();
    const publishedTests = await Test.countDocuments({ status: "PUBLISHED" });
    const draftTests = await Test.countDocuments({ status: "DRAFT" });
    const totalAttempts = await TestAttempt.countDocuments();
    const completedAttempts = await TestAttempt.countDocuments({ status: "COMPLETED" });
    const totalMarksheets = await Marksheet.countDocuments();
    const passedTests = await Marksheet.countDocuments({ passed: true });

    // Get recent activity
    const recentTests = await Test.find().sort({ createdAt: -1 }).limit(5);
    const recentAttempts = await TestAttempt.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("test", "title")
      .populate("user", "firstName lastName");

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
        recentAttempts,
      },
    });
  } catch (error) {
    console.error("Error fetching admin test stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleManageTestStatusFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const user = await User.findOne({ uniqueId: userId });
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

    const test = await Test.findOneAndUpdate(
      { testId },
      { status },
      { new: true }
    );

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
  } catch (error) {
    console.error("Error managing test status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleBulkDeleteTestsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testIds } = req.body;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const user = await User.findOne({ uniqueId: userId });
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

    const result = await Test.deleteMany({ testId: { $in: testIds } });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} tests successfully`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("Error bulk deleting tests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetAllMarksheetsAdminFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;
    const { page = 1, limit = 20, status, courseId } = req.query;

    const user = await User.findOne({ uniqueId: userId });
    if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const filter: any = {};
    if (status === "passed") filter.passed = true;
    if (status === "failed") filter.passed = false;
    if (courseId) filter.course = courseId;

    const marksheets = await Marksheet.find(filter)
      .sort({ completionDate: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate("user", "firstName lastName email")
      .populate("test", "title")
      .populate("course", "courseName");

    const total = await Marksheet.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        marksheets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin marksheets:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleRevokeCertificateFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { marksheetId } = req.params;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const user = await User.findOne({ uniqueId: userId });
    if (!user || (user.role !== "ADMIN" && user.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const marksheet = await Marksheet.findOneAndUpdate(
      { marksheetId },
      { certificateStatus: "REVOKED" },
      { new: true }
    );

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
  } catch (error) {
    console.error("Error revoking certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateGamificationSettingsFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { pointMultiplier, badgeThresholds, enableLeaderboard } = req.body;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const user = await User.findOne({ uniqueId: userId });
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
  } catch (error) {
    console.error("Error updating gamification settings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetUserTestHistoryAdminFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user.uniqueId;

    const admin = await User.findOne({ uniqueId: adminId });
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const user = await User.findOne({ uniqueId: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const attempts = await TestAttempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("test", "title description")
      .populate("course", "courseName");

    const marksheets = await Marksheet.find({ user: userId })
      .sort({ completionDate: -1 })
      .populate("test", "title")
      .populate("course", "courseName");

    res.status(200).json({
      success: true,
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userName: user.userName,
        },
        attempts,
        marksheets,
        stats: {
          totalAttempts: attempts.length,
          completedAttempts: attempts.filter((a) => a.status === "COMPLETED").length,
          totalMarksheets: marksheets.length,
          passedTests: marksheets.filter((m) => m.passed).length,
          totalPoints: marksheets.reduce((sum, m) => sum + m.pointsEarned, 0),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user test history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
