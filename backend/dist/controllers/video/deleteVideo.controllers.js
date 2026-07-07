"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDeleteVideoFunction = handleDeleteVideoFunction;
const Video_model_1 = __importDefault(require("../../models/Video.model"));
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const cloudinary_config_1 = require("../../utils/cloudinary.config");
async function handleDeleteVideoFunction(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { videoId } = req.body;
    if (!videoId) {
        return res.status(400).json({ success: false, message: "Video ID is required" });
    }
    try {
        // Find the video by ID
        const video = await Video_model_1.default.findOne({ videoId });
        if (!video) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }
        // Delete thumbnail from Cloudinary if it exists
        if (video.thumbnail) {
            await (0, cloudinary_config_1.cloudinaryDeleteVideoImage)(video.thumbnail);
        }
        // Delete video file from Cloudinary if the URL is valid
        if (video.videoUrl && video.videoUrl.includes("https://res.cloudinary.com")) {
            await (0, cloudinary_config_1.cloudinaryDeleteVideoFile)(video.videoUrl);
        }
        // Remove the video from the database
        await Video_model_1.default.findOneAndDelete({ videoId });
        // Find the course associated with the video
        const courseId = video.courseId;
        const course = await Course_model_1.default.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        // Remove the video ID from the course's videos array
        course.videos = course.videos.filter((id) => id !== videoId);
        // Save the updated course
        await course.save();
        return res.status(200).json({ success: true, message: "Video deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting video:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
