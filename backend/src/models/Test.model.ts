import mongoose, { Document, Schema } from "mongoose";

export enum QuestionType {
  MCQ = "MCQ",
  SAQ = "SAQ",
}

export enum TestStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum TestDifficulty {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export interface IQuestion extends Document {
  questionId?: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[]; // For MCQ
  correctAnswer: string | string[]; // For MCQ (index) or SAQ (text)
  explanation?: string;
  points: number;
  order: number;
}

export interface ITest extends Document {
  testId: string;
  title: string;
  description: string;
  course: string; // Reference to Course
  createdBy: string; // Reference to User (Instructor/Admin)
  questions: IQuestion[];
  duration: number; // in minutes
  totalPoints: number;
  passingScore: number; // percentage
  difficulty: TestDifficulty;
  status: TestStatus;
  instructions?: string;
  allowRetake: boolean;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    questionId: { type: String },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String },
    points: { type: Number, required: true, default: 1 },
    order: { type: Number, required: true },
  },
  { _id: true }
);

const testSchema = new Schema<ITest>(
  {
    testId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    course: { type: String, ref: "Course", required: true },
    createdBy: { type: String, ref: "User", required: true },
    questions: [questionSchema],
    duration: { type: Number, required: true }, // in minutes
    totalPoints: { type: Number, required: true },
    passingScore: { type: Number, required: true, min: 0, max: 100 }, // percentage
    difficulty: {
      type: String,
      enum: Object.values(TestDifficulty),
      required: true,
      default: TestDifficulty.INTERMEDIATE,
    },
    status: {
      type: String,
      enum: Object.values(TestStatus),
      default: TestStatus.DRAFT,
    },
    instructions: { type: String },
    allowRetake: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    shuffleQuestions: { type: Boolean, default: false },
    showResults: { type: Boolean, default: true },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Calculate totalPoints based on questions
testSchema.pre("save", function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
  }
  next();
});

const TestModel =
  mongoose.models.Test || mongoose.model<ITest>("Test", testSchema);

export default TestModel;
