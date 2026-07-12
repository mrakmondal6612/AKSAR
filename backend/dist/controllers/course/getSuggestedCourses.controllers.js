"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateSuggestionCache = invalidateSuggestionCache;
exports.handleGetSuggestedCoursesFunction = handleGetSuggestedCoursesFunction;
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const generative_ai_1 = require("@google/generative-ai");
// Initialize Gemini AI
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Simple in-memory cache (5 min TTL per user)
const suggestionCache = new Map();
/**
 * Invalidate the suggestion cache for a user
 */
function invalidateSuggestionCache(userId) {
    suggestionCache.delete(`suggestions_${userId}`);
}
/**
 * GET /api/v1/course/get-suggested-courses
 * Uses Gemini AI to rank and suggest courses based on user profile.
 * Falls back to interest-based matching if Gemini fails.
 */
async function handleGetSuggestedCoursesFunction(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        // Check cache first
        const cacheKey = `suggestions_${userId}`;
        const cached = suggestionCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
            return res.status(200).json({
                success: true,
                data: cached.data,
                meta: { aiUsed: true, cached: true },
            });
        }
        const user = await User_model_1.default.findById(userId).select("interests interestTags enrolledIn learningGoal experienceLevel");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const enrolledIds = user.enrolledIn || [];
        const interests = user.interests || [];
        const interestTags = user.interestTags || [];
        const learningGoal = user.learningGoal || "";
        const experienceLevel = user.experienceLevel || "";
        const hasInterests = interests.length > 0 || interestTags.length > 0;
        // Fetch verified non-enrolled courses as candidates
        const candidateCourses = await Course_model_1.default.find({
            isVerified: true,
            courseId: { $nin: enrolledIds },
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
            .exec();
        if (candidateCourses.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                meta: { hasInterests, aiUsed: false },
            });
        }
        // If user has no interests, return latest courses without AI
        if (!hasInterests) {
            const transformed = candidateCourses.slice(0, 12).map(transformCourse);
            return res.status(200).json({
                success: true,
                data: transformed,
                meta: { hasInterests: false, aiUsed: false },
            });
        }
        // ── Try Gemini AI ranking ────────────────────────────────────────────
        try {
            const courseList = candidateCourses.map((c, i) => ({
                index: i,
                courseId: c.courseId,
                courseName: c.courseName,
                tutorName: c.tutorName,
                description: (c.description ?? "").slice(0, 120),
                courseType: c.courseType,
                category: c.category ?? "",
                courseTechStack: c.courseTechStack ?? [],
                sellingPrice: c.sellingPrice,
            }));
            const prompt = `
You are a course recommendation AI for a learning management system.

User Profile:
- Interests (course types): ${interests.join(", ")}
- Topic interests / skills: ${interestTags.join(", ")}
- Learning goal: ${learningGoal || "not specified"}
- Experience level: ${experienceLevel || "not specified"}

Available Courses (${courseList.length} courses):
${JSON.stringify(courseList, null, 2)}

Task: Select ONLY the courses that are genuinely relevant to this user's interests and goals.
Do NOT include courses that don't match their profile at all.
Prioritize courses that match:
1. Their interest tags and skills
2. Their course type preferences
3. Their experience level (${experienceLevel})
4. Their learning goal (${learningGoal})

Return ONLY valid JSON in this exact format:
{
  "recommendedIndexes": [0, 5, 2],
  "reasoning": "Brief explanation of why these courses were selected"
}

The recommendedIndexes array should contain ONLY the indexes of genuinely relevant courses, ordered from most to least relevant. If no courses match, return an empty array.
Return ONLY valid JSON, no additional text.
`;
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                generationConfig: { responseMimeType: "application/json" },
            });
            const geminiCall = model.generateContent(prompt);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini request timed out")), 8000));
            const result = await Promise.race([geminiCall, timeoutPromise]);
            const response = result.response;
            const text = response.text();
            const cleanedText = text.replaceAll("```json\n", "").replaceAll("```\n", "").replaceAll("```", "").trim();
            const aiResponse = JSON.parse(cleanedText);
            if (aiResponse.recommendedIndexes && Array.isArray(aiResponse.recommendedIndexes)) {
                const recommendedCourses = aiResponse.recommendedIndexes
                    .filter((idx) => idx >= 0 && idx < candidateCourses.length)
                    .map((idx) => transformCourse(candidateCourses[idx]));
                // Save to cache
                suggestionCache.set(cacheKey, { data: recommendedCourses, timestamp: Date.now() });
                return res.status(200).json({
                    success: true,
                    data: recommendedCourses,
                    meta: {
                        hasInterests: true,
                        aiUsed: true,
                        reasoning: aiResponse.reasoning || "",
                        interestsUsed: interests,
                        tagsUsed: interestTags,
                    },
                });
            }
        }
        catch (aiError) {
            console.error("Gemini suggestion error — falling back to interest matching:", aiError);
        }
        // ── Fallback: interest-based matching ───────────────────────────────
        const matched = candidateCourses.filter(c => {
            const typeMatch = interests.some((i) => c.courseType === i.toUpperCase());
            const tagMatch = interestTags.some((tag) => {
                const t = tag.toLowerCase();
                return ((c.courseName ?? "").toLowerCase().includes(t) ||
                    (c.description ?? "").toLowerCase().includes(t) ||
                    (c.category ?? "").toLowerCase().includes(t) ||
                    (c.courseTechStack ?? []).some((s) => s.toLowerCase().includes(t)));
            });
            return typeMatch || tagMatch;
        });
        const finalCourses = matched.slice(0, 12);
        // Save to cache
        suggestionCache.set(cacheKey, { data: finalCourses.map(transformCourse), timestamp: Date.now() });
        return res.status(200).json({
            success: true,
            data: finalCourses.map(transformCourse),
            meta: {
                hasInterests: true,
                aiUsed: false,
                interestsUsed: interests,
                tagsUsed: interestTags,
            },
        });
    }
    catch (error) {
        console.error("Get suggested courses error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// ── Helper ───────────────────────────────────────────────────────────────────
function transformCourse(course) {
    return {
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
    };
}
