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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetUserDataFunction = handleGetUserDataFunction;
exports.handleGetUsersBookmarkedVideo = handleGetUsersBookmarkedVideo;
exports.handleGetUsersBookmarkedCourses = handleGetUsersBookmarkedCourses;
exports.handleGetUserHistoryVideos = handleGetUserHistoryVideos;
const User_model_1 = __importDefault(require("../../models/User.model"));
const Video_model_1 = __importDefault(require("../../models/Video.model"));
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const youtube_config_1 = require("../../utils/youtube.config");
async function handleGetUserDataFunction(req, res) {
    try {
        const userId = req.userId;
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        let uniqueId = user.uniqueId;
        if (!uniqueId) {
            const { nanoid } = await Promise.resolve().then(() => __importStar(require("nanoid")));
            uniqueId = nanoid();
            user.uniqueId = uniqueId;
            await user.save();
        }
        const data = {
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            uniqueId: uniqueId,
            email: user.email,
            emailVerificationStatus: user.emailVerificationStatus,
            profileImageUrl: user.profileImageUrl,
            phoneNumber: user.phoneNumber,
            phoneNumberVerificationStatus: user.phoneNumberVerificationStatus,
            role: user.role,
            bio: user.bio,
            userDob: user.userDob,
            address: user.address,
            enrolledIn: user.enrolledIn,
            bookmarks: user.bookmarks,
            progress: user.progress,
            history: user.history,
            interests: user.interests,
            interestTags: user.interestTags,
            learningGoal: user.learningGoal,
            experienceLevel: user.experienceLevel,
            onboardingCompleted: user.onboardingCompleted ?? false,
            points: user.points || 0,
            bonusPoints: user.bonusPoints || 0,
            lifetimePoints: user.lifetimePoints || 0,
            currentStreak: user.currentStreak || 0,
            lastActivityDate: user.lastActivityDate,
            badges: user.badges || [],
            unlockedUpgrades: user.unlockedUpgrades || [],
            premiumExpiry: user.premiumExpiry,
            referredBy: user.referredBy || "",
            referralCode: user.referralCode || "",
        };
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}
async function handleGetUsersBookmarkedVideo(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { videoIds } = req.body;
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(400).json({ success: false, message: 'VideoIds are required' });
    }
    try {
        const videos = await Video_model_1.default.find({ videoId: { $in: videoIds } })
            .lean()
            .exec();
        if (!videos || videos.length === 0) {
            return res.status(404).json({ success: false, message: 'No videos found for the provided IDs' });
        }
        const filteredVideos = videos.map((video) => ({
            videoName: video.videoName,
            tutorName: video.tutorName,
            videoType: video.videoType,
            courseId: video.courseId,
            videoId: video.videoId,
            uploadedBy: video.uploadedBy,
            thumbnail: video.thumbnail,
            videoUrl: video.videoUrl,
            description: video.description ?? '',
            watchedBy: video.watchedBy ?? [],
            watchCount: video.watchCount ?? 0,
            videoTimeStamps: video.videoTimeStamps ?? [],
            isVerified: video.isVerified,
            markdownContent: video.markdownContent ?? '',
            pub_id: video.pub_id ?? '',
        }));
        return res.status(200).json({ success: true, videos: filteredVideos });
    }
    catch (error) {
        console.error('Error fetching videos:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching videos' });
    }
}
async function handleGetUsersBookmarkedCourses(req, res) {
    const userId = req.userId;
    console.log("🔵 Get Bookmarked Courses Request:", { userId, body: req.body });
    if (!userId) {
        console.log("❌ No userId found");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { courseIds } = req.body;
    console.log("📝 CourseIds received:", courseIds);
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
        console.log("❌ Invalid courseIds format or empty");
        return res.status(400).json({ success: false, message: 'CourseIds are required' });
    }
    try {
        const uniqueCourseIds = Array.from(new Set(courseIds));
        const courses = await Course_model_1.default.find({ courseId: { $in: uniqueCourseIds } })
            .lean() // Convert to plain objects
            .exec();
        console.log("✅ Found " + courses.length + " courses in database");
        const foundCourseIds = courses.map((course) => course.courseId);
        const missingCourseIds = uniqueCourseIds.filter((id) => !foundCourseIds.includes(id) && id.startsWith("PL"));
        const youtubeCourses = await Promise.all(missingCourseIds.map(async (playlistId) => {
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
                likedBy: [],
                enrolledBy: [],
                ratingCount: 0,
                rating: 0,
                likedCount: 0,
                enrolledCount: 0,
                markdownContent: "",
                redirectLink: "",
                videos: [],
            };
        }));
        const filteredYoutubeCourses = youtubeCourses.filter((course) => Boolean(course));
        const filteredCourses = courses.map((course) => ({
            courseName: course.courseName,
            courseId: course.courseId,
            tutorName: course.tutorName,
            courseType: course.courseType,
            description: course.description,
            currency: course.currency,
            sellingPrice: course.sellingPrice,
            originalPrice: course.originalPrice,
            thumbnail: course.thumbnail,
            isVerified: course.isVerified,
            uploadedBy: course.uploadedBy,
            ratings: course.ratings ?? [],
            likedBy: course.likedBy ?? [],
            enrolledBy: course.enrolledBy ?? [],
            ratingCount: course.ratingCount,
            rating: course.rating,
            likedCount: course.likedCount,
            enrolledCount: course.enrolledCount,
            markdownContent: course.markdownContent ?? '',
            redirectLink: course.redirectLink ?? '',
            videos: course.videos ?? [],
        }));
        return res.status(200).json({ success: true, courses: [...filteredCourses, ...filteredYoutubeCourses] });
    }
    catch (error) {
        console.error('Error fetching courses:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching courses' });
    }
}
async function handleGetUserHistoryVideos(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { videoIds } = req.body;
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
        return res.status(200).json({ success: true, videos: [] });
    }
    try {
        const videos = await Video_model_1.default.find({ videoId: { $in: videoIds } }).lean().exec();
        if (!videos || videos.length === 0) {
            return res.status(200).json({ success: true, videos: [] });
        }
        const filteredVideos = videos.map((video) => ({
            videoName: video.videoName,
            tutorName: video.tutorName,
            videoType: video.videoType,
            courseId: video.courseId,
            videoId: video.videoId,
            uploadedBy: video.uploadedBy,
            thumbnail: video.thumbnail,
            videoUrl: video.videoUrl,
            description: video.description ?? '',
            watchedBy: video.watchedBy ?? [],
            watchCount: video.watchedBy.length ?? 0,
            videoTimeStamps: video.videoTimeStamps ?? [],
            isVerified: video.isVerified,
            markdownContent: video.markdownContent ?? '',
            pub_id: video.pub_id ?? '',
        }));
        return res.status(200).json({ success: true, videos: filteredVideos });
    }
    catch (error) {
        console.error('Error fetching videos:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while fetching videos' });
    }
}
// export async function handleGetUsersBookmarkedTest(req: AuthenticatedRequest , res: Response) {
//    const userId = req.userId;
//    if(!userId){
//     return res.status(401).json({success: false , message: "Unauthorized"})
//    }
//    const {testIds} = req.body;
//    if (!Array.isArray(testIds) || testIds.length === 0) {
//     return res.status(400).json({ success: false, message: 'VideoIds are required' });
//   }
//   try {
//     const tests = await TestModel.find({
//       _id: { $in: testIds },
//     });
//     if (!tests || tests.length === 0) {
//       return res.status(404).json({success: false, message: 'No tests found for the provided IDs'});
//     }
//     return res.status(200).json({ success: true, tests });
//   } catch (error) {
//     console.error('Error fetching tests:', error);
//     return res.status(500).json({success: false, message: 'An error occurred while fetching tests'});
//   }
// }
