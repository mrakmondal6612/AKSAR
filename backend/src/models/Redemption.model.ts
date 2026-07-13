import mongoose, { Document, Schema } from "mongoose";

export enum RedemptionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

export interface IRedemption extends Document {
  redemptionId: string;
  user: string; // User uniqueId (string)
  reward: mongoose.Types.ObjectId; // Reference to Reward model
  pointsSpent: number;
  status: RedemptionStatus;
  benefitDetails?: {
    couponCode?: string;
    badgeName?: string;
    premiumExpiry?: Date;
    description?: string;
  };
}

const redemptionSchema = new Schema<IRedemption>(
  {
    redemptionId: { type: String, required: true, unique: true },
    user: { type: String, ref: "User", required: true },
    reward: { type: Schema.Types.ObjectId, ref: "Reward", required: true },
    pointsSpent: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(RedemptionStatus),
      default: RedemptionStatus.PENDING,
      required: true,
    },
    benefitDetails: {
      couponCode: { type: String },
      badgeName: { type: String },
      premiumExpiry: { type: Date },
      description: { type: String },
    },
  },
  { timestamps: true }
);

const RedemptionModel =
  mongoose.models.Redemption ||
  mongoose.model<IRedemption>("Redemption", redemptionSchema);

export default RedemptionModel;
