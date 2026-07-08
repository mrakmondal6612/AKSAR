"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetSuggestedCoursesFunction = handleGetSuggestedCoursesFunction;
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
/**
 * GET /api/v1/course/get-suggested-courses
 * Returns verified courses matched to the user's interests.
 * Matching priority:
 *   1. courseType matches interests[]
 *   2. category or courseTechStack matches interestTags[]
 * Falls back to latest 12 verified courses if no interests set.
 */
async function handleGetSuggestedCoursesFunction(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await User_model_1.default.findById(userId).select("interests interestTags enrolledIn");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const enrolledIds = user.enrolledIn || [];
        const interests = user.interests || [];
        const interestTags = user.interestTags || [];
        let query = {
            isVerified: true,
            courseId: { $nin: enrolledIds }, // exclude already enrolled
        };
        const hasInterests = interests.length > 0 || interestTags.length > 0;
        if (hasInterests) {
            const orConditions = [];
            if (interests.length > 0) {
                orConditions.push({
                    courseType: { $in: interests.map((i) => i.toUpperCase()) },
                });
            }
            if (interestTags.length > 0) {
                const tagRegexes = interestTags.map((tag) => new RegExp(tag, "i"));
                orConditions.push({ category: { $in: tagRegexes } }, { courseName: { $in: tagRegexes } }, { tutorName: { $in: tagRegexes } }, { description: { $in: tagRegexes } });
            }
            query = { ...query, $or: orConditions };
        }
        const courses = await Course_model_1.default.find(query)
            .sort({ enrolledCount: -1, createdAt: -1 })
            .limit(20)
            .lean()
            .exec();
        // If interest-based query returns too few results, top up with latest courses
        let finalCourses = courses;
        if (hasInterests && courses.length < 6) {
            const fallback = await Course_model_1.default.find({
                isVerified: true,
                courseId: {
                    $nin: [
                        ...enrolledIds,
                        ...courses.map((c) => c.courseId),
                    ],
                },
            })
                .sort({ createdAt: -1 })
                .limit(20 - courses.length)
                .lean()
                .exec();
            finalCourses = [...courses, ...fallback];
        }
        if (finalCourses.length === 0) {
            // absolute fallback — return latest verified courses
            finalCourses = await Course_model_1.default.find({ isVerified: true })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean()
                .exec();
        }
        const transformedCourses = finalCourses.map((course) => ({
            courseName: course.courseName,
            courseId: course.courseId,
            tutorName: course.tutorName,
            courseType: course.courseType,
            description: course.description ?? "",
            currency: course.currency,
            sellingPrice: course.sellingPrice,
            originalPrice: course.originalPrice,
            thumbnail: course.thumbnail,
            isVerified: course.isVerified,
            uploadedBy: course.uploadedBy,
            ratingCount: course.ratings?.length ?? 0,
            likedCount: course.likedBy?.length ?? 0,
            enrolledCount: course.enrolledBy?.length ?? 0,
            category: course.category ?? "",
            courseTechStack: course.courseTechStack ?? [],
        }));
        return res.status(200).json({
            success: true,
            data: transformedCourses,
            meta: {
                hasInterests,
                interestsUsed: interests,
                tagsUsed: interestTags,
            },
        });
    }
    catch (error) {
        console.error("Get suggested courses error:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}
