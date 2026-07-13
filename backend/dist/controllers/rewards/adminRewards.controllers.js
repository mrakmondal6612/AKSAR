"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAdjustPointsAdmin = exports.handleGetAdminStats = exports.handleProcessRedemption = exports.handleGetAllRedemptionsAdmin = exports.handleDeleteRewardItem = exports.handleUpdateRewardItem = exports.handleCreateRewardItem = exports.handleGetAdminRewards = void 0;
const Reward_model_1 = __importDefault(require("../../models/Reward.model"));
const Redemption_model_1 = __importStar(require("../../models/Redemption.model"));
const Transaction_model_1 = __importStar(require("../../models/Transaction.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const nanoid_1 = require("nanoid");
const mongoose_1 = __importDefault(require("mongoose"));
// ── Get All Rewards for Admin Management ──
const handleGetAdminRewards = async (req, res) => {
    try {
        const rewards = await Reward_model_1.default.find({ isDeleted: false }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: rewards,
        });
    }
    catch (error) {
        console.error("Error fetching admin rewards:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleGetAdminRewards = handleGetAdminRewards;
// ── Create New Reward Item ──
const handleCreateRewardItem = async (req, res) => {
    try {
        const { name, description, pointCost, type, stock, maxStock, badgeUrl, durationDays } = req.body;
        if (!name || !description || pointCost === undefined || !type || stock === undefined || maxStock === undefined) {
            return res.status(400).json({ success: false, message: "Missing required details" });
        }
        const rewardId = `RW-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
        const newReward = await Reward_model_1.default.create({
            rewardId,
            name,
            description,
            pointCost: Number(pointCost),
            type,
            stock: Number(stock),
            maxStock: Number(maxStock),
            badgeUrl,
            durationDays: durationDays ? Number(durationDays) : undefined,
        });
        return res.status(201).json({
            success: true,
            message: "Reward item created successfully!",
            data: newReward,
        });
    }
    catch (error) {
        console.error("Error creating reward item:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleCreateRewardItem = handleCreateRewardItem;
// ── Update Reward Item ──
const handleUpdateRewardItem = async (req, res) => {
    try {
        const { rewardId } = req.params;
        const updateData = req.body;
        const reward = await Reward_model_1.default.findOne({ rewardId, isDeleted: false });
        if (!reward) {
            return res.status(404).json({ success: false, message: "Reward item not found" });
        }
        const updatedReward = await Reward_model_1.default.findOneAndUpdate({ rewardId }, { $set: updateData }, { new: true });
        return res.status(200).json({
            success: true,
            message: "Reward item updated successfully!",
            data: updatedReward,
        });
    }
    catch (error) {
        console.error("Error updating reward item:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleUpdateRewardItem = handleUpdateRewardItem;
// ── Delete Reward Item (Soft Delete) ──
const handleDeleteRewardItem = async (req, res) => {
    try {
        const { rewardId } = req.params;
        const reward = await Reward_model_1.default.findOne({ rewardId, isDeleted: false });
        if (!reward) {
            return res.status(404).json({ success: false, message: "Reward item not found" });
        }
        reward.isDeleted = true;
        await reward.save();
        return res.status(200).json({
            success: true,
            message: "Reward item deleted successfully!",
        });
    }
    catch (error) {
        console.error("Error deleting reward item:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleDeleteRewardItem = handleDeleteRewardItem;
// ── Get All User Redemptions ──
const handleGetAllRedemptionsAdmin = async (req, res) => {
    try {
        // Populate user profile info and reward metadata
        const redemptions = await Redemption_model_1.default.find()
            .populate("reward")
            .sort({ createdAt: -1 });
        // Manually map user details since uniqueId reference isn't a native ObjectId ref
        const populated = await Promise.all(redemptions.map(async (r) => {
            const u = await User_model_1.default.findOne({ uniqueId: r.user });
            const obj = r.toObject();
            obj.user = u
                ? {
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    userName: u.userName,
                }
                : {
                    firstName: "Unknown",
                    lastName: "User",
                    email: r.user,
                };
            return obj;
        }));
        return res.status(200).json({
            success: true,
            data: populated,
        });
    }
    catch (error) {
        console.error("Error fetching redemptions for admin:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleGetAllRedemptionsAdmin = handleGetAllRedemptionsAdmin;
// ── Process Redemption Order (Approve/Reject) ──
const handleProcessRedemption = async (req, res) => {
    try {
        const { redemptionId } = req.params;
        const { status, remarks, couponCode } = req.body; // status must be COMPLETED or REJECTED
        if (![Redemption_model_1.RedemptionStatus.COMPLETED, Redemption_model_1.RedemptionStatus.REJECTED].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status status value" });
        }
        const redemption = await Redemption_model_1.default.findOne({ redemptionId }).populate("reward");
        if (!redemption) {
            return res.status(404).json({ success: false, message: "Redemption record not found" });
        }
        if (redemption.status !== Redemption_model_1.RedemptionStatus.PENDING) {
            return res.status(400).json({ success: false, message: "This redemption order has already been processed" });
        }
        redemption.status = status;
        if (!redemption.benefitDetails) {
            redemption.benefitDetails = {};
        }
        if (remarks) {
            redemption.benefitDetails.description = remarks;
        }
        const reward = redemption.reward;
        if (status === Redemption_model_1.RedemptionStatus.COMPLETED) {
            if (couponCode) {
                redemption.benefitDetails.couponCode = couponCode;
            }
            await redemption.save();
        }
        else if (status === Redemption_model_1.RedemptionStatus.REJECTED) {
            // Refund points to user
            const user = await User_model_1.default.findOne({ uniqueId: redemption.user });
            if (user) {
                user.points = (user.points || 0) + redemption.pointsSpent;
                await user.save();
                // Restore reward stock
                if (reward) {
                    reward.stock += 1;
                    await reward.save();
                }
                // Log refund transaction
                const transactionId = `TX-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
                await Transaction_model_1.default.create({
                    transactionId,
                    user: redemption.user,
                    points: redemption.pointsSpent,
                    type: Transaction_model_1.TransactionType.ADMIN_ADJUSTMENT,
                    activityType: "REFUND",
                    description: `Refunded points for rejected reward order: ${reward?.name || "Product"} (+${redemption.pointsSpent} points)`,
                });
            }
            await redemption.save();
        }
        return res.status(200).json({
            success: true,
            message: `Redemption order status updated to ${status} successfully!`,
            data: redemption,
        });
    }
    catch (error) {
        console.error("Error processing redemption:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleProcessRedemption = handleProcessRedemption;
// ── Get Admin Rewards Statistics ──
const handleGetAdminStats = async (req, res) => {
    try {
        const [totalItems, totalRedeemed, pendingRedeemed] = await Promise.all([
            Reward_model_1.default.countDocuments({ isDeleted: false }),
            Redemption_model_1.default.countDocuments({ status: Redemption_model_1.RedemptionStatus.COMPLETED }),
            Redemption_model_1.default.countDocuments({ status: Redemption_model_1.RedemptionStatus.PENDING }),
        ]);
        const completedRedemptions = await Redemption_model_1.default.find({ status: Redemption_model_1.RedemptionStatus.COMPLETED });
        const totalPointsSpent = completedRedemptions.reduce((sum, r) => sum + r.pointsSpent, 0);
        return res.status(200).json({
            success: true,
            data: {
                totalItems,
                totalRedeemed,
                pendingRedeemed,
                totalPointsSpent,
            },
        });
    }
    catch (error) {
        console.error("Error fetching rewards statistics:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleGetAdminStats = handleGetAdminStats;
// ── Manual Points Adjustment for Student ──
const handleAdjustPointsAdmin = async (req, res) => {
    try {
        const { studentUniqueId, points, reason } = req.body;
        if (!studentUniqueId || points === undefined) {
            return res.status(400).json({ success: false, message: "Student UniqueID and points are required" });
        }
        let user = null;
        const queryStr = studentUniqueId.toString().trim();
        // 1. Try to find by uniqueId
        user = await User_model_1.default.findOne({ uniqueId: queryStr });
        // 2. Try to find by MongoDB ObjectId
        if (!user && mongoose_1.default.Types.ObjectId.isValid(queryStr)) {
            user = await User_model_1.default.findById(queryStr);
        }
        // 3. Try to find by email
        if (!user) {
            user = await User_model_1.default.findOne({ email: queryStr });
        }
        // 4. Try to find by userName
        if (!user) {
            user = await User_model_1.default.findOne({ userName: queryStr });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "Student not found with this ID, Email, or Username" });
        }
        const adjustmentAmount = Number(points);
        user.points = (user.points || 0) + adjustmentAmount;
        // Prevent negative points
        if (user.points < 0) {
            user.points = 0;
        }
        if (adjustmentAmount > 0) {
            user.lifetimePoints = (user.lifetimePoints || 0) + adjustmentAmount;
        }
        await user.save();
        // Log transaction
        const transactionId = `TX-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
        await Transaction_model_1.default.create({
            transactionId,
            user: user.uniqueId,
            points: adjustmentAmount,
            type: Transaction_model_1.TransactionType.ADMIN_ADJUSTMENT,
            activityType: "ADMIN_ADJUSTMENT",
            description: reason || `Admin adjusted points by ${adjustmentAmount > 0 ? "+" : ""}${adjustmentAmount}`,
        });
        return res.status(200).json({
            success: true,
            message: `Adjusted points for ${user.firstName} ${user.lastName || ""} by ${adjustmentAmount > 0 ? "+" : ""}${adjustmentAmount} points successfully!`,
            data: {
                points: user.points,
            },
        });
    }
    catch (error) {
        console.error("Error adjusting student points:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleAdjustPointsAdmin = handleAdjustPointsAdmin;
