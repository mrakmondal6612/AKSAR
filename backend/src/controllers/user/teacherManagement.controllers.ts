import { Response } from "express";
import User from "../../models/User.model";
import { AuthenticatedAdminRequest } from "../../middleware/auth.middleware";

// Get all teachers (for admin/instructor)
export async function handleGetAllTeachers(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    const filter: any = { role: "INSTRUCTOR" };
    
    if (search && typeof search === "string") {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const teachers = await User.find(filter)
      .select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get teacher details by ID
export async function handleGetTeacherById(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findById(teacherId).select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (teacher.role !== "INSTRUCTOR") {
      return res.status(400).json({ success: false, message: "User is not a teacher" });
    }

    return res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Update teacher details
export async function handleUpdateTeacher(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { teacherId } = req.params;
    const { firstName, lastName, userName, email, bio, userDob, address, phoneNumber, specialization, experience } = req.body;

    const teacher = await User.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (teacher.role !== "INSTRUCTOR") {
      return res.status(400).json({ success: false, message: "User is not a teacher" });
    }

    // Update fields
    if (firstName) teacher.firstName = firstName;
    if (lastName !== undefined) teacher.lastName = lastName;
    if (userName) teacher.userName = userName;
    if (email) teacher.email = email;
    if (bio !== undefined) teacher.bio = bio;
    if (userDob !== undefined) teacher.userDob = userDob;
    if (address) teacher.address = address;
    if (phoneNumber) teacher.phoneNumber = phoneNumber;
    if (specialization !== undefined) teacher.specialization = specialization;
    if (experience !== undefined) teacher.experience = experience;

    await teacher.save();

    return res.status(200).json({ success: true, message: "Teacher updated successfully", data: teacher });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Delete teacher
export async function handleDeleteTeacher(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { teacherId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    // Verify admin password
    const admin = await User.findById(req.userId);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const bcrypt = require("bcryptjs");
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (teacher.role !== "INSTRUCTOR") {
      return res.status(400).json({ success: false, message: "User is not a teacher" });
    }

    await User.findByIdAndDelete(teacherId);

    return res.status(200).json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get teacher statistics
export async function handleGetTeacherStats(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const totalTeachers = await User.countDocuments({ role: "INSTRUCTOR" });
    const verifiedEmails = await User.countDocuments({ role: "INSTRUCTOR", emailVerificationStatus: true });
    const verifiedPhones = await User.countDocuments({ role: "INSTRUCTOR", phoneNumberVerificationStatus: true });
    
    const recentTeachers = await User.find({ role: "INSTRUCTOR" })
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Toggle teacher email verification status
export async function handleToggleTeacherEmailVerification(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findById(teacherId);
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Create new teacher (admin only)
export async function handleCreateTeacher(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { firstName, lastName, userName, email, password, bio, userDob, address, phoneNumber, specialization, experience } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email or username already exists" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = new User({
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
