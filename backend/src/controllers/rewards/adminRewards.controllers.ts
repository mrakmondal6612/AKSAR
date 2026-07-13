import { Response } from "express";
import { AuthenticatedAdminRequest } from "../../middleware/auth.middleware";
import Reward from "../../models/Reward.model";
import Redemption, { RedemptionStatus } from "../../models/Redemption.model";
import Transaction, { TransactionType } from "../../models/Transaction.model";
import User from "../../models/User.model";
import { nanoid } from "nanoid";
import mongoose from "mongoose";

// ── Get All Rewards for Admin Management ──
export const handleGetAdminRewards = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const rewards = await Reward.find({ isDeleted: false }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: rewards,
    });
  } catch (error) {
    console.error("Error fetching admin rewards:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Create New Reward Item ──
export const handleCreateRewardItem = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { name, description, pointCost, type, stock, maxStock, badgeUrl, durationDays } = req.body;

    if (!name || !description || pointCost === undefined || !type || stock === undefined || maxStock === undefined) {
      return res.status(400).json({ success: false, message: "Missing required details" });
    }

    const rewardId = `RW-${nanoid(8).toUpperCase()}`;
    const newReward = await Reward.create({
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
  } catch (error) {
    console.error("Error creating reward item:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Update Reward Item ──
export const handleUpdateRewardItem = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { rewardId } = req.params;
    const updateData = req.body;

    const reward = await Reward.findOne({ rewardId, isDeleted: false });
    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward item not found" });
    }

    const updatedReward = await Reward.findOneAndUpdate(
      { rewardId },
      { $set: updateData },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Reward item updated successfully!",
      data: updatedReward,
    });
  } catch (error) {
    console.error("Error updating reward item:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Delete Reward Item (Soft Delete) ──
export const handleDeleteRewardItem = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { rewardId } = req.params;

    const reward = await Reward.findOne({ rewardId, isDeleted: false });
    if (!reward) {
      return res.status(404).json({ success: false, message: "Reward item not found" });
    }

    reward.isDeleted = true;
    await reward.save();

    return res.status(200).json({
      success: true,
      message: "Reward item deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting reward item:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get All User Redemptions ──
export const handleGetAllRedemptionsAdmin = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    // Populate user profile info and reward metadata
    const redemptions = await Redemption.find()
      .populate("reward")
      .sort({ createdAt: -1 });

    // Manually map user details since uniqueId reference isn't a native ObjectId ref
    const populated = await Promise.all(
      redemptions.map(async (r) => {
        const u = await User.findOne({ uniqueId: r.user });
        const obj = r.toObject() as any;
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
      })
    );

    return res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error("Error fetching redemptions for admin:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Process Redemption Order (Approve/Reject) ──
export const handleProcessRedemption = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { redemptionId } = req.params;
    const { status, remarks, couponCode } = req.body; // status must be COMPLETED or REJECTED

    if (![RedemptionStatus.COMPLETED, RedemptionStatus.REJECTED].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status status value" });
    }

    const redemption = await Redemption.findOne({ redemptionId }).populate("reward");
    if (!redemption) {
      return res.status(404).json({ success: false, message: "Redemption record not found" });
    }

    if (redemption.status !== RedemptionStatus.PENDING) {
      return res.status(400).json({ success: false, message: "This redemption order has already been processed" });
    }

    redemption.status = status;
    
    if (!redemption.benefitDetails) {
      redemption.benefitDetails = {};
    }

    if (remarks) {
      redemption.benefitDetails.description = remarks;
    }

    const reward = redemption.reward as any;

    if (status === RedemptionStatus.COMPLETED) {
      if (couponCode) {
        redemption.benefitDetails.couponCode = couponCode;
      }
      await redemption.save();
    } 
    else if (status === RedemptionStatus.REJECTED) {
      // Refund points to user
      const user = await User.findOne({ uniqueId: redemption.user });
      if (user) {
        user.points = (user.points || 0) + redemption.pointsSpent;
        await user.save();

        // Restore reward stock
        if (reward) {
          reward.stock += 1;
          await reward.save();
        }

        // Log refund transaction
        const transactionId = `TX-${nanoid(8).toUpperCase()}`;
        await Transaction.create({
          transactionId,
          user: redemption.user,
          points: redemption.pointsSpent,
          type: TransactionType.ADMIN_ADJUSTMENT,
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
  } catch (error) {
    console.error("Error processing redemption:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Get Admin Rewards Statistics ──
export const handleGetAdminStats = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const [totalItems, totalRedeemed, pendingRedeemed] = await Promise.all([
      Reward.countDocuments({ isDeleted: false }),
      Redemption.countDocuments({ status: RedemptionStatus.COMPLETED }),
      Redemption.countDocuments({ status: RedemptionStatus.PENDING }),
    ]);

    const completedRedemptions = await Redemption.find({ status: RedemptionStatus.COMPLETED });
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
  } catch (error) {
    console.error("Error fetching rewards statistics:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── Manual Points Adjustment for Student ──
export const handleAdjustPointsAdmin = async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const { studentUniqueId, points, reason } = req.body;

    if (!studentUniqueId || points === undefined) {
      return res.status(400).json({ success: false, message: "Student UniqueID and points are required" });
    }

    let user = null;
    const queryStr = studentUniqueId.toString().trim();

    // 1. Try to find by uniqueId
    user = await User.findOne({ uniqueId: queryStr });

    // 2. Try to find by MongoDB ObjectId
    if (!user && mongoose.Types.ObjectId.isValid(queryStr)) {
      user = await User.findById(queryStr);
    }

    // 3. Try to find by email
    if (!user) {
      user = await User.findOne({ email: queryStr });
    }

    // 4. Try to find by userName
    if (!user) {
      user = await User.findOne({ userName: queryStr });
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
    const transactionId = `TX-${nanoid(8).toUpperCase()}`;
    await Transaction.create({
      transactionId,
      user: user.uniqueId,
      points: adjustmentAmount,
      type: TransactionType.ADMIN_ADJUSTMENT,
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
  } catch (error) {
    console.error("Error adjusting student points:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
