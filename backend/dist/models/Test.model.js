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
exports.TestDifficulty = exports.TestStatus = exports.QuestionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var QuestionType;
(function (QuestionType) {
    QuestionType["MCQ"] = "MCQ";
    QuestionType["SAQ"] = "SAQ";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var TestStatus;
(function (TestStatus) {
    TestStatus["DRAFT"] = "DRAFT";
    TestStatus["PUBLISHED"] = "PUBLISHED";
    TestStatus["ARCHIVED"] = "ARCHIVED";
})(TestStatus || (exports.TestStatus = TestStatus = {}));
var TestDifficulty;
(function (TestDifficulty) {
    TestDifficulty["BEGINNER"] = "BEGINNER";
    TestDifficulty["INTERMEDIATE"] = "INTERMEDIATE";
    TestDifficulty["ADVANCED"] = "ADVANCED";
})(TestDifficulty || (exports.TestDifficulty = TestDifficulty = {}));
const questionSchema = new mongoose_1.Schema({
    questionId: { type: String },
    questionText: { type: String, required: true },
    questionType: {
        type: String,
        enum: Object.values(QuestionType),
        required: true,
    },
    options: [{ type: String }],
    correctAnswer: { type: mongoose_1.Schema.Types.Mixed, required: true },
    explanation: { type: String },
    points: { type: Number, required: true, default: 1 },
    order: { type: Number, required: true },
}, { _id: true });
const testSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// Calculate totalPoints based on questions
testSchema.pre("save", function (next) {
    if (this.questions && this.questions.length > 0) {
        this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
    }
    next();
});
const TestModel = mongoose_1.default.models.Test || mongoose_1.default.model("Test", testSchema);
exports.default = TestModel;
