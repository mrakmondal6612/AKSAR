import { Request, Response } from "express";
import { Feedback } from "../../models/Feedback.model";
import User from "../../models/User.model";

export const handleCreateFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, message } = req.body;
    const userId = (req as any).userId; // Set by authenticateToken middleware

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
      return;
    }

    if (!rating || !message) {
      res.status(400).json({ success: false, message: "Rating and message are required." });
      return;
    }

    // Find the logged-in user in database to retrieve name & email
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User account not found." });
      return;
    }

    const newFeedback = await Feedback.create({
      user: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      rating: Number(rating),
      message,
    });

    res.status(201).json({
      success: true,
      message: "Thank you for your feedback!",
      data: newFeedback,
    });
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const handleGetFeedbacks = async (req: Request, res: Response): Promise<void> => {
  try {
    // Return high-rating feedbacks (4 or 5 stars) to display on the landing page
    const feedbacks = await Feedback.find({ rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: feedbacks,
    });
  } catch (error: any) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
