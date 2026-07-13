import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import Reward, { RewardType } from "../../models/Reward.model";
import Redemption, { RedemptionStatus } from "../../models/Redemption.model";
import Transaction, { TransactionType } from "../../models/Transaction.model";
import User from "../../models/User.model";
import { nanoid } from "nanoid";
import Razorpay from "razorpay";
import crypto from "crypto";

let razorpayInstance: Razorpay | null = null;
const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
      );
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// ── Daily Claim Points ──
export const handleClaimDaily = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userUniqueId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User not authenticated" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Check if claimed today
    const claimedToday = await Transaction.findOne({
      user: userId,
      activityType: "DAILY_CLAIM",
      createdAt: { $gte: todayStart },
    });

    if (claimedToday) {
      return res.status(400).json({ success: false, message: "You have already claimed your daily reward today" });
    }

    const user = await User.findOne({ uniqueId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Daily streak logic
    let pointsToEarn = 10;
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const claimedYesterday = await Transaction.findOne({
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
    } else {
      user.currentStreak = 1;
    }

    // Add points
    user.points = (user.points || 0) + pointsToEarn;
    user.lifetimePoints = (user.lifetimePoints || 0) + pointsToEarn;
    user.lastActivityDate = new Date();
    await user.save();

    // Log transaction
    const transactionId = `TX-${nanoid(8).toUpperCase()}`;
    await Transaction.create({
      transactionId,
      user: userId,
      points: pointsToEarn,
      type: TransactionType.EARNED,
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
  } catch (error) {
    console.error("Error in daily claim:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get All Rewards in Store ──
export const handleGetStore = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const storeItems = await Reward.find({ isDeleted: false, stock: { $gt: 0 } }).sort({ pointCost: 1 });
    return res.status(200).json({
      success: true,
      data: storeItems,
    });
  } catch (error) {
    console.error("Error fetching rewards store:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Redeem a Reward ──
export const handleRedeemReward = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userUniqueId;
    const { rewardId } = req.body;

    if (!userId || !rewardId) {
      return res.status(400).json({ success: false, message: "Missing required details" });
    }

    const user = await User.findOne({ uniqueId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const reward = await Reward.findOne({ rewardId, isDeleted: false });
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
    const redemptionId = `RDM-${nanoid(8).toUpperCase()}`;
    const benefitDetails: any = {
      description: `Redeemed ${reward.name}`,
    };

    // If COUPON type, generate a random code
    if (reward.type === RewardType.COUPON) {
      benefitDetails.couponCode = `AKSR-${nanoid(6).toUpperCase()}`;
    }

    // If PREMIUM ACCESS, calculate premium expiry date
    if (reward.type === RewardType.DIGITAL_ACCESS) {
      const duration = reward.durationDays || 30;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + duration);
      benefitDetails.premiumExpiry = expiry;
      
      // Update user unlock profile directly
      if (!user.unlockedUpgrades) user.unlockedUpgrades = [];
      user.unlockedUpgrades.push(reward.name);
      user.premiumExpiry = expiry;
      await user.save();
    }

    const redemption = await Redemption.create({
      redemptionId,
      user: userId,
      reward: reward._id,
      pointsSpent: reward.pointCost,
      status: reward.type === RewardType.COUPON || reward.type === RewardType.DIGITAL_ACCESS
        ? RedemptionStatus.COMPLETED // Auto completed for digital coupons
        : RedemptionStatus.PENDING,   // Needs admin shipping/approval for physical products
      benefitDetails,
    });

    // Log spend transaction
    const transactionId = `TX-${nanoid(8).toUpperCase()}`;
    await Transaction.create({
      transactionId,
      user: userId,
      points: -reward.pointCost,
      type: TransactionType.SPENT,
      activityType: "REDEEM",
      description: `Redeemed ${reward.name} (-${reward.pointCost} points)`,
    });

    return res.status(200).json({
      success: true,
      message: `Redeemed ${reward.name} successfully!`,
      data: redemption,
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get My Redeemed Rewards ──
export const handleGetMyRewards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userUniqueId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User not authenticated" });
    }

    const myRedemptions = await Redemption.find({ user: userId })
      .populate("reward")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: myRedemptions,
    });
  } catch (error) {
    console.error("Error fetching my rewards:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get Points Transaction History ──
export const handleGetHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userUniqueId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User not authenticated" });
    }

    const historyItems = await Transaction.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: historyItems,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Create Points Purchase Order ──
export const handleCreatePointsOrder = async (req: AuthenticatedRequest, res: Response) => {
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

    if (points === 2500) price = 230; // discount package
    if (points === 5000) price = 450; // discount package

    const options = {
      amount: price * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `PTS_${nanoid(6).toUpperCase()}`,
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
  } catch (error) {
    console.error("Error creating points order:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate point purchase order" });
  }
};

// ── Verify Points Purchase Payment ──
export const handleVerifyPointsPurchase = async (req: AuthenticatedRequest, res: Response) => {
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
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid signature verification failed" });
    }

    const user = await User.findOne({ uniqueId: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const points = Number(pointsAmount);

    // Update user points
    user.points = (user.points || 0) + points;
    user.lifetimePoints = (user.lifetimePoints || 0) + points;
    await user.save();

    // Log transaction
    const transactionId = `TX-${nanoid(8).toUpperCase()}`;
    await Transaction.create({
      transactionId,
      user: userId,
      points,
      type: TransactionType.EARNED,
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
  } catch (error) {
    console.error("Error verifying points payment:", error);
    return res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};
