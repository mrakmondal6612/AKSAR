import express from "express";
import { authenticateToken, authenticateAdminToken } from "../middleware/auth.middleware";
import {
  handleGetStoreRewards,
  handleClaimDailyLogin,
  handleRedeemReward,
  handleGetMyRewards,
  handleGetTransactionHistory,
  handleAdminAdjustPoints,
  handleAdminGetAnalytics,
  handleAdminAddReward,
  handleAdminUpdateReward,
  handleAdminDeleteReward,
} from "../controllers/user/reward.controllers";

const rewardRoute = express.Router();

// User Reward Routes
rewardRoute.get("/store", authenticateToken, handleGetStoreRewards);
rewardRoute.post("/claim-daily", authenticateToken, handleClaimDailyLogin);
rewardRoute.post("/redeem", authenticateToken, handleRedeemReward);
rewardRoute.get("/my-rewards", authenticateToken, handleGetMyRewards);
rewardRoute.get("/history", authenticateToken, handleGetTransactionHistory);

// Admin Reward Routes
rewardRoute.post("/admin/adjust", authenticateAdminToken, handleAdminAdjustPoints);
rewardRoute.get("/admin/analytics", authenticateAdminToken, handleAdminGetAnalytics);
rewardRoute.post("/admin/add-reward", authenticateAdminToken, handleAdminAddReward);
rewardRoute.put("/admin/rewards/:rewardId", authenticateAdminToken, handleAdminUpdateReward);
rewardRoute.delete("/admin/rewards/:rewardId", authenticateAdminToken, handleAdminDeleteReward);

export default rewardRoute;
