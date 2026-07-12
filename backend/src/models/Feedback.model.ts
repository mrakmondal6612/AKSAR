import mongoose, { Document, Schema } from "mongoose";

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  rating: number;
  message: string;
  createdAt: Date;
}

const FeedbackSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  name: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Feedback = mongoose.model<IFeedback>("Feedback", FeedbackSchema);
