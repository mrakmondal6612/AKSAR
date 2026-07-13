"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetStoreRewards = handleGetStoreRewards;
exports.handleClaimDailyLogin = handleClaimDailyLogin;
exports.handleRedeemReward = handleRedeemReward;
exports.handleGetMyRewards = handleGetMyRewards;
exports.handleGetTransactionHistory = handleGetTransactionHistory;
exports.handleAdminAdjustPoints = handleAdminAdjustPoints;
exports.handleAdminGetAnalytics = handleAdminGetAnalytics;
exports.handleAdminAddReward = handleAdminAddReward;
exports.handleAdminUpdateReward = handleAdminUpdateReward;
exports.handleAdminDeleteReward = handleAdminDeleteReward;
const mongoose_1 = __importDefault(require("mongoose"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const Reward_model_1 = __importDefault(require("../../models/Reward.model"));
const Redemption_model_1 = __importDefault(require("../../models/Redemption.model"));
const Transaction_model_1 = __importDefault(require("../../models/Transaction.model"));
const reward_service_1 = require("../../services/reward.service");
/**
 * Helper to generate a secure random ID
 */
function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}
/**
 * Fetch all active store rewards
 */
async function handleGetStoreRewards(req, res) {
    try {
        const rewards = await Reward_model_1.default.find({ isActive: true }).sort({ pointCost: 1 });
        return res.status(200).json({ success: true, data: rewards });
    }
    catch (error) {
        console.error("Error fetching store rewards:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch store rewards" });
    }
}
/**
 * Claim daily login points (5 points, capped once per day)
 */
async function handleClaimDailyLogin(req, res) {
    const userUniqueId = req.userUniqueId;
    if (!userUniqueId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const todayStr = new Date().toISOString().split("T")[0];
        const idempotencyKey = `daily_login_${userUniqueId}_${todayStr}`;
        const result = await (0, reward_service_1.awardPoints)(userUniqueId, 5, "DAILY_LOGIN", "Daily login bonus", idempotencyKey);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: result.pointsAwarded > 0 ? "Daily login points claimed!" : result.message,
            pointsAwarded: result.pointsAwarded,
            totalPoints: result.totalPoints,
        });
    }
    catch (error) {
        console.error("Error claiming daily login:", error);
        return res.status(500).json({ success: false, message: "Failed to claim daily login" });
    }
}
/**
 * Redeem a store reward.
 * Runs atomically using a transaction if available, otherwise handles checks gracefully.
 */
