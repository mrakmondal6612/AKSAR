import mongoose, { Document, Schema } from "mongoose";

export interface IReward extends Document {
  rewardId: string;
  name: string;
  description: string;
  pointCost: number;
  type: "DIGITAL_ACCESS" | "COUPON" | "FEATURE_UNLOCK" | "BADGE" | "CUSTOMIZATION";
  stock: number;
  maxStock: number;
  isActive: boolean;
  badgeUrl?: string;
  couponCode?: string;
  durationDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema<IReward>(
  {
    rewardId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    pointCost: { type: Number, required: true },
    type: {
      type: String,
      enum: ["DIGITAL_ACCESS", "COUPON", "FEATURE_UNLOCK", "BADGE", "CUSTOMIZATION"],
      required: true,
    },
    stock: { type: Number, required: true, default: 0 },
    maxStock: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    badgeUrl: { type: String },
    couponCode: { type: String },
    durationDays: { type: Number },
  },
  { timestamps: true }
);

const Reward = mongoose.models.Reward || mongoose.model<IReward>("Reward", rewardSchema);
export default Reward;
