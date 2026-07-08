import { Response, Request } from "express";
import Test from "../../models/Test.model";
import TestAttempt from "../../models/TestAttempt.model";
import CourseEnrollment from "../../models/CourseEnrollment.model";
import User from "../../models/User.model";
import Course from "../../models/Course.model";
import Notification from "../../models/Notification.model";

export const handleAutoAssignTestFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { courseId, userId } = req.body;

    // Find the course
    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find published tests for this course
    const tests = await Test.find({
      course: courseId,
      status: "PUBLISHED",
    });

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tests available for this course",
      });
    }

    // Check if user has already been assigned or taken tests for this course
    const user = await User.findOne({ uniqueId: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get test IDs the user has already attempted
    const userAttempts = await TestAttempt.find({
      user: userId,
      course: courseId,
    });
    const attemptedTestIds = userAttempts.map((attempt) => attempt.test);

    // Filter out tests the user has already attempted
    const availableTests = tests.filter(
      (test) => !attemptedTestIds.includes(test.testId)
    );

    if (availableTests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All tests for this course have been attempted",
        data: [],
      });
    }

    // Assign the first available test (or could implement logic to assign based on difficulty)
    const assignedTest = availableTests[0];

    // Create notification for test assignment
    try {
      const notification = new Notification({
        user: userId,
        type: "TEST_ASSIGNED",
        title: "Test Assigned",
        message: `You have been assigned a new test for ${course.courseName}: ${assignedTest.title}`,
        relatedId: assignedTest.testId,
        relatedType: "TEST",
        isRead: false,
      });
      await notification.save();
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Continue even if notification fails
    }

    res.status(200).json({
      success: true,
      message: "Test assigned successfully",
      data: {
        testId: assignedTest.testId,
        title: assignedTest.title,
        description: assignedTest.description,
        duration: assignedTest.duration,
        totalPoints: assignedTest.totalPoints,
        passingScore: assignedTest.passingScore,
        difficulty: assignedTest.difficulty,
        courseName: course.courseName,
      },
    });
  } catch (error) {
    console.error("Error auto-assigning test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleCheckCourseCompletionFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { courseId, userId } = req.params;

    // Find the course
    const course = await Course.findOne({ courseId });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get user's progress for this course
    const user = await User.findOne({ uniqueId: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const courseProgress = user.progress.find((p: any) => p.courseId === courseId);
    
    if (!courseProgress) {
      return res.status(200).json({
        success: true,
        isCompleted: false,
        completedVideos: 0,
        totalVideos: course.videos?.length || 0,
        message: "No progress found for this course",
      });
    }

    const totalVideos = course.videos?.length || 0;
    const completedVideos = courseProgress.completedVideos?.length || 0;
    const isCompleted = totalVideos > 0 && completedVideos >= totalVideos;

    // Update course enrollment status if completed
    if (isCompleted) {
      await CourseEnrollment.findOneAndUpdate(
        { user: userId, course: courseId },
        { status: "completed", endDate: new Date() }
      );
    }

    res.status(200).json({
      success: true,
      isCompleted,
      completedVideos,
      totalVideos,
      percentage: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0,
    });
  } catch (error) {
    console.error("Error checking course completion:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleCompleteCourseAndAssignTestFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { courseId } = req.params;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    // First check if course is completed
    const completionCheck: any = await handleCheckCourseCompletionFunction(
      { params: { courseId, userId } } as any,
      { status: () => {}, json: (data: any) => data } as any
    );

    if (!completionCheck || !completionCheck.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "Course is not yet completed",
        data: completionCheck,
      });
    }

    // Auto-assign test
    const testAssignment = await handleAutoAssignTestFunction(
      { body: { courseId, userId } } as any,
      { status: () => {}, json: (data: any) => data } as any
    );

    res.status(200).json({
      success: true,
      message: "Course completed and test assigned",
      completion: completionCheck,
      testAssignment,
    });
  } catch (error) {
    console.error("Error completing course and assigning test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
