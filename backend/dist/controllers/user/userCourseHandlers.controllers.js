"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUserCourseBookmarkfunction = handleUserCourseBookmarkfunction;
exports.handleUserVideoBookmarkfunction = handleUserVideoBookmarkfunction;
exports.handleUserUnenrolledCourseFunction = handleUserUnenrolledCourseFunction;
exports.handleRemoveHistoryVideo = handleRemoveHistoryVideo;
exports.handleRemoveUserEntireHistory = handleRemoveUserEntireHistory;
exports.handleRemoveHistoryByDateRange = handleRemoveHistoryByDateRange;
exports.handleUserHistoryVideoOrder = handleUserHistoryVideoOrder;
exports.handleUserCourseProgress = handleUserCourseProgress;
exports.calculateProgress = calculateProgress;
const User_model_1 = __importDefault(require("../../models/User.model"));
const Video_model_1 = __importDefault(require("../../models/Video.model"));
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const autoAssignTest_controllers_1 = require("../test/autoAssignTest.controllers");
async function handleUserCourseBookmarkfunction(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'userId not found' });
    }
    const { courseId } = req.body;
    if (!courseId) {
        return res.status(400).json({ success: false, message: 'courseId not found' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'user not found' });
        }
        const courseIndex = user.bookmarks.course.findIndex((id) => id === courseId);
        if (courseIndex !== -1) {
            user.bookmarks.course.splice(courseIndex, 1);
            await user.save();
            const courseBookmarks = user.bookmarks.course;
            return res.status(200).json({
                success: true,
                message: 'Removed from bookmarks',
                courseBookmarks,
            });
        }
        else {
            user.bookmarks.course.push(courseId);
            await user.save();
            const courseBookmarks = user.bookmarks.course;
            return res.status(200).json({
                success: true,
                message: 'Added to bookmarks',
                courseBookmarks,
            });
        }
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
async function handleUserVideoBookmarkfunction(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'userId not found' });
    }
    const { videoId } = req.body;
    if (!videoId) {
        return res.status(400).json({ success: false, message: 'videoId not found' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'user not found' });
        }
        const videoIndex = user.bookmarks.video.findIndex((id) => id === videoId);
        if (videoIndex !== -1) {
            user.bookmarks.video.splice(videoIndex, 1);
            await user.save();
            const videoBookmarks = user.bookmarks.video;
            return res.status(200).json({
                success: true,
                message: 'Removed from bookmarks',
                videoBookmarks,
            });
        }
        else {
            user.bookmarks.video.push(videoId);
            await user.save();
            const videoBookmarks = user.bookmarks.video;
            return res.status(200).json({
                success: true,
                message: 'Added to bookmarks',
                videoBookmarks,
            });
        }
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
async function handleUserUnenrolledCourseFunction(req, res) {
    const { userId, userUniqueId: uniqueId } = req;
    const { courseId } = req.body;
    if (!courseId || !userId || !uniqueId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing required information' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const userCourseIndex = user.enrolledIn.indexOf(courseId);
        if (userCourseIndex === -1) {
            return res.status(400).json({ success: false, message: "Course not found in user's enrolled courses" });
        }
        user.enrolledIn.splice(userCourseIndex, 1);
        await user.save();
        const course = await Course_model_1.default.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        const enrolledByIndex = course.enrolledBy.indexOf(uniqueId);
        if (enrolledByIndex !== -1) {
            course.enrolledBy.splice(enrolledByIndex, 1);
            await course.save();
        }
        return res.status(200).json({ success: true, message: "User unenrolled from course successfully" });
    }
    catch (error) {
        console.error("Error unenrolling user from course:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
async function handleRemoveHistoryVideo(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID not found' });
    }
    const { videoId } = req.body;
    if (!videoId) {
        return res.status(400).json({ success: false, message: 'Video ID or Course ID not found' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const videoIndex = user.history.findIndex((item) => item.video === videoId);
        if (videoIndex !== -1) {
            user.history.splice(videoIndex, 1);
            await user.save();
            return res.status(200).json({
                success: true,
                message: 'Removed from history',
            });
        }
        return res.status(404).json({
            success: false,
            message: 'Video not found in history',
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
async function handleRemoveUserEntireHistory(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID not found' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.history = [];
        await user.save();
        return res.status(200).json({ success: true, message: 'Removed history' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
async function handleRemoveHistoryByDateRange(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID not found' });
    }
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        // Filter out history items within the date range
        user.history = user.history.filter((item) => {
            const itemDate = new Date(item.time);
            return itemDate < start || itemDate > end;
        });
        await user.save();
        return res.status(200).json({
            success: true,
            message: 'History cleared for selected date range',
            remainingCount: user.history.length
        });
    }
    catch (error) {
        console.error('Error clearing history by date range:', error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
async function handleUserHistoryVideoOrder(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID not found' });
    }
    const { videoId } = req.body;
    if (!videoId) {
        return res.status(400).json({ success: false, message: 'Video ID or Course ID not found' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        const videoIndex = user.history.findIndex((item) => item.video === videoId);
        if (videoIndex !== -1) {
            // If it exists, update the timestamp 
            user.history[videoIndex].time = new Date();
        }
        else {
            // Add new entry if not found
            user.history.push({ video: videoId, time: new Date() });
        }
        await user.save();
    }
    catch (error) {
        console.error("Error updating user history:", error);
    }
}
async function handleUserCourseProgress(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID not found' });
    }
    const { videoId, courseId } = req.body;
    if (!videoId || !courseId) {
        return res.status(400).json({ success: false, message: 'Video ID or Course ID not found' });
    }
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let courseProgress = user.progress.find((p) => p.courseId === courseId);
        if (courseProgress) {
            const videoIndex = courseProgress.completedVideos.findIndex((id) => id === videoId);
            if (videoIndex > -1) {
                courseProgress.completedVideos.splice(videoIndex, 1);
            }
            else {
                courseProgress.completedVideos.push(videoId);
            }
            await user.save();
        }
        else {
            user.progress.push({
                courseId: courseId,
                completedVideos: [videoId],
            });
            await user.save();
        }
        let updateCount = user.progress.find((p) => p.courseId === courseId);
        updateCount.count = await calculateProgress(courseId, userId);
        // Check if course is completed (100% progress)
        if (updateCount.count === 100 && !updateCount.completedAt) {
            updateCount.completedAt = new Date();
            console.log("🎉 Course completed:", courseId);
            // Auto-assign course test automatically
            try {
                await (0, autoAssignTest_controllers_1.assignTestToUser)(courseId, user.uniqueId);
            }
            catch (assignError) {
                console.error("Auto-assign test failed during video completion check:", assignError);
            }
        }
        await user.save();
        return res.status(200).json({
            success: true,
            message: courseProgress ? 'Progress updated' : 'Marked as complete',
            progress: updateCount.count,
            isCompleted: updateCount.count === 100,
        });
    }
    catch (error) {
        console.error('Error handling course progress:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
async function calculateProgress(courseId, userId) {
    try {
        const totalVideos = await Video_model_1.default.find({ courseId }).countDocuments();
        if (totalVideos === 0)
            return 0;
        const user = await User_model_1.default.findById(userId);
        const courseProgress = user.progress.find((p) => p.courseId === courseId);
        const completedVideosCount = courseProgress?.completedVideos.length || 0;
        const progress = (completedVideosCount / totalVideos) * 100;
        return parseFloat(progress.toFixed(0));
    }
    catch (error) {
        console.error('Error calculating progress:', error);
        return 0;
    }
}
