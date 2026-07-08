import { Response, Request } from "express";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";
import Test from "../../models/Test.model";
import Course from "../../models/Course.model";
import { CertificateStatus, CertificateType } from "../../models/Marksheet.model";

export const handleGetAllCertificates = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query: any = {};

    if (status && status !== "ALL") {
      query.certificateStatus = status;
    }

    if (search) {
      query.$or = [
        { marksheetId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [certificates, total] = await Promise.all([
      Marksheet.find(query)
        .populate("user", "firstName lastName email userName")
        .populate("test", "title difficulty")
        .populate("course", "courseName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Marksheet.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: certificates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleRevokeCertificate = async (req: Request, res: Response) => {
  try {
    const { marksheetId } = req.params;
    const { reason } = req.body;

    const marksheet = await Marksheet.findOne({ marksheetId });

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    if (marksheet.certificateStatus === CertificateStatus.REVOKED) {
      return res.status(400).json({
        success: false,
        message: "Certificate is already revoked",
      });
    }

    marksheet.certificateStatus = CertificateStatus.REVOKED;
    marksheet.expiryDate = new Date();
    await marksheet.save();

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

export const handleRestoreCertificate = async (req: Request, res: Response) => {
  try {
    const { marksheetId } = req.params;

    const marksheet = await Marksheet.findOne({ marksheetId });

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    if (marksheet.certificateStatus !== CertificateStatus.REVOKED) {
      return res.status(400).json({
        success: false,
        message: "Certificate is not revoked",
      });
    }

    marksheet.certificateStatus = CertificateStatus.GENERATED;
    marksheet.expiryDate = undefined;
    await marksheet.save();

    res.status(200).json({
      success: true,
      message: "Certificate restored successfully",
      data: marksheet,
    });
  } catch (error) {
    console.error("Error restoring certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetCertificateStats = async (req: Request, res: Response) => {
  try {
    const stats = await Marksheet.aggregate([
      {
        $group: {
          _id: "$certificateStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalCertificates = await Marksheet.countDocuments();
    const issuedThisMonth = await Marksheet.countDocuments({
      issuedDate: {
        $gte: new Date(new Date().setDate(1)),
      },
    });

    const statusMap: Record<string, number> = {
      GENERATED: 0,
      DOWNLOADED: 0,
      REVOKED: 0,
    };

    stats.forEach((stat: any) => {
      statusMap[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalCertificates,
        generated: statusMap.GENERATED,
        downloaded: statusMap.DOWNLOADED,
        revoked: statusMap.REVOKED,
        issuedThisMonth,
      },
    });
  } catch (error) {
    console.error("Error fetching certificate stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetCertificateById = async (req: Request, res: Response) => {
  try {
    const { marksheetId } = req.params;

    const marksheet = await Marksheet.findOne({ marksheetId })
      .populate("user", "firstName lastName email userName")
      .populate("test", "title description difficulty")
      .populate("course", "courseName")
      .populate("testAttempt");

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      data: marksheet,
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleCreateCertificate = async (req: Request, res: Response) => {
  try {
    const { userId, testId, courseId, certificateType, score, grade, skillsDemonstrated } = req.body;

    console.log("Certificate creation request:", { userId, testId, courseId, certificateType, score, grade, skillsDemonstrated });

    // Validate required fields
    if (!userId || !courseId || !certificateType) {
      return res.status(400).json({
        success: false,
        message: "userId, courseId, and certificateType are required",
      });
    }

    // Validate certificate type
    if (!Object.values(CertificateType).includes(certificateType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate type",
      });
    }

    // For TEST_RESULT type, testId is required
    if (certificateType === CertificateType.TEST_RESULT && !testId) {
      return res.status(400).json({
        success: false,
        message: "testId is required for TEST_RESULT certificate type",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if test exists (if provided)
    if (testId) {
      const test = await Test.findById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        });
      }
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Generate unique marksheet ID
    const marksheetId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new marksheet/certificate
    const marksheetData: any = {
      marksheetId,
      user: userId,
      course: courseId,
      certificateType,
      score: score || 0,
      totalPoints: score || 0,
      percentage: score || 0,
      grade: grade || "N/A",
      passed: true,
      skillsDemonstrated: skillsDemonstrated || [],
      certificateStatus: CertificateStatus.GENERATED,
      issuedDate: new Date(),
    };

    // Only add test if provided
    if (testId) {
      marksheetData.test = testId;
    }

    const marksheet = await Marksheet.create(marksheetData);

    // Populate the created marksheet
    const populatedMarksheet = await Marksheet.findById(marksheet._id)
      .populate("user", "firstName lastName email userName")
      .populate("test", "title difficulty")
      .populate("course", "courseName");

    res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      data: populatedMarksheet,
    });
  } catch (error) {
    console.error("Error creating certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleDeleteCertificate = async (req: Request, res: Response) => {
  try {
    const { marksheetId } = req.params;

    const marksheet = await Marksheet.findOne({ marksheetId });

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    await Marksheet.deleteOne({ marksheetId });

    res.status(200).json({
      success: true,
      message: "Certificate deleted permanently",
    });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetUsersForCertificate = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("_id firstName lastName email userName")
      .limit(50)
      .sort({ firstName: 1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetTestsForCertificate = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const tests = await Test.find(query)
      .select("_id title difficulty")
      .limit(50)
      .sort({ title: 1 });

    res.status(200).json({
      success: true,
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetCoursesForCertificate = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const query: any = { isVerified: true };

    if (search) {
      query.$or = [
        { courseName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const courses = await Course.find(query)
      .select("_id courseName")
      .limit(50)
      .sort({ courseName: 1 });

    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleDownloadCertificate = async (req: Request, res: Response) => {
  try {
    const { marksheetId } = req.params;

    const marksheet = await Marksheet.findOne({ marksheetId })
      .populate("user", "firstName lastName email userName")
      .populate("test", "title difficulty")
      .populate("course", "courseName");

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    if (marksheet.certificateStatus === "REVOKED") {
      return res.status(400).json({
        success: false,
        message: "Cannot download revoked certificate",
      });
    }

    // Update certificate status to DOWNLOADED
    marksheet.certificateStatus = CertificateStatus.DOWNLOADED;
    await marksheet.save();

    res.status(200).json({
      success: true,
      message: "Certificate marked as downloaded",
      data: marksheet,
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
