import { Response } from "express";
import User from "../../models/User.model";
import { AuthenticatedAdminRequest } from "../../middleware/auth.middleware";

// Get all students (for admin/instructor)
export async function handleGetAllStudents(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    
    const filter: any = { role: "STUDENT" };
    
    if (search && typeof search === "string") {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const students = await User.find(filter)
      .select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get student details by ID
export async function handleGetStudentById(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select("-password -emailVerificationOTP -emailVerificationOTPExpires -passwordResetOTP -passwordResetOTPExpires");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ success: false, message: "User is not a student" });
    }

    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Update student details
export async function handleUpdateStudent(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { studentId } = req.params;
    const { firstName, lastName, userName, email, bio, userDob, address, phoneNumber } = req.body;

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ success: false, message: "User is not a student" });
    }

    // Update fields
    if (firstName) student.firstName = firstName;
    if (lastName !== undefined) student.lastName = lastName;
    if (userName) student.userName = userName;
    if (email) student.email = email;
    if (bio !== undefined) student.bio = bio;
    if (userDob !== undefined) student.userDob = userDob;
    if (address) student.address = address;
    if (phoneNumber) student.phoneNumber = phoneNumber;

    await student.save();

    return res.status(200).json({ success: true, message: "Student updated successfully", data: student });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Delete student
export async function handleDeleteStudent(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { studentId } = req.params;
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

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.role !== "STUDENT") {
      return res.status(400).json({ success: false, message: "User is not a student" });
    }

    await User.findByIdAndDelete(studentId);

    return res.status(200).json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get student statistics
export async function handleGetStudentStats(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const totalStudents = await User.countDocuments({ role: "STUDENT" });
    const verifiedEmails = await User.countDocuments({ role: "STUDENT", emailVerificationStatus: true });
    const verifiedPhones = await User.countDocuments({ role: "STUDENT", phoneNumberVerificationStatus: true });
    
    const recentStudents = await User.find({ role: "STUDENT" })
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Toggle student email verification status
export async function handleToggleStudentEmailVerification(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get student enrolled courses
export async function handleGetStudentEnrolledCourses(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId).populate("enrolledIn");
    
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
