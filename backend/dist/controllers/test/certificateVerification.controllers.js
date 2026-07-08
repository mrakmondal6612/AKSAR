"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePublicVerifyCertificateFunction = exports.handleVerifyCertificateFunction = void 0;
const Marksheet_model_1 = __importDefault(require("../../models/Marksheet.model"));
const handleVerifyCertificateFunction = async (req, res) => {
    try {
        const { certificateId } = req.params;
        if (!certificateId) {
            return res.status(400).json({
                success: false,
                message: "Certificate ID is required",
            });
        }
        const marksheet = await Marksheet_model_1.default.findOne({ marksheetId: certificateId })
            .populate("user", "firstName lastName userName")
            .populate("test", "title description difficulty")
            .populate("course", "courseName");
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
                    name: `${marksheet.user.firstName} ${marksheet.user.lastName}`,
                    userName: marksheet.user.userName,
                },
                test: {
                    title: marksheet.test.title,
                    description: marksheet.test.description,
                    difficulty: marksheet.test.difficulty,
                },
                course: {
                    name: marksheet.course.courseName,
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
    }
    catch (error) {
        console.error("Error verifying certificate:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleVerifyCertificateFunction = handleVerifyCertificateFunction;
const handlePublicVerifyCertificateFunction = async (req, res) => {
    try {
        const { certificateId } = req.body;
        if (!certificateId) {
            return res.status(400).json({
                success: false,
                message: "Certificate ID is required",
            });
        }
        const marksheet = await Marksheet_model_1.default.findOne({ marksheetId: certificateId })
            .populate("user", "firstName lastName")
            .populate("test", "title")
            .populate("course", "courseName");
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
                studentName: `${marksheet.user.firstName} ${marksheet.user.lastName}`,
                testName: marksheet.test.title,
                courseName: marksheet.course.courseName,
                grade: marksheet.grade,
                percentage: marksheet.percentage,
                completionDate: marksheet.completionDate,
                certificateId: marksheet.marksheetId,
            },
        });
    }
    catch (error) {
        console.error("Error in public certificate verification:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handlePublicVerifyCertificateFunction = handlePublicVerifyCertificateFunction;
