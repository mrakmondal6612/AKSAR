import mongoose, { Document, Schema } from "mongoose";

export enum PostStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  FLAGGED = "FLAGGED",
}

export interface ICommunityPost extends Document {
  postId: string;
  user: string; // Reference to User
  content: string;
  images?: string[];
  likes: string[]; // Array of user IDs
  comments: {
    user: string;
    content: string;
    createdAt: Date;
    isApprovedAnswer?: boolean;
  }[];
  status: PostStatus;
  tags?: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    postId: { type: String, required: true, unique: true },
    user: { type: String, ref: "User", required: true },
    content: { type: String, required: true },
    images: [{ type: String }],
    likes: [{ type: String }],
    comments: [
      {
        user: { type: String, ref: "User", required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        isApprovedAnswer: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.PENDING,
    },
    tags: [{ type: String }],
    category: { type: String },
  },
  { timestamps: true }
);

const CommunityPostModel =
  mongoose.models.CommunityPost ||
  mongoose.model<ICommunityPost>("CommunityPost", communityPostSchema);

export default CommunityPostModel;
