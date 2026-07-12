"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAddCommentPost = exports.handleToggleLikePost = exports.handleCreateUserPost = exports.handleGetApprovedPosts = void 0;
const CommunityPost_model_1 = __importDefault(require("../../models/CommunityPost.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const CommunityPost_model_2 = require("../../models/CommunityPost.model");
const handleGetApprovedPosts = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const posts = await CommunityPost_model_1.default.find({ status: CommunityPost_model_2.PostStatus.APPROVED })
            .populate("user", "firstName lastName userName profileImageUrl")
            .populate("comments.user", "firstName lastName userName profileImageUrl")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await CommunityPost_model_1.default.countDocuments({ status: CommunityPost_model_2.PostStatus.APPROVED });
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
    }
    catch (error) {
        console.error("Error fetching approved community posts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch posts",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetApprovedPosts = handleGetApprovedPosts;
const handleCreateUserPost = async (req, res) => {
    try {
        const { content, category, tags } = req.body;
        const userId = req.userId;
        if (!content) {
            return res.status(400).json({
                success: false,
                message: "Post content is required",
            });
        }
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const postId = `POST_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        // Set APPROVED by default so it displays immediately on the page
        const newPost = new CommunityPost_model_1.default({
            postId,
            user: userId,
            content,
            category: category || "General",
            tags: tags || [],
            status: CommunityPost_model_2.PostStatus.APPROVED,
            likes: [],
            comments: [],
        });
        await newPost.save();
        const populatedPost = await CommunityPost_model_1.default.findById(newPost._id)
            .populate("user", "firstName lastName userName profileImageUrl");
        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: populatedPost,
        });
    }
    catch (error) {
        console.error("Error creating community post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create post",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleCreateUserPost = handleCreateUserPost;
const handleToggleLikePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        const post = await CommunityPost_model_1.default.findOne({ postId });
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
        }
        else {
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
    }
    catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to toggle like",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleToggleLikePost = handleToggleLikePost;
const handleAddCommentPost = async (req, res) => {
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
        const post = await CommunityPost_model_1.default.findOne({ postId });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        const newComment = {
            user: userId,
            content,
            createdAt: new Date(),
        };
        post.comments.push(newComment);
        await post.save();
        // Populate comments user details to return the updated comments list
        const populatedPost = await CommunityPost_model_1.default.findById(post._id)
            .populate("comments.user", "firstName lastName userName profileImageUrl");
        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comments: populatedPost?.comments || [],
        });
    }
    catch (error) {
        console.error("Error commenting on post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add comment",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleAddCommentPost = handleAddCommentPost;
