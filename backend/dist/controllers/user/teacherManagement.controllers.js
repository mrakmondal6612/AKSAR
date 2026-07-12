"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetAllTeachers = handleGetAllTeachers;
exports.handleGetTeacherById = handleGetTeacherById;
exports.handleUpdateTeacher = handleUpdateTeacher;
exports.handleDeleteTeacher = handleDeleteTeacher;
exports.handleGetTeacherStats = handleGetTeacherStats;
exports.handleToggleTeacherEmailVerification = handleToggleTeacherEmailVerification;
exports.handleCreateTeacher = handleCreateTeacher;
const User_model_1 = __importDefault(require("../../models/User.model"));
// Get all teachers (for admin/instructor)
async function handleGetAllTeachers(req, res) {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const filter = { role: "INSTRUCTOR" };
        if (search && typeof search === "string") {
            filter.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const teachers = await User_model_1.default.find(filter)
            .select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await User_model_1.default.countDocuments(filter);
        return res.status(200).json({
            success: true,
            data: teachers,
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
// Get teacher details by ID
async function handleGetTeacherById(req, res) {
    try {
        const { teacherId } = req.params;
        const teacher = await User_model_1.default.findById(teacherId).select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires");
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        if (teacher.role !== "INSTRUCTOR") {
            return res.status(400).json({ success: false, message: "User is not a teacher" });
        }
        return res.status(200).json({ success: true, data: teacher });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Update teacher details
async function handleUpdateTeacher(req, res) {
    try {
        const { teacherId } = req.params;
        const { firstName, lastName, userName, email, bio, userDob, address, phoneNumber, specialization, experience } = req.body;
        const teacher = await User_model_1.default.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        if (teacher.role !== "INSTRUCTOR") {
            return res.status(400).json({ success: false, message: "User is not a teacher" });
        }
        // Update fields
        if (firstName)
            teacher.firstName = firstName;
        if (lastName !== undefined)
            teacher.lastName = lastName;
        if (userName)
            teacher.userName = userName;
        if (email)
            teacher.email = email;
        if (bio !== undefined)
            teacher.bio = bio;
        if (userDob !== undefined)
            teacher.userDob = userDob;
        if (address)
            teacher.address = address;
        if (phoneNumber)
            teacher.phoneNumber = phoneNumber;
        if (specialization !== undefined)
            teacher.specialization = specialization;
        if (experience !== undefined)
            teacher.experience = experience;
        await teacher.save();
        return res.status(200).json({ success: true, message: "Teacher updated successfully", data: teacher });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Delete teacher
async function handleDeleteTeacher(req, res) {
    try {
        const { teacherId } = req.params;
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
        const teacher = await User_model_1.default.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        if (teacher.role !== "INSTRUCTOR") {
            return res.status(400).json({ success: false, message: "User is not a teacher" });
        }
        await User_model_1.default.findByIdAndDelete(teacherId);
        return res.status(200).json({ success: true, message: "Teacher deleted successfully" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Get teacher statistics
async function handleGetTeacherStats(req, res) {
    try {
        const totalTeachers = await User_model_1.default.countDocuments({ role: "INSTRUCTOR" });
        const verifiedEmails = await User_model_1.default.countDocuments({ role: "INSTRUCTOR", emailVerificationStatus: true });
        const verifiedPhones = await User_model_1.default.countDocuments({ role: "INSTRUCTOR", phoneNumberVerificationStatus: true });
        const recentTeachers = await User_model_1.default.find({ role: "INSTRUCTOR" })
            .select("firstName lastName email createdAt")
            .sort({ createdAt: -1 })
            .limit(5);
        return res.status(200).json({
            success: true,
            data: {
                totalTeachers,
                verifiedEmails,
                verifiedPhones,
                recentTeachers,
            },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Toggle teacher email verification status
async function handleToggleTeacherEmailVerification(req, res) {
    try {
        const { teacherId } = req.params;
        const teacher = await User_model_1.default.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        if (teacher.role !== "INSTRUCTOR") {
            return res.status(400).json({ success: false, message: "User is not a teacher" });
        }
        teacher.emailVerificationStatus = !teacher.emailVerificationStatus;
        await teacher.save();
        return res.status(200).json({
            success: true,
            message: "Email verification status updated",
            data: { emailVerificationStatus: teacher.emailVerificationStatus },
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
// Create new teacher (admin only)
async function handleCreateTeacher(req, res) {
    try {
        const { firstName, lastName, userName, email, password, bio, userDob, address, phoneNumber, specialization, experience } = req.body;
        // Check if user already exists
        const existingUser = await User_model_1.default.findOne({ $or: [{ email }, { userName }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email or username already exists" });
        }
        const bcrypt = require("bcryptjs");
        const hashedPassword = await bcrypt.hash(password, 10);
        const newTeacher = new User_model_1.default({
            firstName,
            lastName,
            userName,
            email,
            password: hashedPassword,
            role: "INSTRUCTOR",
            bio,
            userDob,
            address,
            phoneNumber,
            specialization,
            experience,
            emailVerificationStatus: false,
            phoneNumberVerificationStatus: false,
        });
        await newTeacher.save();
        return res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            data: newTeacher,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}
