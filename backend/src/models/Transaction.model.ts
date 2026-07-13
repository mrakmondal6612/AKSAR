import mongoose, { Document, Schema } from "mongoose";

export enum TransactionType {
  EARNED = "EARNED",
  SPENT = "SPENT",
  ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT",
}

export interface ITransaction extends Document {
  transactionId: string;
  user: string; // User uniqueId (string)
  points: number;
  type: TransactionType;
  activityType: string; // e.g. "DAILY_CLAIM", "REDEEM", "TEST_COMPLETED", etc.
  description: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    user: { type: String, ref: "User", required: true },
    points: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    activityType: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);

export default TransactionModel;
