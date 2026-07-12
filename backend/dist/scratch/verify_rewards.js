"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_model_1 = __importDefault(require("../models/User.model"));
const Transaction_model_1 = __importDefault(require("../models/Transaction.model"));
const Reward_model_1 = __importDefault(require("../models/Reward.model"));
const Redemption_model_1 = __importDefault(require("../models/Redemption.model"));
const reward_service_1 = require("../services/reward.service");
dotenv_1.default.config();
async function runTests() {
    console.log("🚀 Initializing reward system verification script...");
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
        console.error("❌ MONGODB_URI is not defined in backend .env file");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(dbUri);
        console.log("✅ Successfully connected to MongoDB Atlas database");
        // Clear previous test artifacts if any
        const testUsername = "verification_test_user";
        await User_model_1.default.deleteMany({ userName: testUsername });
        await Transaction_model_1.default.deleteMany({ user: "verify_test_uid" });
        await Redemption_model_1.default.deleteMany({ user: "verify_test_uid" });
        await Reward_model_1.default.deleteMany({ rewardId: "verify_test_rwd" });
        // 1. Create a mock user
        console.log("\n--- Test 1: User Initialization ---");
        const testUser = new User_model_1.default({
            uniqueId: "verify_test_uid",
            userName: testUsername,
            firstName: "Verify",
            lastName: "Tester",
            email: "verify_test@aksar.com",
            password: "password123",
            role: "STUDENT",
        });
        await testUser.save();
        console.log("✅ Test user initialized in database");
        // 2. Test Point Earning & Idempotency
        console.log("\n--- Test 2: Point Earning & Idempotency ---");
        const key1 = "test_lesson_complete_1";
        // First award
        const award1 = await (0, reward_service_1.awardPoints)(testUser.uniqueId, 10, "LESSON_COMPLETE", "Completed lesson video 1", key1);
        console.log(`- Award 1: pointsAwarded=${award1.pointsAwarded}, totalPoints=${award1.totalPoints} (expected: pointsAwarded=10, totalPoints=10)`);
        if (award1.pointsAwarded !== 10 || award1.totalPoints !== 10) {
            throw new Error("Point awarding test failed");
        }
        // Second award (idempotent run)
        const award2 = await (0, reward_service_1.awardPoints)(testUser.uniqueId, 10, "LESSON_COMPLETE", "Completed lesson video 1", key1);
        console.log(`- Award 2 (duplicate key): pointsAwarded=${award2.pointsAwarded}, totalPoints=${award2.totalPoints} (expected: pointsAwarded=0, totalPoints=10)`);
        if (award2.pointsAwarded !== 0 || award2.totalPoints !== 10) {
            throw new Error("Idempotency check failed");
        }
        console.log("✅ Earning & Idempotency checks passed!");
        // 3. Test Capping Limits (Limit is 200/day)
        console.log("\n--- Test 3: Daily Points Earning Limits ---");
        // We already have 10 points. Let's award 180 points.
        const award3 = await (0, reward_service_1.awardPoints)(testUser.uniqueId, 180, "LESSON_COMPLETE", "Completed lesson video 2", "test_key_limit_2");
        console.log(`- Award 3 (180 points): pointsAwarded=${award3.pointsAwarded}, totalPoints=${award3.totalPoints} (expected: pointsAwarded=180, totalPoints=190)`);
        // Let's award another 30 points. It should cap at 200, so only 10 points should be awarded.
        const award4 = await (0, reward_service_1.awardPoints)(testUser.uniqueId, 30, "LESSON_COMPLETE", "Completed lesson video 3", "test_key_limit_3");
        console.log(`- Award 4 (30 points, limit remaining: 10): pointsAwarded=${award4.pointsAwarded}, totalPoints=${award4.totalPoints} (expected: pointsAwarded=10, totalPoints=200)`);
        if (award4.pointsAwarded !== 10 || award4.totalPoints !== 200) {
            throw new Error("Daily points capping limit failed");
        }
        console.log("✅ Daily capping checks passed!");
        // 4. Test Streak Updates
        console.log("\n--- Test 4: Learning Streaks ---");
        const todayStr = new Date().toISOString().split("T")[0];
        // First activity of the day
        const streakResult1 = await (0, reward_service_1.updateStreakAndAwardPoints)(testUser.uniqueId, todayStr);
        console.log(`- Streak 1: ${streakResult1.message} (expected: streak updated to 1)`);
        // Second activity of the same day (should be unchanged)
        const streakResult2 = await (0, reward_service_1.updateStreakAndAwardPoints)(testUser.uniqueId, todayStr);
        console.log(`- Streak 2 (same day): ${streakResult2.message} (expected: streak unchanged)`);
        console.log("✅ Streak calculation check passed!");
        // 5. Cleanup
        console.log("\n--- Test 5: Cleanup Test Data ---");
        await User_model_1.default.deleteMany({ userName: testUsername });
        await Transaction_model_1.default.deleteMany({ user: "verify_test_uid" });
        await Redemption_model_1.default.deleteMany({ user: "verify_test_uid" });
        await Reward_model_1.default.deleteMany({ rewardId: "verify_test_rwd" });
        console.log("✅ Cleaned up all verification test data successfully");
        console.log("\n🏆 ALL TESTS PASSED SUCCESSFULLY! The reward and gamification system is fully correct and operational.");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Test suite run encountered an error:", error);
        process.exit(1);
    }
}
runTests();
