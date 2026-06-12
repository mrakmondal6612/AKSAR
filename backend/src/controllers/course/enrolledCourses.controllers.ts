import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import CourseModel from "../../models/Course.model";
import User, { IUser } from "../../models/User.model";
import { getPlaylistDetails } from "../../utils/youtube.config";

export async function handleUserEnrolledCourseFunction(req: AuthenticatedRequest, res: Response) {
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
        const user = await User.findById(userId);

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
        const course = await CourseModel.findOne({ courseId });

        if (course) {
            console.log("✅ Database course found:", course.courseName);
            
            // Check if course is paid and requires payment
            if (course.sellingPrice > 0) {
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
        } else {
            console.log("📌 No database course found - treating as YouTube course (courseId: " + courseId + ")");
        }
        
        // If courseId starts with 'PL', it's a YouTube course - just add to user's enrolledIn without database course

        user.enrolledIn.push(courseId);
        await user.save();
        console.log("✅ User enrollment saved successfully");

        return res.status(200).json({ 
            success: true, 
            message: 'User enrolled in course successfully',
            courseId: courseId,
            courseName: course?.courseName || 'Course'
        });
    } catch (error) {
        console.error('Error enrolling user in course:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export async function handleGetAllCoursesEnrolledByUser(req: AuthenticatedRequest, res: Response) {
    const userId = req.userId;
    const uniqueId = req.userUniqueId;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!uniqueId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const user = (await User.findById(userId).lean().exec()) as IUser | null;
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const enrolledIds = Array.from(new Set((user.enrolledIn ?? []) as string[]));

        const courses = (await CourseModel.find({
            $or: [
                { courseId: { $in: enrolledIds } },
                { uploadedBy: uniqueId },
            ],
        }).lean().exec()) as Array<Record<string, any>>;

        const dbCourseIds = courses.map((course) => course.courseId as string);
        const youtubeCourseIds = enrolledIds.filter(
            (id: string) => id.startsWith("PL") && !dbCourseIds.includes(id)
        );

        const youtubeCourses = await Promise.all(
            youtubeCourseIds.map(async (playlistId) => {
                const playlist = await getPlaylistDetails(playlistId);
                if (!playlist) return null;
                return {
                    courseName: playlist.snippet.title,
                    courseId: playlist.id,
                    tutorName: playlist.snippet.channelTitle,
                    courseType: "YOUTUBE",
                    description: playlist.snippet.description,
                    currency: "FREE",
                    sellingPrice: 0,
                    originalPrice: 0,
                    thumbnail:
                        playlist.snippet.thumbnails.high?.url ||
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
            })
        );

        const filteredYoutubeCourses = youtubeCourses.filter(
            (course): course is NonNullable<typeof course> => Boolean(course)
        );

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

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


