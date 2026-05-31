"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const courseEnrollmentSchema = new mongoose_1.default.Schema({
    user: { type: String, ref: 'User', required: true },
    course: { type: String, ref: 'Course', required: true },
    enrollmentDate: { type: Date, default: Date.now },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
}, { timestamps: true });
const CourseEnrollment = mongoose_1.default.models.CourseEnrollment ||
    mongoose_1.default.model('CourseEnrollment', courseEnrollmentSchema);
exports.default = CourseEnrollment;
