"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    uniqueId: { type: String, required: true, unique: true },
    firstName: { type: String, required: [true, "Firstname is required"] },
    lastName: { type: String },
    userName: { type: String, required: [true, "Username is required"] },
    password: { type: String, required: [true, "Password is required"] },
    email: { type: String, required: [true, "Email is required"] },
    profileImageUrl: { type: String || undefined },
    role: {
        type: String,
        enum: ["ADMIN", "STUDENT", "MASTER", "INSTRUCTOR"],
        required: true,
    },
    emailVerificationOTP: { type: String },
    emailVerificationOTPExpires: { type: String },
    emailVerificationStatus: { type: Boolean, default: false },
    emailSendTime: { type: String },
    passwordResetOTP: { type: String },
    passwordResetOTPExpires: { type: String },
    passwordSendTime: { type: String },
    phoneNumber: {
        code: { type: String },
        number: { type: String },
    },
    phoneNumberVerificationStatus: { type: Boolean, default: false },
    userDob: { type: String },
    bio: {
        type: String,
        default: "Hey, I am using AKSAR",
        max: [500, "bio must be within the 500 chars"],
    },
    address: {
        country: { type: String },
        city: { type: String },
        state: { type: String },
    },
    uploadedCourses: [{ type: String, ref: "Course" }],
    enrolledIn: [{ type: String, ref: "Course" }],
    bookmarks: {
        course: [{ type: String, ref: "Course" }],
        video: [{ type: String, ref: "Video" }],
        test: [{ type: String, ref: "Test" }],
    },
    progress: [
        {
            courseId: { type: String, ref: "Course" },
            completedVideos: [{ type: String, ref: "Video" }],
            count: { type: Number },
        },
    ],
    history: [
        {
            video: { type: String, ref: "Video" },
            time: { type: String },
        },
    ],
    // Interests & onboarding
    interests: [{ type: String }],
    interestTags: [{ type: String }],
    learningGoal: { type: String },
    experienceLevel: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    bonusPoints: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
    badges: [{ type: String }],
    unlockedUpgrades: [{ type: String }],
    premiumExpiry: { type: Date },
    referredBy: { type: String, default: "" },
    referralCode: { type: String, default: "" },
}, {
    timestamps: true,
});
const User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = User;
