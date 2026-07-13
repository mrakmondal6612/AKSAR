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
exports.handleVerifyPointsPurchase = exports.handleCreatePointsOrder = exports.handleGetHistory = exports.handleGetMyRewards = exports.handleRedeemReward = exports.handleGetStore = exports.handleClaimDaily = void 0;
const Reward_model_1 = __importStar(require("../../models/Reward.model"));
const Redemption_model_1 = __importStar(require("../../models/Redemption.model"));
const Transaction_model_1 = __importStar(require("../../models/Transaction.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const nanoid_1 = require("nanoid");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
let razorpayInstance = null;
const getRazorpayInstance = () => {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
        }
        razorpayInstance = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
};
// ── Daily Claim Points ──
const handleClaimDaily = async (req, res) => {
    try {
        const userId = req.userUniqueId;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authenticated" });
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        // Check if claimed today
        const claimedToday = await Transaction_model_1.default.findOne({
            user: userId,
            activityType: "DAILY_CLAIM",
            createdAt: { $gte: todayStart },
        });
        if (claimedToday) {
            return res.status(400).json({ success: false, message: "You have already claimed your daily reward today" });
        }
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Daily streak logic
        let pointsToEarn = 10;
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const claimedYesterday = await Transaction_model_1.default.findOne({
            user: userId,
            activityType: "DAILY_CLAIM",
            createdAt: { $gte: yesterdayStart, $lt: todayStart },
        });
        if (claimedYesterday) {
            user.currentStreak = (user.currentStreak || 0) + 1;
            // Bonus every 7 days streak
            if (user.currentStreak % 7 === 0) {
                pointsToEarn += 50;
            }
        }
        else {
            user.currentStreak = 1;
        }
        // Add points
        user.points = (user.points || 0) + pointsToEarn;
        user.lifetimePoints = (user.lifetimePoints || 0) + pointsToEarn;
        user.lastActivityDate = new Date();
        await user.save();
        // Log transaction
        const transactionId = `TX-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
        await Transaction_model_1.default.create({
            transactionId,
            user: userId,
            points: pointsToEarn,
            type: Transaction_model_1.TransactionType.EARNED,
            activityType: "DAILY_CLAIM",
            description: `Claimed daily streak reward! Day ${user.currentStreak} (${pointsToEarn} points)`,
        });
        return res.status(200).json({
            success: true,
            message: `Claimed ${pointsToEarn} points successfully! Streak: ${user.currentStreak} days`,
            data: {
                points: user.points,
                streak: user.currentStreak,
            },
        });
    }
    catch (error) {
        console.error("Error in daily claim:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleClaimDaily = handleClaimDaily;
// ── Get All Rewards in Store ──
const handleGetStore = async (req, res) => {
    try {
        const storeItems = await Reward_model_1.default.find({ isDeleted: false, stock: { $gt: 0 } }).sort({ pointCost: 1 });
        return res.status(200).json({
            success: true,
            data: storeItems,
        });
    }
    catch (error) {
        console.error("Error fetching rewards store:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleGetStore = handleGetStore;
// ── Redeem a Reward ──
const handleRedeemReward = async (req, res) => {
    try {
        const userId = req.userUniqueId;
        const { rewardId } = req.body;
        if (!userId || !rewardId) {
            return res.status(400).json({ success: false, message: "Missing required details" });
        }
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const reward = await Reward_model_1.default.findOne({ rewardId, isDeleted: false });
        if (!reward) {
            return res.status(404).json({ success: false, message: "Reward item not found or out of stock" });
        }
        if (reward.stock <= 0) {
            return res.status(400).json({ success: false, message: "This item is currently out of stock" });
        }
        if ((user.points || 0) < reward.pointCost) {
            return res.status(400).json({ success: false, message: "Insufficient reward points balance" });
        }
        // Deduct points
        user.points = (user.points || 0) - reward.pointCost;
        await user.save();
        // Deduct stock
        reward.stock -= 1;
        await reward.save();
        // Create redemption
        const redemptionId = `RDM-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
        const benefitDetails = {
            description: `Redeemed ${reward.name}`,
        };
        // If COUPON type, generate a random code
        if (reward.type === Reward_model_1.RewardType.COUPON) {
            benefitDetails.couponCode = `AKSR-${(0, nanoid_1.nanoid)(6).toUpperCase()}`;
        }
        // If PREMIUM ACCESS, calculate premium expiry date
        if (reward.type === Reward_model_1.RewardType.DIGITAL_ACCESS) {
            const duration = reward.durationDays || 30;
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + duration);
            benefitDetails.premiumExpiry = expiry;
            // Update user unlock profile directly
            if (!user.unlockedUpgrades)
                user.unlockedUpgrades = [];
            user.unlockedUpgrades.push(reward.name);
            user.premiumExpiry = expiry;
            await user.save();
        }
        const redemption = await Redemption_model_1.default.create({
            redemptionId,
            user: userId,
            reward: reward._id,
            pointsSpent: reward.pointCost,
            status: reward.type === Reward_model_1.RewardType.COUPON || reward.type === Reward_model_1.RewardType.DIGITAL_ACCESS
                ? Redemption_model_1.RedemptionStatus.COMPLETED // Auto completed for digital coupons
                : Redemption_model_1.RedemptionStatus.PENDING, // Needs admin shipping/approval for physical products
            benefitDetails,
        });
        // Log spend transaction
        const transactionId = `TX-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
        await Transaction_model_1.default.create({
            transactionId,
            user: userId,
            points: -reward.pointCost,
            type: Transaction_model_1.TransactionType.SPENT,
            activityType: "REDEEM",
            description: `Redeemed ${reward.name} (-${reward.pointCost} points)`,
        });
        return res.status(200).json({
            success: true,
            message: `Redeemed ${reward.name} successfully!`,
            data: redemption,
        });
    }
    catch (error) {
        console.error("Error redeeming reward:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleRedeemReward = handleRedeemReward;
// ── Get My Redeemed Rewards ──
const handleGetMyRewards = async (req, res) => {
    try {
        const userId = req.userUniqueId;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authenticated" });
        }
        const myRedemptions = await Redemption_model_1.default.find({ user: userId })
            .populate("reward")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: myRedemptions,
        });
    }
    catch (error) {
        console.error("Error fetching my rewards:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleGetMyRewards = handleGetMyRewards;
// ── Get Points Transaction History ──
const handleGetHistory = async (req, res) => {
    try {
        const userId = req.userUniqueId;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User not authenticated" });
        }
        const historyItems = await Transaction_model_1.default.find({ user: userId }).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: historyItems,
        });
    }
    catch (error) {
        console.error("Error fetching transaction history:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.handleGetHistory = handleGetHistory;
// ── Create Points Purchase Order ──
const handleCreatePointsOrder = async (req, res) => {
    try {
        const { pointsAmount } = req.body;
        const userId = req.userUniqueId;
        if (!pointsAmount || Number(pointsAmount) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid points amount" });
        }
        const rzp = getRazorpayInstance();
        // Conversion rate: 10 points = 1 INR (1 point = 0.1 INR)
        // Custom discount calculations:
        const points = Number(pointsAmount);
        let price = Math.round(points * 0.1); // in INR
        if (points === 2500)
            price = 230; // discount package
        if (points === 5000)
            price = 450; // discount package
        const options = {
            amount: price * 100, // Razorpay expects amount in paise
            currency: "INR",
            receipt: `PTS_${(0, nanoid_1.nanoid)(6).toUpperCase()}`,
            notes: {
                userId: userId || "",
                points: points.toString(),
                price: price.toString(),
            },
        };
        const order = await rzp.orders.create(options);
        return res.status(200).json({
            success: true,
            order,
            points,
            amount: price,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    }
    catch (error) {
        console.error("Error creating points order:", error);
        return res.status(500).json({ success: false, message: "Failed to initiate point purchase order" });
    }
};
exports.handleCreatePointsOrder = handleCreatePointsOrder;
// ── Verify Points Purchase Payment ──
const handleVerifyPointsPurchase = async (req, res) => {
    try {
        const { orderId, paymentId, signature, pointsAmount } = req.body;
        const userId = req.userUniqueId;
        if (!orderId || !paymentId || !signature || !pointsAmount || !userId) {
            return res.status(400).json({ success: false, message: "Missing payment details" });
        }
        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay key secret not configured");
        }
        // Verify payment signature
        const generatedSignature = crypto_1.default
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest("hex");
        if (generatedSignature !== signature) {
            return res.status(400).json({ success: false, message: "Invalid signature verification failed" });
        }
        const user = await User_model_1.default.findOne({ uniqueId: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const points = Number(pointsAmount);
        // Update user points
        user.points = (user.points || 0) + points;
        user.lifetimePoints = (user.lifetimePoints || 0) + points;
        await user.save();
        // Log transaction
        const transactionId = `TX-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
        await Transaction_model_1.default.create({
            transactionId,
            user: userId,
            points,
            type: Transaction_model_1.TransactionType.EARNED,
            activityType: "POINTS_PURCHASE",
            description: `Manually purchased ${points} reward points (Order ID: ${orderId})`,
        });
        return res.status(200).json({
            success: true,
            message: `Successfully purchased and added ${points} points to your account!`,
            data: {
                points: user.points,
            },
        });
    }
    catch (error) {
        console.error("Error verifying points payment:", error);
        return res.status(500).json({ success: false, message: "Payment verification failed" });
    }
};
exports.handleVerifyPointsPurchase = handleVerifyPointsPurchase;
