"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpdateInterestsFunction = handleUpdateInterestsFunction;
const User_model_1 = __importDefault(require("../../models/User.model"));
const getSuggestedCourses_controllers_1 = require("../course/getSuggestedCourses.controllers");
/**
 * PUT /api/v1/user/update-interests
 * Save user interests, learning goal, experience level.
 * Also marks onboardingCompleted = true.
 */
async function handleUpdateInterestsFunction(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const { interests, interestTags, learningGoal, experienceLevel } = req.body;
        const updateData = {
            onboardingCompleted: true,
        };
        if (Array.isArray(interests) && interests.length > 0) {
            updateData.interests = interests;
        }
        if (Array.isArray(interestTags) && interestTags.length > 0) {
            // sanitize & deduplicate
            updateData.interestTags = [
                ...new Set(interestTags
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean)),
            ];
        }
        if (learningGoal)
            updateData.learningGoal = learningGoal;
        if (experienceLevel)
            updateData.experienceLevel = experienceLevel;
        const user = await User_model_1.default.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Invalidate suggestion cache so suggestions are updated
        (0, getSuggestedCourses_controllers_1.invalidateSuggestionCache)(userId);
        return res.status(200).json({
            success: true,
            message: "Interests updated successfully",
            data: {
                interests: user.interests,
                interestTags: user.interestTags,
                learningGoal: user.learningGoal,
                experienceLevel: user.experienceLevel,
                onboardingCompleted: user.onboardingCompleted,
            },
        });
    }
    catch (error) {
        console.error("Update interests error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}
