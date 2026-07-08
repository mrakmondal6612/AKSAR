"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateType = exports.CertificateStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var CertificateStatus;
(function (CertificateStatus) {
    CertificateStatus["GENERATED"] = "GENERATED";
    CertificateStatus["DOWNLOADED"] = "DOWNLOADED";
    CertificateStatus["REVOKED"] = "REVOKED";
})(CertificateStatus || (exports.CertificateStatus = CertificateStatus = {}));
var CertificateType;
(function (CertificateType) {
    CertificateType["COURSE_COMPLETE"] = "COURSE_COMPLETE";
    CertificateType["TEST_RESULT"] = "TEST_RESULT";
    CertificateType["OTHERS"] = "OTHERS";
})(CertificateType || (exports.CertificateType = CertificateType = {}));
const marksheetSchema = new mongoose_1.Schema({
    marksheetId: { type: String, required: true, unique: true },
    user: { type: String, ref: "User", required: true },
    test: { type: String, ref: "Test", required: false },
    course: { type: String, ref: "Course", required: true },
    testAttempt: { type: String, ref: "TestAttempt", required: false },
    certificateType: {
        type: String,
        enum: Object.values(CertificateType),
        default: CertificateType.COURSE_COMPLETE,
        required: true,
    },
    score: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    grade: { type: String, required: true },
    rank: { type: Number },
    percentile: { type: Number },
    completionDate: { type: Date, required: true, default: Date.now },
    certificateUrl: { type: String },
    certificateStatus: {
        type: String,
        enum: Object.values(CertificateStatus),
        default: CertificateStatus.GENERATED,
    },
    certificateId: { type: String },
    issuedDate: { type: Date },
    expiryDate: { type: Date },
    badgeEarned: { type: String },
    pointsEarned: { type: Number, default: 0 },
    skillsDemonstrated: [{ type: String }],
    instructorSignature: { type: String },
    institutionName: { type: String },
}, { timestamps: true });
// Auto-generate grade based on percentage
marksheetSchema.pre("save", function (next) {
    if (!this.grade) {
        if (this.percentage >= 90)
            this.grade = "A+";
        else if (this.percentage >= 80)
            this.grade = "A";
        else if (this.percentage >= 70)
            this.grade = "B";
        else if (this.percentage >= 60)
            this.grade = "C";
        else if (this.percentage >= 50)
            this.grade = "D";
        else
            this.grade = "F";
    }
    // Auto-calculate points earned (gamification)
    if (this.pointsEarned === 0 && this.passed) {
        this.pointsEarned = Math.round(this.score * 10); // 10 points per score point
    }
    next();
});
const MarksheetModel = mongoose_1.default.models.Marksheet ||
    mongoose_1.default.model("Marksheet", marksheetSchema);
exports.default = MarksheetModel;
