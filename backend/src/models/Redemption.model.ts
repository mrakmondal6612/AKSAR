import mongoose, { Document, Schema } from "mongoose";

export interface IRedemption extends Document {
  redemptionId: string;
  user: string; // references User uniqueId
  reward: mongoose.Types.ObjectId; // references Reward model
  pointsSpent: number;
  status: "COMPLETED" | "EXPIRED" | "FAILED";
  benefitDetails?: any;
  createdAt: Date;
  updatedAt: Date;
}

const redemptionSchema = new Schema<IRedemption>(
  {
    redemptionId: { type: String, required: true, unique: true },
    user: { type: String, ref: "User", required: true },
    reward: { type: Schema.Types.ObjectId, ref: "Reward", required: true },
    pointsSpent: { type: Number, required: true },
    status: {
      type: String,
      enum: ["COMPLETED", "EXPIRED", "FAILED"],
      required: true,
      default: "COMPLETED",
    },
    benefitDetails: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Redemption =
  mongoose.models.Redemption ||
  mongoose.model<IRedemption>("Redemption", redemptionSchema);
export default Redemption;
