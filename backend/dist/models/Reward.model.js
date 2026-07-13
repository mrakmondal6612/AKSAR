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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RewardType;
(function (RewardType) {
    RewardType["DIGITAL_ACCESS"] = "DIGITAL_ACCESS";
    RewardType["COUPON"] = "COUPON";
    RewardType["FEATURE_UNLOCK"] = "FEATURE_UNLOCK";
    RewardType["BADGE"] = "BADGE";
    RewardType["CUSTOMIZATION"] = "CUSTOMIZATION";
})(RewardType || (exports.RewardType = RewardType = {}));
const rewardSchema = new mongoose_1.Schema({
    rewardId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    pointCost: { type: Number, required: true, min: 0 },
    type: {
        type: String,
        enum: Object.values(RewardType),
        required: true,
    },
    stock: { type: Number, required: true, min: 0 },
    maxStock: { type: Number, required: true, min: 0 },
    badgeUrl: { type: String },
    durationDays: { type: Number },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
const RewardModel = mongoose_1.default.models.Reward || mongoose_1.default.model("Reward", rewardSchema);
exports.default = RewardModel;
