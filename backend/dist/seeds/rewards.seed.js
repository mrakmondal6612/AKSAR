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
const dotenv_1 = __importDefault(require("dotenv"));
const Reward_model_1 = __importStar(require("../models/Reward.model"));
const db_config_1 = __importDefault(require("../utils/db.config"));
const nanoid_1 = require("nanoid");
dotenv_1.default.config();
const sampleRewards = [
    {
        name: "Amazon ₹500 Gift Voucher",
        description: "Get a flat ₹500 Amazon India electronic gift card. Redeemed code will be sent instantly.",
        pointCost: 1500,
        type: Reward_model_1.RewardType.COUPON,
        stock: 50,
        maxStock: 50,
    },
    {
        name: "1-Month Premium Membership",
        description: "Unlock all premium courses, expert interview preparation tests, and offline video downloads for 30 days.",
        pointCost: 800,
        type: Reward_model_1.RewardType.DIGITAL_ACCESS,
        stock: 100,
        maxStock: 100,
        durationDays: 30,
    },
    {
        name: "AKSAR Official T-Shirt",
        description: "Get the exclusive AKSAR developer cotton black t-shirt. Shipped directly to your home address.",
        pointCost: 3000,
        type: Reward_model_1.RewardType.CUSTOMIZATION,
        stock: 20,
        maxStock: 25,
    },
    {
        name: "Cracking the Coding Interview Book",
        description: "The premium paperback edition of Gayla Laakmann's DSA handbook containing 189 programming questions and solutions.",
        pointCost: 4500,
        type: Reward_model_1.RewardType.CUSTOMIZATION,
        stock: 10,
        maxStock: 10,
    },
    {
        name: "LeetCode Premium 1-Month Access Coupon",
        description: "Flat 100% discount coupon code for LeetCode Premium Monthly subscription.",
        pointCost: 5000,
        type: Reward_model_1.RewardType.COUPON,
        stock: 5,
        maxStock: 5,
    },
    {
        name: "GitHub Pro Upgrade (6 Months)",
        description: "Get advanced coding customization features, higher copilot access limits, and unlimited private repositories.",
        pointCost: 2500,
        type: Reward_model_1.RewardType.DIGITAL_ACCESS,
        stock: 15,
        maxStock: 15,
        durationDays: 180,
    }
];
const seedRewards = async () => {
    try {
        await (0, db_config_1.default)();
        console.log("Connected to DB for seeding rewards...");
        // Delete existing rewards if any to prevent duplicates during seeding
        await Reward_model_1.default.deleteMany({});
        console.log("Cleared existing rewards.");
        for (const item of sampleRewards) {
            const rewardId = `RW-${(0, nanoid_1.nanoid)(8).toUpperCase()}`;
            await Reward_model_1.default.create({
                rewardId,
                ...item,
                isDeleted: false,
            });
            console.log(`Seeded reward: ${item.name}`);
        }
        console.log("Rewards seeding completed successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("Seeding rewards failed:", error);
        process.exit(1);
    }
};
seedRewards();
