import mongoose, { Document, Schema } from "mongoose";

export enum AttemptStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
  TIMED_OUT = "TIMED_OUT",
}

export interface IAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number; // in seconds
}

export interface ITestAttempt extends Document {
  attemptId: string;
  test: string; // Reference to Test
  user: string; // Reference to User
  course: string; // Reference to Course
  status: AttemptStatus;
  answers: IAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  attemptNumber: number;
  ipAddress?: string;
  browserInfo?: string;
  feedback?: string;
}

const answerSchema = new Schema<IAnswer>(
  {
    questionId: { type: String, required: true },
    selectedAnswer: { type: Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsEarned: { type: Number, required: true },
    timeSpent: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const testAttemptSchema = new Schema<ITestAttempt>(
  {
    attemptId: { type: String, required: true, unique: true },
    test: { type: String, ref: "Test", required: true },
    user: { type: String, ref: "User", required: true },
    course: { type: String, ref: "Course", required: true },
    status: {
      type: String,
      enum: Object.values(AttemptStatus),
      default: AttemptStatus.IN_PROGRESS,
    },
    answers: [answerSchema],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, required: true },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    timeSpent: { type: Number, default: 0 },
    attemptNumber: { type: Number, required: true },
    ipAddress: { type: String },
    browserInfo: { type: String },
    feedback: { type: String },
  },
  { timestamps: true }
);

// Calculate percentage and passed status
testAttemptSchema.pre("save", function (next) {
  if (this.totalPoints > 0) {
    this.percentage = (this.score / this.totalPoints) * 100;
  }
  next();
});

const TestAttemptModel =
  mongoose.models.TestAttempt ||
  mongoose.model<ITestAttempt>("TestAttempt", testAttemptSchema);

export default TestAttemptModel;
