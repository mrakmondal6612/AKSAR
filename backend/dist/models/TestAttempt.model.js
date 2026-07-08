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
exports.AttemptStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var AttemptStatus;
(function (AttemptStatus) {
    AttemptStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AttemptStatus["COMPLETED"] = "COMPLETED";
    AttemptStatus["ABANDONED"] = "ABANDONED";
    AttemptStatus["TIMED_OUT"] = "TIMED_OUT";
})(AttemptStatus || (exports.AttemptStatus = AttemptStatus = {}));
const answerSchema = new mongoose_1.Schema({
    questionId: { type: String, required: true },
    selectedAnswer: { type: mongoose_1.Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean, required: true },
    pointsEarned: { type: Number, required: true },
    timeSpent: { type: Number, required: true, default: 0 },
}, { _id: false });
const testAttemptSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// Calculate percentage and passed status
testAttemptSchema.pre("save", function (next) {
    if (this.totalPoints > 0) {
        this.percentage = (this.score / this.totalPoints) * 100;
    }
    next();
});
const TestAttemptModel = mongoose_1.default.models.TestAttempt ||
    mongoose_1.default.model("TestAttempt", testAttemptSchema);
exports.default = TestAttemptModel;
