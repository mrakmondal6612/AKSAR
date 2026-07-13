"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rewards_controllers_1 = require("../controllers/rewards/rewards.controllers");
const adminRewards_controllers_1 = require("../controllers/rewards/adminRewards.controllers");
const rewardRoute = express_1.default.Router();
// ── User Rewards System Routes ──
rewardRoute.get("/store", auth_middleware_1.authenticateToken, rewards_controllers_1.handleGetStore);
rewardRoute.get("/my-rewards", auth_middleware_1.authenticateToken, rewards_controllers_1.handleGetMyRewards);
rewardRoute.get("/history", auth_middleware_1.authenticateToken, rewards_controllers_1.handleGetHistory);
rewardRoute.post("/claim-daily", auth_middleware_1.authenticateToken, rewards_controllers_1.handleClaimDaily);
rewardRoute.post("/redeem", auth_middleware_1.authenticateToken, rewards_controllers_1.handleRedeemReward);
rewardRoute.post("/purchase-points", auth_middleware_1.authenticateToken, rewards_controllers_1.handleCreatePointsOrder);
rewardRoute.post("/verify-points", auth_middleware_1.authenticateToken, rewards_controllers_1.handleVerifyPointsPurchase);
// ── Admin Rewards System Routes ──
rewardRoute.get("/admin/store", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleGetAdminRewards);
rewardRoute.get("/admin/stats", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleGetAdminStats);
rewardRoute.get("/admin/analytics", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleGetAdminStats);
rewardRoute.get("/admin/redemptions", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleGetAllRedemptionsAdmin);
rewardRoute.post("/admin/create", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleCreateRewardItem);
rewardRoute.put("/admin/update/:rewardId", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleUpdateRewardItem);
rewardRoute.delete("/admin/delete/:rewardId", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleDeleteRewardItem);
rewardRoute.put("/admin/process/:redemptionId", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleProcessRedemption);
rewardRoute.post("/admin/adjust", auth_middleware_1.authenticateAdminToken, adminRewards_controllers_1.handleAdjustPointsAdmin);
exports.default = rewardRoute;
