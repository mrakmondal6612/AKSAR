import mongoose from "mongoose";
import dotenv from "dotenv";
import Reward, { RewardType } from "../models/Reward.model";
import connectDB from "../utils/db.config";
import { nanoid } from "nanoid";

dotenv.config();

const sampleRewards = [
  {
    name: "Amazon ₹500 Gift Voucher",
    description: "Get a flat ₹500 Amazon India electronic gift card. Redeemed code will be sent instantly.",
    pointCost: 1500,
    type: RewardType.COUPON,
    stock: 50,
    maxStock: 50,
  },
  {
    name: "1-Month Premium Membership",
    description: "Unlock all premium courses, expert interview preparation tests, and offline video downloads for 30 days.",
    pointCost: 800,
    type: RewardType.DIGITAL_ACCESS,
    stock: 100,
    maxStock: 100,
    durationDays: 30,
  },
  {
    name: "AKSAR Official T-Shirt",
    description: "Get the exclusive AKSAR developer cotton black t-shirt. Shipped directly to your home address.",
    pointCost: 3000,
    type: RewardType.CUSTOMIZATION,
    stock: 20,
    maxStock: 25,
  },
  {
    name: "Cracking the Coding Interview Book",
    description: "The premium paperback edition of Gayla Laakmann's DSA handbook containing 189 programming questions and solutions.",
    pointCost: 4500,
    type: RewardType.CUSTOMIZATION,
    stock: 10,
    maxStock: 10,
  },
  {
    name: "LeetCode Premium 1-Month Access Coupon",
    description: "Flat 100% discount coupon code for LeetCode Premium Monthly subscription.",
    pointCost: 5000,
    type: RewardType.COUPON,
    stock: 5,
    maxStock: 5,
  },
  {
    name: "GitHub Pro Upgrade (6 Months)",
    description: "Get advanced coding customization features, higher copilot access limits, and unlimited private repositories.",
    pointCost: 2500,
    type: RewardType.DIGITAL_ACCESS,
    stock: 15,
    maxStock: 15,
    durationDays: 180,
  }
];

const seedRewards = async () => {
  try {
    await connectDB();
    console.log("Connected to DB for seeding rewards...");

    // Delete existing rewards if any to prevent duplicates during seeding
    await Reward.deleteMany({});
    console.log("Cleared existing rewards.");

    for (const item of sampleRewards) {
      const rewardId = `RW-${nanoid(8).toUpperCase()}`;
      await Reward.create({
        rewardId,
        ...item,
        isDeleted: false,
      });
      console.log(`Seeded reward: ${item.name}`);
    }

    console.log("Rewards seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding rewards failed:", error);
    process.exit(1);
  }
};

seedRewards();
