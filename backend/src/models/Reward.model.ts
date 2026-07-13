import mongoose, { Document, Schema } from "mongoose";

export enum RewardType {
  DIGITAL_ACCESS = "DIGITAL_ACCESS",
  COUPON = "COUPON",
  FEATURE_UNLOCK = "FEATURE_UNLOCK",
  BADGE = "BADGE",
  CUSTOMIZATION = "CUSTOMIZATION",
}

export interface IReward extends Document {
  rewardId: string;
  name: string;
  description: string;
  pointCost: number;
  type: RewardType;
  stock: number;
  maxStock: number;
  badgeUrl?: string;
  durationDays?: number;
  isDeleted: boolean;
}

const rewardSchema = new Schema<IReward>(
  {
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
  },
  { timestamps: true }
);

const RewardModel =
  mongoose.models.Reward || mongoose.model<IReward>("Reward", rewardSchema);

export default RewardModel;
