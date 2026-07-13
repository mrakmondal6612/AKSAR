import express from "express";
import { authenticateToken, authenticateAdminToken } from "../middleware/auth.middleware";
import {
  handleClaimDaily,
  handleGetStore,
  handleRedeemReward,
  handleGetMyRewards,
  handleGetHistory,
  handleCreatePointsOrder,
  handleVerifyPointsPurchase,
} from "../controllers/rewards/rewards.controllers";
import {
  handleGetAdminRewards,
  handleCreateRewardItem,
  handleUpdateRewardItem,
  handleDeleteRewardItem,
  handleGetAllRedemptionsAdmin,
  handleProcessRedemption,
  handleGetAdminStats,
  handleAdjustPointsAdmin,
} from "../controllers/rewards/adminRewards.controllers";

const rewardRoute = express.Router();

// ── User Rewards System Routes ──
rewardRoute.get("/store", authenticateToken, handleGetStore);
rewardRoute.get("/my-rewards", authenticateToken, handleGetMyRewards);
rewardRoute.get("/history", authenticateToken, handleGetHistory);
rewardRoute.post("/claim-daily", authenticateToken, handleClaimDaily);
rewardRoute.post("/redeem", authenticateToken, handleRedeemReward);
rewardRoute.post("/purchase-points", authenticateToken, handleCreatePointsOrder);
rewardRoute.post("/verify-points", authenticateToken, handleVerifyPointsPurchase);

// ── Admin Rewards System Routes ──
rewardRoute.get("/admin/store", authenticateAdminToken, handleGetAdminRewards);
rewardRoute.get("/admin/stats", authenticateAdminToken, handleGetAdminStats);
rewardRoute.get("/admin/analytics", authenticateAdminToken, handleGetAdminStats);
rewardRoute.get("/admin/redemptions", authenticateAdminToken, handleGetAllRedemptionsAdmin);
rewardRoute.post("/admin/create", authenticateAdminToken, handleCreateRewardItem);
rewardRoute.put("/admin/update/:rewardId", authenticateAdminToken, handleUpdateRewardItem);
rewardRoute.delete("/admin/delete/:rewardId", authenticateAdminToken, handleDeleteRewardItem);
rewardRoute.put("/admin/process/:redemptionId", authenticateAdminToken, handleProcessRedemption);
rewardRoute.post("/admin/adjust", authenticateAdminToken, handleAdjustPointsAdmin);

export default rewardRoute;
