"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetAllStudents = handleGetAllStudents;
exports.handleGetStudentById = handleGetStudentById;
exports.handleUpdateStudent = handleUpdateStudent;
exports.handleDeleteStudent = handleDeleteStudent;
exports.handleGetStudentStats = handleGetStudentStats;
exports.handleToggleStudentEmailVerification = handleToggleStudentEmailVerification;
exports.handleGetStudentEnrolledCourses = handleGetStudentEnrolledCourses;
const User_model_1 = __importDefault(require("../../models/User.model"));
// Get all students (for admin/instructor)
async function handleGetAllStudents(req, res) {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;
        const filter = { role: "STUDENT" };
        if (search && typeof search === "string") {
            filter.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const students = await User_model_1.default.find(filter)
            .select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await User_model_1.default.countDocuments(filter);
        return res.status(200).json({
            success: true,
            data: students,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Get student details by ID
async function handleGetStudentById(req, res) {
    try {
        const { studentId } = req.params;
        const student = await User_model_1.default.findById(studentId).select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires");
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        if (student.role !== "STUDENT") {
            return res.status(400).json({ success: false, message: "User is not a student" });
        }
        return res.status(200).json({ success: true, data: student });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Update student details
async function handleUpdateStudent(req, res) {
    try {
        const { studentId } = req.params;
        const { firstName, lastName, userName, email, bio, userDob, address, phoneNumber } = req.body;
        const student = await User_model_1.default.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        if (student.role !== "STUDENT") {
            return res.status(400).json({ success: false, message: "User is not a student" });
        }
        // Update fields
        if (firstName)
            student.firstName = firstName;
        if (lastName !== undefined)
            student.lastName = lastName;
        if (userName)
            student.userName = userName;
        if (email)
            student.email = email;
        if (bio !== undefined)
            student.bio = bio;
        if (userDob !== undefined)
            student.userDob = userDob;
        if (address)
            student.address = address;
        if (phoneNumber)
            student.phoneNumber = phoneNumber;
        await student.save();
        return res.status(200).json({ success: true, message: "Student updated successfully", data: student });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Delete student
async function handleDeleteStudent(req, res) {
    try {
        const { studentId } = req.params;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }
        // Verify admin password
        const admin = await User_model_1.default.findById(req.userId);
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }
        const bcrypt = require("bcryptjs");
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
        const student = await User_model_1.default.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        if (student.role !== "STUDENT") {
            return res.status(400).json({ success: false, message: "User is not a student" });
        }
        await User_model_1.default.findByIdAndDelete(studentId);
        return res.status(200).json({ success: true, message: "Student deleted successfully" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Get student statistics
async function handleGetStudentStats(req, res) {
    try {
        const totalStudents = await User_model_1.default.countDocuments({ role: "STUDENT" });
        const verifiedEmails = await User_model_1.default.countDocuments({ role: "STUDENT", emailVerificationStatus: true });
        const verifiedPhones = await User_model_1.default.countDocuments({ role: "STUDENT", phoneNumberVerificationStatus: true });
        const recentStudents = await User_model_1.default.find({ role: "STUDENT" })
            .select("firstName lastName email createdAt")
            .sort({ createdAt: -1 })
            .limit(5);
        return res.status(200).json({
            success: true,
            data: {
                totalStudents,
                verifiedEmails,
                verifiedPhones,
                recentStudents,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Toggle student email verification status
async function handleToggleStudentEmailVerification(req, res) {
    try {
        const { studentId } = req.params;
        const student = await User_model_1.default.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        if (student.role !== "STUDENT") {
            return res.status(400).json({ success: false, message: "User is not a student" });
        }
        student.emailVerificationStatus = !student.emailVerificationStatus;
        await student.save();
        return res.status(200).json({
            success: true,
            message: "Email verification status updated",
            data: { emailVerificationStatus: student.emailVerificationStatus },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Get student enrolled courses
async function handleGetStudentEnrolledCourses(req, res) {
    try {
        const { studentId } = req.params;
        const student = await User_model_1.default.findById(studentId).populate("enrolledIn");
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }
        if (student.role !== "STUDENT") {
            return res.status(400).json({ success: false, message: "User is not a student" });
        }
        return res.status(200).json({
            success: true,
            data: {
                enrolledIn: student.enrolledIn,
                progress: student.progress,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