async function handleRedeemReward(req, res) {
    const userUniqueId = req.userUniqueId;
    const { rewardId } = req.body;
    if (!userUniqueId || !rewardId) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    // Determine if MongoDB transaction session is supported (e.g. replica sets)
    let session = null;
    try {
        session = await mongoose_1.default.startSession();
    }
    catch (err) {
        console.warn("MongoDB replica set not detected, running redemption without a session.");
    }
    try {
        if (session) {
            session.startTransaction();
        }
        // 1. Fetch User and Reward
        const user = await User_model_1.default.findOne({ uniqueId: userUniqueId }).session(session);
        if (!user) {
            throw new Error("User not found");
        }
        const reward = await Reward_model_1.default.findOne({ rewardId, isActive: true }).session(session);
        if (!reward) {
            throw new Error("Reward not found or is currently inactive");
        }
        // 2. Perform Stock and Cost checks
        if (reward.stock <= 0) {
            throw new Error("Reward item is currently out of stock");
        }
        const totalAvailablePoints = (user.points || 0) + (user.bonusPoints || 0);
        if (totalAvailablePoints < reward.pointCost) {
            throw new Error("Insufficient points balance for this redemption");
        }
        // 3. Deduct Points (Prioritize earned points, then bonus points)
        let costRemaining = reward.pointCost;
        if (user.points >= costRemaining) {
            user.points -= costRemaining;
            costRemaining = 0;
        }
        else {
            costRemaining -= user.points;
            user.points = 0;
            user.bonusPoints = (user.bonusPoints || 0) - costRemaining;
        }
        // 4. Reduce Stock
        reward.stock -= 1;
        // 5. Apply Benefit Details based on Reward Type
        const redemptionId = generateId("RDM");
        let benefitDetails = {};
        if (reward.type === "DIGITAL_ACCESS") {
            const days = reward.durationDays || 3;
            const currentExpiry = user.premiumExpiry && new Date(user.premiumExpiry) > new Date()
                ? new Date(user.premiumExpiry)
                : new Date();
            currentExpiry.setDate(currentExpiry.getDate() + days);
            user.premiumExpiry = currentExpiry;
            benefitDetails = { premiumExpiry: currentExpiry, description: `${days} days premium access` };
        }
        else if (reward.type === "COUPON") {
            const uniqueCode = `${reward.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            benefitDetails = { couponCode: uniqueCode, description: `Discount coupon: ${reward.name}` };
        }
        else if (reward.type === "BADGE") {
            if (!user.badges.includes(reward.name)) {
                user.badges.push(reward.name);
            }
            benefitDetails = { badgeName: reward.name, badgeUrl: reward.badgeUrl || "" };
        }
        else if (reward.type === "CUSTOMIZATION") {
            if (!user.unlockedUpgrades.includes(reward.name)) {
                user.unlockedUpgrades.push(reward.name);
            }
            benefitDetails = { upgradeName: reward.name };
        }
        else if (reward.type === "FEATURE_UNLOCK") {
            if (!user.unlockedUpgrades.includes(reward.name)) {
                user.unlockedUpgrades.push(reward.name);
            }
            benefitDetails = { unlockedFeature: reward.name };
        }
        // 6. Save User and Reward
        await user.save({ session });
        await reward.save({ session });
        // 7. Save Redemption Log
        const newRedemption = new Redemption_model_1.default({
            redemptionId,
            user: userUniqueId,
            reward: reward._id,
            pointsSpent: reward.pointCost,
            status: "COMPLETED",
            benefitDetails,
        });
        await newRedemption.save({ session });
        // 8. Save Point Debit Transaction log
        const transactionId = generateId("TXN");
        const newTxn = new Transaction_model_1.default({
            transactionId,
            user: userUniqueId,
            points: -reward.pointCost,
            type: "SPENT",
            activityType: "REDEEM_REWARD",
            description: `Redeemed: ${reward.name}`,
            idempotencyKey: `redeem_${userUniqueId}_${rewardId}_${redemptionId}`,
        });
        await newTxn.save({ session });
        if (session) {
            await session.commitTransaction();
        }
        return res.status(200).json({
            success: true,
            message: `Successfully redeemed ${reward.name}!`,
            data: {
                redemption: newRedemption,
                pointsBalance: user.points,
                bonusBalance: user.bonusPoints,
            },
        });
    }
    catch (error) {
        if (session) {
            await session.abortTransaction();
        }
        console.error("Error in handleRedeemReward controller:", error);
        return res.status(400).json({ success: false, message: error.message || "Redemption failed" });
    }
    finally {
        if (session) {
            session.endSession();
        }
    }
}
/**
 * Fetch all redeemed items of a user
 */
async function handleGetMyRewards(req, res) {
    const userUniqueId = req.userUniqueId;
    if (!userUniqueId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const redemptions = await Redemption_model_1.default.find({ user: userUniqueId })
            .populate("reward")
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: redemptions });
    }
    catch (error) {
        console.error("Error fetching user redemptions:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch redemptions" });
    }
}
/**
 * Fetch a user's points transaction history
 */
async function handleGetTransactionHistory(req, res) {
    const userUniqueId = req.userUniqueId;
    if (!userUniqueId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const history = await Transaction_model_1.default.find({ user: userUniqueId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: history });
    }
    catch (error) {
        console.error("Error fetching transaction history:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch transaction history" });
    }
}
/* ──────────────────────────────────────────────────────── */
/*                     ADMIN CONTROLLER ACTIONS             */
/* ──────────────────────────────────────────────────────── */
/**
 * Admin adjustments of points (Manual adjust)
 */
async function handleAdminAdjustPoints(req, res) {
    const { studentUniqueId, points, reason } = req.body;
    if (!studentUniqueId || points === undefined || !reason) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        const user = await User_model_1.default.findOne({ uniqueId: studentUniqueId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const idempotencyKey = `admin_adjust_${studentUniqueId}_${Date.now()}`;
        const result = await (0, reward_service_1.awardPoints)(studentUniqueId, points, "ADMIN_ADJUST", reason, idempotencyKey);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({
            success: true,
            message: `Adjusted points balance by ${points}. New balance: ${result.totalPoints}`,
            data: { totalPoints: result.totalPoints },
        });
    }
    catch (error) {
        console.error("Error in admin point adjustment:", error);
        return res.status(500).json({ success: false, message: "Failed to adjust points" });
    }
}
/**
 * Fetch admin analytics: point flows, popular items, farm/abuse alerts
 */
async function handleAdminGetAnalytics(req, res) {
    try {
        // 1. Point aggregates
        const aggregateEarned = await Transaction_model_1.default.aggregate([
            { $match: { points: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$points" } } },
        ]);
        const aggregateSpent = await Transaction_model_1.default.aggregate([
            { $match: { points: { $lt: 0 } } },
            { $group: { _id: null, total: { $sum: "$points" } } },
        ]);
        const totalEarnedPoints = aggregateEarned[0]?.total || 0;
        const totalSpentPoints = Math.abs(aggregateSpent[0]?.total || 0);
        // 2. Count redemptions per reward
        const redemptionCounts = await Redemption_model_1.default.aggregate([
            {
                $group: {
                    _id: "$reward",
                    count: { $sum: 1 },
                    pointsSpent: { $sum: "$pointsSpent" },
                },
            },
            {
                $lookup: {
                    from: "rewards",
                    localField: "_id",
                    foreignField: "_id",
                    as: "rewardDetails",
                },
            },
            { $unwind: "$rewardDetails" },
            {
                $project: {
                    name: "$rewardDetails.name",
                    type: "$rewardDetails.type",
                    count: 1,
                    pointsSpent: 1,
                },
            },
            { $sort: { count: -1 } },
        ]);
        // 3. Earning limit/farming alerts (Users who earned > 150 points today)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const farmingAlerts = await Transaction_model_1.default.aggregate([
            { $match: { type: "EARNED", createdAt: { $gte: startOfToday } } },
            { $group: { _id: "$user", todayEarned: { $sum: "$points" } } },
            { $match: { todayEarned: { $gte: 150 } } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "uniqueId",
                    as: "userDetails",
                },
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    username: "$userDetails.userName",
                    email: "$userDetails.email",
                    todayEarned: 1,
                },
            },
        ]);
        return res.status(200).json({
            success: true,
            data: {
                totalEarnedPoints,
                totalSpentPoints,
                redemptionCounts,
                farmingAlerts,
            },
        });
    }
    catch (error) {
        console.error("Error fetching admin rewards analytics:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
}
/**
 * CRUD: Add a new reward store item
 */
async function handleAdminAddReward(req, res) {
    const { name, description, pointCost, type, stock, maxStock, badgeUrl, durationDays } = req.body;
    if (!name || !description || pointCost === undefined || !type) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        const rewardId = generateId("RWD");
        const newReward = new Reward_model_1.default({
            rewardId,
            name,
            description,
            pointCost,
            type,
            stock: stock !== undefined ? stock : 50,
            maxStock: maxStock !== undefined ? maxStock : (stock !== undefined ? stock : 50),
            isActive: true,
            badgeUrl,
            durationDays,
        });
        await newReward.save();
        return res.status(201).json({ success: true, message: "Reward created successfully", data: newReward });
    }
    catch (error) {
        console.error("Error creating reward:", error);
        return res.status(500).json({ success: false, message: "Failed to create reward" });
    }
}
/**
 * CRUD: Edit a reward store item
 */
async function handleAdminUpdateReward(req, res) {
    const { rewardId } = req.params;
    const updates = req.body;
    try {
        const reward = await Reward_model_1.default.findOneAndUpdate({ rewardId }, updates, { new: true });
        if (!reward) {
            return res.status(404).json({ success: false, message: "Reward not found" });
        }
        return res.status(200).json({ success: true, message: "Reward updated successfully", data: reward });
    }
    catch (error) {
        console.error("Error updating reward:", error);
        return res.status(500).json({ success: false, message: "Failed to update reward" });
    }
}
/**
 * CRUD: Disable/Delete a reward store item
 */
async function handleAdminDeleteReward(req, res) {
    const { rewardId } = req.params;
    try {
        const reward = await Reward_model_1.default.findOne({ rewardId });
        if (!reward) {
            return res.status(404).json({ success: false, message: "Reward not found" });
        }
        // Toggle active state or hard delete depending on design. We toggle isActive to avoid foreign key broken logs.
        reward.isActive = false;
        await reward.save();
        return res.status(200).json({ success: true, message: "Reward disabled successfully" });
    }
    catch (error) {
        console.error("Error deleting reward:", error);
        return res.status(500).json({ success: false, message: "Failed to delete reward" });
    }
}
