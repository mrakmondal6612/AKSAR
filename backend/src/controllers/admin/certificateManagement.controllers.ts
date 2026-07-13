import { Response, Request } from "express";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";
import Test from "../../models/Test.model";
import Course from "../../models/Course.model";
import TestAttempt from "../../models/TestAttempt.model";
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

    const certificates = await Marksheet.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await Marksheet.countDocuments(query);

    // Manually populate related fields
    const userIds = certificates.map((c) => c.user).filter(Boolean);
    const testIds = certificates.map((c) => c.test).filter(Boolean);
    const courseIds = certificates.map((c) => c.course).filter(Boolean);

    const [usersByUniqueId, usersByMongoId, tests, courses] = await Promise.all([
      User.find({ uniqueId: { $in: userIds } }),
      User.find({ _id: { $in: userIds.filter(id => /^[a-f\d]{24}$/i.test(id)) } }),
      Test.find({ testId: { $in: testIds } }),
      Course.find({ courseId: { $in: courseIds } }),
    ]);

    const users = [...usersByUniqueId, ...usersByMongoId];
    // Build map keyed by both uniqueId and _id for flexible lookup
    const userMap = new Map<string, typeof users[0]>();
    users.forEach(u => {
      userMap.set(u._id.toString(), u);
      if (u.uniqueId) userMap.set(u.uniqueId, u);
    });
    const testMap = new Map(tests.map((t) => [t.testId, t]));
    const courseMap = new Map(courses.map((c) => [c.courseId, c]));

    const populatedCertificates = certificates.map((cert) => {
      const obj = cert.toObject();
      const userDoc = userMap.get(cert.user?.toString() || "");
      const testDoc = testMap.get(cert.test || "");
      const courseDoc = courseMap.get(cert.course);

      obj.user = userDoc
          ? {
            _id: userDoc._id.toString(),
            firstName: userDoc.firstName,
            lastName: userDoc.lastName,
            email: userDoc.email,
            userName: userDoc.userName,
          }
          : null;

      obj.test = testDoc
          ? {
            _id: testDoc._id.toString(),
            title: testDoc.title,
            difficulty: testDoc.difficulty,
          }
          : null;

      obj.course = courseDoc
          ? {
            _id: courseDoc._id.toString(),
            courseName: courseDoc.courseName,
          }
          : null;

      return obj;
    });

    res.status(200).json({
      success: true,
      data: populatedCertificates,
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

    const marksheet = await Marksheet.findOne({ marksheetId });

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Manually populate related fields
    // user field may be uniqueId (from test submissions) OR MongoDB _id (legacy admin certs)
    const [userDoc, testDoc, courseDoc, attemptDoc] = await Promise.all([
      marksheet.user
          ? User.findOne({ uniqueId: marksheet.user }).then(u => u || User.findById(marksheet.user).catch(() => null))
          : null,
      marksheet.test ? Test.findOne({ testId: marksheet.test }) : null,
      marksheet.course ? Course.findOne({ courseId: marksheet.course }) : null,
      marksheet.testAttempt ? TestAttempt.findOne({ attemptId: marksheet.testAttempt }) : null,
    ]);

    const marksheetObj = marksheet.toObject();

    marksheetObj.user = userDoc
        ? {
          _id: userDoc._id.toString(),
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          email: userDoc.email,
          userName: userDoc.userName,
        }
        : null;

    marksheetObj.test = testDoc
        ? {
          _id: testDoc._id.toString(),
          title: testDoc.title,
          description: testDoc.description,
          difficulty: testDoc.difficulty,
        }
        : null;

    marksheetObj.course = courseDoc
        ? {
          _id: courseDoc._id.toString(),
          courseName: courseDoc.courseName,
        }
        : null;

    marksheetObj.testAttempt = attemptDoc ? attemptDoc.toObject() : null;

    res.status(200).json({
      success: true,
      data: marksheetObj,
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

    // Dropdown sends MongoDB _id for user — look up by _id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Dropdown sends MongoDB _id for test — look up by _id
    let resolvedTestId: string | undefined;
    if (testId) {
      const test = await Test.findById(testId);
      if (!test) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        });
      }
      resolvedTestId = test.testId; // store the custom testId string
    }

    // Dropdown sends MongoDB _id for course — look up by _id to get custom courseId
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Generate unique marksheet ID
    const marksheetId = `AKSAR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Create new marksheet/certificate
    // Store uniqueId for user and custom string IDs for course/test
    // (consistent with how test submissions store references)
    const marksheetData: any = {
      marksheetId,
      user: user.uniqueId || user._id.toString(),
      course: course.courseId,  // store custom courseId string
      certificateType,
      score: score || 0,
      totalPoints: score || 0,
      percentage: score || 0,
      grade: grade || "N/A",
      passed: true,
      skillsDemonstrated: skillsDemonstrated || [],
      certificateStatus: CertificateStatus.GENERATED,
      issuedDate: new Date(),
      completionDate: new Date(),
    };

    if (resolvedTestId) {
      marksheetData.test = resolvedTestId;
    }

    const marksheet = await Marksheet.create(marksheetData);

    // Manually populate since fields are custom string IDs, not ObjectId refs
    const marksheetObj = marksheet.toObject() as any;
    marksheetObj.user = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userName: user.userName,
    };
    marksheetObj.course = {
      _id: course._id.toString(),
      courseName: course.courseName,
    };

    res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      data: marksheetObj,
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

    const marksheet = await Marksheet.findOne({ marksheetId });

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

    // Manually populate since user/course/test are stored as custom string IDs
    const [userDoc, testDoc, courseDoc] = await Promise.all([
      marksheet.user
          ? User.findOne({ uniqueId: marksheet.user }).then(u => u || User.findById(marksheet.user).catch(() => null))
          : null,
      marksheet.test ? Test.findOne({ testId: marksheet.test }) : null,
      marksheet.course ? Course.findOne({ courseId: marksheet.course }) : null,
    ]);

    const marksheetObj = marksheet.toObject() as any;
    marksheetObj.user = userDoc
        ? { _id: userDoc._id.toString(), firstName: userDoc.firstName, lastName: userDoc.lastName, email: userDoc.email, userName: userDoc.userName }
        : null;
    marksheetObj.test = testDoc
        ? { _id: testDoc._id.toString(), title: testDoc.title, difficulty: testDoc.difficulty }
        : null;
    marksheetObj.course = courseDoc
        ? { _id: courseDoc._id.toString(), courseName: courseDoc.courseName }
        : null;

    res.status(200).json({
      success: true,
      message: "Certificate marked as downloaded",
      data: marksheetObj,
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