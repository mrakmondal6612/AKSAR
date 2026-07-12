import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  transactionId: string;
  user: string; // references User uniqueId
  points: number;
  type: "EARNED" | "SPENT" | "ADMIN_ADJUSTMENT";
  activityType:
    | "DAILY_LOGIN"
    | "LESSON_COMPLETE"
    | "QUIZ_COMPLETE"
    | "QUIZ_BONUS"
    | "MOCK_TEST"
    | "STREAK_BONUS"
    | "DOUBT_ANSWER"
    | "NOTE_UPLOAD"
    | "COURSE_COMPLETE"
    | "REFERRAL"
    | "REDEEM_REWARD"
    | "ADMIN_ADJUST";
  description: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
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
  },
  { timestamps: true }
);



const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);
export default Transaction;
