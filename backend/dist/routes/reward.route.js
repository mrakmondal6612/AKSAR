"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const reward_controllers_1 = require("../controllers/user/reward.controllers");
const rewardRoute = express_1.default.Router();
// User Reward Routes
rewardRoute.get("/store", auth_middleware_1.authenticateToken, reward_controllers_1.handleGetStoreRewards);
rewardRoute.post("/claim-daily", auth_middleware_1.authenticateToken, reward_controllers_1.handleClaimDailyLogin);
rewardRoute.post("/redeem", auth_middleware_1.authenticateToken, reward_controllers_1.handleRedeemReward);
rewardRoute.get("/my-rewards", auth_middleware_1.authenticateToken, reward_controllers_1.handleGetMyRewards);
rewardRoute.get("/history", auth_middleware_1.authenticateToken, reward_controllers_1.handleGetTransactionHistory);
// Admin Reward Routes
rewardRoute.post("/admin/adjust", auth_middleware_1.authenticateAdminToken, reward_controllers_1.handleAdminAdjustPoints);
rewardRoute.get("/admin/analytics", auth_middleware_1.authenticateAdminToken, reward_controllers_1.handleAdminGetAnalytics);
rewardRoute.post("/admin/add-reward", auth_middleware_1.authenticateAdminToken, reward_controllers_1.handleAdminAddReward);
rewardRoute.put("/admin/rewards/:rewardId", auth_middleware_1.authenticateAdminToken, reward_controllers_1.handleAdminUpdateReward);
rewardRoute.delete("/admin/rewards/:rewardId", auth_middleware_1.authenticateAdminToken, reward_controllers_1.handleAdminDeleteReward);
exports.default = rewardRoute;
