"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUserEnrolledCourseFunction = handleUserEnrolledCourseFunction;
exports.handleGetAllCoursesEnrolledByUser = handleGetAllCoursesEnrolledByUser;
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const youtube_config_1 = require("../../utils/youtube.config");
const notificationHelper_1 = require("../../helpers/notificationHelper");
const getSuggestedCourses_controllers_1 = require("./getSuggestedCourses.controllers");
async function handleUserEnrolledCourseFunction(req, res) {
    const userId = req.userId;
    const uniqueId = req.userUniqueId;
    console.log("🔵 Enrollment Request Received:", { userId, uniqueId, body: req.body });
    if (!userId) {
        console.log("❌ No userId found");
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { courseId } = req.body;
    if (!courseId) {
        console.log("❌ No courseId in body");
        return res.status(400).json({ success: false, message: 'Course ID not provided' });
    }
    console.log("📝 Processing enrollment for courseId:", courseId);
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            console.log("❌ User not found in database");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log("✅ User found:", user.email);
        console.log("📋 User's current enrolledIn:", user.enrolledIn);
        // Check if already enrolled
        if (user.enrolledIn.includes(courseId)) {
            console.log("⚠️ User already enrolled in this course");
            return res.status(400).json({
                success: false,
                message: "User is already enrolled in this course",
            });
        }
        // Try to find in database (for database courses)
        const course = await Course_model_1.default.findOne({ courseId });
        if (course) {
            console.log("✅ Database course found:", course.courseName);
            // Check if course is paid and requires payment (only if Razorpay is configured)
            const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID &&
                !process.env.RAZORPAY_KEY_ID.includes("your_razorpay_key_id") &&
                process.env.RAZORPAY_KEY_ID.trim() !== "";
            if (course.sellingPrice > 0 && isRazorpayConfigured) {
                console.log("💰 Course is paid - payment required");
                return res.status(403).json({
                    success: false,
                    message: "Payment required for this course. Please complete payment to enroll.",
                    requiresPayment: true,
                    amount: course.sellingPrice,
                    currency: course.currency || "INR"
                });
            }
            // Database course
            const alreadyEnrolledInCourse = course.enrolledBy.includes(uniqueId);
            if (alreadyEnrolledInCourse) {
                console.log("⚠️ User already in enrolledBy array");
                return res.status(400).json({
                    success: false,
                    message: "User is already enrolled in this course",
                });
            }
            course.enrolledBy.push(user.uniqueId);
            await course.save();
            console.log("✅ Updated course enrolledBy");
            // ── Notify student ───────────────────────────────────────────────
            await (0, notificationHelper_1.createNotification)({
                userId,
                type: "course_enrolled",
                title: "🎉 Enrolled Successfully!",
                message: `You have successfully enrolled in "${course.courseName}". Start learning now!`,
                courseId: course.courseId,
                link: `/user/view-course?c=${course.courseId}`,
            });
            // ── Notify instructor ────────────────────────────────────────────
            if (course.uploadedBy) {
                const instructor = await User_model_1.default.findOne({ uniqueId: course.uploadedBy }).select("_id");
                if (instructor) {
                    await (0, notificationHelper_1.createNotification)({
                        userId: instructor._id.toString(),
                        type: "new_enrollment",
                        title: "👤 New Student Enrolled",
                        message: `${user.firstName} ${user.lastName} enrolled in your course "${course.courseName}"`,
                        courseId: course.courseId,
                    });
                }
            }
        }
        else {
            console.log("📌 No database course found - treating as YouTube course (courseId: " + courseId + ")");
            // ── Notify student for YouTube course ────────────────────────────
            await (0, notificationHelper_1.createNotification)({
                userId,
                type: "course_enrolled",
                title: "🎉 YouTube Course Added!",
                message: `YouTube course has been added to your learning list.`,
            });
        }
        user.enrolledIn.push(courseId);
        await user.save();
        console.log("✅ User enrollment saved successfully");
        // Invalidate suggestion cache
        (0, getSuggestedCourses_controllers_1.invalidateSuggestionCache)(userId);
        return res.status(200).json({
            success: true,
            message: 'User enrolled in course successfully',
            courseId: courseId,
            courseName: course?.courseName || 'Course'
        });
    }
    catch (error) {
        console.error('Error enrolling user in course:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
async function handleGetAllCoursesEnrolledByUser(req, res) {
    const userId = req.userId;
    const uniqueId = req.userUniqueId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!uniqueId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
        const user = (await User_model_1.default.findById(userId).lean().exec());
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const enrolledIds = Array.from(new Set((user.enrolledIn ?? [])));
        const courses = (await Course_model_1.default.find({
            $or: [
                { courseId: { $in: enrolledIds } },
                { uploadedBy: uniqueId },
            ],
        }).lean().exec());
        const dbCourseIds = courses.map((course) => course.courseId);
        const youtubeCourseIds = enrolledIds.filter((id) => id.startsWith("PL") && !dbCourseIds.includes(id));
        const youtubeCourses = await Promise.all(youtubeCourseIds.map(async (playlistId) => {
            const playlist = await (0, youtube_config_1.getPlaylistDetails)(playlistId);
            if (!playlist)
                return null;
            return {
                courseName: playlist.snippet.title,
                courseId: playlist.id,
                tutorName: playlist.snippet.channelTitle,
                courseType: "YOUTUBE",
                description: playlist.snippet.description,
                currency: "FREE",
                sellingPrice: 0,
                originalPrice: 0,
                thumbnail: playlist.snippet.thumbnails.high?.url ||
                    playlist.snippet.thumbnails.medium?.url ||
                    playlist.snippet.thumbnails.default.url,
                isVerified: true,
                uploadedBy: "youtube-integration",
                ratings: [],
                ratingCount: 0,
                likedBy: [],
                likedCount: 0,
                enrolledBy: [],
                enrolledCount: 0,
                markdownContent: "",
                redirectLink: "",
                videos: [],
            };
        }));
        const filteredYoutubeCourses = youtubeCourses.filter((course) => Boolean(course));
        const transformedCourses = [
            ...courses.map((course) => ({
                courseName: course.courseName,
                courseId: course.courseId,
                tutorName: course.tutorName,
                courseType: course.courseType,
                description: course.description ?? '',
                currency: course.currency,
                sellingPrice: course.sellingPrice,
                originalPrice: course.originalPrice,
                thumbnail: course.thumbnail,
                isVerified: course.isVerified,
                uploadedBy: course.uploadedBy,
                ratings: course.ratings ?? [],
                ratingCount: course.ratings?.length ?? 0,
                likedBy: course.likedBy ?? [],
                likedCount: course.likedBy?.length ?? 0,
                markdownContent: course.markdownContent ?? '',
                redirectLink: course.redirectLink ?? '',
                enrolledBy: course.enrolledBy ?? [],
                enrolledCount: course.enrolledBy?.length ?? 0,
                videos: course.videos ?? []
            })),
            ...filteredYoutubeCourses,
        ];
        return res.status(200).json({ success: true, message: "courses were fetched", data: transformedCourses });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
