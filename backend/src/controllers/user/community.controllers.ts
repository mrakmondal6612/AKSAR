import { Response, Request } from "express";
import CommunityPost from "../../models/CommunityPost.model";
import User from "../../models/User.model";
import { PostStatus } from "../../models/CommunityPost.model";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";

export const handleGetApprovedPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await CommunityPost.find({ status: PostStatus.APPROVED })
      .populate("user", "firstName lastName userName profileImageUrl")
      .populate("comments.user", "firstName lastName userName profileImageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await CommunityPost.countDocuments({ status: PostStatus.APPROVED });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching approved community posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleCreateUserPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, category, tags } = req.body;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Post content is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const postId = `POST_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Set APPROVED by default except for Notes which need moderation/approval for points
    const isNotes = category?.toLowerCase() === "notes" || category?.toLowerCase() === "note";
    const status = isNotes ? PostStatus.PENDING : PostStatus.APPROVED;

    const newPost = new CommunityPost({
      postId,
      user: userId,
      content,
      category: category || "General",
      tags: tags || [],
      status,
      likes: [],
      comments: [],
    });

    await newPost.save();

    const populatedPost = await CommunityPost.findById(newPost._id)
      .populate("user", "firstName lastName userName profileImageUrl");

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: populatedPost,
    });
  } catch (error) {
    console.error("Error creating community post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleToggleLikePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const post = await CommunityPost.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userIndex = post.likes.indexOf(userId);
    let isLiked = false;

    if (userIndex > -1) {
      post.likes.splice(userIndex, 1);
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    await post.save();

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleAddCommentPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const post = await CommunityPost.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const newComment = {
      user: userId!,
      content,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    // Populate comments user details to return the updated comments list
    const populatedPost = await CommunityPost.findById(post._id)
      .populate("comments.user", "firstName lastName userName profileImageUrl");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comments: populatedPost?.comments || [],
    });
  } catch (error) {
    console.error("Error commenting on post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleApproveComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId; // MongoDB _id of the requester

    const post = await CommunityPost.findOne({ postId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Verify requester is the owner of the post
    if (post.user.toString() !== userId?.toString()) {
      // Allow Admin or Master to approve too
      const requester = await User.findById(userId);
      if (!requester || (requester.role !== "ADMIN" && requester.role !== "MASTER")) {
        return res.status(403).json({
          success: false,
          message: "Only the post owner or an admin can approve an answer",
        });
      }
    }

    const comment = (post.comments as any).id 
      ? (post.comments as any).id(commentId)
      : post.comments.find((c: any) => c._id?.toString() === commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.isApprovedAnswer) {
      return res.status(400).json({
        success: false,
        message: "This comment is already approved as the answer",
      });
    }

    comment.isApprovedAnswer = true;
    await post.save();

    // Award 10 points to the comment author
    try {
      const commentAuthor = await User.findById(comment.user);
      if (commentAuthor) {
        const { awardPoints } = await import("../../services/reward.service");
        await awardPoints(
          commentAuthor.uniqueId,
          10,
          "DOUBT_ANSWER",
          `Your answer was approved on post: ${post.content.substring(0, 30)}...`,
          `doubt_answer_${commentAuthor.uniqueId}_${commentId}`
        );
      }
    } catch (rewardError) {
      console.error("Failed to award points for doubt answer approval:", rewardError);
    }

    res.status(200).json({
      success: true,
      message: "Comment approved as correct answer successfully",
      comments: post.comments,
    });
  } catch (error) {
    console.error("Error approving comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve comment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
