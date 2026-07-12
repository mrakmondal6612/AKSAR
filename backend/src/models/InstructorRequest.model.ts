import mongoose, { Document } from "mongoose";

export interface IInstructorRequest extends Document {
    requestId: string;
    userId: string;
    userName: string;
    fullName: string;
    email: string;
    profileImageUrl?: string;
    reason?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
}

const instructorRequestSchema = new mongoose.Schema<IInstructorRequest>(
    {
        requestId: { type: String, required: true, unique: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        profileImageUrl: { type: String },
        reason: { type: String },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },
        reviewedAt: { type: Date },
        reviewedBy: { type: String },
        rejectionReason: { type: String },
    },
    { timestamps: true }
);


const InstructorRequest =
    mongoose.models.InstructorRequest ||
    mongoose.model<IInstructorRequest>("InstructorRequest", instructorRequestSchema);

export default InstructorRequest;