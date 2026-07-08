import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { Response } from "express";
import User from "../../models/User.model";

/**
 * PUT /api/v1/user/update-interests
 * Save user interests, learning goal, experience level.
 * Also marks onboardingCompleted = true.
 */
export async function handleUpdateInterestsFunction(
    req: AuthenticatedRequest,
    res: Response
) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { interests, interestTags, learningGoal, experienceLevel } = req.body;

        const updateData: Record<string, any> = {
            onboardingCompleted: true,
        };

        if (Array.isArray(interests) && interests.length > 0) {
            updateData.interests = interests;
        }
        if (Array.isArray(interestTags) && interestTags.length > 0) {
            // sanitize & deduplicate
            updateData.interestTags = [
                ...new Set(
                    (interestTags as string[])
                        .map((t) => t.trim().toLowerCase())
                        .filter(Boolean)
                ),
            ];
        }
        if (learningGoal) updateData.learningGoal = learningGoal;
        if (experienceLevel) updateData.experienceLevel = experienceLevel;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

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
    } catch (error) {
        console.error("Update interests error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}