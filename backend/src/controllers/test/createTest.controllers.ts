import { Response, Request } from "express";
import Test from "../../models/Test.model";
import { nanoid } from "nanoid";
import Course from "../../models/Course.model";
import User from "../../models/User.model";

export const handleCreateTestFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      description,
      course,
      questions,
      duration,
      passingScore,
      difficulty,
      instructions,
      allowRetake,
      maxAttempts,
      shuffleQuestions,
      showResults,
      tags,
    } = req.body;

    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    // Validate required fields
    if (!title || !description || !course || !duration) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, description, course, and duration are required",
      });
    }

    // Validate questions array
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    // Verify course exists
    const courseExists = await Course.findOne({ courseId: course });
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Verify user is instructor or admin
    const user = await User.findOne({ uniqueId: userId });
    if (!user || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN" && user.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "Only instructors and admins can create tests",
      });
    }

    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    // Process questions with order
    const processedQuestions = questions.map((q, index) => ({
      ...q,
      order: index + 1,
    }));

    // Calculate total points
    const totalPoints = processedQuestions.reduce(
      (sum, q) => sum + (q.points || 1),
      0
    );

    const testId = nanoid();

    const newTest = new Test({
      testId,
      title,
      description,
      course,
      createdBy: userId,
      questions: processedQuestions,
      duration,
      totalPoints,
      passingScore: passingScore || 60,
      difficulty: difficulty || "INTERMEDIATE",
      status: "DRAFT",
      instructions,
      allowRetake: allowRetake || false,
      maxAttempts: maxAttempts || 1,
      shuffleQuestions: shuffleQuestions || false,
      showResults: showResults !== undefined ? showResults : true,
      tags: tags || [],
    });

    await newTest.save();

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      data: newTest,
    });
  } catch (error) {
    console.error("Error creating test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleUpdateTestFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId } = req.params;
    const updateData = req.body;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const test = await Test.findOne({ testId });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Verify user is the creator or admin
    const user = await User.findOne({ uniqueId: userId });
    if (!user || (test.createdBy !== userId && user.role !== "ADMIN" && user.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this test",
      });
    }

    // If questions are being updated, recalculate total points and order
    if (updateData.questions && Array.isArray(updateData.questions)) {
      updateData.questions = updateData.questions.map((q: any, index: number) => ({
        ...q,
        order: index + 1,
      }));
      updateData.totalPoints = updateData.questions.reduce(
        (sum: number, q: any) => sum + (q.points || 1),
        0
      );
    }

    const updatedTest = await Test.findOneAndUpdate(
      { testId },
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Test updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    console.error("Error updating test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handlePublishTestFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId } = req.params;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const test = await Test.findOne({ testId });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Verify user is the creator or admin
    const user = await User.findOne({ uniqueId: userId });
    if (!user || (test.createdBy !== userId && user.role !== "ADMIN" && user.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to publish this test",
      });
    }

    if (test.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish a test without questions",
      });
    }

    test.status = "PUBLISHED";
    await test.save();

    res.status(200).json({
      success: true,
      message: "Test published successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error publishing test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleDeleteTestFunction = async (
  req: Request,
  res: Response
) => {
  try {
    const { testId } = req.params;
    const userId = (req as any).user?.uniqueId || (req as any).userUniqueId;

    const test = await Test.findOne({ testId });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Verify user is the creator or admin
    const user = await User.findOne({ uniqueId: userId });
    if (!user || (test.createdBy !== userId && user.role !== "ADMIN" && user.role !== "MASTER")) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this test",
      });
    }

    await Test.deleteOne({ testId });

    res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
