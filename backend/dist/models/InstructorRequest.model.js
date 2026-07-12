"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const instructorRequestSchema = new mongoose_1.default.Schema({
    requestId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    profileImageUrl: { type: String },
    reason: { type: String },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: String },
    rejectionReason: { type: String },
}, { timestamps: true });
const InstructorRequest = mongoose_1.default.models.InstructorRequest ||
    mongoose_1.default.model("InstructorRequest", instructorRequestSchema);
exports.default = InstructorRequest;
