"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDeleteCourseFunction = handleDeleteCourseFunction;
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const cloudinary_config_1 = require("../../utils/cloudinary.config");
async function handleDeleteCourseFunction(req, res) {
    const userId = req.userId;
    const { password, courseId } = req.body;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: No user found" });
    }
    try {
        const course = await Course_model_1.default.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid password" });
        }
        // Remove the course ID from the user's uploadedCourses
        user.uploadedCourses = user.uploadedCourses.filter((id) => id !== course.courseId);
        // Delete the course thumbnail from Cloudinary if it exists
        if (course.thumbnail) {
            await (0, cloudinary_config_1.cloudinaryDeleteCourseImage)(course.thumbnail);
        }
        // Delete the course
        const deleteResult = await Course_model_1.default.deleteOne({ courseId });
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        // Save the user after removing the course ID
        await user.save();
        return res.status(200).json({ success: true, message: "Course deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
