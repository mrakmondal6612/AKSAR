"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetPostById = exports.handleGetCommunityStats = exports.handleFlagPost = exports.handleDeletePost = exports.handleRejectPost = exports.handleApprovePost = exports.handleGetAllPosts = void 0;
const CommunityPost_model_1 = __importDefault(require("../../models/CommunityPost.model"));
const CommunityPost_model_2 = require("../../models/CommunityPost.model");
const handleGetAllPosts = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const query = {};
        if (status && status !== "ALL") {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { content: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [posts, total] = await Promise.all([
            CommunityPost_model_1.default.find(query)
                .populate("user", "firstName lastName email userName profileImageUrl")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            CommunityPost_model_1.default.countDocuments(query),
        ]);
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
        console.error("Error fetching posts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetAllPosts = handleGetAllPosts;
const handleApprovePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await CommunityPost_model_1.default.findOne({ postId });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        post.status = CommunityPost_model_2.PostStatus.APPROVED;
        await post.save();
        res.status(200).json({
            success: true,
            message: "Post approved successfully",
            data: post,
        });
    }
    catch (error) {
        console.error("Error approving post:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleApprovePost = handleApprovePost;
const handleRejectPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;
        const post = await CommunityPost_model_1.default.findOne({ postId });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        post.status = CommunityPost_model_2.PostStatus.REJECTED;
        await post.save();
        res.status(200).json({
            success: true,
            message: "Post rejected successfully",
            data: post,
        });
    }
    catch (error) {
        console.error("Error rejecting post:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleRejectPost = handleRejectPost;
const handleDeletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await CommunityPost_model_1.default.findOneAndDelete({ postId });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleDeletePost = handleDeletePost;
const handleFlagPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;
        const post = await CommunityPost_model_1.default.findOne({ postId });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        post.status = CommunityPost_model_2.PostStatus.FLAGGED;
        await post.save();
        res.status(200).json({
            success: true,
            message: "Post flagged successfully",
            data: post,
        });
    }
    catch (error) {
        console.error("Error flagging post:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleFlagPost = handleFlagPost;
const handleGetCommunityStats = async (req, res) => {
    try {
        const stats = await CommunityPost_model_1.default.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        const totalPosts = await CommunityPost_model_1.default.countDocuments();
        const totalLikes = await CommunityPost_model_1.default.aggregate([
            {
                $project: {
                    likeCount: { $size: "$likes" },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$likeCount" },
                },
            },
        ]);
        const totalComments = await CommunityPost_model_1.default.aggregate([
            {
                $project: {
                    commentCount: { $size: "$comments" },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$commentCount" },
                },
            },
        ]);
        const statusMap = {
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            FLAGGED: 0,
        };
        stats.forEach((stat) => {
            statusMap[stat._id] = stat.count;
        });
        res.status(200).json({
            success: true,
            data: {
                total: totalPosts,
                pending: statusMap.PENDING,
                approved: statusMap.APPROVED,
                rejected: statusMap.REJECTED,
                flagged: statusMap.FLAGGED,
                totalLikes: totalLikes[0]?.total || 0,
                totalComments: totalComments[0]?.total || 0,
            },
        });
    }
    catch (error) {
        console.error("Error fetching community stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetCommunityStats = handleGetCommunityStats;
const handleGetPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await CommunityPost_model_1.default.findOne({ postId })
            .populate("user", "firstName lastName email userName profileImageUrl")
            .populate("comments.user", "firstName lastName userName profileImageUrl");
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }
        res.status(200).json({
            success: true,
            data: post,
        });
    }
    catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.handleGetPostById = handleGetPostById;
