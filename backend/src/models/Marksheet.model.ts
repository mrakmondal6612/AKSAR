import mongoose, { Document, Schema } from "mongoose";

export enum CertificateStatus {
  GENERATED = "GENERATED",
  DOWNLOADED = "DOWNLOADED",
  REVOKED = "REVOKED",
}

export enum CertificateType {
  COURSE_COMPLETE = "COURSE_COMPLETE",
  TEST_RESULT = "TEST_RESULT",
  OTHERS = "OTHERS",
}

export interface IMarksheet extends Document {
  marksheetId: string;
  user: string; // Reference to User
  test?: string; // Reference to Test (optional for some certificate types)
  course: string; // Reference to Course
  testAttempt?: string; // Reference to TestAttempt (optional)
  certificateType: CertificateType;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  grade: string;
  rank?: number;
  percentile?: number;
  completionDate: Date;
  certificateUrl?: string;
  certificateStatus: CertificateStatus;
  certificateId?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  badgeEarned?: string;
  pointsEarned: number;
  skillsDemonstrated?: string[];
  instructorSignature?: string;
  institutionName?: string;
}

const marksheetSchema = new Schema<IMarksheet>(
  {
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
  },
  { timestamps: true }
);

// Auto-generate grade based on percentage
marksheetSchema.pre("save", function (next) {
  if (!this.grade) {
    if (this.percentage >= 90) this.grade = "A+";
    else if (this.percentage >= 80) this.grade = "A";
    else if (this.percentage >= 70) this.grade = "B";
    else if (this.percentage >= 60) this.grade = "C";
    else if (this.percentage >= 50) this.grade = "D";
    else this.grade = "F";
  }
  
  // Auto-calculate points earned (gamification)
  if (this.pointsEarned === 0 && this.passed) {
    this.pointsEarned = Math.round(this.score * 10); // 10 points per score point
  }
  
  next();
});

const MarksheetModel =
  mongoose.models.Marksheet ||
  mongoose.model<IMarksheet>("Marksheet", marksheetSchema);

export default MarksheetModel;
