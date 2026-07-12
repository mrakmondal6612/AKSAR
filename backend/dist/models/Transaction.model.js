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
const mongoose_1 = __importStar(require("mongoose"));
const transactionSchema = new mongoose_1.Schema({
    transactionId: { type: String, required: true, unique: true },
    user: { type: String, ref: "User", required: true },
    points: { type: Number, required: true },
    type: {
        type: String,
        enum: ["EARNED", "SPENT", "ADMIN_ADJUSTMENT"],
        required: true,
    },
    activityType: {
        type: String,
        enum: [
            "DAILY_LOGIN",
            "LESSON_COMPLETE",
            "QUIZ_COMPLETE",
            "QUIZ_BONUS",
            "MOCK_TEST",
            "STREAK_BONUS",
            "DOUBT_ANSWER",
            "NOTE_UPLOAD",
            "COURSE_COMPLETE",
            "REFERRAL",
            "REDEEM_REWARD",
            "ADMIN_ADJUST",
        ],
        required: true,
    },
    description: { type: String, required: true },
    idempotencyKey: { type: String, required: true, unique: true },
}, { timestamps: true });
const Transaction = mongoose_1.default.models.Transaction ||
    mongoose_1.default.model("Transaction", transactionSchema);
exports.default = Transaction;
