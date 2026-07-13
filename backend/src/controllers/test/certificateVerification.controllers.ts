import { Response, Request } from "express";
import Marksheet from "../../models/Marksheet.model";
import User from "../../models/User.model";
import Test from "../../models/Test.model";
import Course from "../../models/Course.model";

const findMarksheetByIdOrNo = async (input: string) => {
  const cleanInput = input.trim();

  // 1. Try exact match
  let marksheet = await Marksheet.findOne({ marksheetId: cleanInput });

  // 2. Try case-insensitive exact match
  if (!marksheet) {
    marksheet = await Marksheet.findOne({ marksheetId: { $regex: new RegExp("^" + cleanInput.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i") } });
  }

  // 3. Try parsing AKSAR-YYYY-SUFFIX or CERT-TIMESTAMP-SUFFIX format
  if (!marksheet) {
    const upperInput = cleanInput.toUpperCase();
    const knownPrefixes = ["AKSAR-", "CERT-"];
    for (const prefix of knownPrefixes) {
      if (upperInput.startsWith(prefix)) {
        const parts = cleanInput.split("-");
        if (parts.length >= 3) {
          const suffix = parts.slice(2).join("-");
          const escapedSuffix = suffix.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          marksheet = await Marksheet.findOne({ marksheetId: { $regex: new RegExp(escapedSuffix + "$", "i") } });
          if (marksheet) break;
        }
      }
    }
  }

  // 4. Try suffix match if input is at least 6 characters
  if (!marksheet && cleanInput.length >= 6) {
    const escapedSuffix = cleanInput.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    marksheet = await Marksheet.findOne({ marksheetId: { $regex: new RegExp(escapedSuffix + "$", "i") } });
  }

  if (!marksheet) return null;

  // Manually populate user, test, course
  // user field may contain uniqueId (from test submissions) OR MongoDB _id (from admin-created certs)
  const [userDoc, testDoc, courseDoc] = await Promise.all([
    marksheet.user
        ? User.findOne({ uniqueId: marksheet.user }).then(u => u || User.findById(marksheet.user).catch(() => null))
        : null,
    marksheet.test ? Test.findOne({ testId: marksheet.test }) : null,
    Course.findOne({ courseId: marksheet.course }),
  ]);

  const marksheetObj = marksheet.toObject();

  marksheetObj.user = userDoc ? {
    firstName: userDoc.firstName,
    lastName: userDoc.lastName,
    userName: userDoc.userName,
  } : null;

  marksheetObj.test = testDoc ? {
    _id: testDoc.testId,
    title: testDoc.title,
    description: testDoc.description,
    difficulty: testDoc.difficulty,
  } : null;

  marksheetObj.course = courseDoc ? {
    _id: courseDoc.courseId,
    courseName: courseDoc.courseName,
  } : null;

  return marksheetObj as any;
};

export const handleVerifyCertificateFunction = async (
    req: Request,
    res: Response
) => {
  try {
    const { certificateId } = req.params;

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: "Certificate ID is required",
      });
    }

    const marksheet = await findMarksheetByIdOrNo(certificateId);

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
        verified: false,
      });
    }

    // Check if certificate is revoked
    if (marksheet.certificateStatus === "REVOKED") {
      return res.status(200).json({
        success: true,
        verified: false,
        message: "Certificate has been revoked",
        data: {
          certificateId: marksheet.marksheetId,
          status: "REVOKED",
          revokedDate: marksheet.updatedAt,
        },
      });
    }

    // Check if certificate is only for passed tests
    if (!marksheet.passed) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: "Certificate is only issued for passed tests",
        data: {
          certificateId: marksheet.marksheetId,
          status: "FAILED",
          percentage: marksheet.percentage,
          grade: marksheet.grade,
        },
      });
    }

    res.status(200).json({
      success: true,
      verified: true,
      message: "Certificate verified successfully",
      data: {
        certificateId: marksheet.marksheetId,
        student: {
          name: marksheet.user
              ? `${marksheet.user.firstName} ${marksheet.user.lastName}`
              : "Unknown",
          userName: marksheet.user?.userName || "",
        },
        test: marksheet.test ? {
          title: marksheet.test.title,
          description: marksheet.test.description,
          difficulty: marksheet.test.difficulty,
        } : undefined,
        course: {
          name: marksheet.course?.courseName || "Unknown Course",
        },
        performance: {
          score: marksheet.score,
          totalPoints: marksheet.totalPoints,
          percentage: marksheet.percentage,
          grade: marksheet.grade,
          passed: marksheet.passed,
          rank: marksheet.rank,
          percentile: marksheet.percentile,
        },
        completion: {
          date: marksheet.completionDate,
          issuedDate: marksheet.issuedDate,
        },
        certificate: {
          status: marksheet.certificateStatus,
          pointsEarned: marksheet.pointsEarned,
          skillsDemonstrated: marksheet.skillsDemonstrated,
        },
      },
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handlePublicVerifyCertificateFunction = async (
    req: Request,
    res: Response
) => {
  try {
    const { certificateId } = req.body;

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: "Certificate ID is required",
      });
    }

    const marksheet = await findMarksheetByIdOrNo(certificateId);

    if (!marksheet) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
        verified: false,
      });
    }

    if (marksheet.certificateStatus === "REVOKED") {
      return res.status(200).json({
        success: true,
        verified: false,
        message: "This certificate has been revoked",
        data: {
          status: "REVOKED",
        },
      });
    }

    if (!marksheet.passed) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: "Certificate not issued (test not passed)",
        data: {
          status: "NOT_PASSED",
        },
      });
    }

    // Return limited information for public verification
    res.status(200).json({
      success: true,
      verified: true,
      message: "Certificate is valid",
      data: {
        studentName: marksheet.user
            ? `${marksheet.user.firstName} ${marksheet.user.lastName}`
            : "Unknown",
        testName: marksheet.test?.title || "N/A",
        courseName: marksheet.course?.courseName || "Unknown Course",
        grade: marksheet.grade,
        percentage: marksheet.percentage,
        completionDate: marksheet.completionDate,
        certificateId: marksheet.marksheetId,
      },
    });
  } catch (error) {
    console.error("Error in public certificate verification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};