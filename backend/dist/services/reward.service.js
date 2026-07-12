"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.awardPoints = awardPoints;
exports.updateStreakAndAwardPoints = updateStreakAndAwardPoints;
const User_model_1 = __importDefault(require("../models/User.model"));
const Transaction_model_1 = __importDefault(require("../models/Transaction.model"));
// Earning Point Limits
const DAILY_POINT_LIMIT = 200;
const WEEKLY_POINT_LIMIT = 1000;
/**
 * Helper to generate a secure random ID
 */
function generateUniqueId(prefix = "TXN") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
/**
 * Core service function to award points to a user.
 * Implements daily/weekly capping and refer-a-friend triggers.
 */
async function awardPoints(userUniqueId, rawAmount, activityType, description, idempotencyKey) {
    try {
        // 1. Check if this idempotencyKey has already been processed
        const existingTxn = await Transaction_model_1.default.findOne({ idempotencyKey });
        if (existingTxn) {
            const user = await User_model_1.default.findOne({ uniqueId: userUniqueId });
            return {
                success: true,
                pointsAwarded: 0,
                totalPoints: user ? (user.points || 0) : 0,
                message: "Activity already rewarded (idempotent)",
            };
        }
        const user = await User_model_1.default.findOne({ uniqueId: userUniqueId });
        if (!user) {
            return { success: false, pointsAwarded: 0, totalPoints: 0, message: "User not found" };
        }
        let pointsToAward = rawAmount;
        // 2. Apply Capping Limits (only for earned activities, not admin adjustments or redemptions)
        if (pointsToAward > 0 && activityType !== "ADMIN_ADJUST") {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            // Aggregate points earned by user today
            const todayTxns = await Transaction_model_1.default.find({
                user: userUniqueId,
                type: "EARNED",
                createdAt: { $gte: startOfDay },
            });
            const todayEarned = todayTxns.reduce((sum, t) => sum + (t.points || 0), 0);
            // Aggregate points earned by user this week
            const weekTxns = await Transaction_model_1.default.find({
                user: userUniqueId,
                type: "EARNED",
                createdAt: { $gte: startOfWeek },
            });
            const weekEarned = weekTxns.reduce((sum, t) => sum + (t.points || 0), 0);
            if (todayEarned >= DAILY_POINT_LIMIT) {
                return {
                    success: true,
                    pointsAwarded: 0,
                    totalPoints: user.points || 0,
                    message: "Daily earning limit of 200 points reached",
                };
            }
            if (weekEarned >= WEEKLY_POINT_LIMIT) {
                return {
                    success: true,
                    pointsAwarded: 0,
                    totalPoints: user.points || 0,
                    message: "Weekly earning limit of 1000 points reached",
                };
            }
            // Cap points if the reward exceeds the limits
            if (todayEarned + pointsToAward > DAILY_POINT_LIMIT) {
                pointsToAward = DAILY_POINT_LIMIT - todayEarned;
            }
            if (weekEarned + pointsToAward > WEEKLY_POINT_LIMIT) {
                pointsToAward = WEEKLY_POINT_LIMIT - weekEarned;
            }
        }
        if (pointsToAward <= 0) {
            return {
                success: true,
                pointsAwarded: 0,
                totalPoints: user.points || 0,
                message: "Points capped to 0 due to earning limits",
            };
        }
        // 3. Save the Transaction log
        const transactionId = generateUniqueId("TXN");
        const newTxn = new Transaction_model_1.default({
            transactionId,
            user: userUniqueId,
            points: pointsToAward,
            type: activityType === "ADMIN_ADJUST" ? "ADMIN_ADJUSTMENT" : "EARNED",
            activityType,
            description,
            idempotencyKey,
        });
        await newTxn.save();
        // 4. Update the User wallet
        user.points = (user.points || 0) + pointsToAward;
        user.lifetimePoints = (user.lifetimePoints || 0) + pointsToAward;
        await user.save();
        // 5. Check and Trigger Referral reward (Referrer gets 50 points after genuine activity)
        if (user.referredBy && activityType !== "DAILY_LOGIN" && activityType !== "REFERRAL" && activityType !== "ADMIN_ADJUST") {
            const referralKey = `referral_${user.uniqueId}`;
            const alreadyAwardedReferral = await Transaction_model_1.default.findOne({ idempotencyKey: referralKey });
            if (!alreadyAwardedReferral) {
                // Award 50 points to the referrer
                await awardPoints(user.referredBy, 50, "REFERRAL", `Referral bonus for verifying learner: ${user.userName}`, referralKey);
            }
        }
        return {
            success: true,
            pointsAwarded: pointsToAward,
            totalPoints: user.points,
            message: `Successfully earned ${pointsToAward} points`,
        };
    }
    catch (error) {
        console.error("Error in awardPoints service:", error);
        return {
            success: false,
            pointsAwarded: 0,
            totalPoints: 0,
            message: error.message || "Failed to award points",
        };
    }
}
/**
 * Evaluates and updates a user's consecutive day learning streak.
 * Meaningful activities (lessons, quizzes, mock tests) trigger this.
 */
async function updateStreakAndAwardPoints(userUniqueId, todayStr) {
    try {
        const user = await User_model_1.default.findOne({ uniqueId: userUniqueId });
        if (!user) {
            return { currentStreak: 0, message: "User not found" };
        }
        const lastActiveStr = user.lastActivityDate
            ? user.lastActivityDate.toISOString().split("T")[0]
            : null;
        if (lastActiveStr === todayStr) {
            return {
                currentStreak: user.currentStreak || 0,
                message: "Activity recorded today already (streak unchanged)",
            };
        }
        // Calculate yesterday's date string
        const today = new Date(todayStr);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        let newStreak = 1;
        if (lastActiveStr === yesterdayStr) {
            newStreak = (user.currentStreak || 0) + 1;
        }
        user.currentStreak = newStreak;
        user.lastActivityDate = new Date(todayStr);
        await user.save();
        let milestoneMsg = "";
        // Award rewards based on new streak milestone reached
        if (newStreak === 3) {
            await awardPoints(userUniqueId, 15, "STREAK_BONUS", "3-day learning streak bonus!", `streak_3_${userUniqueId}_${todayStr}`);
            milestoneMsg = " (+15 pts milestone)";
        }
        else if (newStreak === 7) {
            await awardPoints(userUniqueId, 40, "STREAK_BONUS", "7-day learning streak bonus!", `streak_7_${userUniqueId}_${todayStr}`);
            milestoneMsg = " (+40 pts milestone)";
        }
        else if (newStreak === 30) {
            // Award exclusive badge
            const badgeName = "30-Day Streak Warrior";
            if (!user.badges.includes(badgeName)) {
                user.badges.push(badgeName);
                await user.save();
                milestoneMsg = " (Unlocked '30-Day Streak Warrior' badge!)";
            }
        }
        else if (newStreak === 100) {
            // Award premium mock test access
            const upgradeName = "PREMIUM_MOCK_TEST_UPGRADE";
            if (!user.unlockedUpgrades.includes(upgradeName)) {
                user.unlockedUpgrades.push(upgradeName);
                await user.save();
                milestoneMsg = " (Unlocked Premium Mock Test access!)";
            }
        }
        return {
            currentStreak: newStreak,
            message: `Streak updated to ${newStreak} days!${milestoneMsg}`,
        };
    }
    catch (error) {
        console.error("Error updating streak:", error);
        return {
            currentStreak: 0,
            message: "Failed to update learning streak",
        };
    }
}
